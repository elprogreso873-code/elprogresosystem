import { pool } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { sqlLimitOffset } from '../utils/paginationSql.js';
import { withTransaction } from '../utils/transaction.js';
import { registerMovement } from './inventory.service.js';
import { getOpenSessionForUser, registerPurchasePaymentInCash, reversePurchasePaymentInCash } from './cash.service.js';
import { logAudit } from '../utils/audit.js';
import { getActivePaymentMethodByCode } from './paymentMethod.service.js';
import {
  applySupplierBalanceChange,
  getSupplierForUpdate,
} from './supplier.service.js';

const roundMoney = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const paymentStateFrom = (total, pagado) => {
  if (pagado <= 0.009) return 'pendiente';
  if (pagado + 0.009 >= total) return 'pagada';
  return 'parcial';
};

const computePuedeAnular = (compra, openSessionId) => {
  if (compra.estado !== 'completada') return false;
  if (Number(compra.pagos_posteriores ?? 0) > 0) return false;
  if (!compra.paga_con_caja || !compra.caja_sesion_id) return true;
  if (!openSessionId) return false;
  return (
    compra.caja_sesion_id === openSessionId && compra.caja_sesion_estado === 'abierta'
  );
};

const mapPurchaseList = (row, openSessionId = null) => ({
  id: row.id,
  numero: row.numero,
  proveedor_id: row.proveedor_id,
  proveedor_nombre: row.proveedor_nombre,
  usuario_id: row.usuario_id,
  usuario_nombre: row.usuario_nombre,
  subtotal: Number(row.subtotal),
  total: Number(row.total),
  total_manual: Boolean(row.total_manual),
  monto_pagado: Number(row.monto_pagado),
  saldo: Number(row.saldo),
  estado: row.estado,
  estado_pago: row.estado_pago,
  paga_con_caja: Boolean(row.paga_con_caja),
  caja_sesion_id: row.caja_sesion_id,
  metodo_pago: row.metodo_pago,
  metodo_pago_nombre: row.metodo_pago_nombre ?? row.metodo_pago,
  observaciones: row.observaciones,
  fecha_compra: row.fecha_compra,
  total_items: Number(row.total_items ?? 0),
  puede_anular: computePuedeAnular(row, openSessionId),
});

const mapPurchaseItem = (row) => ({
  id: row.id,
  producto_id: row.producto_id,
  producto_nombre: row.producto_nombre,
  producto_codigo: row.producto_codigo,
  cantidad: Number(row.cantidad),
  precio_costo: Number(row.precio_costo),
  precio_venta: row.precio_venta != null ? Number(row.precio_venta) : null,
  actualizar_precios: Boolean(row.actualizar_precios),
  subtotal: Number(row.subtotal),
  unidad_medida: row.unidad_medida || 'unidad',
});

const mapPurchasePayment = (row) => ({
  id: row.id,
  compra_id: row.compra_id,
  monto: Number(row.monto),
  metodo_pago: row.metodo_pago,
  metodo_pago_nombre: row.metodo_pago_nombre ?? row.metodo_pago,
  paga_con_caja: Boolean(row.paga_con_caja),
  es_inicial: Boolean(row.es_inicial),
  observaciones: row.observaciones,
  usuario_nombre: row.usuario_nombre,
  fecha: row.fecha,
});

const generatePurchaseNumber = async (conn) => {
  const year = new Date().getFullYear();
  const [rows] = await conn.execute(
    'SELECT COUNT(*) AS total FROM compras WHERE YEAR(fecha_compra) = ?',
    [year]
  );
  const seq = Number(rows[0].total) + 1;
  return `CMP-${year}-${String(seq).padStart(6, '0')}`;
};

export const createPurchase = async (data, usuarioId, ip = null) => {
  return withTransaction(async (conn) => {
    await getSupplierForUpdate(data.proveedor_id, conn);

    const lineItems = [];
    let subtotal = 0;

    for (const item of data.items) {
      const [products] = await conn.execute(
        `SELECT id, codigo, nombre, precio_costo, precio_venta, estado
         FROM productos WHERE id = ? LIMIT 1`,
        [item.producto_id]
      );

      if (!products.length || products[0].estado !== 'activo') {
        throw new AppError(`Producto #${item.producto_id} no disponible`, 400);
      }

      const product = products[0];
      const cantidad = Number(item.cantidad);
      const precioCosto = roundMoney(item.precio_costo ?? product.precio_costo ?? 0);
      const subtotalLinea = roundMoney(precioCosto * cantidad);

      lineItems.push({
        producto_id: product.id,
        producto_codigo: product.codigo ?? '',
        producto_nombre: product.nombre,
        cantidad,
        precio_costo: precioCosto,
        precio_venta: item.precio_venta != null ? roundMoney(item.precio_venta) : null,
        actualizar_precios: Boolean(item.actualizar_precios),
        subtotal: subtotalLinea,
      });

      subtotal = roundMoney(subtotal + subtotalLinea);
    }

    const hasManualTotal = data.total_manual != null && data.total_manual !== '';
    const total = hasManualTotal ? roundMoney(data.total_manual) : subtotal;
    if (total < 0) throw new AppError('El total no puede ser negativo', 400);

    const pagada = Boolean(data.pagada);
    let montoPagado = 0;
    if (pagada) {
      montoPagado =
        data.monto_pagado != null && data.monto_pagado !== ''
          ? roundMoney(data.monto_pagado)
          : total;
    }
    if (montoPagado > total + 0.009) {
      throw new AppError('El monto pagado no puede superar el total', 400);
    }

    const saldo = roundMoney(Math.max(0, total - montoPagado));
    const estadoPago = paymentStateFrom(total, montoPagado);
    const metodoPago = data.metodo_pago || 'efectivo';
    const pagaConCaja = Boolean(data.paga_con_caja) && montoPagado > 0;

    if (montoPagado > 0) {
      await getActivePaymentMethodByCode(metodoPago, conn);
    }

    const openSession = await getOpenSessionForUser(usuarioId, conn);
    if (pagaConCaja && !openSession) {
      throw new AppError('Debe abrir la caja para descontar esta compra del turno actual', 400);
    }

    const numero = await generatePurchaseNumber(conn);
    const cajaSesionId = pagaConCaja ? openSession.id : null;

    const [result] = await conn.execute(
      `INSERT INTO compras (
        numero, proveedor_id, usuario_id, subtotal, total, total_manual,
        monto_pagado, saldo, estado, estado_pago, paga_con_caja,
        caja_sesion_id, metodo_pago, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completada', ?, ?, ?, ?, ?)`,
      [
        numero,
        data.proveedor_id,
        usuarioId,
        subtotal,
        total,
        hasManualTotal ? 1 : 0,
        montoPagado,
        saldo,
        estadoPago,
        pagaConCaja ? 1 : 0,
        cajaSesionId,
        montoPagado > 0 ? metodoPago : null,
        data.observaciones ?? null,
      ]
    );

    const compraId = result.insertId;

    for (const line of lineItems) {
      await conn.execute(
        `INSERT INTO compra_detalle (
          compra_id, producto_id, producto_nombre, producto_codigo,
          cantidad, precio_costo, precio_venta, actualizar_precios, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          compraId,
          line.producto_id,
          line.producto_nombre,
          line.producto_codigo,
          line.cantidad,
          line.precio_costo,
          line.precio_venta,
          line.actualizar_precios ? 1 : 0,
          line.subtotal,
        ]
      );

      await registerMovement(
        {
          producto_id: line.producto_id,
          tipo: 'entrada',
          cantidad: line.cantidad,
          motivo: `Compra ${numero}`,
          referencia: numero,
        },
        usuarioId,
        conn
      );

      if (line.actualizar_precios) {
        const updates = ['precio_costo = ?'];
        const params = [line.precio_costo];
        if (line.precio_venta != null) {
          updates.push('precio_venta = ?');
          params.push(line.precio_venta);
        }
        params.push(line.producto_id);
        await conn.execute(
          `UPDATE productos SET ${updates.join(', ')} WHERE id = ?`,
          params
        );
      }
    }

    const [provRows] = await conn.execute(
      'SELECT nombre FROM proveedores WHERE id = ? LIMIT 1',
      [data.proveedor_id]
    );
    const proveedorNombre = provRows[0]?.nombre || 'Proveedor';

    let movimientoId = null;
    if (saldo > 0.009) {
      movimientoId = await applySupplierBalanceChange(conn, {
        proveedorId: data.proveedor_id,
        delta: saldo,
        tipo: 'cargo',
        compraId,
        referencia: numero,
        observaciones: `Compra ${numero}`,
        usuarioId,
      });
    }

    if (montoPagado > 0.009) {
      await conn.execute(
        `INSERT INTO compra_pagos (
          compra_id, proveedor_movimiento_id, monto, metodo_pago, paga_con_caja,
          caja_sesion_id, es_inicial, usuario_id, observaciones
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          compraId,
          movimientoId,
          montoPagado,
          metodoPago,
          pagaConCaja ? 1 : 0,
          cajaSesionId,
          usuarioId,
          `Pago inicial ${numero}`,
        ]
      );

      if (pagaConCaja && cajaSesionId) {
        await registerPurchasePaymentInCash(
          {
            sesionId: cajaSesionId,
            compraId,
            numero,
            monto: montoPagado,
            metodoPago,
            proveedorNombre,
            descripcion: `Compra ${numero} — ${proveedorNombre}`,
          },
          usuarioId,
          conn
        );
      }
    }

    await logAudit({
      usuarioId,
      accion: 'compras.crear',
      modulo: 'compras',
      detalle: {
        compra_id: compraId,
        numero,
        total,
        monto_pagado: montoPagado,
        paga_con_caja: pagaConCaja,
      },
      ip,
    });

    return getPurchaseById(compraId, conn, usuarioId);
  });
};

const purchaseSelect = `
  SELECT c.*,
         p.nombre AS proveedor_nombre,
         u.nombre_usuario AS usuario_nombre,
         mp.nombre AS metodo_pago_nombre,
         s.estado AS caja_sesion_estado,
         (SELECT COUNT(*) FROM compra_detalle d WHERE d.compra_id = c.id) AS total_items,
         (SELECT COUNT(*) FROM compra_pagos cp WHERE cp.compra_id = c.id AND cp.es_inicial = 0) AS pagos_posteriores
  FROM compras c
  INNER JOIN proveedores p ON p.id = c.proveedor_id
  INNER JOIN usuarios u ON u.id = c.usuario_id
  LEFT JOIN metodos_pago mp ON mp.codigo = c.metodo_pago
  LEFT JOIN caja_sesiones s ON s.id = c.caja_sesion_id
`;

export const getPurchaseById = async (id, connection = null, usuarioId = null) => {
  const conn = connection || pool;
  const [rows] = await conn.execute(`${purchaseSelect} WHERE c.id = ? LIMIT 1`, [id]);
  if (!rows.length) throw new AppError('Compra no encontrada', 404);

  let openSessionId = null;
  if (usuarioId) {
    const open = await getOpenSessionForUser(usuarioId, conn);
    openSessionId = open?.id ?? null;
  }

  const [items] = await conn.execute(
    `SELECT d.*, pr.unidad_medida
     FROM compra_detalle d
     LEFT JOIN productos pr ON pr.id = d.producto_id
     WHERE d.compra_id = ?
     ORDER BY d.id ASC`,
    [id]
  );

  const [pagos] = await conn.execute(
    `SELECT cp.*, u.nombre_usuario AS usuario_nombre, mp.nombre AS metodo_pago_nombre
     FROM compra_pagos cp
     INNER JOIN usuarios u ON u.id = cp.usuario_id
     LEFT JOIN metodos_pago mp ON mp.codigo = cp.metodo_pago
     WHERE cp.compra_id = ?
     ORDER BY cp.fecha ASC, cp.id ASC`,
    [id]
  );

  return {
    ...mapPurchaseList(rows[0], openSessionId),
    items: items.map(mapPurchaseItem),
    pagos: pagos.map(mapPurchasePayment),
  };
};

export const listPurchases = async (query, usuarioId) => {
  const {
    page,
    limit,
    search,
    estado,
    estado_pago,
    proveedor_id,
    fecha_desde,
    fecha_hasta,
  } = query;
  const offset = (page - 1) * limit;
  const conditions = ['1=1'];
  const params = [];

  if (search) {
    conditions.push('(c.numero LIKE ? OR p.nombre LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term);
  }
  if (estado && estado !== 'todos') {
    conditions.push('c.estado = ?');
    params.push(estado);
  }
  if (estado_pago && estado_pago !== 'todos') {
    conditions.push('c.estado_pago = ?');
    params.push(estado_pago);
  }
  if (proveedor_id) {
    conditions.push('c.proveedor_id = ?');
    params.push(proveedor_id);
  }
  if (fecha_desde) {
    conditions.push('DATE(c.fecha_compra) >= ?');
    params.push(fecha_desde);
  }
  if (fecha_hasta) {
    conditions.push('DATE(c.fecha_compra) <= ?');
    params.push(fecha_hasta);
  }

  const whereClause = conditions.join(' AND ');
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM compras c
     INNER JOIN proveedores p ON p.id = c.proveedor_id
     WHERE ${whereClause}`,
    params
  );
  const total = countRows[0].total;

  const [rows] = await pool.execute(
    `${purchaseSelect}
     WHERE ${whereClause}
     ORDER BY c.fecha_compra DESC, c.id DESC
     ${sqlLimitOffset(limit, offset)}`,
    params
  );

  const open = usuarioId ? await getOpenSessionForUser(usuarioId) : null;
  return {
    data: rows.map((row) => mapPurchaseList(row, open?.id ?? null)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const getPurchasesSummary = async (query = {}) => {
  const conditions = ["c.estado = 'completada'"];
  const params = [];
  if (query.fecha_desde) {
    conditions.push('DATE(c.fecha_compra) >= ?');
    params.push(query.fecha_desde);
  }
  if (query.fecha_hasta) {
    conditions.push('DATE(c.fecha_compra) <= ?');
    params.push(query.fecha_hasta);
  }
  if (query.proveedor_id) {
    conditions.push('c.proveedor_id = ?');
    params.push(query.proveedor_id);
  }
  const whereClause = conditions.join(' AND ');

  const [rows] = await pool.execute(
    `SELECT
       COUNT(*) AS cantidad,
       COALESCE(SUM(c.total), 0) AS total,
       COALESCE(SUM(c.monto_pagado), 0) AS pagado,
       COALESCE(SUM(c.saldo), 0) AS saldo,
       COUNT(CASE WHEN c.estado_pago = 'pendiente' THEN 1 END) AS pendientes,
       COUNT(CASE WHEN c.estado_pago = 'pagada' THEN 1 END) AS pagadas
     FROM compras c
     WHERE ${whereClause}`,
    params
  );

  return {
    cantidad: Number(rows[0].cantidad),
    total: Number(rows[0].total),
    pagado: Number(rows[0].pagado),
    saldo: Number(rows[0].saldo),
    pendientes: Number(rows[0].pendientes),
    pagadas: Number(rows[0].pagadas),
  };
};

export const cancelPurchase = async (id, usuarioId, ip = null) => {
  return withTransaction(async (conn) => {
    await conn.execute('SELECT id FROM compras WHERE id = ? LIMIT 1 FOR UPDATE', [id]);
    const [rows] = await conn.execute(`${purchaseSelect} WHERE c.id = ? LIMIT 1`, [id]);
    if (!rows.length) throw new AppError('Compra no encontrada', 404);
    const compra = rows[0];

    if (compra.estado !== 'completada') {
      throw new AppError('La compra ya está anulada', 400);
    }

    const [later] = await conn.execute(
      'SELECT COUNT(*) AS total FROM compra_pagos WHERE compra_id = ? AND es_inicial = 0',
      [id]
    );
    if (Number(later[0].total) > 0) {
      throw new AppError(
        'No se puede anular: ya hay pagos posteriores. Anule o revise esos pagos primero.',
        400
      );
    }

    const openSession = await getOpenSessionForUser(usuarioId, conn);
    if (compra.paga_con_caja && compra.caja_sesion_id) {
      if (!openSession || openSession.id !== compra.caja_sesion_id) {
        throw new AppError(
          'Solo se puede anular una compra pagada con caja mientras el mismo turno siga abierto',
          400
        );
      }
    }

    const [items] = await conn.execute(
      'SELECT producto_id, cantidad FROM compra_detalle WHERE compra_id = ?',
      [id]
    );

    for (const item of items) {
      await registerMovement(
        {
          producto_id: item.producto_id,
          tipo: 'salida',
          cantidad: Number(item.cantidad),
          motivo: `Anulación compra ${compra.numero}`,
          referencia: compra.numero,
        },
        usuarioId,
        conn
      );
    }

    const saldo = Number(compra.saldo);
    if (saldo > 0.009) {
      await applySupplierBalanceChange(conn, {
        proveedorId: compra.proveedor_id,
        delta: -saldo,
        tipo: 'anulacion',
        compraId: id,
        referencia: compra.numero,
        observaciones: `Anulación compra ${compra.numero}`,
        usuarioId,
      });
    }

    const montoPagado = Number(compra.monto_pagado);
    if (compra.paga_con_caja && compra.caja_sesion_id && montoPagado > 0.009) {
      await reversePurchasePaymentInCash(
        {
          sesionId: compra.caja_sesion_id,
          compraId: id,
          numero: compra.numero,
          monto: montoPagado,
          metodoPago: compra.metodo_pago,
          proveedorNombre: compra.proveedor_nombre,
        },
        usuarioId,
        conn
      );
    }

    await conn.execute(
      `UPDATE compras
       SET estado = 'anulada', estado_pago = 'pagada', monto_pagado = 0, saldo = 0
       WHERE id = ?`,
      [id]
    );

    await logAudit({
      usuarioId,
      accion: 'compras.anular',
      modulo: 'compras',
      detalle: { compra_id: id, numero: compra.numero },
      ip,
    });

    return getPurchaseById(id, conn, usuarioId);
  });
};

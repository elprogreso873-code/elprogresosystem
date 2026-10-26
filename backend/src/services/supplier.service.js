import { pool } from '../config/database.js';
import { sqlLimitOffset } from '../utils/paginationSql.js';
import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/transaction.js';
import { logAudit } from '../utils/audit.js';
import { getActivePaymentMethodByCode } from './paymentMethod.service.js';
import {
  getOpenSessionForUser,
  registerPurchasePaymentInCash,
} from './cash.service.js';

const roundMoney = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const paymentStateFrom = (total, pagado) => {
  if (pagado <= 0.009) return 'pendiente';
  if (pagado + 0.009 >= total) return 'pagada';
  return 'parcial';
};

export const mapSupplier = (row) => ({
  id: row.id,
  nombre: row.nombre,
  cuit: row.cuit,
  email: row.email,
  telefono: row.telefono,
  direccion: row.direccion,
  observaciones: row.observaciones,
  estado: row.estado,
  saldo: Number(row.saldo ?? 0),
  compras_pendientes: Number(row.compras_pendientes ?? 0),
  fecha_creacion: row.fecha_creacion,
  fecha_actualizacion: row.fecha_actualizacion,
});

export const mapSupplierMovement = (row) => ({
  id: row.id,
  proveedor_id: row.proveedor_id,
  tipo: row.tipo,
  monto: Number(row.monto),
  saldo_anterior: Number(row.saldo_anterior),
  saldo_posterior: Number(row.saldo_posterior),
  compra_id: row.compra_id,
  compra_numero: row.compra_numero ?? null,
  referencia: row.referencia,
  observaciones: row.observaciones,
  metodo_pago: row.metodo_pago,
  metodo_pago_nombre: row.metodo_pago_nombre ?? row.metodo_pago,
  paga_con_caja: Boolean(row.paga_con_caja),
  caja_sesion_id: row.caja_sesion_id,
  usuario_id: row.usuario_id,
  usuario_nombre: row.usuario_nombre,
  fecha: row.fecha,
});

export const getSupplierForUpdate = async (proveedorId, conn) => {
  const [rows] = await conn.execute(
    `SELECT * FROM proveedores WHERE id = ? LIMIT 1 FOR UPDATE`,
    [proveedorId]
  );
  if (!rows.length) throw new AppError('Proveedor no encontrado', 404);
  if (rows[0].estado !== 'activo') {
    throw new AppError('El proveedor está inactivo', 400);
  }
  return rows[0];
};

export const insertSupplierMovement = async (
  conn,
  {
    proveedorId,
    tipo,
    monto,
    saldoAnterior,
    saldoPosterior,
    compraId,
    referencia,
    observaciones,
    metodoPago,
    pagaConCaja,
    cajaSesionId,
    usuarioId,
  }
) => {
  const [result] = await conn.execute(
    `INSERT INTO proveedor_movimientos (
      proveedor_id, tipo, monto, saldo_anterior, saldo_posterior,
      compra_id, referencia, observaciones, metodo_pago, paga_con_caja,
      caja_sesion_id, usuario_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      proveedorId,
      tipo,
      monto,
      saldoAnterior,
      saldoPosterior,
      compraId ?? null,
      referencia ?? null,
      observaciones ?? null,
      metodoPago ?? null,
      pagaConCaja ? 1 : 0,
      cajaSesionId ?? null,
      usuarioId,
    ]
  );
  return result.insertId;
};

export const applySupplierBalanceChange = async (
  conn,
  { proveedorId, delta, tipo, compraId, referencia, observaciones, metodoPago, pagaConCaja, cajaSesionId, usuarioId }
) => {
  const supplier = await getSupplierForUpdate(proveedorId, conn);
  const saldoAnterior = Number(supplier.saldo);
  const saldoPosterior = roundMoney(Math.max(0, saldoAnterior + Number(delta)));
  const monto = roundMoney(Math.abs(Number(delta)));

  await conn.execute('UPDATE proveedores SET saldo = ? WHERE id = ?', [
    saldoPosterior,
    proveedorId,
  ]);

  return insertSupplierMovement(conn, {
    proveedorId,
    tipo,
    monto,
    saldoAnterior,
    saldoPosterior,
    compraId,
    referencia,
    observaciones,
    metodoPago,
    pagaConCaja,
    cajaSesionId,
    usuarioId,
  });
};

export const listSuppliers = async ({ page, limit, search, estado, solo_deuda }) => {
  const offset = (page - 1) * limit;
  const conditions = ['1=1'];
  const params = [];

  if (search) {
    conditions.push(
      '(p.nombre LIKE ? OR p.cuit LIKE ? OR p.email LIKE ? OR p.telefono LIKE ?)'
    );
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  if (estado && estado !== 'todos') {
    conditions.push('p.estado = ?');
    params.push(estado);
  }

  if (solo_deuda) {
    conditions.push('p.saldo > 0');
  }

  const whereClause = conditions.join(' AND ');

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM proveedores p WHERE ${whereClause}`,
    params
  );
  const total = countRows[0].total;

  const [rows] = await pool.execute(
    `SELECT p.*,
            (SELECT COUNT(*) FROM compras c
              WHERE c.proveedor_id = p.id
                AND c.estado = 'completada'
                AND c.saldo > 0) AS compras_pendientes
     FROM proveedores p
     WHERE ${whereClause}
     ORDER BY p.saldo DESC, p.nombre ASC
     ${sqlLimitOffset(limit, offset)}`,
    params
  );

  return {
    data: rows.map(mapSupplier),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const listSuppliersActive = async () => {
  const [rows] = await pool.execute(
    `SELECT id, nombre, cuit, telefono, saldo
     FROM proveedores WHERE estado = 'activo' ORDER BY nombre ASC`
  );
  return rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    cuit: r.cuit,
    telefono: r.telefono,
    saldo: Number(r.saldo ?? 0),
  }));
};

export const getSupplierById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT p.*,
            (SELECT COUNT(*) FROM compras c
              WHERE c.proveedor_id = p.id
                AND c.estado = 'completada'
                AND c.saldo > 0) AS compras_pendientes
     FROM proveedores p WHERE p.id = ? LIMIT 1`,
    [id]
  );
  if (!rows.length) throw new AppError('Proveedor no encontrado', 404);
  return mapSupplier(rows[0]);
};

export const getSupplierSummary = async () => {
  const [rows] = await pool.execute(
    `SELECT
       COUNT(CASE WHEN saldo > 0 AND estado = 'activo' THEN 1 END) AS proveedores_con_deuda,
       COALESCE(SUM(CASE WHEN estado = 'activo' THEN saldo ELSE 0 END), 0) AS total_por_pagar,
       (SELECT COUNT(*) FROM proveedor_movimientos WHERE DATE(fecha) = CURDATE()) AS movimientos_hoy
     FROM proveedores`
  );
  return {
    proveedores_con_deuda: Number(rows[0].proveedores_con_deuda),
    total_por_pagar: Number(rows[0].total_por_pagar),
    movimientos_hoy: Number(rows[0].movimientos_hoy),
  };
};

export const createSupplier = async (data) => {
  if (data.cuit) {
    const [dup] = await pool.execute(
      'SELECT id FROM proveedores WHERE cuit = ? LIMIT 1',
      [data.cuit]
    );
    if (dup.length) throw new AppError('Ya existe un proveedor con ese CUIT', 409);
  }

  const [result] = await pool.execute(
    `INSERT INTO proveedores (nombre, cuit, email, telefono, direccion, observaciones, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.nombre,
      data.cuit ?? null,
      data.email || null,
      data.telefono ?? null,
      data.direccion ?? null,
      data.observaciones ?? null,
      data.estado ?? 'activo',
    ]
  );

  return getSupplierById(result.insertId);
};

export const updateSupplier = async (id, data) => {
  await getSupplierById(id);

  if (data.cuit) {
    const [dup] = await pool.execute(
      'SELECT id FROM proveedores WHERE cuit = ? AND id != ? LIMIT 1',
      [data.cuit, id]
    );
    if (dup.length) throw new AppError('Ya existe un proveedor con ese CUIT', 409);
  }

  const fields = [];
  const params = [];
  const allowed = ['nombre', 'cuit', 'email', 'telefono', 'direccion', 'observaciones', 'estado'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key] ?? null);
    }
  }
  if (!fields.length) return getSupplierById(id);

  params.push(id);
  await pool.execute(`UPDATE proveedores SET ${fields.join(', ')} WHERE id = ?`, params);
  return getSupplierById(id);
};

export const deactivateSupplier = async (id) => {
  const supplier = await getSupplierById(id);
  if (supplier.saldo > 0.009) {
    throw new AppError(
      `No se puede desactivar: hay un saldo pendiente de ${supplier.saldo.toFixed(2)}`,
      400
    );
  }
  await pool.execute("UPDATE proveedores SET estado = 'inactivo' WHERE id = ?", [id]);
  return getSupplierById(id);
};

export const listSupplierMovements = async (proveedorId, { page, limit }) => {
  await getSupplierById(proveedorId);
  const offset = (page - 1) * limit;

  const [countRows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM proveedor_movimientos WHERE proveedor_id = ?',
    [proveedorId]
  );
  const total = countRows[0].total;

  const [rows] = await pool.execute(
    `SELECT m.*, u.nombre_usuario AS usuario_nombre,
            c.numero AS compra_numero,
            mp.nombre AS metodo_pago_nombre
     FROM proveedor_movimientos m
     INNER JOIN usuarios u ON u.id = m.usuario_id
     LEFT JOIN compras c ON c.id = m.compra_id
     LEFT JOIN metodos_pago mp ON mp.codigo = m.metodo_pago
     WHERE m.proveedor_id = ?
     ORDER BY m.fecha DESC, m.id DESC
     ${sqlLimitOffset(limit, offset)}`,
    [proveedorId]
  );

  return {
    data: rows.map(mapSupplierMovement),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const listUnpaidPurchases = async (proveedorId) => {
  const [rows] = await pool.execute(
    `SELECT id, numero, total, monto_pagado, saldo, fecha_compra, estado_pago
     FROM compras
     WHERE proveedor_id = ? AND estado = 'completada' AND saldo > 0
     ORDER BY fecha_compra ASC, id ASC`,
    [proveedorId]
  );
  return rows.map((r) => ({
    id: r.id,
    numero: r.numero,
    total: Number(r.total),
    monto_pagado: Number(r.monto_pagado),
    saldo: Number(r.saldo),
    fecha_compra: r.fecha_compra,
    estado_pago: r.estado_pago,
  }));
};

const allocatePaymentToPurchases = async (conn, { proveedorId, monto, compraId, movimientoId, metodoPago, pagaConCaja, cajaSesionId, usuarioId, observaciones }) => {
  let remaining = roundMoney(monto);
  const allocations = [];

  let targets;
  if (compraId) {
    const [rows] = await conn.execute(
      `SELECT id, numero, total, monto_pagado, saldo
       FROM compras
       WHERE id = ? AND proveedor_id = ? AND estado = 'completada'
       FOR UPDATE`,
      [compraId, proveedorId]
    );
    if (!rows.length) throw new AppError('La compra no pertenece a este proveedor', 400);
    const compra = rows[0];
    const saldo = Number(compra.saldo);
    if (saldo <= 0.009) throw new AppError('Esa compra ya está pagada', 400);
    if (remaining > saldo + 0.009) {
      throw new AppError(
        `El pago supera el saldo de ${compra.numero} (${saldo.toFixed(2)})`,
        400
      );
    }
    targets = [compra];
  } else {
    const [rows] = await conn.execute(
      `SELECT id, numero, total, monto_pagado, saldo
       FROM compras
       WHERE proveedor_id = ? AND estado = 'completada' AND saldo > 0
       ORDER BY fecha_compra ASC, id ASC
       FOR UPDATE`,
      [proveedorId]
    );
    targets = rows;
  }

  for (const compra of targets) {
    if (remaining <= 0.009) break;
    const saldo = Number(compra.saldo);
    const applied = roundMoney(Math.min(saldo, remaining));
    const nuevoPagado = roundMoney(Number(compra.monto_pagado) + applied);
    const nuevoSaldo = roundMoney(Number(compra.total) - nuevoPagado);
    const estadoPago = paymentStateFrom(Number(compra.total), nuevoPagado);

    await conn.execute(
      `UPDATE compras SET monto_pagado = ?, saldo = ?, estado_pago = ? WHERE id = ?`,
      [nuevoPagado, Math.max(0, nuevoSaldo), estadoPago, compra.id]
    );

    await conn.execute(
      `INSERT INTO compra_pagos (
        compra_id, proveedor_movimiento_id, monto, metodo_pago, paga_con_caja,
        caja_sesion_id, es_inicial, usuario_id, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        compra.id,
        movimientoId,
        applied,
        metodoPago ?? null,
        pagaConCaja ? 1 : 0,
        cajaSesionId ?? null,
        usuarioId,
        observaciones ?? null,
      ]
    );

    allocations.push({ compra_id: compra.id, numero: compra.numero, monto: applied });
    remaining = roundMoney(remaining - applied);
  }

  if (remaining > 0.009) {
    throw new AppError(
      'El monto supera el saldo pendiente de las compras de este proveedor',
      400
    );
  }

  return allocations;
};

export const registerSupplierPayment = async (proveedorId, data, usuarioId, ip = null) => {
  return withTransaction(async (conn) => {
    const supplier = await getSupplierForUpdate(proveedorId, conn);
    const monto = roundMoney(data.monto);
    const saldoActual = Number(supplier.saldo);

    if (monto > saldoActual + 0.009) {
      throw new AppError(`El pago no puede superar el saldo (${saldoActual.toFixed(2)})`, 400);
    }

    const metodoPago = data.metodo_pago || 'efectivo';
    await getActivePaymentMethodByCode(metodoPago, conn);

    const pagaConCaja = Boolean(data.paga_con_caja);
    let cajaSesionId = null;

    if (pagaConCaja) {
      const openSession = await getOpenSessionForUser(usuarioId, conn);
      if (!openSession) {
        throw new AppError('Debe abrir la caja para descontar este pago del turno actual', 400);
      }
      cajaSesionId = openSession.id;
    }

    const movimientoId = await applySupplierBalanceChange(conn, {
      proveedorId,
      delta: -monto,
      tipo: 'pago',
      compraId: data.compra_id ?? null,
      referencia: data.compra_id ? `Pago compra` : 'Pago proveedor',
      observaciones: data.observaciones ?? `Pago a ${supplier.nombre}`,
      metodoPago,
      pagaConCaja,
      cajaSesionId,
      usuarioId,
    });

    const allocations = await allocatePaymentToPurchases(conn, {
      proveedorId,
      monto,
      compraId: data.compra_id ?? null,
      movimientoId,
      metodoPago,
      pagaConCaja,
      cajaSesionId,
      usuarioId,
      observaciones: data.observaciones,
    });

    if (pagaConCaja && cajaSesionId) {
      await registerPurchasePaymentInCash(
        {
          sesionId: cajaSesionId,
          compraId: allocations[0]?.compra_id ?? null,
          numero: allocations.map((a) => a.numero).join(', '),
          monto,
          metodoPago,
          proveedorNombre: supplier.nombre,
          proveedorMovimientoId: movimientoId,
          descripcion: `Pago proveedor — ${supplier.nombre}`,
        },
        usuarioId,
        conn
      );
    }

    await logAudit({
      usuarioId,
      accion: 'proveedores.pagar',
      modulo: 'proveedores',
      detalle: { proveedor_id: proveedorId, monto, allocations, paga_con_caja: pagaConCaja },
      ip,
    });

    return {
      proveedor: await getSupplierById(proveedorId),
      allocations,
    };
  });
};

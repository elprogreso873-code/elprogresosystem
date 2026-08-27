export const PERMISSIONS = {
  DASHBOARD_VER: 'dashboard.ver',
  USUARIOS_VER: 'usuarios.ver',
  USUARIOS_CREAR: 'usuarios.crear',
  USUARIOS_EDITAR: 'usuarios.editar',
  USUARIOS_DESACTIVAR: 'usuarios.desactivar',
  PERMISOS_VER: 'permisos.ver',
  PERMISOS_ASIGNAR: 'permisos.asignar',
  CATEGORIAS_VER: 'categorias.ver',
  CATEGORIAS_CREAR: 'categorias.crear',
  CATEGORIAS_EDITAR: 'categorias.editar',
  CATEGORIAS_DESACTIVAR: 'categorias.desactivar',
  PRODUCTOS_VER: 'productos.ver',
  PRODUCTOS_CREAR: 'productos.crear',
  PRODUCTOS_EDITAR: 'productos.editar',
  PRODUCTOS_DESACTIVAR: 'productos.desactivar',
  CLIENTES_VER: 'clientes.ver',
  CLIENTES_CREAR: 'clientes.crear',
  CLIENTES_EDITAR: 'clientes.editar',
  CLIENTES_DESACTIVAR: 'clientes.desactivar',
  CUENTA_CORRIENTE_VER: 'cuenta_corriente.ver',
  CUENTA_CORRIENTE_COBRAR: 'cuenta_corriente.cobrar',
  CUENTA_CORRIENTE_AJUSTAR: 'cuenta_corriente.ajustar',
  INVENTARIO_VER: 'inventario.ver',
  INVENTARIO_MOVIMIENTO: 'inventario.movimiento',
  VENTAS_VER: 'ventas.ver',
  VENTAS_CREAR: 'ventas.crear',
  VENTAS_ANULAR: 'ventas.anular',
  PRESUPUESTOS_VER: 'presupuestos.ver',
  PRESUPUESTOS_CREAR: 'presupuestos.crear',
  PRESUPUESTOS_ANULAR: 'presupuestos.anular',
  PRESUPUESTOS_CONVERTIR: 'presupuestos.convertir',
  CAJA_VER: 'caja.ver',
  CAJA_ABRIR: 'caja.abrir',
  CAJA_CERRAR: 'caja.cerrar',
  CAJA_MOVIMIENTO: 'caja.movimiento',
  COMPROBANTES_VER: 'comprobantes.ver',
  REPORTES_VER: 'reportes.ver',
  AUDITORIA_VER: 'auditoria.ver',
  METODOS_PAGO_VER: 'metodos_pago.ver',
  METODOS_PAGO_GESTIONAR: 'metodos_pago.gestionar',
};

export const ROLES = { ADMIN: 'admin', EMPLEADO: 'empleado' };

export const CONFIG_ACCESS_PERMISSIONS = [
  PERMISSIONS.USUARIOS_VER,
  PERMISSIONS.USUARIOS_CREAR,
  PERMISSIONS.USUARIOS_EDITAR,
  PERMISSIONS.USUARIOS_DESACTIVAR,
  PERMISSIONS.PERMISOS_VER,
  PERMISSIONS.PERMISOS_ASIGNAR,
  PERMISSIONS.METODOS_PAGO_GESTIONAR,
];

export const CATALOGO_ACCESS_PERMISSIONS = [
  PERMISSIONS.CATEGORIAS_VER,
  PERMISSIONS.CATEGORIAS_CREAR,
  PERMISSIONS.CATEGORIAS_EDITAR,
  PERMISSIONS.CATEGORIAS_DESACTIVAR,
  PERMISSIONS.PRODUCTOS_VER,
  PERMISSIONS.PRODUCTOS_CREAR,
  PERMISSIONS.PRODUCTOS_EDITAR,
  PERMISSIONS.PRODUCTOS_DESACTIVAR,
  PERMISSIONS.INVENTARIO_VER,
  PERMISSIONS.INVENTARIO_MOVIMIENTO,
];

export const VENTAS_ACCESS_PERMISSIONS = [
  PERMISSIONS.VENTAS_VER,
  PERMISSIONS.VENTAS_CREAR,
  PERMISSIONS.VENTAS_ANULAR,
];

export const PRESUPUESTOS_ACCESS_PERMISSIONS = [
  PERMISSIONS.PRESUPUESTOS_VER,
  PERMISSIONS.PRESUPUESTOS_CREAR,
  PERMISSIONS.PRESUPUESTOS_ANULAR,
  PERMISSIONS.PRESUPUESTOS_CONVERTIR,
];

export const CAJA_ACCESS_PERMISSIONS = [
  PERMISSIONS.CAJA_VER,
  PERMISSIONS.CAJA_ABRIR,
  PERMISSIONS.CAJA_CERRAR,
  PERMISSIONS.CAJA_MOVIMIENTO,
];

export const CLIENTES_ACCESS_PERMISSIONS = [
  PERMISSIONS.CLIENTES_VER,
  PERMISSIONS.CLIENTES_CREAR,
  PERMISSIONS.CLIENTES_EDITAR,
  PERMISSIONS.CLIENTES_DESACTIVAR,
  PERMISSIONS.CUENTA_CORRIENTE_VER,
  PERMISSIONS.CUENTA_CORRIENTE_COBRAR,
  PERMISSIONS.CUENTA_CORRIENTE_AJUSTAR,
];

/** @deprecated */
export const COMERCIAL_ACCESS_PERMISSIONS = CLIENTES_ACCESS_PERMISSIONS;

export const FINANZAS_ACCESS_PERMISSIONS = [
  PERMISSIONS.COMPROBANTES_VER,
  PERMISSIONS.REPORTES_VER,
  PERMISSIONS.AUDITORIA_VER,
];

/** Etiquetas de respaldo si la API no devuelve nombre */
export const METODO_PAGO_LABELS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta_credito: 'Tarjeta de crédito',
  tarjeta: 'Tarjeta',
  cuenta_corriente: 'Cuenta corriente',
  mixto: 'Pago combinado',
};

export const METODOS_COBRO_CC = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'otro', label: 'Otro' },
];

export const TIPOS_COMPROBANTE = [
  { value: 'ticket', label: 'Ticket' },
  { value: 'boleta', label: 'Boleta' },
  { value: 'factura', label: 'Factura' },
];

export const TIPOS_DOCUMENTO = [
  { value: 'CF', label: 'Consumidor final' },
  { value: 'DNI', label: 'DNI' },
  { value: 'RUC', label: 'RUC' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'OTRO', label: 'Otro' },
];

export const UNIDADES_MEDIDA = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'kg', label: 'Kilogramo (kg)' },
  { value: 'g', label: 'Gramo (g)' },
  { value: 'litro', label: 'Litro' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'caja', label: 'Caja' },
  { value: 'paquete', label: 'Paquete' },
];

export const PERMISSION_LABELS = {
  [PERMISSIONS.DASHBOARD_VER]: 'Ver dashboard',
  [PERMISSIONS.USUARIOS_VER]: 'Ver usuarios',
  [PERMISSIONS.USUARIOS_CREAR]: 'Crear usuarios',
  [PERMISSIONS.USUARIOS_EDITAR]: 'Editar usuarios',
  [PERMISSIONS.USUARIOS_DESACTIVAR]: 'Desactivar usuarios',
  [PERMISSIONS.PERMISOS_VER]: 'Ver permisos',
  [PERMISSIONS.PERMISOS_ASIGNAR]: 'Asignar permisos',
  [PERMISSIONS.CATEGORIAS_VER]: 'Ver categorías',
  [PERMISSIONS.CATEGORIAS_CREAR]: 'Crear categorías',
  [PERMISSIONS.CATEGORIAS_EDITAR]: 'Editar categorías',
  [PERMISSIONS.CATEGORIAS_DESACTIVAR]: 'Desactivar categorías',
  [PERMISSIONS.PRODUCTOS_VER]: 'Ver productos',
  [PERMISSIONS.PRODUCTOS_CREAR]: 'Crear productos',
  [PERMISSIONS.PRODUCTOS_EDITAR]: 'Editar productos',
  [PERMISSIONS.PRODUCTOS_DESACTIVAR]: 'Desactivar productos',
  [PERMISSIONS.CLIENTES_VER]: 'Ver clientes',
  [PERMISSIONS.CLIENTES_CREAR]: 'Crear clientes',
  [PERMISSIONS.CLIENTES_EDITAR]: 'Editar clientes',
  [PERMISSIONS.CLIENTES_DESACTIVAR]: 'Desactivar clientes',
  [PERMISSIONS.CUENTA_CORRIENTE_VER]: 'Ver cuenta corriente',
  [PERMISSIONS.CUENTA_CORRIENTE_COBRAR]: 'Cobrar cuenta corriente',
  [PERMISSIONS.CUENTA_CORRIENTE_AJUSTAR]: 'Ajustar cuenta corriente',
  [PERMISSIONS.INVENTARIO_VER]: 'Ver inventario',
  [PERMISSIONS.INVENTARIO_MOVIMIENTO]: 'Registrar movimientos',
  [PERMISSIONS.VENTAS_VER]: 'Ver ventas',
  [PERMISSIONS.VENTAS_CREAR]: 'Registrar ventas',
  [PERMISSIONS.VENTAS_ANULAR]: 'Anular ventas',
  [PERMISSIONS.PRESUPUESTOS_VER]: 'Ver presupuestos',
  [PERMISSIONS.PRESUPUESTOS_CREAR]: 'Crear presupuestos',
  [PERMISSIONS.PRESUPUESTOS_ANULAR]: 'Anular presupuestos',
  [PERMISSIONS.PRESUPUESTOS_CONVERTIR]: 'Convertir presupuestos a venta',
  [PERMISSIONS.CAJA_VER]: 'Ver caja',
  [PERMISSIONS.CAJA_ABRIR]: 'Abrir caja',
  [PERMISSIONS.CAJA_CERRAR]: 'Cerrar caja',
  [PERMISSIONS.CAJA_MOVIMIENTO]: 'Movimientos de caja',
  [PERMISSIONS.COMPROBANTES_VER]: 'Ver comprobantes',
  [PERMISSIONS.REPORTES_VER]: 'Ver reportes',
  [PERMISSIONS.AUDITORIA_VER]: 'Ver auditoría',
  [PERMISSIONS.METODOS_PAGO_VER]: 'Ver métodos de pago',
  [PERMISSIONS.METODOS_PAGO_GESTIONAR]: 'Configurar métodos de pago',
};

export const PERMISSION_GROUPS = [
  { modulo: 'dashboard', titulo: 'Panel principal', permisos: [PERMISSIONS.DASHBOARD_VER] },
  {
    modulo: 'usuarios',
    titulo: 'Usuarios',
    permisos: [
      PERMISSIONS.USUARIOS_VER,
      PERMISSIONS.USUARIOS_CREAR,
      PERMISSIONS.USUARIOS_EDITAR,
      PERMISSIONS.USUARIOS_DESACTIVAR,
    ],
  },
  {
    modulo: 'permisos',
    titulo: 'Permisos',
    permisos: [PERMISSIONS.PERMISOS_VER, PERMISSIONS.PERMISOS_ASIGNAR],
  },
  {
    modulo: 'metodos_pago',
    titulo: 'Métodos de pago',
    permisos: [PERMISSIONS.METODOS_PAGO_VER, PERMISSIONS.METODOS_PAGO_GESTIONAR],
  },
  {
    modulo: 'categorias',
    titulo: 'Categorías',
    permisos: [
      PERMISSIONS.CATEGORIAS_VER,
      PERMISSIONS.CATEGORIAS_CREAR,
      PERMISSIONS.CATEGORIAS_EDITAR,
      PERMISSIONS.CATEGORIAS_DESACTIVAR,
    ],
  },
  {
    modulo: 'productos',
    titulo: 'Productos',
    permisos: [
      PERMISSIONS.PRODUCTOS_VER,
      PERMISSIONS.PRODUCTOS_CREAR,
      PERMISSIONS.PRODUCTOS_EDITAR,
      PERMISSIONS.PRODUCTOS_DESACTIVAR,
    ],
  },
  {
    modulo: 'inventario',
    titulo: 'Inventario',
    permisos: [PERMISSIONS.INVENTARIO_VER, PERMISSIONS.INVENTARIO_MOVIMIENTO],
  },
  {
    modulo: 'clientes',
    titulo: 'Clientes',
    permisos: [
      PERMISSIONS.CLIENTES_VER,
      PERMISSIONS.CLIENTES_CREAR,
      PERMISSIONS.CLIENTES_EDITAR,
      PERMISSIONS.CLIENTES_DESACTIVAR,
    ],
  },
  {
    modulo: 'cuenta_corriente',
    titulo: 'Cuenta corriente',
    permisos: [
      PERMISSIONS.CUENTA_CORRIENTE_VER,
      PERMISSIONS.CUENTA_CORRIENTE_COBRAR,
      PERMISSIONS.CUENTA_CORRIENTE_AJUSTAR,
    ],
  },
  {
    modulo: 'ventas',
    titulo: 'Ventas',
    permisos: [PERMISSIONS.VENTAS_VER, PERMISSIONS.VENTAS_CREAR, PERMISSIONS.VENTAS_ANULAR],
  },
  {
    modulo: 'presupuestos',
    titulo: 'Presupuestos',
    permisos: [
      PERMISSIONS.PRESUPUESTOS_VER,
      PERMISSIONS.PRESUPUESTOS_CREAR,
      PERMISSIONS.PRESUPUESTOS_ANULAR,
      PERMISSIONS.PRESUPUESTOS_CONVERTIR,
    ],
  },
  {
    modulo: 'caja',
    titulo: 'Caja',
    permisos: [
      PERMISSIONS.CAJA_VER,
      PERMISSIONS.CAJA_ABRIR,
      PERMISSIONS.CAJA_CERRAR,
      PERMISSIONS.CAJA_MOVIMIENTO,
    ],
  },
  {
    modulo: 'comprobantes',
    titulo: 'Comprobantes',
    permisos: [PERMISSIONS.COMPROBANTES_VER],
  },
  {
    modulo: 'reportes',
    titulo: 'Reportes',
    permisos: [PERMISSIONS.REPORTES_VER],
  },
  {
    modulo: 'auditoria',
    titulo: 'Auditoría',
    permisos: [PERMISSIONS.AUDITORIA_VER],
  },
];

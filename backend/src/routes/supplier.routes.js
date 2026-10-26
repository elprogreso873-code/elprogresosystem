import { Router } from 'express';
import * as supplierController from '../controllers/supplier.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  createSupplierSchema,
  updateSupplierSchema,
  listSuppliersQuerySchema,
  supplierPaymentSchema,
  supplierMovementsQuerySchema,
} from '../validations/supplier.validation.js';
import { authenticate, authorizePermission } from '../middlewares/auth.js';
import { PERMISSION_CODES } from '../constants/permissions.js';

const router = Router();

router.use(authenticate);

router.get(
  '/activos',
  authorizePermission(
    PERMISSION_CODES.PROVEEDORES_VER,
    PERMISSION_CODES.COMPRAS_CREAR,
    PERMISSION_CODES.COMPRAS_VER
  ),
  supplierController.listActive
);

router.get(
  '/summary',
  authorizePermission(PERMISSION_CODES.PROVEEDORES_VER),
  supplierController.summary
);

router.get(
  '/',
  authorizePermission(PERMISSION_CODES.PROVEEDORES_VER),
  validate(listSuppliersQuerySchema, 'query'),
  supplierController.list
);

router.get(
  '/:id/movimientos',
  authorizePermission(PERMISSION_CODES.PROVEEDORES_VER),
  validate(supplierMovementsQuerySchema, 'query'),
  supplierController.movements
);

router.post(
  '/:id/pagos',
  authorizePermission(PERMISSION_CODES.PROVEEDORES_PAGAR),
  validate(supplierPaymentSchema),
  supplierController.pay
);

router.get(
  '/:id',
  authorizePermission(PERMISSION_CODES.PROVEEDORES_VER),
  supplierController.getById
);

router.post(
  '/',
  authorizePermission(PERMISSION_CODES.PROVEEDORES_CREAR),
  validate(createSupplierSchema),
  supplierController.create
);

router.put(
  '/:id',
  authorizePermission(PERMISSION_CODES.PROVEEDORES_EDITAR),
  validate(updateSupplierSchema),
  supplierController.update
);

router.patch(
  '/:id/deactivate',
  authorizePermission(PERMISSION_CODES.PROVEEDORES_DESACTIVAR),
  supplierController.deactivate
);

export default router;

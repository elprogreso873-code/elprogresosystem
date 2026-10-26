import { Router } from 'express';
import * as purchaseController from '../controllers/purchase.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  createPurchaseSchema,
  listPurchasesQuerySchema,
  purchasesSummaryQuerySchema,
} from '../validations/purchase.validation.js';
import { authenticate, authorizePermission } from '../middlewares/auth.js';
import { PERMISSION_CODES } from '../constants/permissions.js';

const router = Router();

router.use(authenticate);

router.get(
  '/summary',
  authorizePermission(PERMISSION_CODES.COMPRAS_VER),
  validate(purchasesSummaryQuerySchema, 'query'),
  purchaseController.summary
);

router.get(
  '/',
  authorizePermission(PERMISSION_CODES.COMPRAS_VER),
  validate(listPurchasesQuerySchema, 'query'),
  purchaseController.list
);

router.get(
  '/:id',
  authorizePermission(PERMISSION_CODES.COMPRAS_VER),
  purchaseController.getById
);

router.post(
  '/',
  authorizePermission(PERMISSION_CODES.COMPRAS_CREAR),
  validate(createPurchaseSchema),
  purchaseController.create
);

router.patch(
  '/:id/cancel',
  authorizePermission(PERMISSION_CODES.COMPRAS_ANULAR),
  purchaseController.cancel
);

export default router;

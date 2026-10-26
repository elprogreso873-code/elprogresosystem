import * as purchaseService from '../services/purchase.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const clientIp = (req) => req.ip || req.headers['x-forwarded-for'] || null;

export const list = asyncHandler(async (req, res) => {
  const result = await purchaseService.listPurchases(req.query, req.user.id);
  res.json({ success: true, data: result.data, pagination: result.pagination });
});

export const summary = asyncHandler(async (req, res) => {
  const resumen = await purchaseService.getPurchasesSummary(req.query);
  res.json({ success: true, data: { resumen } });
});

export const getById = asyncHandler(async (req, res) => {
  const compra = await purchaseService.getPurchaseById(req.params.id, null, req.user.id);
  res.json({ success: true, data: { compra } });
});

export const create = asyncHandler(async (req, res) => {
  const compra = await purchaseService.createPurchase(req.body, req.user.id, clientIp(req));
  res.status(201).json({
    success: true,
    message: 'Compra registrada correctamente',
    data: { compra },
  });
});

export const cancel = asyncHandler(async (req, res) => {
  const compra = await purchaseService.cancelPurchase(req.params.id, req.user.id, clientIp(req));
  res.json({
    success: true,
    message: 'Compra anulada. El stock se revirtió.',
    data: { compra },
  });
});

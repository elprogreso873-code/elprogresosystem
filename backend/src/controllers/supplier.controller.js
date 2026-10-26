import * as supplierService from '../services/supplier.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const clientIp = (req) => req.ip || req.headers['x-forwarded-for'] || null;

export const list = asyncHandler(async (req, res) => {
  const result = await supplierService.listSuppliers(req.query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
});

export const listActive = asyncHandler(async (_req, res) => {
  const proveedores = await supplierService.listSuppliersActive();
  res.json({ success: true, data: { proveedores } });
});

export const summary = asyncHandler(async (_req, res) => {
  const resumen = await supplierService.getSupplierSummary();
  res.json({ success: true, data: { resumen } });
});

export const getById = asyncHandler(async (req, res) => {
  const proveedor = await supplierService.getSupplierById(req.params.id);
  const compras_pendientes = await supplierService.listUnpaidPurchases(req.params.id);
  res.json({ success: true, data: { proveedor, compras_pendientes } });
});

export const create = asyncHandler(async (req, res) => {
  const proveedor = await supplierService.createSupplier(req.body);
  res.status(201).json({
    success: true,
    message: 'Proveedor creado correctamente',
    data: { proveedor },
  });
});

export const update = asyncHandler(async (req, res) => {
  const proveedor = await supplierService.updateSupplier(req.params.id, req.body);
  res.json({
    success: true,
    message: 'Proveedor actualizado correctamente',
    data: { proveedor },
  });
});

export const deactivate = asyncHandler(async (req, res) => {
  const proveedor = await supplierService.deactivateSupplier(req.params.id);
  res.json({
    success: true,
    message: 'Proveedor desactivado correctamente',
    data: { proveedor },
  });
});

export const movements = asyncHandler(async (req, res) => {
  const result = await supplierService.listSupplierMovements(req.params.id, req.query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
});

export const pay = asyncHandler(async (req, res) => {
  const result = await supplierService.registerSupplierPayment(
    req.params.id,
    req.body,
    req.user.id,
    clientIp(req)
  );
  res.json({
    success: true,
    message: 'Pago registrado correctamente',
    data: result,
  });
});

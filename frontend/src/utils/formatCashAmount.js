import { formatCurrency } from './formatCurrency';

export const MASKED_AMOUNT = '$ ****';

export const formatCashAmount = (value, visible) =>
  visible ? formatCurrency(value) : MASKED_AMOUNT;

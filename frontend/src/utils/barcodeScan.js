export const isBarcodeLike = (value) => {
  const term = String(value || '').trim();
  if (term.length < 4 || /\s/.test(term)) return false;
  if (!/^[A-Za-z0-9\-_.\/]+$/.test(term)) return false;
  return /\d/.test(term);
};

export const codesMatch = (codigo, term) => {
  if (!codigo || !term) return false;
  return String(codigo).trim().toLowerCase() === String(term).trim().toLowerCase();
};

export const pickScannedProduct = (items, term, { allowSingleName = false } = {}) => {
  if (!items?.length) return null;
  const exact = items.find((product) => codesMatch(product.codigo, term));
  if (exact) return exact;
  if (items.length === 1 && (isBarcodeLike(term) || allowSingleName)) return items[0];
  return null;
};

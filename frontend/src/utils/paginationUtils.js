/**
 * Rango visible "Mostrando X–Y de Z".
 */
export const getShowingRange = (page, limit, total) => {
  if (!total || total <= 0) {
    return { from: 0, to: 0 };
  }
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return { from, to };
};

/**
 * Números de página con elipsis para navegación compacta.
 * @returns {(number|'ellipsis')[]}
 */
export const getVisiblePages = (currentPage, totalPages) => {
  if (totalPages <= 1) return totalPages === 1 ? [1] : [];

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set([1, totalPages, currentPage]);

  if (currentPage > 1) pages.add(currentPage - 1);
  if (currentPage < totalPages) pages.add(currentPage + 1);
  if (currentPage > 2) pages.add(currentPage - 2);
  if (currentPage < totalPages - 1) pages.add(currentPage + 2);

  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const p = sorted[i];
    const prev = sorted[i - 1];
    if (i > 0 && p - prev > 1) {
      result.push('ellipsis');
    }
    result.push(p);
  }

  return result;
};

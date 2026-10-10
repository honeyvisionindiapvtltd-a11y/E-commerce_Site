export const getScanProductPresentation = (apiProduct) => {
  const id = String(apiProduct?.id || '').trim();
  if (!id) return null;

  return {
    ...apiProduct,
    id,
    href: `/products/${encodeURIComponent(id)}`,
  };
};

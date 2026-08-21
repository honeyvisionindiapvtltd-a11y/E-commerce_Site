export function computeTotals(items = [], options = {}) {
  const { coupon = false, secureShipping = false } = options;

  const subtotal = items.reduce((total, item) => total + (item.product?.price || 0) * (item.quantity || 0), 0);
  const installationFee = items.some((item) => item.installation) ? 499 : 0;
  const shipping = subtotal >= 999 || subtotal === 0 ? 0 : 99;
  const discount = coupon ? Math.round(subtotal * 0.1) : 0;
  const insurance = secureShipping ? 49 : 0;
  const total = subtotal + installationFee + shipping + insurance - discount;
  const itemCount = items.reduce((count, item) => count + (item.quantity || 0), 0);

  return {
    subtotal,
    installationFee,
    shipping,
    discount,
    insurance,
    total,
    itemCount,
  };
}

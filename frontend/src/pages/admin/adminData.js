export function loadAdminData() {
  try {
    const raw = localStorage.getItem('admin.data');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }

  // Fallback demo data used when backend admin API is unavailable
  return {
    orders: [],
    products: [],
    customers: [],
    settings: {
      lowStockLimit: 5,
      taxRate: 18,
      currency: 'INR',
    },
  };
}

export function saveAdminData(data) {
  try {
    localStorage.setItem('admin.data', JSON.stringify(data || {}));
  } catch (e) {}
}

export default { loadAdminData, saveAdminData };

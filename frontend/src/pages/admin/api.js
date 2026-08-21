import { loadAdminData, saveAdminData } from "./adminData";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok || body.success === false) {
    throw new Error(body.message || `Request failed (${response.status})`);
  }

  return body;
}

const isProductKey = (key) => key === "products";
const isCategoryKey = (key) => key === "categories";
const isOrderKey = (key) => key === "orders";
const isServiceKey = (key) => key === "services";
const orderStatusValues = { Pending: "order_placed", Processing: "processing", Shipped: "shipped", Delivered: "delivered", Cancelled: "cancelled" };

const wait = (ms=100) => new Promise(resolve => setTimeout(resolve, ms));

export async function adminGet(key) {
  await wait();
  return loadAdminData()[key];
}

export async function adminList(key) {
  if (isProductKey(key)) {
    const body = await adminListProducts();
    return body.products || [];
  }
  if (isCategoryKey(key)) return adminListCategories();
  if (isOrderKey(key)) return adminListOrders();
  if (isServiceKey(key)) return adminListServices();
  return adminGet(key);
}

export async function adminListProducts() {
  return request("/products?limit=1000&includeInactive=true");
}

export async function adminListCategories() {
  const body = await request("/categories");
  return body.categories || [];
}

export async function adminListOrders() {
  const body = await request("/orders");
  return Array.isArray(body) ? body : body.orders || [];
}

export async function adminListServices() { return (await request("/admin/services")).services || []; }
export async function adminListInstallations() { return (await request("/admin/installations")).installations || []; }
export async function adminListNotifications() { return (await request("/admin/notifications")).notifications || []; }
export async function adminUpdateInstallationStatus(id, status) {
  return request(`/admin/installations/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
}

export async function adminCreate(key, item) {
  if (isProductKey(key)) {
    const body = await request("/products", {
      method: "POST",
      body: JSON.stringify(item),
    });
    return body.product;
  }
  if (isCategoryKey(key)) {
    const body = await request("/categories", { method: "POST", body: JSON.stringify(item) });
    return body.category;
  }
  if (isServiceKey(key)) {
    const body = await request("/admin/services", { method: "POST", body: JSON.stringify(item) });
    return body.service;
  }
  const data = loadAdminData();
  const newItem = { id: `${key.slice(0,2)}_${Date.now()}`, ...item };
  data[key] = [newItem, ...(data[key] || [])];
  saveAdminData(data);
  return newItem;
}

export async function adminUpdate(key, id, patch) {
  if (isProductKey(key)) {
    const body = await request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    return body.product;
  }
  if (isCategoryKey(key)) {
    const body = await request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(patch) });
    return body.category;
  }
  if (isServiceKey(key)) {
    const body = await request(`/admin/services/${id}`, { method: "PUT", body: JSON.stringify(patch) });
    return body.service;
  }
  if (isOrderKey(key)) {
    const body = await request(`/admin/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ newStatus: orderStatusValues[patch.status] || patch.status }),
    });
    return body.order;
  }
  const data = loadAdminData();
  data[key] = (data[key] || []).map(item => item.id === id ? {...item, ...patch} : item);
  saveAdminData(data);
  return data[key].find(item => item.id === id);
}

export async function adminDelete(key, id) {
  if (isProductKey(key)) {
    await request(`/products/${id}`, { method: "DELETE" });
    return true;
  }
  if (isCategoryKey(key)) {
    await request(`/categories/${id}`, { method: "DELETE" });
    return true;
  }
  if (isServiceKey(key)) {
    await request(`/admin/services/${id}`, { method: "DELETE" });
    return true;
  }
  const data = loadAdminData();
  data[key] = (data[key] || []).filter(item => item.id !== id);
  saveAdminData(data);
  return true;
}

export async function adminUpdateSettings(patch) {
  const data = loadAdminData();
  data.settings = {...data.settings, ...patch};
  saveAdminData(data);
  return data.settings;
}

/*
Replace this localStorage implementation with fetch/axios calls
when your Flask/FastAPI/Node backend is ready.
*/
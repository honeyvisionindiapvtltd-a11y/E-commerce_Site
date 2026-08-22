import { loadAdminData, saveAdminData } from "./adminData";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const liveKeys = new Set(["products", "categories", "customers", "orders", "delivery"]);

const categoryLabel = (category) => (
  category && typeof category === "object"
    ? category.name || category.slug || "Uncategorized"
    : category || "Uncategorized"
);

const getToken = () => {
  try {
    return JSON.parse(localStorage.getItem("honey-vision-commerce") || "{}").authToken || "";
  } catch {
    return "";
  }
};

const getAllProducts = async () => {
  const products = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const payload = await request(`/admin/products?page=${page}&limit=100`);
    products.push(...(Array.isArray(payload.products) ? payload.products : []));
    totalPages = Number(payload.totalPages || page);
    page += 1;
  }

  return products;
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || "Admin request failed");
  return data;
};

export async function adminGet(key) {
  if (key === "settings") return loadAdminData().settings;
  if (key === "customers") return ((await request("/auth/customers")).customers || []).map((item) => ({ ...item, id: item.id || item._id }));
  if (key === "orders") return (await request("/admin/orders?limit=100")).orders || [];
  if (key === "products") return (await getAllProducts()).map((item) => ({
    ...item,
    id: item.id || item._id,
    category: categoryLabel(item.category),
    subCategory: categoryLabel(item.subCategory),
    status: item.status || (item.isActive === false ? "Inactive" : "Active"),
  }));
  if (key === "categories") {
    const tree = (await request("/categories/tree")).categories || [];
    return tree.flatMap((category) => [
      {
        ...category,
        id: category.id || category._id,
        products: category.productCount || 0,
        parentCategory: "",
      },
      ...(Array.isArray(category.subcategories) ? category.subcategories : []).map((subcategory) => ({
        ...subcategory,
        id: subcategory.id || subcategory._id,
        products: subcategory.productCount || 0,
        parentCategory: categoryLabel(category),
      })),
    ]);
  }
  if (key === "delivery") return (await request("/admin/orders?limit=100")).orders || [];
  return loadAdminData()[key];
}

export async function adminList(key) {
  try {
    return await adminGet(key);
  } catch (error) {
    if (liveKeys.has(key)) throw error;
    return loadAdminData()[key] || [];
  }
}

export async function adminListProducts() {
  const products = [];
  let page = 1;
  let lastResponse;

  do {
    const response = await request(`/products?page=${page}&limit=100&includeInactive=true`);
    lastResponse = response;
    products.push(...(Array.isArray(response.products) ? response.products : []));
    page += 1;
  } while (page <= Number(lastResponse.totalPages || 1));

  return {
    ...lastResponse,
    products,
    count: products.length,
    totalProducts: Number(lastResponse.totalProducts ?? products.length),
    totalPages: 1,
  };
}

export async function adminListCategories() {
  const body = await request("/categories");
  return body.categories || [];
}

export async function adminListCategoryTree() {
  const body = await request("/categories/tree");
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
  if (key === "products") return request("/products", { method: "POST", body: JSON.stringify(item) });
  if (key === "categories") return request("/categories", { method: "POST", body: JSON.stringify(item) });
  const data = loadAdminData();
  const newItem = { id: `${key.slice(0, 2)}_${Date.now()}`, ...item };
  data[key] = [newItem, ...(data[key] || [])];
  saveAdminData(data);
  return newItem;
}

export async function adminUpdate(key, id, patch) {
  if (key === "products") return request(`/products/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(patch) });
  if (key === "categories") return request(`/categories/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(patch) });
  if (key === "customers") return request(`/auth/customers/${encodeURIComponent(id)}/status`, { method: "PUT", body: JSON.stringify(patch) });
  if (key === "orders") return request(`/admin/orders/${encodeURIComponent(id)}/status`, { method: "PUT", body: JSON.stringify({ newStatus: patch.status }) });
  if (key === "delivery") return request(`/admin/orders/${encodeURIComponent(id)}/status`, { method: "PUT", body: JSON.stringify({ newStatus: patch.status }) });
  const data = loadAdminData();
  data[key] = (data[key] || []).map((item) => item.id === id ? { ...item, ...patch } : item);
  saveAdminData(data);
  return data[key].find((item) => item.id === id);
}

export async function adminDelete(key, id) {
  if (key === "products" || key === "categories") {
    await request(`/${key}/${encodeURIComponent(id)}`, { method: "DELETE" });
    return true;
  }
  const data = loadAdminData();
  data[key] = (data[key] || []).filter((item) => item.id !== id);
  saveAdminData(data);
  return true;
}

export async function adminUpdateSettings(patch) {
  const data = loadAdminData();
  data.settings = { ...data.settings, ...patch };
  saveAdminData(data);
  return data.settings;
}
const tryJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const storageKey = (resource) => `admin.${resource}`;

export async function adminList(resource) {
  try {
    const res = await fetch(`/api/${resource}`);
    if (!res.ok) throw new Error('network');
    const body = await tryJson(res);
    if (Array.isArray(body)) return body;
    if (body == null) return [];
    // common shapes: { customers: [...] } or { data: [...] } or { items: [...] }
    const candidates = Object.values(body).find((v) => Array.isArray(v));
    if (candidates) return candidates;
    return [];
  } catch (err) {
    const raw = localStorage.getItem(storageKey(resource));
    return raw ? JSON.parse(raw) : [];
  }
}

export async function adminGet(resource) {
  // Try backend first
  try {
    const res = await fetch(`/api/${resource}`);
    if (res.ok) return await tryJson(res);
  } catch {}

  const raw = localStorage.getItem(storageKey(resource));
  return raw ? JSON.parse(raw) : null;
}

export async function adminCreate(resource, payload = {}) {
  try {
    const endpoint = resource === 'admins' ? '/api/auth/admin/create' : `/api/${resource}`;
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('create-failed');
    return await tryJson(res);
  } catch (err) {
    // fallback: store locally
    const existing = JSON.parse(localStorage.getItem(storageKey(resource)) || '[]');
    const item = { id: `local-${Date.now()}`, ...payload };
    localStorage.setItem(storageKey(resource), JSON.stringify([item, ...existing]));
    return item;
  }
}

export async function adminUpdate(resource, id, payload = {}) {
  try {
    const res = await fetch(`/api/${resource}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('update-failed');
    return await tryJson(res);
  } catch (err) {
    const rows = JSON.parse(localStorage.getItem(storageKey(resource)) || '[]');
    const updated = rows.map((r) => (String(r.id) === String(id) ? { ...r, ...payload } : r));
    localStorage.setItem(storageKey(resource), JSON.stringify(updated));
    return updated.find((r) => String(r.id) === String(id));
  }
}

export async function adminDelete(resource, id) {
  try {
    const res = await fetch(`/api/${resource}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('delete-failed');
    return await tryJson(res);
  } catch (err) {
    const rows = JSON.parse(localStorage.getItem(storageKey(resource)) || '[]');
    const updated = rows.filter((r) => String(r.id) !== String(id));
    localStorage.setItem(storageKey(resource), JSON.stringify(updated));
    return { success: true };
  }
}

export async function adminUpdateSettings(settings) {
  try {
    const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    if (res.ok) return await tryJson(res);
  } catch {}

  localStorage.setItem(storageKey('settings'), JSON.stringify(settings));
  return settings;
}

export default {
  adminList,
  adminGet,
  adminCreate,
  adminUpdate,
  adminDelete,
  adminUpdateSettings,
};

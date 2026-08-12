
import { loadAdminData, saveAdminData } from "./adminData";

const wait = (ms=100) => new Promise(resolve => setTimeout(resolve, ms));

export async function adminGet(key) {
  await wait();
  return loadAdminData()[key];
}

export async function adminList(key) {
  return adminGet(key);
}

export async function adminCreate(key, item) {
  const data = loadAdminData();
  const newItem = { id: `${key.slice(0,2)}_${Date.now()}`, ...item };
  data[key] = [newItem, ...(data[key] || [])];
  saveAdminData(data);
  return newItem;
}

export async function adminUpdate(key, id, patch) {
  const data = loadAdminData();
  data[key] = (data[key] || []).map(item => item.id === id ? {...item, ...patch} : item);
  saveAdminData(data);
  return data[key].find(item => item.id === id);
}

export async function adminDelete(key, id) {
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

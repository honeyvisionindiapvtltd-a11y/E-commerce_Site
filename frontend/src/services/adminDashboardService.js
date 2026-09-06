const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function getAdminDashboard(authToken, period = "7days") {
  const response = await fetch(`${API_BASE}/admin/dashboard?period=${encodeURIComponent(period)}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || "Unable to load dashboard data");
  return data;
}
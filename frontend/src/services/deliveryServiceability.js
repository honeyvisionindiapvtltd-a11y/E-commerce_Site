const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function checkDeliveryServiceability(address) {
  const response = await fetch(`${API_BASE}/delivery/check-serviceability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      country: address?.country || "India",
      state: address?.state || "",
      city: address?.city || "",
      pincode: address?.pincode || address?.pin || "",
    }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Unable to check delivery availability");
    error.status = response.status;
    throw error;
  }

  return data;
}

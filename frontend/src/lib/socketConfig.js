const apiUrl = import.meta.env.VITE_API_URL || "";

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
  || apiUrl.replace(/\/api\/?$/, "")
  || (typeof window !== "undefined" ? window.location.origin : "");

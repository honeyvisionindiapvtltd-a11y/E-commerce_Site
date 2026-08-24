const apiUrl = import.meta.env.VITE_API_URL || "";

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
  || apiUrl.replace(/\/api\/?$/, "")
  || (typeof window !== "undefined" ? window.location.origin : "");

if (import.meta.env.DEV) {
  console.debug("HoneyVision local network configuration", {
    apiUrl: apiUrl || "relative proxy",
    socketUrl: SOCKET_URL,
    frontendOrigin: typeof window !== "undefined" ? window.location.origin : "unknown",
  });
}

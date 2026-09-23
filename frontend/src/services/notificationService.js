const notificationPath = (isAdmin, path = "") => `${isAdmin ? "/admin" : ""}/notifications${path}`;

export const getNotifications = (requestJson, page = 1, isAdmin = false) => requestJson(`${notificationPath(isAdmin)}?page=${page}&limit=30`);
export const getUnreadNotificationCount = (requestJson, isAdmin = false) => requestJson(notificationPath(isAdmin, "/unread-count"));
export const getNotificationPreferences = (requestJson, isAdmin = false) => requestJson(notificationPath(isAdmin, "/preferences"));
export const updateNotificationPreferences = (requestJson, updates, isAdmin = false) => requestJson(notificationPath(isAdmin, "/preferences"), { method: "PATCH", body: JSON.stringify(updates) });
export const markNotificationRead = (requestJson, id, isAdmin = false) => requestJson(`${notificationPath(isAdmin)}/${encodeURIComponent(id)}/read`, { method: "PATCH", body: JSON.stringify({}) });
export const markNotificationUnread = (requestJson, id, isAdmin = false) => requestJson(`${notificationPath(isAdmin)}/${encodeURIComponent(id)}/unread`, { method: "PATCH", body: JSON.stringify({}) });
export const markAllNotificationsRead = (requestJson, isAdmin = false) => requestJson(notificationPath(isAdmin, "/read-all"), { method: "PATCH", body: JSON.stringify({}) });
export const deleteNotification = (requestJson, id, isAdmin = false) => requestJson(`${notificationPath(isAdmin)}/${encodeURIComponent(id)}`, { method: "DELETE" });
export const clearAllNotifications = (requestJson, isAdmin = false) => requestJson(notificationPath(isAdmin), { method: "DELETE" });
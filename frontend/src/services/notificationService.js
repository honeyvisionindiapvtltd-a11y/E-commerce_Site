export const getNotifications = (requestJson, page = 1) => requestJson(`/notifications?page=${page}&limit=30`);
export const getUnreadNotificationCount = (requestJson) => requestJson("/notifications/unread-count");
export const markNotificationRead = (requestJson, id) => requestJson(`/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH", body: JSON.stringify({}) });
export const markAllNotificationsRead = (requestJson) => requestJson("/notifications/read-all", { method: "PATCH", body: JSON.stringify({}) });
export const deleteNotification = (requestJson, id) => requestJson(`/notifications/${encodeURIComponent(id)}`, { method: "DELETE" });
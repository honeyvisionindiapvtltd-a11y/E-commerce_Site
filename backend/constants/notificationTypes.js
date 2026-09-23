export const NOTIFICATION_CATEGORIES = Object.freeze({
  ORDER: "ORDER",
  PAYMENT: "PAYMENT",
  DELIVERY: "DELIVERY",
  INSTALLATION: "INSTALLATION",
  SUPPORT: "SUPPORT",
  PROMOTION: "PROMOTION",
  PRICE_ALERT: "PRICE_ALERT",
  SECURITY: "SECURITY",
  CUSTOMER: "CUSTOMER",
  PRODUCT: "PRODUCT",
  INVENTORY: "INVENTORY",
  SYSTEM: "SYSTEM",
});

export const DEFAULT_NOTIFICATION_PREFERENCES = Object.freeze({
  orderUpdates: true,
  paymentUpdates: true,
  deliveryUpdates: true,
  installationUpdates: true,
  supportUpdates: true,
  promotions: true,
  priceAlerts: true,
  securityAlerts: true,
  pushNotifications: false,
  emailNotifications: true,
  smsNotifications: false,
});

export const DEFAULT_ADMIN_NOTIFICATION_PREFERENCES = Object.freeze({
  orderNotifications: true,
  paymentNotifications: true,
  installationNotifications: true,
  deliveryNotifications: true,
  customerNotifications: true,
  supportNotifications: true,
  productNotifications: true,
  inventoryNotifications: true,
  securityAlerts: true,
  pushNotifications: false,
  emailNotifications: false,
  smsNotifications: false,
});

export const ADMIN_NOTIFICATION_PREFERENCE_BY_CATEGORY = Object.freeze({
  ORDER: "orderNotifications",
  PAYMENT: "paymentNotifications",
  INSTALLATION: "installationNotifications",
  DELIVERY: "deliveryNotifications",
  CUSTOMER: "customerNotifications",
  SUPPORT: "supportNotifications",
  PRODUCT: "productNotifications",
  INVENTORY: "inventoryNotifications",
  SECURITY: "securityAlerts",
});

export const NOTIFICATION_PREFERENCE_BY_CATEGORY = Object.freeze({
  ORDER: "orderUpdates",
  PAYMENT: "paymentUpdates",
  DELIVERY: "deliveryUpdates",
  INSTALLATION: "installationUpdates",
  SUPPORT: "supportUpdates",
  PROMOTION: "promotions",
  PRICE_ALERT: "priceAlerts",
  SECURITY: "securityAlerts",
});

export const TRANSACTIONAL_CATEGORIES = new Set([
  "ORDER",
  "PAYMENT",
  "DELIVERY",
  "INSTALLATION",
  "SUPPORT",
  "SECURITY",
]);

export const CATEGORY_BY_TYPE = Object.freeze({
  ORDER_PLACED: "ORDER",
  ORDER_CREATED: "ORDER",
  ORDER_CONFIRMED: "ORDER",
  ORDER_STATUS_UPDATE: "ORDER",
  ORDER_STATUS_CHANGED: "ORDER",
  ORDER_CANCELLED: "ORDER",
  PAYMENT_PENDING: "PAYMENT",
  ORDER_PAYMENT_PENDING: "PAYMENT",
  PAYMENT_SUCCESS: "PAYMENT",
  ORDER_PAYMENT_CONFIRMED: "PAYMENT",
  PAYMENT_FAILED: "PAYMENT",
  PAYMENT_REFUNDED: "PAYMENT",
  DELIVERY_ASSIGNED: "DELIVERY",
  DELIVERY_COMPLETED: "DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERY",
  DELIVERY_FAILED: "DELIVERY",
  DELIVERED: "DELIVERY",
  INSTALLATION_BOOKED: "INSTALLATION",
  INSTALLATION_CONFIRMED: "INSTALLATION",
  INSTALLATION_SCHEDULED: "INSTALLATION",
  INSTALLATION_ASSIGNED: "INSTALLATION",
  INSTALLATION_AGENT_ACCEPTED: "INSTALLATION",
  INSTALLATION_ON_THE_WAY: "INSTALLATION",
  INSTALLATION_ARRIVED: "INSTALLATION",
  INSTALLATION_IN_PROGRESS: "INSTALLATION",
  INSTALLATION_COMPLETED: "INSTALLATION",
  INSTALLATION_FAILED: "INSTALLATION",
  INSTALLATION_CANCELLED: "INSTALLATION",
  SUPPORT_TICKET_CREATED: "SUPPORT",
  SUPPORT_TICKET_UPDATED: "SUPPORT",
  SUPPORT_REPLY_RECEIVED: "SUPPORT",
  SUPPORT_TICKET_REPLIED: "SUPPORT",
  PROMOTIONAL_OFFER: "PROMOTION",
  NEW_ARRIVAL: "PROMOTION",
  PRICE_DROP: "PRICE_ALERT",
  SECURITY_ALERT: "SECURITY",
  PASSWORD_CHANGED: "SECURITY",
  ACCOUNT_SECURITY_ALERT: "SECURITY",
  CUSTOMER_REGISTERED: "CUSTOMER",
  CUSTOMER_UPDATED: "CUSTOMER",
  NEW_SUPPORT_TICKET: "SUPPORT",
  NEW_SUPPORT_MESSAGE: "SUPPORT",
  PRODUCT_CREATED: "PRODUCT",
  PRODUCT_UPDATED: "PRODUCT",
  PRODUCT_OUT_OF_STOCK: "INVENTORY",
  LOW_STOCK: "INVENTORY",
  SECURITY_LOGIN: "SECURITY",
  SECURITY_PASSWORD_CHANGED: "SECURITY",
  SECURITY_SUSPICIOUS_ACTIVITY: "SECURITY",
  ADMIN_ALERT: "SYSTEM",
});

export function normalizeNotificationCategory(category, type = "") {
  const normalized = String(category || "").trim().toUpperCase();
  const inferred = CATEGORY_BY_TYPE[String(type || "").trim().toUpperCase()];
  if (inferred && (!normalized || normalized === "SYSTEM")) return inferred;
  if (Object.prototype.hasOwnProperty.call(NOTIFICATION_CATEGORIES, normalized)) return normalized;
  return inferred || "SYSTEM";
}

export function isNotificationEnabled(preferences, category, type = "") {
  const normalizedCategory = normalizeNotificationCategory(category, type);
  if (String(type || "").toUpperCase() === "PAYMENT_FAILED" || normalizedCategory === "SECURITY") return true;
  const preferenceKey = NOTIFICATION_PREFERENCE_BY_CATEGORY[normalizedCategory];
  return !preferenceKey || preferences?.[preferenceKey] !== false;
}
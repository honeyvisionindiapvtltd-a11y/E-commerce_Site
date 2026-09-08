import { ORDER_STATUSES } from "../constants/orderStatuses.js";

const excludedStatuses = [ORDER_STATUSES.CANCELLED, ORDER_STATUSES.RETURNED];

export const confirmedOrderFilter = (extra = {}) => ({
  ...extra,
  status: extra.status || { $nin: excludedStatuses },
  $or: [
    { paymentStatus: "PAID" },
    { paymentMethod: "COD", orderLifecycleStatus: { $ne: "PAYMENT_PENDING" } },
    { orderLifecycleStatus: "CONFIRMED" },
  ],
});

export const pendingPaymentFilter = {
  orderLifecycleStatus: { $in: ["PAYMENT_PENDING", "PAYMENT_FAILED", "PAYMENT_CANCELLED"] },
};

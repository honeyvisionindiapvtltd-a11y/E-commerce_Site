import { ORDER_STATUSES } from "../constants/orderStatuses.js";

const courierStatusMap = Object.freeze({
  PICKED_UP: ORDER_STATUSES.SHIPPED,
  IN_TRANSIT: ORDER_STATUSES.SHIPPED,
  ARRIVED_AT_HUB: ORDER_STATUSES.SHIPPED,
  OUT_FOR_DELIVERY: ORDER_STATUSES.OUT_FOR_DELIVERY,
  DELIVERED: ORDER_STATUSES.DELIVERED,
  CANCELLED: ORDER_STATUSES.CANCELLED,
  RETURNED: ORDER_STATUSES.RETURNED,
});

export const mapCourierStatus = (status) => {
  const normalizedStatus = String(status || "").trim().toUpperCase();
  return courierStatusMap[normalizedStatus] || null;
};

export { courierStatusMap };
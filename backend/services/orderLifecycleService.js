import ReturnRequest from "../models/ReturnRequest.js";
import { ORDER_STATUSES } from "../constants/orderStatuses.js";

export const RETURN_WINDOW_DAYS = Math.max(0, Number(process.env.RETURN_WINDOW_DAYS || 7));

const CUSTOMER_CANCELLABLE_STATUSES = new Set([
  ORDER_STATUSES.ORDER_PLACED,
  ORDER_STATUSES.PROCESSING,
  ORDER_STATUSES.PACKED,
]);

export const canCustomerCancelOrder = (order) => {
  if (!order) return { allowed: false, reason: "Order not found" };
  if (order.status === ORDER_STATUSES.DELIVERED) {
    return { allowed: false, reason: "This order has already been delivered and cannot be cancelled. You may request a return if eligible." };
  }
  if (order.status === ORDER_STATUSES.CANCELLED) {
    return { allowed: false, reason: "This order has already been cancelled." };
  }
  if (order.status === ORDER_STATUSES.RETURNED) {
    return { allowed: false, reason: "Returned orders cannot be cancelled." };
  }
  if (order.status === ORDER_STATUSES.OUT_FOR_DELIVERY || order.status === ORDER_STATUSES.SHIPPED) {
    return { allowed: false, reason: "This order is already in transit and cannot be cancelled." };
  }
  if (!CUSTOMER_CANCELLABLE_STATUSES.has(order.status)) {
    return { allowed: false, reason: `Orders cannot be cancelled after ${String(order.status || "this stage").toLowerCase().replaceAll("_", " ")}.` };
  }
  return { allowed: true, reason: "" };
};

export const getReturnEligibility = async (order) => {
  if (!order || order.status !== ORDER_STATUSES.DELIVERED) {
    return { returnEligible: false, reason: "Returns are available only for delivered orders." };
  }

  const existing = await ReturnRequest.exists({ order: order._id });
  if (existing) return { returnEligible: false, reason: "A return request already exists for this order." };

  const deliveredAt = order.deliveredAt;
  if (!deliveredAt) return { returnEligible: false, reason: "Delivery date is unavailable." };

  const returnDeadline = new Date(new Date(deliveredAt).getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const daysRemaining = Math.max(0, Math.ceil((returnDeadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  if (Date.now() > returnDeadline.getTime()) {
    return { returnEligible: false, reason: "The return window has expired.", returnDeadline, daysRemaining: 0 };
  }
  return { returnEligible: true, returnDeadline, daysRemaining };
};

export const getOrderActions = async (order) => {
  const eligibility = await getReturnEligibility(order);
  return {
    canCancel: canCustomerCancelOrder(order).allowed,
    ...eligibility,
    canReturn: eligibility.returnEligible,
    canReplace: false,
  };
};

export const canTransitionOrderStatus = (currentStatus, nextStatus, allowedTransitions) => (
  currentStatus === nextStatus || Boolean(allowedTransitions[currentStatus]?.includes(nextStatus))
);

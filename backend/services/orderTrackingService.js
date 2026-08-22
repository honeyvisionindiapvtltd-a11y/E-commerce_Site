import crypto from "node:crypto";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import {
  ORDER_STATUSES,
  ORDER_STATUS_VALUES,
  STATUS_DESCRIPTIONS,
  STATUS_TITLES,
} from "../constants/orderStatuses.js";
import { emitOrderStatusUpdate } from "./realtimeService.js";

const allowedTransitions = {
  ORDER_PLACED: ["PAYMENT_CONFIRMED", "PROCESSING", "CANCELLED"],
  PAYMENT_CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED", "RETURN_REQUESTED"],
  PACKED: ["SHIPPED", "OUT_FOR_DELIVERY", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED_DELIVERY", "CANCELLED"],
  FAILED_DELIVERY: ["OUT_FOR_DELIVERY"],
  DELIVERED: ["RETURN_REQUESTED"],
  CANCELLED: ["RETURNED"],
  RETURN_REQUESTED: ["RETURNED", "CANCELLED"],
  RETURNED: [],
};

export const DELIVERY_OTP_MAX_ATTEMPTS = 5;
export const DELIVERY_OTP_TTL_MS = 24 * 60 * 60 * 1000;

export const hashDeliveryOtp = (otp) => crypto
  .createHash("sha256")
  .update(String(otp))
  .digest("hex");

export const createDeliveryOtp = () => String(crypto.randomInt(100000, 1000000));

export const verifyDeliveryOtp = (otp, expectedHash) => {
  const actual = Buffer.from(hashDeliveryOtp(otp), "hex");
  const expected = Buffer.from(String(expectedHash || ""), "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};

const resolveOrder = async (orderId) => {
  const lookup = [{ orderNumber: String(orderId) }];
  if (mongoose.Types.ObjectId.isValid(orderId)) {
    lookup.push({ _id: orderId });
  }
  return Order.findOne({ $or: lookup }).select("+deliveryOtpVerifiedAt");
};

const sameEvent = (event, candidate) => (
  event?.status === candidate.status
  && event?.title === candidate.title
  && event?.description === candidate.description
  && event?.location === candidate.location
);

export const updateOrderTracking = async ({
  orderId,
  status,
  title,
  description,
  location = "",
  source = "SYSTEM",
  metadata,
  deliveryAgent,
  allowTransition = true,
  deliveryOtp,
  resetDeliveryOtp = false,
}) => {
  if (!orderId) throw new Error("Order ID is required");
  if (!ORDER_STATUS_VALUES.includes(status)) {
    throw new Error(`Invalid order status: ${status}`);
  }
  if (!["ADMIN", "PAYMENT", "COURIER", "DELIVERY_AGENT", "SYSTEM"].includes(source)) {
    throw new Error(`Invalid tracking source: ${source}`);
  }

  const order = await resolveOrder(orderId);
  if (!order) throw new Error("Order not found");

  if (status === ORDER_STATUSES.OUT_FOR_DELIVERY && order.status !== status) {
    const otp = deliveryOtp || createDeliveryOtp();
    order.deliveryOtpHash = hashDeliveryOtp(otp);
    order.deliveryOtpExpiresAt = new Date(Date.now() + DELIVERY_OTP_TTL_MS);
    order.deliveryOtpVerifiedAt = null;
    order.deliveryOtpAttempts = 0;
  }

  if (resetDeliveryOtp) {
    order.deliveryOtpHash = null;
    order.deliveryOtpExpiresAt = null;
    order.deliveryOtpVerifiedAt = null;
    order.deliveryOtpAttempts = 0;
  }

  if (
    status === ORDER_STATUSES.DELIVERED
    && order.status !== ORDER_STATUSES.DELIVERED
    && !order.deliveryOtpVerifiedAt
  ) {
    throw new Error("Delivery OTP verification is required before completion");
  }

  if (status === ORDER_STATUSES.OUT_FOR_DELIVERY && order.status === "FAILED_DELIVERY" && source !== "DELIVERY_AGENT") {
    throw new Error("Failed deliveries must be restarted by the assigned delivery agent");
  }

  const event = {
    status,
    title: title || STATUS_TITLES[status] || status,
    description: description || STATUS_DESCRIPTIONS[status] || `Status changed to ${status}`,
    location: location || order.shippingAddress?.city || "",
    timestamp: new Date(),
    completed: true,
    source,
    ...(metadata ? { metadata } : {}),
  };

  const lastEvent = order.trackingEvents?.[order.trackingEvents.length - 1];
  if (sameEvent(lastEvent, event)) {
    return { order, trackingEvent: lastEvent, duplicate: true };
  }

  if (allowTransition && status !== order.status) {
    const nextStatuses = allowedTransitions[order.status] || [];
    if (!nextStatuses.includes(status)) {
      throw new Error(`Invalid order status transition: ${order.status} -> ${status}`);
    }
  }

  order.status = status;
  order.trackingEvents = order.trackingEvents || [];
  order.trackingEvents.push(event);

  if (status === ORDER_STATUSES.DELIVERED) {
    order.deliveredAt = event.timestamp;
  }
  if (status === ORDER_STATUSES.CANCELLED) {
    order.cancelledAt = event.timestamp;
  }

  await order.save();

  if (status === ORDER_STATUSES.CANCELLED && !order.stockRestoredAt) {
    await Promise.all(order.items.map((item) =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }),
    ));
    order.stockRestoredAt = event.timestamp;
    await order.save();
  }

  emitOrderStatusUpdate(order.orderNumber, order.user, status, {
    trackingEvent: event,
    estimatedDeliveryDate: order.estimatedDeliveryDate,
    trackingNumber: order.trackingNumber,
    carrier: order.courierName,
    deliveryAgent,
    failedDelivery: status === ORDER_STATUSES.FAILED_DELIVERY ? {
      reason: order.failedDeliveryReason,
      failedAt: order.failedDeliveryAt,
    } : undefined,
    updatedAt: order.updatedAt,
  });

  return { order, trackingEvent: event, duplicate: false };
};

export { allowedTransitions };
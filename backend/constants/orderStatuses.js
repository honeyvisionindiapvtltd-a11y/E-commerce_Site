export const ORDER_STATUSES = Object.freeze({
  ORDER_PLACED: "ORDER_PLACED",
  PAYMENT_CONFIRMED: "PAYMENT_CONFIRMED",
  PROCESSING: "PROCESSING",
  PACKED: "PACKED",
  SHIPPED: "SHIPPED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  FAILED_DELIVERY: "FAILED_DELIVERY",
  CANCELLED: "CANCELLED",
  RETURN_REQUESTED: "RETURN_REQUESTED",
  RETURNED: "RETURNED",
});

export const STATUS_TITLES = Object.freeze({
  ORDER_PLACED: "Order Placed",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Order Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  FAILED_DELIVERY: "Delivery attempt unsuccessful",
  CANCELLED: "Order Cancelled",
  RETURN_REQUESTED: "Return Requested",
  RETURNED: "Returned",
});

export const STATUS_DESCRIPTIONS = Object.freeze({
  ORDER_PLACED: "Your order has been placed successfully.",
  PAYMENT_CONFIRMED: "Payment has been confirmed.",
  PROCESSING: "Your order is being processed.",
  PACKED: "Your order has been packed and is ready for shipment.",
  SHIPPED: "Your order has been shipped and is on its way.",
  OUT_FOR_DELIVERY: "Your order is out for delivery.",
  DELIVERED: "Your order has been delivered successfully.",
  FAILED_DELIVERY: "The delivery attempt was unsuccessful. Our team will update you regarding the next delivery step.",
  CANCELLED: "Your order has been cancelled.",
  RETURN_REQUESTED: "Return has been requested.",
  RETURNED: "Your order has been returned.",
});

export const ORDER_STATUS_VALUES = Object.freeze(Object.values(ORDER_STATUSES));
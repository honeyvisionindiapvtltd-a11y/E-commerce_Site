/**
 * Order Tracking API Service
 * Frontend service for all order tracking related API calls
 */

const API_BASE = import.meta.env.VITE_API_URL || "/api";

// ==========================================
// CUSTOMER API CALLS
// ==========================================

/**
 * Fetch all orders for current user
 */
export const getMyOrders = async (token) => {
  try {
    const response = await fetch(`${API_BASE}/orders/my-orders`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

/**
 * Get single order details by order number
 */
export const getOrderByNumber = async (orderNumber, token) => {
  try {
    const response = await fetch(`${API_BASE}/orders/${orderNumber}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
};

/**
 * Get order tracking information (timeline, carrier, ETA, etc.)
 */
export const getOrderTracking = async (orderNumber, token) => {
  try {
    const fetchTrackingFrom = async (url) => {
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        return { ok: false, status: response.status, statusText: response.statusText };
      }

      return { ok: true, data: await response.json() };
    };

    const directUrl = `${API_BASE}/orders/${encodeURIComponent(orderNumber)}/tracking`;
    const fallbackUrl = `${API_BASE}/tracking?order=${encodeURIComponent(orderNumber)}`;

    let result = await fetchTrackingFrom(directUrl);

    if (!result.ok && result.status === 404) {
      result = await fetchTrackingFrom(fallbackUrl);
    }

    if (!result.ok) {
      throw new Error(result.statusText || "Not Found");
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching tracking:", error);
    throw error;
  }
};

/**
 * Get tracking events for an order
 */
export const getTrackingEvents = async (orderNumber, token) => {
  try {
    const response = await fetch(`${API_BASE}/orders/${orderNumber}/tracking/events`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching tracking events:", error);
    throw error;
  }
};

// ==========================================
// ADMIN API CALLS
// ==========================================

/**
 * Update order status (admin only)
 * Automatically creates tracking event
 */
export const updateOrderStatus = async (orderNumber, status, token) => {
  try {
    const response = await fetch(`${API_BASE}/orders/${orderNumber}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

/**
 * Update tracking information (admin only)
 * Updates carrier, tracking number, estimated delivery date
 */
export const updateOrderTracking = async (
  orderNumber,
  trackingData,
  token
) => {
  try {
    const response = await fetch(`${API_BASE}/orders/${orderNumber}/tracking`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(trackingData),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating tracking:", error);
    throw error;
  }
};

/**
 * Add manual tracking event (admin only)
 */
export const addTrackingEvent = async (
  orderNumber,
  eventData,
  token
) => {
  try {
    const response = await fetch(
      `${API_BASE}/orders/${orderNumber}/tracking/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding tracking event:", error);
    throw error;
  }
};

/**
 * Assign delivery agent to order (admin only)
 */
export const assignDeliveryAgent = async (
  orderNumber,
  agentId,
  token
) => {
  try {
    const response = await fetch(
      `${API_BASE}/orders/${orderNumber}/assign-agent`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ agentId }),
      }
    );

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json();
  } catch (error) {
    console.error("Error assigning delivery agent:", error);
    throw error;
  }
};

// ==========================================
// ORDER STATUSES HELPER
// ==========================================

export const ORDER_STATUSES = {
  ORDER_PLACED: "ORDER_PLACED",
  PAYMENT_CONFIRMED: "PAYMENT_CONFIRMED",
  PROCESSING: "PROCESSING",
  PACKED: "PACKED",
  SHIPPED: "SHIPPED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  RETURN_REQUESTED: "RETURN_REQUESTED",
  RETURNED: "RETURNED",
};

export const STATUS_COLORS = {
  ORDER_PLACED: "bg-blue-500",
  PAYMENT_CONFIRMED: "bg-green-500",
  PROCESSING: "bg-yellow-500",
  PACKED: "bg-purple-500",
  SHIPPED: "bg-indigo-500",
  OUT_FOR_DELIVERY: "bg-orange-500",
  DELIVERED: "bg-green-600",
  CANCELLED: "bg-red-500",
  RETURN_REQUESTED: "bg-yellow-600",
  RETURNED: "bg-red-600",
};

export const STATUS_LABELS = {
  ORDER_PLACED: "Order Placed",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURN_REQUESTED: "Return Requested",
  RETURNED: "Returned",
};

/**
 * Get all possible order statuses
 */
export const getAllStatuses = () => {
  return Object.values(ORDER_STATUSES);
};

/**
 * Get status color for UI
 */
export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || "bg-gray-500";
};

/**
 * Get status label for display
 */
export const getStatusLabel = (status) => {
  return STATUS_LABELS[status] || status;
};

/**
 * Check if order is delivered
 */
export const isDelivered = (status) => {
  return status === ORDER_STATUSES.DELIVERED;
};

/**
 * Check if order is cancelled
 */
export const isCancelled = (status) => {
  return status === ORDER_STATUSES.CANCELLED;
};

/**
 * Check if order is in transit
 */
export const isInTransit = (status) => {
  return (
    status === ORDER_STATUSES.SHIPPED ||
    status === ORDER_STATUSES.OUT_FOR_DELIVERY
  );
};

/**
 * Check if order status polling should continue
 */
export const shouldContinuePolling = (status) => {
  return !isDelivered(status) && !isCancelled(status);
};

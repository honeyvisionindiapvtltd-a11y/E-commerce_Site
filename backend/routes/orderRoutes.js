import express from "express";

import {
  createOrder,
  getMyOrders,
  getOrderByNumber,
  getOrderTracking,
  updateOrderStatus,
  updateOrderTracking,
  addTrackingEvent,
  assignDeliveryAgent,
  assignShipment,
  createTestOrder,
} from "../controllers/orderTrackingController.js";

import { protect, requireAdmin, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// CUSTOMER ROUTES
// ======================================================

// Create new order (supports guest checkout when no JWT is present)
router.post("/", optionalAuth, createOrder);

// Get all orders for logged-in user
router.get("/my-orders", protect, getMyOrders);

// Debug: List all orders (for testing)
router.get("/debug/all-orders", async (req, res) => {
  try {
    const Order = (await import("../models/Order.js")).default;
    const orders = await Order.find().select("orderNumber status totalAmount createdAt user").limit(50);
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create test order for tracking demo
router.post("/debug/test-order", protect, createTestOrder);

// Query-string based lookup used by demos and legacy UI flows
router.get("/tracking", optionalAuth, async (req, res) => {
  const orderNumber = req.query.order || req.query.orderNumber;

  if (!orderNumber) {
    return res.status(400).json({
      success: false,
      message: "Order number is required",
    });
  }

  return getOrderTracking({
    params: { orderNumber },
    query: req.query,
    user: req.user,
  }, res);
});

// Get single order by order number
router.get("/:orderNumber", protect, getOrderByNumber);

// Get order tracking information
router.get("/:orderNumber/tracking", optionalAuth, getOrderTracking);

// ======================================================
// ADMIN ROUTES - Order Management
// ======================================================

// Update order status
router.put("/:orderNumber/status", protect, requireAdmin, updateOrderStatus);

// Update tracking information (carrier, tracking number, ETA)
router.put("/:orderNumber/tracking", protect, requireAdmin, updateOrderTracking);

// Add manual tracking event
router.post("/:orderNumber/tracking/events", protect, requireAdmin, addTrackingEvent);

// Assign delivery agent to order
router.put("/:orderNumber/assign-agent", protect, requireAdmin, assignDeliveryAgent);

// Legacy shipment endpoint
router.put("/:orderNumber/shipment", protect, requireAdmin, assignShipment);

export default router;
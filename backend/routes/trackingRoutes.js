import express from "express";

import {
  trackShipment,
  updateShipmentStatus,
  updateShipmentLocation,
} from "../controllers/trackingController.js";
import {
  getOrderTracking,
} from "../controllers/orderTrackingController.js";
import { optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Query-string order lookup used by legacy frontend flows
router.get("/", optionalAuth, async (req, res) => {
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

// Public tracking
router.get(
  "/:trackingNumber",
  trackShipment
);

// Admin / delivery-agent endpoints
router.patch(
  "/shipment/:id/status",
  updateShipmentStatus
);

router.patch(
  "/shipment/:id/location",
  updateShipmentLocation
);

export default router;
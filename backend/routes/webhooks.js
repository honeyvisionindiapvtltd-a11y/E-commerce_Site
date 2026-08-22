import crypto from "crypto";
import express from "express";
import Shipment from "../models/Shipment.js";
import { mapCourierStatus } from "../services/courierStatusMapper.js";
import { updateOrderTracking } from "../services/orderTrackingService.js";
import { emitDeliveryUpdate } from "../services/realtimeService.js";

const router = express.Router();

router.post("/shipping", express.raw({ type: "application/json" }), async (req, res) => {
  const secret = process.env.SHIPPING_WEBHOOK_SECRET;
  const signature = req.headers["x-shipping-signature"];

  if (!secret || !signature || !Buffer.isBuffer(req.body)) {
    return res.status(401).json({ success: false, message: "Invalid webhook authentication" });
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(req.body)
    .digest("hex");

  const receivedSignature = Buffer.from(String(signature));
  const expectedSignatureBuffer = Buffer.from(expectedSignature);
  if (
    receivedSignature.length !== expectedSignatureBuffer.length
    || !crypto.timingSafeEqual(receivedSignature, expectedSignatureBuffer)
  ) {
    return res.status(401).json({ success: false, message: "Invalid webhook signature" });
  }

  try {
    const payload = JSON.parse(req.body.toString("utf8"));
    const { trackingNumber, status, location = "", description } = payload;
    const internalStatus = mapCourierStatus(status);

    if (!trackingNumber || !internalStatus) {
      return res.status(400).json({ success: false, message: "Tracking number and supported status are required" });
    }

    const shipment = await Shipment.findOne({ trackingNumber });
    if (!shipment) {
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    shipment.status = internalStatus;
    if (location) {
      shipment.currentLocation = {
        ...(typeof location === "object" ? location : { address: location }),
        updatedAt: new Date(),
      };
    }
    const result = await updateOrderTracking({
      orderId: shipment.order,
      status: internalStatus,
      description: description || `Courier status updated to ${status}`,
      location: typeof location === "string" ? location : "",
      source: "COURIER",
    });
    await shipment.save();

    if (location) {
      emitDeliveryUpdate(
        result.order.orderNumber,
        result.order.user,
        location,
        result.order.estimatedDeliveryDate
      );
    }

    return res.json({ success: true, order: result.order, event: result.trackingEvent });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
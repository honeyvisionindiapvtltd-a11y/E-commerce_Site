import Shipment from "../models/Shipment.js";
import Order from "../models/Order.js";
import {
  ORDER_STATUS_VALUES,
  STATUS_DESCRIPTIONS,
} from "../constants/orderStatuses.js";
import { emitDeliveryUpdate } from "../services/realtimeService.js";
import { updateOrderTracking } from "../services/orderTrackingService.js";

// ==========================================
// TRACK BY TRACKING NUMBER
// ==========================================

export const trackShipment = async (
  req,
  res
) => {
  try {
    const shipment =
      await Shipment.findOne({
        trackingNumber:
          req.params.trackingNumber,
      })
        .populate({
          path: "order",
          select:
            "orderNumber status user shippingAddress createdAt totalAmount",
        })
        .populate(
          "deliveryAgent",
          "name phone vehicleNumber vehicleType"
        );

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    const isAdmin = req.user?.role === "admin";
    const isCustomer = req.user && shipment.order?.user
      && String(shipment.order.user) === String(req.user._id);
    if (!isAdmin && !isCustomer) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.status(200).json({
      success: true,
      shipment,
    });
  } catch (error) {
    console.error(
      "trackShipment:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch tracking information",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE SHIPMENT STATUS
// ==========================================

export const updateShipmentStatus = async (
  req,
  res
) => {
  try {
    const {
      status,
      message,
      location = "",
    } = req.body;

    if (!ORDER_STATUS_VALUES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const shipment =
      await Shipment.findById(
        req.params.id
      );

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    if (req.user.role === "delivery_agent") {
      if (String(shipment.deliveryAgent) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: "Assigned delivery agent access required" });
      }
      if (req.user.status !== "Active") {
        return res.status(403).json({ success: false, message: "Active delivery agent access required" });
      }
    }

    const order = await Order.findById(shipment.order).select("status +deliveryOtpVerifiedAt");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (status === "DELIVERED" && !order.deliveryOtpVerifiedAt) {
      return res.status(409).json({ success: false, message: "Delivery OTP verification is required before completion" });
    }

    shipment.status = status;

    shipment.trackingEvents.push({
      status,

      message: message || STATUS_DESCRIPTIONS[status],

      location,

      timestamp: new Date(),
    });

    if (status === "DELIVERED") {
      shipment.deliveredAt =
        new Date();
    }

    const result = await updateOrderTracking({
      orderId: shipment.order,
      status,
      description: message || STATUS_DESCRIPTIONS[status],
      location,
      source: "COURIER",
    });
    await shipment.save();

    res.status(200).json({
      success: true,
      message:
        "Shipment status updated",
      shipment,
      order: result.order,
      event: result.trackingEvent,
    });
  } catch (error) {
    console.error(
      "updateShipmentStatus:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update shipment",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE LIVE LOCATION
// ==========================================

export const updateShipmentLocation =
  async (req, res) => {
    try {
      const {
        latitude,
        longitude,
        accuracy,
      } = req.body;

      if (
        latitude === undefined ||
        longitude === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Latitude and longitude are required",
        });
      }

      const shipment =
        await Shipment.findById(
          req.params.id
        );

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message:
            "Shipment not found",
        });
      }

      if (req.user.role === "delivery_agent") {
        if (String(shipment.deliveryAgent) !== String(req.user._id)) {
          return res.status(403).json({ success: false, message: "Assigned delivery agent access required" });
        }
        if (shipment.status !== "OUT_FOR_DELIVERY") {
          return res.status(409).json({ success: false, message: "Location can only be shared while out for delivery" });
        }
      }

      const parsedLatitude = Number(latitude);
      const parsedLongitude = Number(longitude);
      const parsedAccuracy = accuracy === undefined ? null : Number(accuracy);
      if (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90
        || !Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180
        || (parsedLatitude === 0 && parsedLongitude === 0)
        || (parsedAccuracy !== null && (!Number.isFinite(parsedAccuracy) || parsedAccuracy < 0))) {
        return res.status(400).json({ success: false, message: "Invalid delivery coordinates" });
      }

      shipment.currentLocation = {
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        accuracy: parsedAccuracy,
        updatedAt: new Date(),
      };

      shipment.liveTrackingEnabled =
        true;

      await shipment.save();

      const order = await Order.findById(shipment.order).select("orderNumber user").lean();
      if (order) {
        emitDeliveryUpdate(
          order.orderNumber,
          order.user,
          shipment.currentLocation,
          shipment.estimatedDeliveryDate
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Location updated successfully",
        location:
          shipment.currentLocation,
      });
    } catch (error) {
      console.error(
        "updateShipmentLocation:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update location",
        error: error.message,
      });
    }
  };
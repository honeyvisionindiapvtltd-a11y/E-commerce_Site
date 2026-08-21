import Shipment from "../models/Shipment.js";
import Order from "../models/Order.js";

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
            "orderNumber status shippingAddress createdAt totalAmount",
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

    shipment.status = status;

    shipment.trackingEvents.push({
      status,

      message:
        message ||
        `Shipment status updated to ${status}`,

      location,

      timestamp: new Date(),
    });

    if (status === "delivered") {
      shipment.deliveredAt =
        new Date();
    }

    await shipment.save();

    await Order.findByIdAndUpdate(
      shipment.order,
      {
        status,
      }
    );

    res.status(200).json({
      success: true,
      message:
        "Shipment status updated",
      shipment,
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

      shipment.currentLocation = {
        latitude: Number(latitude),
        longitude: Number(longitude),
        accuracy:
          accuracy !== undefined
            ? Number(accuracy)
            : null,
        updatedAt: new Date(),
      };

      shipment.liveTrackingEnabled =
        true;

      await shipment.save();

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
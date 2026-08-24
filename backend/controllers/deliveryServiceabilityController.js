import {
  checkDeliveryServiceability,
  SERVICEABILITY_UNAVAILABLE_MESSAGE,
} from "../services/deliveryServiceabilityService.js";

export const checkServiceability = async (req, res) => {
  const result = await checkDeliveryServiceability(req.body || {});

  if (!result.valid) {
    return res.status(400).json({
      success: false,
      message: result.validationError,
    });
  }

  return res.json({
    success: true,
    serviceable: result.serviceable,
    message: result.serviceable
      ? "Delivery is available at your location"
      : result.unavailableReason || SERVICEABILITY_UNAVAILABLE_MESSAGE,
    ...(result.location ? { location: result.location } : {}),
    ...(result.serviceable ? { deliveryCharge: result.deliveryCharge, estimatedDeliveryDays: result.estimatedDeliveryDays } : {}),
  });
};

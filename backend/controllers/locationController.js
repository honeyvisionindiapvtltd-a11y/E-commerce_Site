import { reverseGeocodeCoordinates } from '../services/geocodingService.js';
import { isValidLatitude, isValidLongitude, parseLatitude, parseLongitude, normalizePincode, isValidPincode } from '../middleware/validation.js';
import { verifyDeliveryByPincode, findDeliveryDocument } from '../services/deliveryService.js';

export async function checkLocation(req, res) {
  const latitude = parseLatitude(req.body.latitude);
  const longitude = parseLongitude(req.body.longitude);
  const productId = req.body.productId || null;

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return res.status(400).json({ success: false, message: 'Please provide valid latitude and longitude values.' });
  }

  try {
    const location = await reverseGeocodeCoordinates(latitude, longitude);
    const delivery = await verifyDeliveryByPincode(location.pincode, productId);

    return res.json({
      success: true,
      serviceable: delivery.serviceable,
      location,
      delivery: delivery.delivery,
      message: delivery.serviceable
        ? 'Delivery is available at your location.'
        : 'Sorry, delivery is currently not available at this location.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to check delivery availability right now.' });
  }
}

export async function checkPincode(req, res) {
  const rawPincode = req.params.pincode;
  const productId = req.query.productId || null;
  const pincode = normalizePincode(rawPincode);

  if (!isValidPincode(pincode)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid 6-digit PIN code.' });
  }

  const deliveryDocument = await findDeliveryDocument(pincode, productId);
  const serviceable = Boolean(deliveryDocument?.serviceable && deliveryDocument?.active);

  return res.json({
    success: true,
    serviceable,
    location: {
      pincode,
      city: deliveryDocument?.city || '',
      state: deliveryDocument?.state || '',
      country: deliveryDocument?.country || 'India',
    },
    delivery: serviceable
      ? {
          estimatedDeliveryDays: deliveryDocument.estimatedDeliveryDays || '2-5 days',
          deliveryCharge: Number(deliveryDocument.deliveryCharge || 0),
          codAvailable: Boolean(deliveryDocument.codAvailable),
        }
      : null,
    message: serviceable
      ? 'Delivery is available at this location.'
      : 'Sorry, delivery is currently not available at this location.',
  });
}

import { reverseGeocodeCoordinates } from '../services/geocodingService.js';
import { isValidLatitude, isValidLongitude, parseLatitude, parseLongitude, normalizePincode, isValidPincode } from '../middleware/validation.js';
import { verifyDeliveryByPincode, findDeliveryDocument } from '../services/deliveryService.js';
import { checkDeliveryServiceability } from '../services/deliveryServiceabilityService.js';

export async function checkLocation(req, res) {
  const latitude = parseLatitude(req.body.latitude);
  const longitude = parseLongitude(req.body.longitude);
  const productId = req.body.productId || null;

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return res.status(400).json({ success: false, message: 'Please provide valid latitude and longitude values.' });
  }

  try {
    const location = await reverseGeocodeCoordinates(latitude, longitude);
    const serviceability = await checkDeliveryServiceability(location);
    const delivery = await verifyDeliveryByPincode(location.pincode, productId);

    return res.json({
      success: true,
      serviceable: serviceability.valid && serviceability.serviceable,
      location,
      delivery: serviceability.valid && serviceability.serviceable ? delivery.delivery : null,
      message: serviceability.valid && serviceability.serviceable
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
  const serviceability = await checkDeliveryServiceability({
    country: req.query.country || '',
    state: req.query.state || '',
    city: req.query.city || '',
    pincode,
  });
  const serviceable = serviceability.valid && serviceability.serviceable;

  return res.json({
    success: true,
    serviceable,
    location: {
      pincode,
      city: serviceability.location?.city || '',
      state: serviceability.location?.state || '',
      country: serviceability.location?.country || 'India',
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

import { normalizePincode, isValidPincode } from '../middleware/validation.js';

function buildDefaultResponse(pincode) {
  const normalized = normalizePincode(pincode);
  return {
    serviceable: true,
    location: {
      pincode: normalized,
      city: '',
      state: '',
      country: 'India',
    },
    delivery: {
      estimatedDeliveryDays: '2-5 days',
      deliveryCharge: 0,
      codAvailable: true,
    },
  };
}

export async function findDeliveryDocument(pincode, _productId) {
  const normalized = normalizePincode(pincode);
  if (!isValidPincode(normalized)) return null;

  // DB-backed delivery documents removed — return a sensible default
  return {
    pincode: normalized,
    city: '',
    state: '',
    country: 'India',
    serviceable: true,
    active: true,
    estimatedDeliveryDays: '2-5 days',
    deliveryCharge: 0,
    codAvailable: true,
  };
}

export async function verifyDeliveryByPincode(pincode, _productId) {
  const normalized = normalizePincode(pincode);
  if (!isValidPincode(normalized)) {
    return { serviceable: false, location: { pincode: normalized, city: '', state: '', country: 'India' }, delivery: null };
  }

  return buildDefaultResponse(normalized);
}

export async function ensureDeliveryIndexes() {
  // No-op: delivery collection usage removed for simpler local setups
  return;
}

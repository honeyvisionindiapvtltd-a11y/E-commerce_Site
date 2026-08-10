import { getDeliveryCollection } from '../models/DeliveryLocation.js';
import { normalizePincode, isValidPincode } from '../middleware/validation.js';

function buildResponse(deliveryDocument, location) {
  const serviceable = Boolean(deliveryDocument?.serviceable && deliveryDocument?.active);
  return {
    serviceable,
    location: {
      pincode: location.pincode,
      city: location.city || deliveryDocument?.city || '',
      state: location.state || deliveryDocument?.state || '',
      country: location.country || deliveryDocument?.country || 'India',
    },
    delivery: serviceable
      ? {
          estimatedDeliveryDays: deliveryDocument.estimatedDeliveryDays || '2-5 days',
          deliveryCharge: Number(deliveryDocument.deliveryCharge || 0),
          codAvailable: Boolean(deliveryDocument.codAvailable),
        }
      : null,
  };
}

export async function findDeliveryDocument(pincode, productId) {
  const normalized = normalizePincode(pincode);
  if (!isValidPincode(normalized)) {
    return null;
  }

  const collection = getDeliveryCollection();
  if (productId) {
    const productEntry = await collection.findOne({ pincode: normalized, productId });
    if (productEntry) {
      return productEntry;
    }
  }

  return collection.findOne({ pincode: normalized, productId: { $exists: false } });
}

export async function verifyDeliveryByPincode(pincode, productId) {
  const normalized = normalizePincode(pincode);
  if (!isValidPincode(normalized)) {
    return { serviceable: false, location: { pincode: normalized, city: '', state: '', country: 'India' }, delivery: null };
  }

  const deliveryDocument = await findDeliveryDocument(normalized, productId);
  return buildResponse(deliveryDocument, { pincode: normalized, city: deliveryDocument?.city || '', state: deliveryDocument?.state || '', country: deliveryDocument?.country || 'India' });
}

export async function ensureDeliveryIndexes() {
  const collection = getDeliveryCollection();
  await collection.createIndex(
    { pincode: 1, productId: 1 },
    {
      unique: true,
      partialFilterExpression: { pincode: { $exists: true } },
    }
  );
}

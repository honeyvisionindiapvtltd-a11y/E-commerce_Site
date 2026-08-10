import { getDB } from '../db.js';

export const getDeliveryCollection = () => getDB().collection('delivery_locations');

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

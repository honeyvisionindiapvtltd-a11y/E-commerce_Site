import "dotenv/config";
import mongoose from "mongoose";
import dbConfig from "../config/db.js";
import DeliveryZone from "../models/DeliveryZone.js";
import deliveryServiceability from "../config/deliveryServiceability.js";

const seed = async () => {
  await mongoose.connect(dbConfig.mongoUri);
  let created = 0;
  let updated = 0;

  for (const city of deliveryServiceability.cities) {
    for (const pincode of city.pincodes) {
      const result = await DeliveryZone.updateOne(
        { country: deliveryServiceability.country, state: deliveryServiceability.state, city: city.name, pincode },
        {
          $set: {
            aliases: city.aliases,
            serviceable: true,
            active: city.enabled !== false,
            deliveryCharge: 0,
            estimatedDeliveryDays: { min: 1, max: 2 },
          },
          $setOnInsert: { areas: [] },
        },
        { upsert: true },
      );
      if (result.upsertedCount) created += 1;
      else if (result.modifiedCount) updated += 1;
    }
  }

  const total = await DeliveryZone.countDocuments({ country: deliveryServiceability.country, state: deliveryServiceability.state });
  console.log(JSON.stringify({ created, updated, total, configured: deliveryServiceability.serviceablePincodes.length }));
};

seed()
  .catch((error) => {
    console.error("Delivery zone seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });

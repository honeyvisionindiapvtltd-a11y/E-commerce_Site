import assert from "node:assert/strict";
import mongoose from "mongoose";
import dbConfig from "./config/db.js";
import DeliveryZone from "./models/DeliveryZone.js";

const pincode = "899999";
const city = "__DeliveryZoneTest__";

await mongoose.connect(dbConfig.mongoUri);
try {
  await DeliveryZone.deleteMany({ city });
  const created = await DeliveryZone.create({ city, country: "India", state: "Odisha", pincode, areas: ["Test Area"], deliveryCharge: 50, estimatedDeliveryDays: { min: 1, max: 2 } });
  assert.equal(created.deliveryCharge, 50);
  await assert.rejects(() => DeliveryZone.create({ city, country: "India", state: "Odisha", pincode }));

  const updated = await DeliveryZone.findByIdAndUpdate(created._id, { deliveryCharge: 100, active: false }, { new: true, runValidators: true });
  assert.equal(updated.deliveryCharge, 100);
  assert.equal(updated.active, false);

  const serviceabilityDisabled = await DeliveryZone.findByIdAndUpdate(created._id, { serviceable: false }, { new: true, runValidators: true });
  assert.equal(serviceabilityDisabled.serviceable, false);
  await DeliveryZone.findByIdAndDelete(created._id);
  assert.equal(await DeliveryZone.exists({ _id: created._id }), null);
  console.log("DeliveryZone CRUD, validation, toggle, and duplicate tests passed");
} finally {
  await mongoose.disconnect();
}

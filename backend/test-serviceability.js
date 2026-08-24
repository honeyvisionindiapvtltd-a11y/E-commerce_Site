import assert from "node:assert/strict";
import mongoose from "mongoose";
import dbConfig from "./config/db.js";
import { execFile } from "node:child_process";
import deliveryServiceability from "./config/deliveryServiceability.js";
import { checkDeliveryServiceability } from "./services/deliveryServiceabilityService.js";

const check = async (city, state = "Odisha", country = "India", pincode = city?.toLowerCase().includes("khordha") || city?.toLowerCase().includes("khurda") ? "752055" : "751001") =>
  checkDeliveryServiceability({ city, state, country, pincode });

assert.equal(
  new Set(deliveryServiceability.serviceablePincodes).size,
  deliveryServiceability.serviceablePincodes.length,
);

await mongoose.connect(dbConfig.mongoUri);
try {
  const seed = await new Promise((resolve, reject) => {
    execFile(process.execPath, ["scripts/seedDeliveryZones.js"], { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr || stdout || error.message));
      else resolve(stdout);
    });
  });
  const secondSeed = await new Promise((resolve, reject) => {
    execFile(process.execPath, ["scripts/seedDeliveryZones.js"], { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr || stdout || error.message));
      else resolve(stdout);
    });
  });
  assert.match(seed, /configured/);
  assert.match(secondSeed, /configured/);

  for (const pincode of ["751001", "751002", "751010", "751019", "751024", "751025", "751030"]) assert.equal((await check("Bhubaneswar", "Odisha", "India", pincode)).serviceable, true);
  for (const pincode of ["752018", "752055", "752056", "752057"]) assert.equal((await check("Khordha", "Odisha", "India", pincode)).serviceable, true);
  for (const city of ["BHUBANESWAR", " bhubaneswar ", "KHORDHA", "Khurda"]) assert.equal((await check(city)).serviceable, true);
  for (const city of ["Cuttack", "Puri", "Berhampur", "Rourkela"]) assert.equal((await check(city)).serviceable, false);
  assert.equal((await check("Bhubaneswar", "Odisha", "India", "999999")).serviceable, false);
  assert.equal((await check("Bhubaneswar", "Odisha", "India", "752055")).serviceable, false);
  assert.equal((await check("Khordha", "Odisha", "India", "751001")).serviceable, false);
  assert.equal((await check("Bhubaneswar", "Jharkhand")).serviceable, false);
  assert.equal((await check("Bhubaneswar", "Odisha", "India", "75101")).valid, false);
  assert.equal((await check("", "Odisha")).valid, false);
  assert.equal((await check("Bhubaneswar", "Odisha", "")).valid, false);
  console.log("Delivery serviceability tests and seed idempotency passed");
} finally {
  await mongoose.disconnect();
}

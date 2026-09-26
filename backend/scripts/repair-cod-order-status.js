import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../models/Order.js";

dotenv.config();

const applyChanges = process.argv.includes("--apply");
const uri = process.env.MONGODB_DIRECT_URI
  || process.env.MONGO_URI
  || process.env.MONGODB_URI
  || (process.env.NODE_ENV === "production" ? "" : "mongodb://127.0.0.1:27017/honeyvision");
const affectedFilter = {
  paymentMethod: "COD",
  paymentStatus: "PENDING",
  status: "PAYMENT_CONFIRMED",
};

if (!uri) {
  console.error("MongoDB URI is not configured.");
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const affected = await Order.find(affectedFilter).lean();

    console.log(JSON.stringify({
      readOnly: !applyChanges,
      affectedCount: affected.length,
      affectedOrders: affected.map((order) => ({
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        deliveryStatus: order.deliveryStatus || null,
      })),
    }, null, 2));

    if (applyChanges && affected.length) {
      const backupDirectory = path.resolve("backups");
      const backupPath = path.join(backupDirectory, `cod-order-status-${new Date().toISOString().replaceAll(":", "-")}.json`);
      await fs.mkdir(backupDirectory, { recursive: true });
      await fs.writeFile(backupPath, JSON.stringify(affected, null, 2), "utf8");

      const result = await Order.updateMany(affectedFilter, { $set: { status: "ORDER_PLACED" } });
      console.log(JSON.stringify({ applied: true, modifiedCount: result.modifiedCount, backupPath }, null, 2));
    }
  } catch (error) {
    console.error(`COD status repair failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}
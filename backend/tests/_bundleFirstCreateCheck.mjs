import mongoose from "mongoose";
import { createHash } from "node:crypto";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Bundle from "../models/Bundle.js";
import dbConfig from "../config/db.js";

await mongoose.connect(dbConfig.mongoUri, { serverSelectionTimeoutMS: 7000 });
try {
  const productCount = await Product.countDocuments();
  const fields = "_id name sku brand category subCategory price mrp discountPercentage gstPercentage stock stockStatus images thumbnail slug shortDescription description";
  const records = await Product.find().sort({ _id: 1 }).select(fields)
    .populate("category", "name slug")
    .populate("subCategory", "name slug")
    .lean();
  const digest = createHash("sha256").update(JSON.stringify(records)).digest("hex");
  const bundlesBefore = await Bundle.countDocuments();
  const candidates = await Product.find({
    isActive: { $ne: false },
    stock: { $gt: 0 },
    stockStatus: { $in: ["in_stock", "low_stock"] },
    price: { $gt: 0 },
  })
    .sort({ createdAt: 1 })
    .limit(12)
    .select("_id name sku brand price mrp stock stockStatus thumbnail images category subCategory")
    .populate("category", "name slug")
    .populate("subCategory", "name slug")
    .lean();

  console.log(JSON.stringify({
    connected: mongoose.connection.readyState === 1,
    database: mongoose.connection.name,
    productCount,
    productDigest: digest,
    bundlesBefore,
    candidates,
  }, null, 2));
} finally {
  await mongoose.disconnect();
}

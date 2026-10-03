import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import Bundle from "../models/Bundle.js";
import Product from "../models/Product.js";
import dbConfig from "../config/db.js";
import { validateBundleDiscount } from "../services/bundleService.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const bundlesFile = path.resolve(scriptDirectory, "../honeyvision_bundles_30.json");

const toObjectId = (value, label) => {
  const id = typeof value === "string" ? value : value?.$oid;
  if (!mongoose.isValidObjectId(id)) throw new Error(`${label} is not a valid MongoDB ObjectId.`);
  return new mongoose.Types.ObjectId(id);
};

const run = async () => {
  if (!dbConfig.mongoUri) throw new Error("No MongoDB URI configured for bundle seeding.");

  const source = JSON.parse(await fs.readFile(bundlesFile, "utf8"));
  if (!Array.isArray(source) || source.length === 0) throw new Error("Bundle JSON must contain a non-empty array.");

  const bundleIds = new Set();
  const bundles = source.map((record, index) => {
    const label = `Bundle ${index + 1}`;
    const _id = toObjectId(record._id, `${label} _id`);
    if (bundleIds.has(String(_id))) throw new Error(`${label} duplicates bundle ID ${_id}.`);
    bundleIds.add(String(_id));

    const mainProduct = toObjectId(record.mainProduct, `${label} mainProduct`);
    if (!Array.isArray(record.products) || record.products.length === 0) {
      throw new Error(`${label} must contain products.`);
    }

    const products = record.products.map((item, itemIndex) => {
      const productId = toObjectId(item.productId, `${label} product ${itemIndex + 1}`);
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new Error(`${label} has an invalid quantity for product ${productId}.`);
      }
      return { productId, quantity };
    });

    if (!products.some((item) => item.productId.equals(mainProduct))) {
      throw new Error(`${label} does not include its main product.`);
    }
    if (new Set(products.map((item) => String(item.productId))).size !== products.length) {
      throw new Error(`${label} contains duplicate product references.`);
    }

    return {
      _id,
      name: record.name,
      description: record.description || "",
      mainProduct,
      products,
      discountType: record.discountType,
      discountValue: Number(record.discountValue),
      active: record.status === "active" && record.isActive !== false,
      startDate: record.startDate || null,
      endDate: record.endDate || null,
      displayPriority: Number(record.displayPriority || 0),
    };
  });

  await mongoose.connect(dbConfig.mongoUri, { serverSelectionTimeoutMS: 15000 });

  const productIds = [...new Set(bundles.flatMap((bundle) => [
    String(bundle.mainProduct),
    ...bundle.products.map((item) => String(item.productId)),
  ]))].map((id) => new mongoose.Types.ObjectId(id));
  const foundProducts = await Product.find({ _id: { $in: productIds } })
    .select("_id price isActive")
    .lean();
  const productsById = new Map(foundProducts.map((product) => [String(product._id), product]));
  const missingProductIds = productIds.filter((id) => !productsById.has(String(id)));
  if (missingProductIds.length) {
    throw new Error(`Missing referenced products: ${missingProductIds.map(String).join(", ")}`);
  }

  for (const bundle of bundles) {
    const bundleProductIds = [bundle.mainProduct, ...bundle.products.map((item) => item.productId)];
    const referencedProducts = bundleProductIds.map((id) => productsById.get(String(id)));
    if (bundle.active && referencedProducts.some((product) => product.isActive === false)) {
      throw new Error(`Active bundle "${bundle.name}" references an inactive product.`);
    }

    const individualTotal = bundle.products.reduce((total, item) => (
      total + Number(productsById.get(String(item.productId)).price || 0) * item.quantity
    ), 0);
    validateBundleDiscount(individualTotal, bundle.discountType, bundle.discountValue);
    await new Bundle(bundle).validate();
  }

  const result = await Bundle.bulkWrite(bundles.map((bundle) => ({
    updateOne: {
      filter: { _id: bundle._id },
      update: { $set: bundle },
      upsert: true,
    },
  })));

  console.log(JSON.stringify({
    database: mongoose.connection.name,
    sourceBundles: bundles.length,
    inserted: result.upsertedCount,
    updated: result.modifiedCount,
    matched: result.matchedCount,
  }, null, 2));
};

try {
  await run();
  console.log("Bundle seeding completed successfully.");
} catch (error) {
  console.error("Bundle seeding failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
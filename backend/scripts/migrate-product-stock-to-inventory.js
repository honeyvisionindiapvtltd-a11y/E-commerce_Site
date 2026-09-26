import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";
import Inventory from "../models/Inventory.js";

dotenv.config();

const applyChanges = process.argv.includes("--apply");
const uri = process.env.MONGODB_DIRECT_URI
  || process.env.MONGO_URI
  || process.env.MONGODB_URI
  || (process.env.NODE_ENV === "production" ? "" : "mongodb://127.0.0.1:27017/honeyvision");

const numeric = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

if (!uri) {
  console.error("MongoDB URI is not configured.");
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const [products, inventories] = await Promise.all([
      Product.find({}, "_id sku name stock price lowStockThreshold").lean(),
      Inventory.find({}, "_id productId sku totalStock availableStock reservedStock soldStock damagedStock currentPrice lowStockThreshold").lean(),
    ]);
    const byProduct = new Map();
    const duplicateProductIds = [];
    for (const inventory of inventories) {
      const key = String(inventory.productId);
      if (byProduct.has(key)) duplicateProductIds.push(key);
      else byProduct.set(key, inventory);
    }

    const plans = products.map((product) => {
      const existing = byProduct.get(String(product._id));
      const productStock = numeric(product.stock);
      const existingAvailable = existing ? numeric(existing.availableStock) : null;
      const existingReserved = existing ? numeric(existing.reservedStock) : null;
      const existingSold = existing ? numeric(existing.soldStock) : null;
      const inventoryTotal = existing
        ? existingAvailable + existingReserved + existingSold
        : null;
      const difference = existing ? productStock - inventoryTotal : null;
      return {
        productId: String(product._id),
        name: product.name,
        sku: product.sku,
        productStock,
        existingInventory: existing ? {
          totalStock: numeric(existing.totalStock),
          availableStock: existingAvailable,
          reservedStock: existingReserved,
          soldStock: existingSold,
          damagedStock: numeric(existing.damagedStock),
        } : null,
        recommended: existing ? "REVIEW_EXISTING_VALUES" : {
          totalStock: productStock,
          availableStock: productStock,
          reservedStock: 0,
          soldStock: 0,
          damagedStock: 0,
        },
        difference,
        action: existing ? (difference === 0 ? "NO_CHANGE" : "REVIEW") : "CREATE",
      };
    });

    console.log(JSON.stringify({
      readOnly: !applyChanges,
      productCount: products.length,
      inventoryCount: inventories.length,
      matched: plans.filter((plan) => plan.existingInventory).length,
      missingInventory: plans.filter((plan) => plan.action === "CREATE").length,
      orphanInventory: inventories.filter((inventory) => !products.some((product) => String(product._id) === String(inventory.productId))).length,
      duplicateProductIds: [...new Set(duplicateProductIds)],
      mismatchedStock: plans.filter((plan) => plan.action === "REVIEW").length,
      plans,
    }, null, 2));

    if (applyChanges) {
      const createPlans = plans.filter((plan) => plan.action === "CREATE");
      const backupDirectory = path.resolve("backups");
      const backupPath = path.join(backupDirectory, `inventory-migration-${new Date().toISOString().replaceAll(":", "-")}.json`);
      await fs.mkdir(backupDirectory, { recursive: true });
      await fs.writeFile(backupPath, JSON.stringify({ createdAt: new Date(), plans: createPlans }, null, 2), "utf8");

      let created = 0;
      for (const plan of createPlans) {
        const result = await Inventory.updateOne(
          { productId: plan.productId },
          {
            $setOnInsert: {
              productId: plan.productId,
              sku: plan.sku,
              totalStock: plan.recommended.totalStock,
              availableStock: plan.recommended.availableStock,
              reservedStock: 0,
              soldStock: 0,
              damagedStock: 0,
              lowStockThreshold: numeric(products.find((product) => String(product._id) === plan.productId)?.lowStockThreshold) || 10,
              currentPrice: numeric(products.find((product) => String(product._id) === plan.productId)?.price),
            },
          },
          { upsert: true },
        );
        if (result.upsertedCount) created += 1;
      }
      console.log(JSON.stringify({ applied: true, created, reviewed: plans.filter((plan) => plan.action === "REVIEW").length, backupPath }, null, 2));
    }
  } catch (error) {
    console.error(`Inventory migration failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}
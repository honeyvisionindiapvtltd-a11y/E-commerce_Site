import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";
import Inventory from "../models/Inventory.js";
import Order from "../models/Order.js";

dotenv.config();

const uri = process.env.MONGODB_DIRECT_URI
  || process.env.MONGO_URI
  || process.env.MONGODB_URI
  || (process.env.NODE_ENV === "production" ? "" : "mongodb://127.0.0.1:27017/honeyvision");

if (!uri) {
  console.error("MongoDB URI is not configured.");
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

    const [products, inventory, codOrders] = await Promise.all([
      Product.find({}, "_id sku stock").lean(),
      Inventory.find({}, "productId sku totalStock availableStock reservedStock soldStock damagedStock status").lean(),
      Order.find(
        { paymentMethod: "COD" },
        "orderNumber paymentStatus status orderLifecycleStatus deliveryAgent stockReservationStatus",
      ).sort({ createdAt: -1 }).lean(),
    ]);

    const inventoryByProduct = new Map();
    const duplicateProductIds = new Set();
    inventory.forEach((item) => {
      const key = String(item.productId);
      if (inventoryByProduct.has(key)) duplicateProductIds.add(key);
      else inventoryByProduct.set(key, item);
    });
    const productIds = new Set(products.map((product) => String(product._id)));
    const productsWithoutInventory = products
      .filter((product) => !inventoryByProduct.has(String(product._id)))
      .map((product) => ({ id: String(product._id), sku: product.sku, productStock: product.stock }));
    const orphanInventory = inventory.filter((item) => !productIds.has(String(item.productId)));
    const invalidProducts = products.filter((product) => !Number.isFinite(Number(product.stock)) || Number(product.stock) < 0);
    const invalidInventory = inventory.filter((item) => ["totalStock", "availableStock", "reservedStock", "soldStock", "damagedStock"].some((field) => !Number.isFinite(Number(item[field])) || Number(item[field]) < 0));
    const invalidInventoryStatus = inventory.filter((item) => !["in_stock", "low_stock", "out_of_stock", "discontinued"].includes(item.status)).length;
    const skuMismatches = products.flatMap((product) => {
      const item = inventoryByProduct.get(String(product._id));
      return item && String(item.sku || "") !== String(product.sku || "") ? [{ productId: String(product._id), productSku: product.sku, inventorySku: item.sku }] : [];
    });
    const mismatchedStock = products.flatMap((product) => {
      const item = inventoryByProduct.get(String(product._id));
      if (!item || invalidProducts.includes(product) || invalidInventory.includes(item)) return [];
      const inventoryUnits = Number(item.availableStock) + Number(item.reservedStock) + Number(item.soldStock);
      return Number(product.stock) === inventoryUnits ? [] : [{
        productId: String(product._id),
        sku: product.sku,
        productStock: product.stock,
        inventoryUnits,
      }];
    });

    console.log(JSON.stringify({
      readOnly: true,
      productCount: products.length,
      inventoryCount: inventory.length,
      matched: products.length - productsWithoutInventory.length,
      productsWithoutInventory: productsWithoutInventory.length,
      missingProductsSample: productsWithoutInventory.slice(0, 20),
      orphanInventory: orphanInventory.length,
      orphanInventorySample: orphanInventory.slice(0, 20),
      duplicateProductIds: [...duplicateProductIds],
      mismatchedStock: mismatchedStock.length,
      mismatchedStockSample: mismatchedStock.slice(0, 20),
      invalidProducts: invalidProducts.length,
      invalidProductsSample: invalidProducts.slice(0, 20),
      invalidInventory: invalidInventory.length,
      invalidInventorySample: invalidInventory.slice(0, 20),
      invalidInventoryStatus,
      skuMismatches: skuMismatches.length,
      skuMismatchSample: skuMismatches.slice(0, 20),
      codOrders: codOrders.map((order) => ({
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        orderLifecycleStatus: order.orderLifecycleStatus,
        deliveryAgent: order.deliveryAgent ? String(order.deliveryAgent) : null,
        stockReservationStatus: order.stockReservationStatus,
      })),
    }, null, 2));
  } catch (error) {
    console.error(`Inventory diagnostic failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}
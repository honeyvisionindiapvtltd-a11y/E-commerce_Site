import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Inventory from "../models/Inventory.js";
import InventoryMovement from "../models/InventoryMovement.js";
import inventoryService from "../services/inventoryService.js";

const testUri = process.env.INVENTORY_TEST_URI;
const productId = "inventory-service-test-product";

const withDatabase = async (t, callback) => {
  if (!testUri) {
    t.skip("Set INVENTORY_TEST_URI to an isolated disposable MongoDB database");
    return;
  }
  if (mongoose.connection.readyState !== 1) await mongoose.connect(testUri);
  await Inventory.deleteMany({ productId });
  await InventoryMovement.deleteMany({ productId });
  await Inventory.create({ productId, sku: "TEST-SKU", totalStock: 10, availableStock: 10, currentPrice: 100 });
  await callback();
};

test("reserve and release inventory", async (t) => withDatabase(t, async () => {
  await inventoryService.reserveInventory(productId, 3, { type: "ORDER", id: "reserve-release" });
  let inventory = await Inventory.findOne({ productId });
  assert.equal(inventory.availableStock, 7);
  assert.equal(inventory.reservedStock, 3);
  await inventoryService.releaseInventory(productId, 3, { type: "ORDER", id: "reserve-release" });
  inventory = await Inventory.findOne({ productId });
  assert.equal(inventory.availableStock, 10);
  assert.equal(inventory.reservedStock, 0);
}));

test("commit and restore inventory", async (t) => withDatabase(t, async () => {
  const reference = { type: "ORDER", id: "commit-restore" };
  await inventoryService.reserveInventory(productId, 3, reference);
  await inventoryService.commitInventory(productId, 3, reference);
  let inventory = await Inventory.findOne({ productId });
  assert.equal(inventory.availableStock, 7);
  assert.equal(inventory.reservedStock, 0);
  assert.equal(inventory.soldStock, 3);
  await inventoryService.restoreInventory(productId, 3, "Sellable return", "test", { type: "RETURN", id: "commit-restore-return" });
  inventory = await Inventory.findOne({ productId });
  assert.equal(inventory.availableStock, 10);
  assert.equal(inventory.soldStock, 0);
}));

test("rejects overselling atomically", async (t) => withDatabase(t, async () => {
  await Inventory.updateOne({ productId }, { $set: { totalStock: 2, availableStock: 2 } });
  await assert.rejects(() => inventoryService.reserveInventory(productId, 3, { type: "ORDER", id: "oversell" }), (error) => error.code === "INSUFFICIENT_STOCK");
  const inventory = await Inventory.findOne({ productId });
  assert.equal(inventory.availableStock, 2);
  assert.equal(inventory.reservedStock, 0);
}));

test("reservation, release, and commit are idempotent", async (t) => withDatabase(t, async () => {
  const reference = { type: "ORDER", id: "idempotent" };
  await inventoryService.reserveInventory(productId, 3, reference);
  await inventoryService.reserveInventory(productId, 3, reference);
  let inventory = await Inventory.findOne({ productId });
  assert.equal(inventory.availableStock, 7);
  assert.equal(inventory.reservedStock, 3);
  await inventoryService.releaseInventory(productId, 3, reference);
  await inventoryService.releaseInventory(productId, 3, reference);
  inventory = await Inventory.findOne({ productId });
  assert.equal(inventory.availableStock, 10);
  assert.equal(inventory.reservedStock, 0);
  await inventoryService.reserveInventory(productId, 3, reference);
  await inventoryService.commitInventory(productId, 3, reference);
  await inventoryService.commitInventory(productId, 3, reference);
  inventory = await Inventory.findOne({ productId });
  assert.equal(inventory.availableStock, 7);
  assert.equal(inventory.reservedStock, 0);
  assert.equal(inventory.soldStock, 3);
  assert.equal(await InventoryMovement.countDocuments({ productId, movementType: "ORDER_RESERVED" }), 1);
}));

test("only one simultaneous reservation succeeds", async (t) => withDatabase(t, async () => {
  await Inventory.updateOne({ productId }, { $set: { totalStock: 5, availableStock: 5 } });
  const results = await Promise.allSettled([
    inventoryService.reserveInventory(productId, 4, { type: "ORDER", id: "concurrent-a" }),
    inventoryService.reserveInventory(productId, 4, { type: "ORDER", id: "concurrent-b" }),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  const inventory = await Inventory.findOne({ productId });
  assert.equal(inventory.availableStock, 1);
  assert.equal(inventory.reservedStock, 4);
  assert.ok(inventory.availableStock >= 0);
}));

test.after(async () => {
  if (testUri && mongoose.connection.readyState === 1) await mongoose.disconnect();
});
import assert from "node:assert/strict";
import test from "node:test";
import { calculateBundleTotals, getBundleQuote, isBundleActive } from "../services/bundleService.js";

const exampleProducts = [
  { unitPrice: 4999, quantity: 1 },
  { unitPrice: 3499, quantity: 1 },
  { unitPrice: 4299, quantity: 1 },
];

test("percentage bundle discount is calculated without changing item prices", () => {
  assert.deepEqual(calculateBundleTotals(exampleProducts, "percentage", 10), {
    originalTotal: 12797,
    discountAmount: 1279.7,
    finalTotal: 11517.3,
  });
  assert.equal(exampleProducts[0].unitPrice, 4999);
});

test("fixed discount is applied against the individual total", () => {
  assert.deepEqual(calculateBundleTotals(exampleProducts, "fixed", 1200), {
    originalTotal: 12797,
    discountAmount: 1200,
    finalTotal: 11597,
  });
});

test("negative, equal-to-total, over-total, and invalid discounts are rejected", () => {
  assert.throws(() => calculateBundleTotals(exampleProducts, "fixed", -1), /non-negative/);
  assert.throws(() => calculateBundleTotals(exampleProducts, "fixed", 12797), /less than/);
  assert.throws(() => calculateBundleTotals(exampleProducts, "fixed", 20000), /less than/);
  assert.throws(() => calculateBundleTotals(exampleProducts, "percentage", 100), /less than/);
  assert.throws(() => calculateBundleTotals(exampleProducts, "fixed", "not-a-number"), /non-negative/);
});

test("bundle quantity scales product totals and fixed discounts", () => {
  assert.deepEqual(calculateBundleTotals(exampleProducts, "fixed", 1200, 2), {
    originalTotal: 25594,
    discountAmount: 2400,
    finalTotal: 23194,
  });
});

test("bundle quantity validation rejects zero, fractional, and excessive values before database access", async () => {
  await assert.rejects(() => getBundleQuote("not-a-database-id", 0), /between 1 and 20/);
  await assert.rejects(() => getBundleQuote("not-a-database-id", 1.5), /between 1 and 20/);
  await assert.rejects(() => getBundleQuote("not-a-database-id", 21), /between 1 and 20/);
});

test("bundle schedule excludes future and expired active bundles", () => {
  const now = new Date("2026-09-30T12:00:00.000Z");
  assert.equal(isBundleActive({ active: true, startDate: null, endDate: null }, now), true);
  assert.equal(isBundleActive({ active: true, startDate: "2026-10-01T00:00:00.000Z", endDate: null }, now), false);
  assert.equal(isBundleActive({ active: true, startDate: null, endDate: "2026-09-29T23:59:59.999Z" }, now), false);
  assert.equal(isBundleActive({ active: false, startDate: null, endDate: null }, now), false);
});
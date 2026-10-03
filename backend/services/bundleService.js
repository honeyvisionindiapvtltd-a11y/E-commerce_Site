import Bundle from "../models/Bundle.js";
import Product from "../models/Product.js";
import inventoryService, { isInventoryAuthorityEnabled } from "./inventoryService.js";

const roundCurrency = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export function validateBundleDiscount(individualTotal, discountType, discountValue, bundleQuantity = 1) {
  const total = Number(individualTotal);
  const value = Number(discountValue);
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(value) || value < 0) {
    throw new Error("Bundle total must be positive and discount must be non-negative.");
  }
  const discount = discountType === "percentage"
    ? total * value / 100
    : value * bundleQuantity;
  if (!Number.isFinite(discount) || discount >= total) {
    throw new Error("Bundle discount must be less than the individual total.");
  }
  return roundCurrency(discount);
}

export function calculateBundleTotals(items, discountType, discountValue, bundleQuantity = 1) {
  const originalTotal = roundCurrency(items.reduce(
    (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0) * bundleQuantity,
    0
  ));
  const discountAmount = validateBundleDiscount(originalTotal, discountType, discountValue, bundleQuantity);

  return {
    originalTotal,
    discountAmount,
    finalTotal: roundCurrency(originalTotal - discountAmount),
  };
}

export const isBundleActive = (bundle, now = new Date()) => Boolean(
  bundle?.active
  && (!bundle.startDate || new Date(bundle.startDate) <= now)
  && (!bundle.endDate || new Date(bundle.endDate) >= now)
);

export async function getBundleQuote(bundleId, requestedQuantity = 1) {
  const quantity = Number(requestedQuantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    throw new Error("Bundle quantity must be between 1 and 20.");
  }

  const bundle = await Bundle.findById(bundleId)
    .populate("mainProduct", "name sku price mrp stock stockStatus isActive thumbnail images")
    .populate("products.productId", "name sku price mrp stock stockStatus isActive thumbnail images");

  if (!bundle || !isBundleActive(bundle)) throw new Error("This bundle is not currently available.");

  const lines = [];

  for (const entry of bundle.products) {
    const product = entry.productId && typeof entry.productId === "object"
      ? entry.productId
      : await Product.findById(entry.productId);
    const requiredQuantity = Number(entry.quantity) * quantity;

    if (!product || product.isActive === false) {
      throw new Error(`${product?.name || "A product in this bundle"} is unavailable.`);
    }

    let availableStock = Number(product.stock || 0);
    if (isInventoryAuthorityEnabled()) {
      try {
        availableStock = Number(await inventoryService.getAvailableStock(product._id));
      } catch {
        availableStock = 0;
      }
    }

    if (availableStock < requiredQuantity || ["out_of_stock", "pre_order"].includes(product.stockStatus)) {
      throw new Error(`${product.name} is out of stock for this bundle.`);
    }

    const unitPrice = roundCurrency(product.price);
    lines.push({
      productId: String(product._id),
      name: product.name,
      sku: product.sku || "",
      image: product.thumbnail || product.images?.[0] || "",
      unitPrice,
      quantity: Number(entry.quantity),
      availableStock,
    });
  }

  const totals = calculateBundleTotals(lines, bundle.discountType, bundle.discountValue, quantity);

  return {
    id: String(bundle._id),
    name: bundle.name,
    description: bundle.description,
    mainProductId: String(bundle.mainProduct?._id || bundle.mainProduct),
    products: lines,
    discountType: bundle.discountType,
    discountValue: Number(bundle.discountValue),
    quantity,
    ...totals,
    active: true,
  };
}

export async function getBundleProductsForAdmin(bundle) {
  const fields = "name sku price stock stockStatus isActive thumbnail images category subCategory";
  const categoryPopulation = [
    { path: "category", select: "name slug parentCategory" },
    { path: "subCategory", select: "name slug parentCategory" },
  ];
  return Bundle.populate(bundle, [
    { path: "mainProduct", select: fields, populate: categoryPopulation },
    { path: "products.productId", select: fields, populate: categoryPopulation },
  ]);
}
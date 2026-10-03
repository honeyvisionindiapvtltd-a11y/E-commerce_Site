import mongoose from "mongoose";
import Bundle from "../models/Bundle.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { getBundleProductsForAdmin, getBundleQuote, isBundleActive, validateBundleDiscount } from "../services/bundleService.js";

const productFields = "name sku price mrp stock stockStatus isActive thumbnail images";
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const getPopulatedBundle = (query) => query
  .populate("mainProduct", productFields)
  .populate("products.productId", productFields);

export async function searchAdminBundleProducts(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const conditions = [];
    const query = String(req.query.q || "").trim();

    if (query) {
      const regex = new RegExp(escapeRegex(query), "i");
      const textMatches = [{ name: regex }, { sku: regex }, { brand: regex }];
      const matchingCategories = await Category.find({ $or: [{ name: regex }, { slug: regex }] }).select("_id").lean();
      if (matchingCategories.length) {
        const ids = matchingCategories.map((item) => item._id);
        textMatches.push({ category: { $in: ids } }, { subCategory: { $in: ids } });
      }
      conditions.push({ $or: textMatches });
    }

    if (req.query.category) {
      const category = await Category.findById(req.query.category).select("parentCategory").lean();
      if (!category) return res.status(200).json({ success: true, products: [], totalProducts: 0, currentPage: page, totalPages: 0, brands: [] });
      if (category.parentCategory) {
        conditions.push({ subCategory: category._id });
      } else {
        const subcategoryIds = await Category.find({ parentCategory: category._id }).distinct("_id");
        conditions.push({ $or: [{ category: category._id }, { subCategory: { $in: subcategoryIds } }] });
      }
    }

    if (req.query.subCategory) conditions.push({ subCategory: req.query.subCategory });
    if (req.query.brand) conditions.push({ brand: new RegExp(escapeRegex(req.query.brand), "i") });
    if (req.query.status === "active") conditions.push({ isActive: { $ne: false } });
    if (req.query.status === "inactive") conditions.push({ isActive: false });
    if (req.query.minPrice !== undefined && req.query.minPrice !== "") conditions.push({ price: { $gte: Math.max(0, Number(req.query.minPrice) || 0) } });
    if (req.query.maxPrice !== undefined && req.query.maxPrice !== "") conditions.push({ price: { $lte: Math.max(0, Number(req.query.maxPrice) || 0) } });

    if (req.query.stock === "in-stock") conditions.push({ stock: { $gt: 0 }, stockStatus: { $in: ["in_stock", "low_stock"] } });
    if (req.query.stock === "low-stock") conditions.push({ stockStatus: "low_stock", $expr: { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", "$lowStockThreshold"] }] } });
    if (req.query.stock === "out-of-stock") conditions.push({ $or: [{ stock: { $lte: 0 } }, { stockStatus: "out_of_stock" }] });

    const filter = conditions.length ? { $and: conditions } : {};
    const [totalProducts, products, brands] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .select("name sku brand price mrp stock lowStockThreshold stockStatus isActive thumbnail images category subCategory slug")
        .populate("category", "name slug parentCategory")
        .populate("subCategory", "name slug parentCategory")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.distinct("brand", { isActive: { $ne: false } }),
    ]);

    return res.json({
      success: true,
      products,
      totalProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      brands: brands.filter(Boolean).sort((first, second) => first.localeCompare(second)),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to search products.", error: error.message });
  }
}

const normalizeBundleInput = (body = {}) => {
  const name = String(body.name || "").trim();
  const mainProduct = String(body.mainProduct || "").trim();
  const products = Array.isArray(body.products)
    ? body.products.map((item) => ({
        productId: String(item?.productId || "").trim(),
        quantity: Number(item?.quantity ?? 1),
      }))
    : [];
  const discountType = String(body.discountType || "percentage").toLowerCase();
  const discountValue = Number(body.discountValue);
  const displayPriority = Number(body.displayPriority || 0);
  const active = body.active === true;

  if (!name || !mainProduct || !products.length) throw new Error("Name, main product, and bundle products are required.");
  if (!mongoose.isValidObjectId(mainProduct) || products.some((item) => !mongoose.isValidObjectId(item.productId))) {
    throw new Error("Select valid existing products.");
  }
  if (products.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) {
    throw new Error("Product quantities must be whole numbers between 1 and 99.");
  }
  if (new Set(products.map((item) => item.productId)).size !== products.length) {
    throw new Error("Add each product once and set its quantity.");
  }
  if (!products.some((item) => item.productId === mainProduct)) {
    throw new Error("The main product must be included in the bundle.");
  }
  if (active && products.length < 2) throw new Error("Add at least two products before activating this bundle.");
  if (!new Set(["percentage", "fixed"]).has(discountType) || !Number.isFinite(discountValue) || discountValue < 0) {
    throw new Error("Enter a valid bundle discount.");
  }
  if (discountType === "percentage" && discountValue > 100) throw new Error("Percentage discount cannot exceed 100%.");
  if (!Number.isFinite(displayPriority) || displayPriority < 0) throw new Error("Display priority must be zero or greater.");

  const startDate = body.startDate ? new Date(body.startDate) : null;
  const endDate = body.endDate ? new Date(body.endDate) : null;
  if ((startDate && Number.isNaN(startDate.getTime())) || (endDate && Number.isNaN(endDate.getTime()))) {
    throw new Error("Enter valid bundle dates.");
  }
  if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(String(body.endDate))) endDate.setUTCHours(23, 59, 59, 999);
  if (startDate && endDate && endDate < startDate) throw new Error("End date must be after start date.");

  return {
    name,
    description: String(body.description || "").trim(),
    mainProduct,
    products,
    discountType,
    discountValue,
    active,
    startDate,
    endDate,
    displayPriority,
  };
};

const validateProductReferences = async (bundle) => {
  const ids = [...new Set([bundle.mainProduct, ...bundle.products.map((item) => item.productId)])];
  const found = await Product.find({ _id: { $in: ids } }).select("_id name price isActive").lean();
  if (found.length !== ids.length) throw new Error("One or more selected products no longer exist.");
  if (bundle.active && found.some((product) => product.isActive === false)) {
    throw new Error("One of the selected products is no longer available. Please update this bundle.");
  }

  const productsById = new Map(found.map((product) => [String(product._id), product]));
  const individualTotal = bundle.products.reduce((total, item) => (
    total + Number(productsById.get(item.productId)?.price || 0) * item.quantity
  ), 0);
  validateBundleDiscount(individualTotal, bundle.discountType, bundle.discountValue);
};

export async function getBundlesForProduct(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.productId)) return res.json({ success: true, bundles: [] });
    const bundles = await getPopulatedBundle(Bundle.find({
      active: true,
      $or: [
        { mainProduct: req.params.productId },
        { "products.productId": req.params.productId },
      ],
    }).sort({ displayPriority: -1, createdAt: -1 }));
    const quotes = await Promise.all(bundles.filter((bundle) => isBundleActive(bundle)).map(async (bundle) => {
      try {
        return await getBundleQuote(bundle._id);
      } catch {
        return null;
      }
    }));
    return res.json({ success: true, bundles: quotes.filter(Boolean) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load bundles.", error: error.message });
  }
}

export async function getBundle(req, res) {
  try {
    const bundle = await getBundleQuote(req.params.id, Number(req.query.quantity || 1));
    return res.json({ success: true, bundle });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
}

export async function quoteBundleForCart(req, res) {
  try {
    const { bundleId, quantity = 1 } = req.body || {};
    if (!mongoose.isValidObjectId(bundleId)) return res.status(400).json({ success: false, message: "A valid bundle ID is required." });
    return res.json({ success: true, bundle: await getBundleQuote(bundleId, quantity) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function listAdminBundles(_req, res) {
  try {
    const bundles = await Bundle.find().sort({ displayPriority: -1, createdAt: -1 });
    return res.json({ success: true, bundles: await Promise.all(bundles.map(getBundleProductsForAdmin)) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load bundles.", error: error.message });
  }
}

export async function createBundle(req, res) {
  try {
    const input = normalizeBundleInput(req.body);
    await validateProductReferences(input);
    const bundle = await Bundle.create(input);
    return res.status(201).json({ success: true, bundle: await getBundleProductsForAdmin(bundle) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Unable to create bundle." });
  }
}

export async function updateBundle(req, res) {
  try {
    const input = normalizeBundleInput(req.body);
    await validateProductReferences(input);
    const bundle = await Bundle.findByIdAndUpdate(req.params.id, input, { new: true, runValidators: true });
    if (!bundle) return res.status(404).json({ success: false, message: "Bundle not found." });
    return res.json({ success: true, bundle: await getBundleProductsForAdmin(bundle) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Unable to update bundle." });
  }
}

export async function updateBundleStatus(req, res) {
  try {
    if (typeof req.body?.active !== "boolean") return res.status(400).json({ success: false, message: "Active must be a boolean." });
    const current = await Bundle.findById(req.params.id);
    if (!current) return res.status(404).json({ success: false, message: "Bundle not found." });
    if (req.body.active) await validateProductReferences({ ...current.toObject(), active: true });
    const bundle = await Bundle.findByIdAndUpdate(req.params.id, { active: req.body.active }, { new: true });
    return res.json({ success: true, bundle: await getBundleProductsForAdmin(bundle) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function deleteBundle(req, res) {
  try {
    const bundle = await Bundle.findByIdAndDelete(req.params.id);
    if (!bundle) return res.status(404).json({ success: false, message: "Bundle not found." });
    return res.json({ success: true });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}
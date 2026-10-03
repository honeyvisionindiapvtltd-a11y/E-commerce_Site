import express from "express";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";
import {
  createBundle,
  deleteBundle,
  getBundle,
  getBundlesForProduct,
  listAdminBundles,
  quoteBundleForCart,
  searchAdminBundleProducts,
  updateBundle,
  updateBundleStatus,
} from "../controllers/bundleController.js";

const router = express.Router();

router.get("/bundles/product/:productId", getBundlesForProduct);
router.get("/bundles/:id", getBundle);
router.post("/cart/bundle", quoteBundleForCart);
router.get("/admin/bundles/products", protect, requireAdmin, searchAdminBundleProducts);
router.get("/admin/bundles", protect, requireAdmin, listAdminBundles);
router.post("/admin/bundles", protect, requireAdmin, createBundle);
router.put("/admin/bundles/:id", protect, requireAdmin, updateBundle);
router.patch("/admin/bundles/:id/status", protect, requireAdmin, updateBundleStatus);
router.delete("/admin/bundles/:id", protect, requireAdmin, deleteBundle);

export default router;
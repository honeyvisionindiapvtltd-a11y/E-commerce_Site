import express from "express";
import { protect, requireAdmin, requireCustomer } from "../middleware/authMiddleware.js";
import { getMyReturns, listReturns, processReturnInventory, requestReturn, updateReturn } from "../controllers/returnController.js";

const router = express.Router();

router.get("/my", protect, requireCustomer, getMyReturns);
router.post("/:orderNumber", protect, requireCustomer, requestReturn);
router.get("/admin", protect, requireAdmin, listReturns);
router.put("/admin/:id", protect, requireAdmin, updateReturn);
router.put("/admin/:id/inventory-disposition", protect, requireAdmin, processReturnInventory);

export default router;

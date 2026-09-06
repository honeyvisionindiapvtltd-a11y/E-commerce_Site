import express from "express";
import { protect, requireAdmin, requireCustomer } from "../middleware/authMiddleware.js";
import { getMyReturns, listReturns, requestReturn, updateReturn } from "../controllers/returnController.js";

const router = express.Router();

router.use(protect, requireCustomer);
router.get("/my", getMyReturns);
router.post("/:orderNumber", requestReturn);
router.get("/admin", protect, requireAdmin, listReturns);
router.put("/admin/:id", protect, requireAdmin, updateReturn);

export default router;

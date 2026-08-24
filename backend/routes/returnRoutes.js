import express from "express";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";
import { getMyReturns, listReturns, requestReturn, updateReturn } from "../controllers/returnController.js";

const router = express.Router();

router.use(protect);
router.get("/my", getMyReturns);
router.post("/:orderNumber", requestReturn);
router.get("/admin", protect, requireAdmin, listReturns);
router.put("/admin/:id", protect, requireAdmin, updateReturn);

export default router;

import express from "express";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";
import { getMyReturns, listReturns, requestReturn, updateReturn } from "../controllers/returnController.js";

const router = express.Router();

router.use(protect);
router.get("/my", getMyReturns);
router.post("/:orderNumber", requestReturn);
router.get("/admin", requireAdmin, listReturns);
router.put("/admin/:id", requireAdmin, updateReturn);

export default router;

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getNotifications, getUnreadCount, readAllNotifications, readNotification, removeNotification } from "../controllers/notificationController.js";

const router = express.Router();
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.use(protect);
router.get("/", asyncHandler(getNotifications));
router.get("/unread-count", asyncHandler(getUnreadCount));
router.patch("/:id/read", asyncHandler(readNotification));
router.patch("/read-all", asyncHandler(readAllNotifications));
router.delete("/:id", asyncHandler(removeNotification));

export default router;
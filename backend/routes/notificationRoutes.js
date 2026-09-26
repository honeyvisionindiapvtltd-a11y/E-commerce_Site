import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { clearAllNotifications, getNotifications, getPreferences, getUnreadCount, patchPreferences, readAllNotifications, readNotification, removeNotification, unreadNotification } from "../controllers/notificationController.js";

const router = express.Router();
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.use(protect);
router.get("/", asyncHandler(getNotifications));
router.get("/unread-count", asyncHandler(getUnreadCount));
router.get("/preferences", asyncHandler(getPreferences));
router.patch("/preferences", asyncHandler(patchPreferences));
router.delete("/", asyncHandler(clearAllNotifications));
router.patch("/:id/read", asyncHandler(readNotification));
router.patch("/:id/unread", asyncHandler(unreadNotification));
router.patch("/read-all", asyncHandler(readAllNotifications));
router.delete("/:id", asyncHandler(removeNotification));

export default router;
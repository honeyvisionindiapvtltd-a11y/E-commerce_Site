import express from "express";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";
import {
  acceptConversation, createNewConversation, createOrGetConversation, createTicketFromConversation, getConversationMessages,
  listAdminConversations, requestAgent, sendMessage, updateConversationStatus,
} from "../controllers/chatController.js";

const router = express.Router();
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.use(protect);
router.post("/conversations", asyncHandler(createOrGetConversation));
router.post("/conversations/new", asyncHandler(createNewConversation));
router.get("/conversations/:id/messages", asyncHandler(getConversationMessages));
router.post("/conversations/:id/messages", asyncHandler(sendMessage));
router.post("/conversations/:id/request-agent", asyncHandler(requestAgent));
router.post("/conversations/:id/ticket", asyncHandler(createTicketFromConversation));
router.get("/admin/conversations", requireAdmin, asyncHandler(listAdminConversations));
router.post("/admin/conversations/:id/accept", requireAdmin, asyncHandler(acceptConversation));
router.patch("/admin/conversations/:id/status", requireAdmin, asyncHandler(updateConversationStatus));

export default router;
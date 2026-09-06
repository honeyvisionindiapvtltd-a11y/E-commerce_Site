import express from "express";
import { protect, requireAdmin, requireCustomer } from "../middleware/authMiddleware.js";
import {
  acceptConversation, createNewConversation, createOrGetConversation, createTicketFromConversation, getConversationMessages,
  listAdminConversations, requestAgent, sendMessage, updateConversationStatus,
} from "../controllers/chatController.js";

const router = express.Router();
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.use(protect);
router.post("/conversations", requireCustomer, asyncHandler(createOrGetConversation));
router.post("/conversations/new", requireCustomer, asyncHandler(createNewConversation));
router.get("/conversations/:id/messages", requireCustomer, asyncHandler(getConversationMessages));
router.post("/conversations/:id/messages", requireCustomer, asyncHandler(sendMessage));
router.post("/conversations/:id/request-agent", requireCustomer, asyncHandler(requestAgent));
router.post("/conversations/:id/ticket", requireCustomer, asyncHandler(createTicketFromConversation));
router.get("/admin/conversations", requireAdmin, asyncHandler(listAdminConversations));
router.post("/admin/conversations/:id/accept", requireAdmin, asyncHandler(acceptConversation));
router.patch("/admin/conversations/:id/status", requireAdmin, asyncHandler(updateConversationStatus));

export default router;
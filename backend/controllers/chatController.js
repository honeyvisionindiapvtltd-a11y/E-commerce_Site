import mongoose from "mongoose";
import ChatConversation from "../models/ChatConversation.js";
import ChatMessage from "../models/ChatMessage.js";
import Order from "../models/Order.js";
import SupportTicket from "../models/SupportTicket.js";
import { getBotResponse } from "../services/chatBotService.js";
import { emitAdminNotification, emitChatEvent } from "../services/realtimeService.js";

const statuses = new Set(["BOT_ACTIVE", "WAITING_FOR_AGENT", "AGENT_ASSIGNED", "RESOLVED", "CLOSED"]);
const aiRequests = new Map();
const cleanMessage = (value) => String(value || "").replace(/[<>]/g, "").trim();
const publicConversation = (conversation) => conversation.toObject ? conversation.toObject() : conversation;

const getConversation = async (id, user, allowAdmin = false) => {
  if (!mongoose.isValidObjectId(id)) return null;
  const filter = { _id: id };
  if (!allowAdmin) filter.customer = user._id;
  return ChatConversation.findOne(filter).populate("customer", "name email").populate("assignedAgent", "name email");
};

export const createOrGetConversation = async (req, res) => {
  let conversation = await ChatConversation.findOne({ customer: req.user._id, status: { $in: ["BOT_ACTIVE", "WAITING_FOR_AGENT", "AGENT_ASSIGNED"] } }).sort({ updatedAt: -1 });
  if (!conversation) conversation = await ChatConversation.create({ customer: req.user._id });
  return res.status(200).json({ success: true, conversation: publicConversation(conversation) });
};

export const createNewConversation = async (req, res) => {
  const conversation = await ChatConversation.create({
    customer: req.user._id,
    status: "BOT_ACTIVE",
  });
  const welcomeMessage = await ChatMessage.create({
    conversation: conversation._id,
    senderType: "bot",
    message: "Hi! Welcome to Honey Vision Support. I can help with orders, delivery, installation, payments, products, and warranty support.",
    messageType: "bot",
  });
  conversation.lastMessage = welcomeMessage.message;
  conversation.lastMessageAt = welcomeMessage.createdAt;
  await conversation.save();
  return res.status(201).json({
    success: true,
    conversation: publicConversation(conversation),
    messages: [welcomeMessage],
  });
};

export const getConversationMessages = async (req, res) => {
  const conversation = await getConversation(req.params.id, req.user, req.user.role === "admin");
  if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found." });
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const messages = await ChatMessage.find({ conversation: conversation._id }).sort({ createdAt: -1 }).limit(limit).populate("sender", "name role").lean();
  await ChatConversation.updateOne({ _id: conversation._id }, req.user.role === "admin" ? { agentUnread: 0 } : { customerUnread: 0 });
  return res.json({ success: true, conversation: publicConversation(conversation), messages: messages.reverse() });
};

export const sendMessage = async (req, res) => {
  const message = cleanMessage(req.body?.message);
  if (!message || message.length > 4000) return res.status(400).json({ success: false, message: "Message must be between 1 and 4000 characters." });
  const conversation = await getConversation(req.params.id, req.user, req.user.role === "admin");
  if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found." });
  if (["CLOSED", "RESOLVED"].includes(conversation.status)) return res.status(409).json({ success: false, message: "This conversation is no longer active." });
  if (req.user.role !== "admin" && conversation.status === "BOT_ACTIVE") {
    const requestWindow = aiRequests.get(String(req.user._id)) || { startedAt: Date.now(), count: 0 };
    if (Date.now() - requestWindow.startedAt > 60_000) { requestWindow.startedAt = Date.now(); requestWindow.count = 0; }
    if (requestWindow.count >= 20) return res.status(429).json({ success: false, message: "Please wait a moment before sending more assistant messages." });
    requestWindow.count += 1;
    aiRequests.set(String(req.user._id), requestWindow);
  }
  const senderType = req.user.role === "admin" ? "agent" : "customer";
  const saved = await ChatMessage.create({ conversation: conversation._id, sender: req.user._id, senderType, message, messageType: senderType === "agent" ? "agent" : "text" });
  conversation.lastMessage = message;
  conversation.lastMessageAt = saved.createdAt;
  if (senderType === "agent") conversation.customerUnread += 1;
  else conversation.agentUnread += 1;
  await conversation.save();
  emitChatEvent("chat:newMessage", conversation, saved);

  if (senderType === "customer" && conversation.status === "BOT_ACTIVE") {
    const recentMessages = await ChatMessage.find({ conversation: conversation._id }).sort({ createdAt: -1 }).limit(12).lean();
    const bot = await getBotResponse({ message, user: req.user, conversation, recentMessages: recentMessages.reverse() });
    const currentConversation = await ChatConversation.findById(conversation._id).select("status").lean();
    if (!currentConversation || currentConversation.status !== "BOT_ACTIVE") return res.status(201).json({ success: true, message: saved });
    const botMessage = await ChatMessage.create({ conversation: conversation._id, senderType: "bot", message: bot.message, messageType: bot.metadata?.action === "TRACK_ORDER" ? "order_status" : "bot", metadata: { ...bot.metadata, actions: bot.actions } });
    conversation.lastMessage = bot.message;
    conversation.lastMessageAt = botMessage.createdAt;
    conversation.customerUnread += 1;
    if (bot.intent === "HUMAN_AGENT") conversation.status = "WAITING_FOR_AGENT";
    await conversation.save();
    emitChatEvent("chat:newMessage", conversation, botMessage);
    if (bot.intent === "HUMAN_AGENT") emitAdminNotification("New customer waiting for support", { conversationId: conversation._id });
  }
  return res.status(201).json({ success: true, message: saved });
};

export const requestAgent = async (req, res) => {
  const conversation = await getConversation(req.params.id, req.user);
  if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found." });
  if (!["BOT_ACTIVE", "WAITING_FOR_AGENT"].includes(conversation.status)) return res.status(409).json({ success: false, message: "This conversation cannot be transferred." });
  conversation.status = "WAITING_FOR_AGENT";
  await conversation.save();
  const systemMessage = await ChatMessage.create({ conversation: conversation._id, senderType: "system", message: "Your request has been sent to our support team. Please wait while we connect you with an agent.", messageType: "system" });
  emitChatEvent("chat:conversationUpdate", conversation);
  emitChatEvent("chat:newMessage", conversation, systemMessage);
  emitAdminNotification("New customer waiting for support", { conversationId: conversation._id });
  return res.json({ success: true, conversation: publicConversation(conversation) });
};

export const listAdminConversations = async (req, res) => {
  const status = req.query.status ? String(req.query.status).toUpperCase() : null;
  if (status && !statuses.has(status)) return res.status(400).json({ success: false, message: "Invalid chat status." });
  const conversations = await ChatConversation.find(status ? { status } : {}).populate("customer", "name email").populate("assignedAgent", "name email").sort({ lastMessageAt: -1 }).limit(200).lean();
  return res.json({ success: true, conversations });
};

export const acceptConversation = async (req, res) => {
  const conversation = await ChatConversation.findOneAndUpdate({ _id: req.params.id, status: "WAITING_FOR_AGENT", assignedAgent: null }, { $set: { status: "AGENT_ASSIGNED", assignedAgent: req.user._id } }, { new: true }).populate("customer", "name email").populate("assignedAgent", "name email");
  if (!conversation) return res.status(409).json({ success: false, message: "This chat was already accepted or is unavailable." });
  const systemMessage = await ChatMessage.create({ conversation: conversation._id, sender: req.user._id, senderType: "system", message: `${req.user.name} from Honey Vision Support joined the conversation.`, messageType: "system" });
  emitChatEvent("chat:agentAssigned", conversation);
  emitChatEvent("chat:newMessage", conversation, systemMessage);
  return res.json({ success: true, conversation: publicConversation(conversation) });
};

export const updateConversationStatus = async (req, res) => {
  const nextStatus = String(req.body?.status || "").toUpperCase();
  if (!["RESOLVED", "CLOSED"].includes(nextStatus)) return res.status(400).json({ success: false, message: "Invalid chat status transition." });
  const conversation = await getConversation(req.params.id, req.user, true);
  if (!conversation || (conversation.status === "CLOSED" && nextStatus !== "CLOSED")) return res.status(404).json({ success: false, message: "Conversation not found." });
  if (nextStatus === "RESOLVED" && !["AGENT_ASSIGNED", "WAITING_FOR_AGENT"].includes(conversation.status)) return res.status(409).json({ success: false, message: "Only active chats can be resolved." });
  conversation.status = nextStatus;
  await conversation.save();
  emitChatEvent(nextStatus === "RESOLVED" ? "chat:resolved" : "chat:closed", conversation);
  return res.json({ success: true, conversation: publicConversation(conversation) });
};

export const createTicketFromConversation = async (req, res) => {
  const conversation = await getConversation(req.params.id, req.user);
  if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found." });
  const existing = await SupportTicket.findOne({ user: req.user._id, status: { $in: ["OPEN", "IN_PROGRESS"] }, description: { $regex: String(conversation._id) } });
  if (existing) return res.json({ success: true, ticket: existing, existing: true });
  const order = conversation.relatedOrderNumber ? await Order.findOne({ orderNumber: conversation.relatedOrderNumber, user: req.user._id }).select("_id orderNumber") : null;
  const ticket = await SupportTicket.create({ ticketNumber: `HV-CHAT-${Date.now().toString(36).toUpperCase()}`, user: req.user._id, order: order?._id || null, orderNumber: order?.orderNumber || "", category: "OTHER", subject: "Chat support request", description: `Created from chat conversation ${conversation._id}.`, messages: [{ author: req.user._id, authorRole: "customer", message: "Please continue helping with this chat request." }] });
  return res.status(201).json({ success: true, ticket });
};
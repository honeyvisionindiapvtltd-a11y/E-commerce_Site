import crypto from "crypto";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import SupportTicket from "../models/SupportTicket.js";

const categories = new Set(["ORDERS", "DELIVERY", "INSTALLATION", "RETURNS", "PAYMENTS", "WARRANTY", "ACCOUNT", "TECHNICAL", "OTHER"]);
const statuses = new Set(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]);
const priorities = new Set(["LOW", "NORMAL", "HIGH", "URGENT"]);

const ticketNumber = () => `HV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
const safeTicket = (ticket) => ticket;

const getOwnedOrder = async (orderNumber, req) => {
  if (!orderNumber) return null;
  return Order.findOne({ orderNumber: String(orderNumber).trim(), user: req.user._id }).select("_id orderNumber status totalAmount");
};

export const createTicket = async (req, res) => {
  try {
    const { category, subject, description, orderNumber = "" } = req.body || {};
    const normalizedCategory = String(category || "").trim().toUpperCase();

    if (!categories.has(normalizedCategory)) return res.status(400).json({ success: false, message: "A valid support category is required." });
    if (!String(subject || "").trim() || !String(description || "").trim()) return res.status(400).json({ success: false, message: "Subject and description are required." });

    const order = await getOwnedOrder(orderNumber, req);
    if (orderNumber && !order) return res.status(404).json({ success: false, message: "Order not found." });

    const ticket = await SupportTicket.create({
      ticketNumber: ticketNumber(),
      user: req.user._id,
      order: order?._id || null,
      orderNumber: order?.orderNumber || "",
      category: normalizedCategory,
      subject: String(subject).trim(),
      description: String(description).trim(),
      priority: "NORMAL",
      messages: [{ author: req.user._id, authorRole: "customer", message: String(description).trim() }],
    });

    return res.status(201).json({ success: true, ticket: safeTicket(ticket) });
  } catch (error) {
    console.error("createTicket error:", error);
    return res.status(500).json({ success: false, message: "Unable to create support request." });
  }
};

export const getMyTickets = async (req, res) => {
  const tickets = await SupportTicket.find({ user: req.user._id })
    .populate("order", "orderNumber status totalAmount")
    .sort({ createdAt: -1 })
    .lean();
  return res.json({ success: true, tickets });
};

export const getMyTicket = async (req, res) => {
  const ticket = await SupportTicket.findOne({ ticketNumber: String(req.params.ticketNumber).trim(), user: req.user._id })
    .populate("order", "orderNumber status totalAmount")
    .populate("messages.author", "name role")
    .lean();
  if (!ticket) return res.status(404).json({ success: false, message: "Support request not found." });
  return res.json({ success: true, ticket });
};

export const addCustomerMessage = async (req, res) => {
  const message = String(req.body?.message || "").trim();
  if (!message) return res.status(400).json({ success: false, message: "Message is required." });

  const ticket = await SupportTicket.findOne({ ticketNumber: String(req.params.ticketNumber).trim(), user: req.user._id });
  if (!ticket) return res.status(404).json({ success: false, message: "Support request not found." });
  if (ticket.status === "CLOSED") return res.status(409).json({ success: false, message: "Closed support requests cannot receive new messages." });

  ticket.messages.push({ author: req.user._id, authorRole: "customer", message });
  if (ticket.status === "RESOLVED") ticket.status = "OPEN";
  await ticket.save();
  return res.json({ success: true, ticket });
};

export const listTickets = async (req, res) => {
  const filter = {};
  if (req.query.status) {
    const status = String(req.query.status).toUpperCase();
    if (!statuses.has(status)) return res.status(400).json({ success: false, message: "Invalid ticket status filter." });
    filter.status = status;
  }
  if (req.query.priority) {
    const priority = String(req.query.priority).toUpperCase();
    if (!priorities.has(priority)) return res.status(400).json({ success: false, message: "Invalid ticket priority filter." });
    filter.priority = priority;
  }
  const tickets = await SupportTicket.find(filter)
    .populate("user", "name email phone")
    .populate("order", "orderNumber status totalAmount")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  return res.json({ success: true, tickets });
};

export const updateTicket = async (req, res) => {
  const { status, priority, message } = req.body || {};
  const nextStatus = status === undefined ? undefined : String(status).toUpperCase();
  const nextPriority = priority === undefined ? undefined : String(priority).toUpperCase();
  if (nextStatus !== undefined && !statuses.has(nextStatus)) return res.status(400).json({ success: false, message: "Invalid ticket status." });
  if (nextPriority !== undefined && !priorities.has(nextPriority)) return res.status(400).json({ success: false, message: "Invalid ticket priority." });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid support request ID." });

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ success: false, message: "Support request not found." });
  if (nextStatus !== undefined) ticket.status = nextStatus;
  if (nextPriority !== undefined) ticket.priority = nextPriority;
  if (String(message || "").trim()) ticket.messages.push({ author: req.user._id, authorRole: "admin", message: String(message).trim() });
  await ticket.save();
  return res.json({ success: true, ticket });
};

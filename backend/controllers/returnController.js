import Order from "../models/Order.js";
import ReturnRequest from "../models/ReturnRequest.js";
import { updateOrderTracking } from "../services/orderTrackingService.js";

const allowedStatuses = ["REQUESTED", "APPROVED", "REJECTED", "PICKUP_SCHEDULED", "PICKED_UP", "REFUNDED"];
const findOrder = (orderNumber) => Order.findOne({ orderNumber: String(orderNumber).trim() });

export const requestReturn = async (req, res) => {
  try {
    const { reason, description = "" } = req.body || {};
    if (!reason?.trim()) return res.status(400).json({ success: false, message: "Return reason is required" });

    const order = await findOrder(req.params.orderNumber);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (String(order.user) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Access denied" });
    if (order.status !== "DELIVERED") return res.status(409).json({ success: false, message: "Returns are available only for delivered orders" });

    const existing = await ReturnRequest.findOne({ order: order._id });
    if (existing) return res.status(409).json({ success: false, message: "A return request already exists for this order", request: existing });

    const request = await ReturnRequest.create({
      order: order._id,
      orderNumber: order.orderNumber,
      user: order.user,
      reason: reason.trim(),
      description: String(description).trim(),
      refundAmount: order.totalAmount,
      refundStatus: "PENDING",
    });
    await updateOrderTracking({ orderId: order.orderNumber, status: "RETURN_REQUESTED", source: "SYSTEM", metadata: { returnRequestId: request._id } });
    return res.status(201).json({ success: true, request });
  } catch (error) {
    console.error("requestReturn error:", error);
    return res.status(500).json({ success: false, message: "Failed to request return", error: error.message });
  }
};

export const getMyReturns = async (req, res) => {
  const requests = await ReturnRequest.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  return res.json({ success: true, requests });
};

export const listReturns = async (req, res) => {
  const filter = req.query.status && allowedStatuses.includes(req.query.status) ? { status: req.query.status } : {};
  const requests = await ReturnRequest.find(filter).populate("order", "totalAmount paymentStatus status").populate("user", "name email phone").sort({ createdAt: -1 }).limit(200).lean();
  return res.json({ success: true, requests });
};

export const updateReturn = async (req, res) => {
  try {
    const { status, adminNote = "", refundStatus, refundAmount } = req.body || {};
    if (!allowedStatuses.includes(status)) return res.status(400).json({ success: false, message: "Invalid return status" });
    const request = await ReturnRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Return request not found" });

    request.status = status;
    request.adminNote = String(adminNote).trim();
    if (refundStatus) request.refundStatus = refundStatus;
    if (refundAmount !== undefined) request.refundAmount = Number(refundAmount);
    await request.save();

    if (["REJECTED", "REFUNDED"].includes(status)) {
      await updateOrderTracking({ orderId: request.orderNumber, status: status === "REFUNDED" ? "RETURNED" : "CANCELLED", source: "ADMIN", metadata: { returnRequestId: request._id } });
    }
    return res.json({ success: true, request });
  } catch (error) {
    console.error("updateReturn error:", error);
    return res.status(500).json({ success: false, message: "Failed to update return request", error: error.message });
  }
};

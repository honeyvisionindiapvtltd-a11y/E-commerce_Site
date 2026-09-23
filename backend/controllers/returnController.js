import Order from "../models/Order.js";
import ReturnRequest from "../models/ReturnRequest.js";
import { updateOrderTracking } from "../services/orderTrackingService.js";
import { getReturnEligibility } from "../services/orderLifecycleService.js";
import inventoryService, { isInventoryAuthorityEnabled } from "../services/inventoryService.js";

const allowedStatuses = ["REQUESTED", "APPROVED", "REJECTED", "PICKUP_SCHEDULED", "PICKED_UP", "REFUNDED"];
const findOrder = (orderNumber) => Order.findOne({ orderNumber: String(orderNumber).trim() });

export const requestReturn = async (req, res) => {
  try {
    const { reason, description = "" } = req.body || {};
    if (!reason?.trim()) return res.status(400).json({ success: false, message: "Return reason is required" });

    const order = await findOrder(req.params.orderNumber);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (String(order.user) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Access denied" });
    const eligibility = await getReturnEligibility(order);
    if (!eligibility.returnEligible) return res.status(409).json({ success: false, message: eligibility.reason, actions: { canCancel: false, canReturn: false, canReplace: false } });

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

    if (status === "REFUNDED") {
      await updateOrderTracking({ orderId: request.orderNumber, status: "RETURNED", source: "ADMIN", metadata: { returnRequestId: request._id } });
    }
    return res.json({ success: true, request });
  } catch (error) {
    console.error("updateReturn error:", error);
    return res.status(500).json({ success: false, message: "Failed to update return request", error: error.message });
  }
};

export const processReturnInventory = async (req, res) => {
  try {
    if (!isInventoryAuthorityEnabled()) return res.status(409).json({ success: false, message: "Inventory authority is not enabled." });
    const { disposition, reason = "", items } = req.body || {};
    if (!["SELLABLE_RETURN", "DAMAGED_RETURN", "REPLACEMENT", "REFUND"].includes(disposition)) {
      return res.status(400).json({ success: false, message: "A valid return inventory disposition is required." });
    }
    const request = await ReturnRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Return request not found" });
    if (!["PICKED_UP", "REFUNDED"].includes(request.status)) return res.status(409).json({ success: false, message: "Inventory can be processed only after the return is picked up." });
    if (request.inventoryProcessed) return res.json({ success: true, request, idempotent: true });

    const order = await Order.findById(request.order).select("items");
    if (!order) return res.status(404).json({ success: false, message: "The related order was not found" });
    const requestedItems = Array.isArray(items) && items.length ? items : order.items.map((item) => ({ productId: item.product, quantity: item.quantity }));
    const orderItems = new Map(order.items.map((item) => [String(item.product), item]));

    for (const item of requestedItems) {
      const orderItem = orderItems.get(String(item.productId));
      const quantity = Number(item.quantity);
      if (!orderItem || !Number.isInteger(quantity) || quantity < 1 || quantity > Number(orderItem.quantity)) {
        return res.status(400).json({ success: false, message: "Return quantity is invalid for the selected item." });
      }
      await inventoryService.processReturnInventory(
        item.productId,
        quantity,
        disposition,
        { type: "RETURN", id: `${request._id}:${item.productId}` },
        String(reason).trim(),
        req.user._id,
      );
    }

    request.inventoryDisposition = disposition;
    request.inventoryProcessed = true;
    request.inventoryProcessedAt = new Date();
    request.inventoryProcessedBy = req.user._id;
    await request.save();
    return res.json({ success: true, request });
  } catch (error) {
    console.error("processReturnInventory error:", error);
    return res.status(400).json({ success: false, message: error.message || "Failed to process return inventory" });
  }
};

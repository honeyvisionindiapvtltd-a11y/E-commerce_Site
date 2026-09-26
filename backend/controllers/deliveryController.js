import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import {
  createDeliveryOtp,
  DELIVERY_OTP_MAX_ATTEMPTS,
  DELIVERY_OTP_TTL_MS,
  hashDeliveryOtp,
  updateOrderTracking,
  verifyDeliveryOtp,
} from "../services/orderTrackingService.js";
import { STATUS_DESCRIPTIONS } from "../constants/orderStatuses.js";
import { generateUniqueHoneyVisionTrackingNumber } from "../utils/tracking.js";
import { sendDeliveryOtpEmail } from "../services/deliveryOtpService.js";
import { sendOTP } from "../services/twoFactorService.js";
import inventoryService, { isInventoryAuthorityEnabled } from "../services/inventoryService.js";
import {
  processLocationUpdate,
  getLocationFreshnessStatus,
  getLocationAge,
} from "../services/deliveryLocationService.js";
import {
  createDeliveryEvent,
  recordStatusTransition,
  recordDeliveryMilestone,
  recordAgentPresence,
} from "../services/deliveryEventService.js";
import {
  validateAndTransition as validateStateTransition,
  isValidStatusTransition,
} from "../services/deliveryStateMachine.js";

const orderQuery = (orderNumber) => ({ orderNumber: String(orderNumber).trim() });
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);
const FAILED_DELIVERY_REASONS = Object.freeze([
  "CUSTOMER_UNAVAILABLE",
  "CUSTOMER_NOT_REACHABLE",
  "ADDRESS_NOT_FOUND",
  "CUSTOMER_REFUSED",
  "OTP_VERIFICATION_FAILED",
  "DELIVERY_LOCATION_UNREACHABLE",
  "CUSTOMER_REQUESTED_RESCHEDULE",
  "OTHER",
]);
const canExposeDevelopmentOtp = () => process.env.NODE_ENV === "development"
  && process.env.ALLOW_DEV_OTP_EXPOSURE === "true";

const captureDeliveryStartState = (order) => ({
  status: order.status,
  trackingNumber: order.trackingNumber,
  deliveryStartedAt: order.deliveryStartedAt,
  deliveryLocation: order.deliveryLocation?.toObject?.() || order.deliveryLocation,
  deliveryProof: order.deliveryProof?.toObject?.() || order.deliveryProof,
  failedDeliveryReason: order.failedDeliveryReason,
  failedDeliveryNotes: order.failedDeliveryNotes,
  failedDeliveryAt: order.failedDeliveryAt,
  deliveryOtpHash: order.deliveryOtpHash,
  deliveryOtpExpiresAt: order.deliveryOtpExpiresAt,
  deliveryOtpVerifiedAt: order.deliveryOtpVerifiedAt,
  deliveryOtpAttempts: order.deliveryOtpAttempts,
  trackingEvents: order.trackingEvents?.map((event) => event.toObject?.() || event),
});

const restoreDeliveryStartState = async (order, state) => {
  Object.assign(order, state);
  await order.save();
};

const serializeAgent = (agent, workload = {}) => ({
  id: agent._id?.toString(),
  name: agent.name,
  email: agent.email,
  phone: agent.phone,
  role: agent.role,
  status: agent.status,
  profile: agent.profile,
  createdAt: agent.createdAt,
  updatedAt: agent.updatedAt,
  assignedOrders: Number(workload.assignedOrders || 0),
  deliveredOrders: Number(workload.deliveredOrders || 0),
});

const getAgentWorkload = async (agentIds) => {
  const rows = await Order.aggregate([
    { $match: { deliveryAgent: { $in: agentIds } } },
    { $group: {
      _id: "$deliveryAgent",
      assignedOrders: { $sum: { $cond: [{ $not: [{ $in: ["$status", ["DELIVERED", "CANCELLED", "RETURNED"]] }] }, 1, 0] } },
      deliveredOrders: { $sum: { $cond: [{ $eq: ["$status", "DELIVERED"] }, 1, 0] } },
    } },
  ]);
  return new Map(rows.map((row) => [String(row._id), row]));
};

export const listManagedDeliveryAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: "delivery_agent" })
      .select("name phone email role status profile createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();
    const workload = await getAgentWorkload(agents.map((agent) => agent._id));
    res.json({
      success: true,
      agents: agents.map((agent) => serializeAgent(agent, workload.get(String(agent._id)))),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch delivery-agent management data", error: error.message });
  }
};

export const getManagedDeliveryAgent = async (req, res) => {
  try {
    const agent = await User.findOne({ _id: req.params.agentId, role: "delivery_agent" })
      .select("name phone email role status profile createdAt updatedAt")
      .lean();
    if (!agent) return res.status(404).json({ success: false, message: "Delivery agent not found" });
    const workload = await getAgentWorkload([agent._id]);
    res.json({ success: true, agent: serializeAgent(agent, workload.get(String(agent._id))) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch delivery agent", error: error.message });
  }
};

export const createDeliveryAgent = async (req, res) => {
  try {
    const { name, fullName, email, phone, password, profile = {} } = req.body || {};
    const agentName = String(fullName || name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhone = String(phone || "").trim();

    if (!agentName || !normalizedEmail || !normalizedPhone || !password) {
      return res.status(400).json({ success: false, message: "Full name, email, phone, and password are required" });
    }
    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "A valid email address is required" });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ success: false, message: "Password must contain at least 8 characters" });
    }
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ success: false, message: "A user with this email already exists" });
    }

    const agent = new User({
      name: agentName,
      email: normalizedEmail,
      phone: normalizedPhone,
      role: "delivery_agent",
      status: "Active",
      profile: { ...profile, fullName: agentName, email: normalizedEmail, phone: normalizedPhone },
    });
    agent.setPassword(String(password));
    await agent.save();

    res.status(201).json({ success: true, agent: serializeAgent(agent) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create delivery agent", error: error.message });
  }
};

export const updateDeliveryAgent = async (req, res) => {
  try {
    const agent = await User.findOne({ _id: req.params.agentId, role: "delivery_agent" });
    if (!agent) return res.status(404).json({ success: false, message: "Delivery agent not found" });

    const { name, fullName, email, phone, password, profile } = req.body || {};
    const nextName = String(fullName || name || agent.name).trim();
    const nextEmail = String(email || agent.email).trim().toLowerCase();
    const nextPhone = String(phone || agent.phone).trim();
    if (!nextName || !nextPhone || !emailPattern.test(nextEmail)) {
      return res.status(400).json({ success: false, message: "Valid name, email, and phone are required" });
    }
    const duplicate = await User.findOne({ email: nextEmail, _id: { $ne: agent._id } }).select("_id").lean();
    if (duplicate) return res.status(409).json({ success: false, message: "A user with this email already exists" });

    agent.name = nextName;
    agent.email = nextEmail;
    agent.phone = nextPhone;
    agent.profile = { ...(agent.profile || {}), ...(profile || {}), fullName: nextName, email: nextEmail, phone: nextPhone };
    if (password) {
      if (String(password).length < 8) return res.status(400).json({ success: false, message: "Password must contain at least 8 characters" });
      agent.setPassword(String(password));
    }
    await agent.save();
    res.json({ success: true, agent: serializeAgent(agent) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update delivery agent", error: error.message });
  }
};

export const updateDeliveryAgentStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be Active or Inactive" });
    }
    const agent = await User.findOneAndUpdate(
      { _id: req.params.agentId, role: "delivery_agent" },
      { status },
      { new: true, runValidators: true },
    ).select("name phone email role status profile createdAt updatedAt").lean();
    if (!agent) return res.status(404).json({ success: false, message: "Delivery agent not found" });
    const workload = await getAgentWorkload([agent._id]);
    res.json({ success: true, agent: serializeAgent(agent, workload.get(String(agent._id))) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update delivery-agent status", error: error.message });
  }
};

export const listDeliveryAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: "delivery_agent", status: "Active" })
      .select("name phone email role status profile")
      .sort({ name: 1 })
      .lean();
    res.json({ success: true, agents });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch delivery agents", error: error.message });
  }
};

export const listMyDeliveries = async (req, res) => {
  try {
    const orders = await Order.find({ deliveryAgent: req.user._id })
      .populate("items.product", "name slug thumbnail price")
      .populate("user", "name email phone")
      .sort({ deliveryAssignedAt: -1, createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch assigned deliveries", error: error.message });
  }
};

const getAssignedOrder = async (req, res) => {
  const order = await Order.findOne({ ...orderQuery(req.params.orderNumber), deliveryAgent: req.user._id })
    .populate("items.product", "name slug thumbnail price")
    .populate("user", "name email phone");
  if (!order) {
    res.status(404).json({ success: false, message: "Assigned order not found" });
    return null;
  }
  return order;
};

export const getMyDelivery = async (req, res) => {
  try {
    const order = await getAssignedOrder(req, res);
    if (order) res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch delivery", error: error.message });
  }
};

export const startDelivery = async (req, res) => {
  let order = null;
  let previousState = null;
  try {
    order = await getAssignedOrder(req, res);
    if (!order) return;
    if (!["PACKED", "SHIPPED", "FAILED_DELIVERY"].includes(order.status)) {
      return res.status(409).json({ success: false, message: `Cannot start delivery from ${order.status}` });
    }
    previousState = captureDeliveryStartState(order);
    const isRedelivery = order.status === "FAILED_DELIVERY";
    if (isRedelivery) {
      order.failedDeliveryReason = null;
      order.failedDeliveryNotes = "";
      order.failedDeliveryAt = null;
      order.deliveryLocation = { latitude: null, longitude: null, accuracy: null, updatedAt: null };
      order.deliveryProof = { notes: "", capturedAt: null, capturedBy: null };
      await order.save();
    }
    if (!order.trackingNumber) {
      order.trackingNumber = await generateUniqueHoneyVisionTrackingNumber(
        (candidate) => Order.exists({ trackingNumber: candidate, _id: { $ne: order._id } }),
      );
      await order.save();
    }
    const deliveryOtp = createDeliveryOtp();
    if (process.env.NODE_ENV !== "production") console.debug("[SMS] OTP generated: yes");
    const deliveryOtpExpiresAt = new Date(Date.now() + DELIVERY_OTP_TTL_MS);
    order.deliveryOtpHash = hashDeliveryOtp(deliveryOtp);
    order.deliveryOtpExpiresAt = deliveryOtpExpiresAt;
    order.deliveryOtpVerifiedAt = null;
    order.deliveryOtpAttempts = 0;
    await order.save();
    if (process.env.NODE_ENV !== "production") console.debug("[SMS] OTP hash saved: yes");
    if (process.env.NODE_ENV !== "production") console.debug("[SMS] Customer phone found:", Boolean(order.shippingAddress?.phone));
    await sendOTP({ phone: order.shippingAddress?.phone, otp: deliveryOtp });
    try {
      await sendDeliveryOtpEmail({
        email: order.user?.email,
        customerName: order.user?.name,
        orderNumber: order.orderNumber,
        otp: deliveryOtp,
        expiresAt: deliveryOtpExpiresAt,
      });
    } catch (emailError) {
      console.warn("Delivery OTP email skipped:", emailError.message);
    }
    const result = await updateOrderTracking({
      orderId: order.orderNumber,
      status: "OUT_FOR_DELIVERY",
      title: "Out for Delivery",
      description: STATUS_DESCRIPTIONS.OUT_FOR_DELIVERY,
      source: "DELIVERY_AGENT",
      metadata: { updatedBy: req.user._id },
      deliveryOtp,
    });
    result.order.deliveryStartedAt = result.order.deliveryStartedAt || new Date();
    await result.order.save();
    
    // Record delivery event with sequence number
    try {
      await recordStatusTransition(
        order._id,
        order.orderNumber,
        req.user._id,
        order.status, // previous status
        "OUT_FOR_DELIVERY", // new status
        { updatedBy: req.user._id }
      );
    } catch (eventError) {
      console.warn("Failed to record delivery event:", eventError.message);
    }
    
    if (process.env.NODE_ENV !== "production") console.debug("[SMS] Order transitioned to OUT_FOR_DELIVERY");
    res.json({
      success: true,
      order: result.order,
      event: result.trackingEvent,
      smsSent: true,
      ...(canExposeDevelopmentOtp() ? { developmentOtp: deliveryOtp } : {}),
    });
  } catch (error) {
    if (order && previousState) {
      await restoreDeliveryStartState(order, previousState).catch((restoreError) => {
        console.error("Failed to restore delivery start state:", restoreError.message);
      });
    }
    if (error.isSmsError) {
      return res.status(502).json({
        success: false,
        message: "Unable to send delivery OTP SMS. Please check SMS configuration.",
      });
    }
    res.status(400).json({ success: false, message: "Failed to start delivery", error: error.message });
  }
};

export const markDelivered = async (req, res) => {
  let verificationTime = null;
  let orderId = null;
  try {
    let order = await Order.findOne({
      ...orderQuery(req.params.orderNumber),
      deliveryAgent: req.user._id,
    }).select("+deliveryOtpHash +deliveryOtpExpiresAt +deliveryOtpVerifiedAt +deliveryOtpAttempts");
    if (!order) return res.status(404).json({ success: false, message: "Assigned order not found" });
    orderId = order._id;
    if (order.status !== "OUT_FOR_DELIVERY") {
      return res.status(409).json({ success: false, message: `Cannot mark ${order.status} as delivered` });
    }
    if (String(order.paymentMethod || "").toUpperCase() === "COD" && order.paymentStatus !== "PAID") {
      return res.status(409).json({ success: false, message: "COD payment must be collected before delivery is completed." });
    }
    const otp = String(req.body?.otp || "").trim();
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: "Enter the 6-digit delivery OTP" });
    }
    if (order.deliveryOtpVerifiedAt) {
      return res.status(409).json({ success: false, message: "Delivery OTP has already been used" });
    }
    if (!order.deliveryOtpHash || !order.deliveryOtpExpiresAt || order.deliveryOtpExpiresAt <= new Date()) {
      return res.status(410).json({ success: false, message: "Delivery OTP has expired" });
    }
    if (Number(order.deliveryOtpAttempts || 0) >= DELIVERY_OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ success: false, message: "Too many invalid OTP attempts" });
    }
    if (!verifyDeliveryOtp(otp, order.deliveryOtpHash)) {
      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          status: "OUT_FOR_DELIVERY",
          deliveryOtpVerifiedAt: null,
          deliveryOtpAttempts: { $lt: DELIVERY_OTP_MAX_ATTEMPTS },
        },
        { $inc: { deliveryOtpAttempts: 1 } },
        { new: true },
      ).select("+deliveryOtpAttempts");
      const attempts = Number(updatedOrder?.deliveryOtpAttempts || DELIVERY_OTP_MAX_ATTEMPTS);
      return res.status(400).json({
        success: false,
        message: `Invalid delivery OTP. ${Math.max(0, DELIVERY_OTP_MAX_ATTEMPTS - attempts)} attempts remaining`,
      });
    }

    verificationTime = new Date();
    order = await Order.findOneAndUpdate(
      {
        _id: order._id,
        status: "OUT_FOR_DELIVERY",
        deliveryOtpHash: order.deliveryOtpHash,
        deliveryOtpExpiresAt: { $gt: verificationTime },
        deliveryOtpVerifiedAt: null,
        deliveryOtpAttempts: { $lt: DELIVERY_OTP_MAX_ATTEMPTS },
      },
      { $set: { deliveryOtpVerifiedAt: verificationTime } },
      { new: true },
    ).select("+deliveryOtpHash +deliveryOtpExpiresAt +deliveryOtpVerifiedAt +deliveryOtpAttempts");
    if (!order) {
      return res.status(409).json({ success: false, message: "Delivery OTP has already been used or is no longer valid" });
    }

    const notes = String(req.body?.notes || "").trim();
    order.deliveryProof = {
      notes,
      capturedAt: new Date(),
      capturedBy: req.user._id,
    };
    order.deliveryLocation = { latitude: null, longitude: null, accuracy: null, updatedAt: null };
    await order.save();

    const result = await updateOrderTracking({
      orderId: order.orderNumber,
      status: "DELIVERED",
      title: "Delivered",
      description: STATUS_DESCRIPTIONS.DELIVERED,
      source: "DELIVERY_AGENT",
      metadata: { updatedBy: req.user._id, otpVerified: true, proofNotesAdded: Boolean(notes) },
    });
    
    // Record delivery event with sequence number
    try {
      await recordStatusTransition(
        order._id,
        order.orderNumber,
        req.user._id,
        "OUT_FOR_DELIVERY", // previous status
        "DELIVERED", // new status
        { 
          updatedBy: req.user._id, 
          otpVerified: true, 
          proofNotesAdded: Boolean(notes),
          capturedBy: req.user._id
        }
      );
    } catch (eventError) {
      console.warn("Failed to record delivery event:", eventError.message);
    }
    
    res.json({ success: true, order: result.order, event: result.trackingEvent });
  } catch (error) {
    if (orderId && verificationTime) {
      await Order.updateOne(
        { _id: orderId, status: "OUT_FOR_DELIVERY", deliveryOtpVerifiedAt: verificationTime },
        { $set: { deliveryOtpVerifiedAt: null } },
      ).catch(() => {});
    }
    res.status(400).json({ success: false, message: "Failed to mark delivery complete", error: error.message });
  }
};

export const unassignDeliveryAgent = async (req, res) => {
  try {
    const order = await Order.findOne(orderQuery(req.params.orderNumber));
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"].includes(order.status)) {
      return res.status(409).json({ success: false, message: "Agent cannot be changed after delivery starts or the order closes" });
    }
    order.deliveryAgent = null;
    order.deliveryAssignedAt = null;
    await order.save();
    res.json({ success: true, message: "Delivery agent unassigned", order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to unassign delivery agent", error: error.message });
  }
};

export const updateDeliveryLocation = async (req, res) => {
  try {
    const order = await Order.findOne({
      orderNumber: String(req.params.orderNumber).trim(),
      deliveryAgent: req.user._id,
    }).populate('shippingAddress');

    if (!order) {
      return res.status(404).json({ success: false, message: "Assigned order not found" });
    }

    if (order.status !== "OUT_FOR_DELIVERY") {
      return res.status(409).json({ success: false, message: "Location can only be shared while out for delivery" });
    }

    // Extract and normalize GPS data
    const latitude = Number(req.body?.latitude);
    const longitude = Number(req.body?.longitude);
    const accuracy = req.body?.accuracy === undefined || req.body?.accuracy === null
      ? null
      : Number(req.body.accuracy);
    const heading = req.body?.heading === undefined || req.body?.heading === null ? null : Number(req.body.heading);
    const speed = req.body?.speed === undefined || req.body?.speed === null ? null : Number(req.body.speed);

    // Process location through validation service
    const locationData = {
      latitude,
      longitude,
      accuracy,
      heading,
      speed,
      timestamp: new Date(),
    };

    const result = await processLocationUpdate(
      req.user._id,
      order._id,
      order.orderNumber,
      locationData,
      order.shippingAddress
    );

    if (!result.success) {
      // Return validation error details
      const firstError = result.validation?.errors?.[0];
      return res.status(400).json({
        success: false,
        message: firstError?.message || "Location validation failed",
        code: firstError?.reason,
        errors: result.validation?.errors,
      });
    }

    // Update Order with delivery location (for backward compatibility)
    order.deliveryLocation = {
      deliveryAgentId: req.user._id,
      latitude,
      longitude,
      accuracy,
      heading,
      speed,
      updatedAt: new Date(),
    };

    await order.save();

    if (process.env.NODE_ENV !== "production") {
      console.debug("Delivery GPS stored:", {
        orderNumber: order.orderNumber,
        latitude,
        longitude,
        accuracy,
        updatedAt: order.deliveryLocation.updatedAt,
      });
    }

    // Socket.IO emission is handled by deliveryEventService.createDeliveryEvent
    // called via recordLocationUpdate in processLocationUpdate

    return res.json({
      success: true,
      location: order.deliveryLocation,
      locationAge: getLocationAge(result.location.timestamp),
      locationStatus: getLocationFreshnessStatus(result.location.timestamp),
      milestones: result.milestones?.milestones || [],
    });
  } catch (error) {
    console.error("updateDeliveryLocation error:", error);
    return res.status(500).json({ success: false, message: "Failed to update delivery location", error: error.message });
  }
};

export const failDelivery = async (req, res) => {
  try {
    const order = await getAssignedOrder(req, res);
    if (!order) return;
    if (order.status !== "OUT_FOR_DELIVERY") {
      return res.status(409).json({ success: false, message: `Cannot fail ${order.status} as a delivery attempt` });
    }

    const reason = String(req.body?.reason || "").trim();
    const notes = String(req.body?.notes || "").trim();
    if (!FAILED_DELIVERY_REASONS.includes(reason)) {
      return res.status(400).json({ success: false, message: "Select a valid failed delivery reason" });
    }
    if (reason === "OTHER" && !notes) {
      return res.status(400).json({ success: false, message: "Notes are required when the reason is Other" });
    }

    order.failedDeliveryReason = reason;
    order.failedDeliveryNotes = notes;
    order.failedDeliveryAt = new Date();
    order.deliveryOtpHash = null;
    order.deliveryOtpExpiresAt = null;
    order.deliveryOtpVerifiedAt = null;
    order.deliveryOtpAttempts = 0;
    order.deliveryLocation = { latitude: null, longitude: null, accuracy: null, updatedAt: null };
    await order.save();

    const result = await updateOrderTracking({
      orderId: order.orderNumber,
      status: "FAILED_DELIVERY",
      title: "Delivery Attempt Unsuccessful",
      description: "The delivery attempt was unsuccessful. Our team will update you regarding the next delivery step.",
      source: "DELIVERY_AGENT",
      metadata: { updatedBy: req.user._id, reason },
      resetDeliveryOtp: true,
    });
    
    // Record delivery event with sequence number
    try {
      await recordStatusTransition(
        order._id,
        order.orderNumber,
        req.user._id,
        "OUT_FOR_DELIVERY", // previous status
        "FAILED_DELIVERY", // new status
        { 
          updatedBy: req.user._id, 
          reason,
          notes
        }
      );
    } catch (eventError) {
      console.warn("Failed to record delivery event:", eventError.message);
    }
    
    res.json({ success: true, order: result.order, event: result.trackingEvent });
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to record delivery attempt", error: error.message });
  }
};

export const collectCodPayment = async (req, res) => {
  try {
    const order = await Order.findOne({ ...orderQuery(req.params.orderNumber), deliveryAgent: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: "Assigned order not found" });
    if (String(order.paymentMethod || "").toUpperCase() !== "COD") return res.status(400).json({ success: false, message: "This order is not a COD order." });
    if (order.paymentStatus === "PAID") return res.json({ success: true, order, message: "COD payment is already recorded." });

    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || Math.round(amount * 100) !== Math.round(Number(order.totalAmount || 0) * 100)) {
      return res.status(400).json({ success: false, message: `Collected amount must be ₹${Number(order.totalAmount || 0).toLocaleString("en-IN")}.` });
    }

    const paymentId = `cod:${order.orderNumber}`;
    const payment = await Payment.findOneAndUpdate(
      { paymentId },
      {
        paymentId,
        orderId: order.orderNumber,
        userId: String(order.user),
        amount: order.totalAmount,
        currency: "INR",
        status: "completed",
        paymentMethod: "cod",
        paymentProvider: "manual",
        transactionId: String(req.body?.reference || "").trim(),
        completedAt: new Date(),
        description: `COD collection for ${order.orderNumber}`,
        metadata: { collectedBy: String(req.user._id), collectedAt: new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    order.paymentStatus = "PAID";
    if (isInventoryAuthorityEnabled() && order.stockReservationStatus === "RESERVED") {
      await Promise.all(order.items.map((item) => inventoryService.commitInventory(item.product, item.quantity, { type: "ORDER", id: order.orderNumber })));
      order.stockReservationStatus = "COMMITTED";
    }
    order.paymentProvider = "manual";
    order.paymentTransactionId = payment.transactionId || "";
    order.paymentCollectedAt = new Date();
    order.paymentCollectedBy = req.user._id;
    await order.save();
    return res.json({ success: true, order, payment, message: "COD payment collected successfully." });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Unable to collect COD payment." });
  }
};
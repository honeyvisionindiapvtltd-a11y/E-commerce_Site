import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Shipment from "../models/Shipment.js";
import User from "../models/User.js";
import { generateOrderNumber, generateUniqueHoneyVisionTrackingNumber, generateTrackingNumber } from "../utils/tracking.js";
import {
  ORDER_STATUSES,
  ORDER_STATUS_VALUES,
  STATUS_TITLES,
  STATUS_DESCRIPTIONS,
} from "../constants/orderStatuses.js";
import {
  createDeliveryOtp,
  DELIVERY_OTP_TTL_MS,
  hashDeliveryOtp,
  updateOrderTracking as applyOrderTrackingUpdate,
} from "../services/orderTrackingService.js";
import { sendDeliveryOtpEmail } from "../services/deliveryOtpService.js";
import { sendDeliveryOtpSms } from "../services/deliveryOtpSmsService.js";

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const canExposeDevelopmentOtp = () => process.env.NODE_ENV === "development"
  && process.env.ALLOW_DEV_OTP_EXPOSURE === "true";

const buildOrderNumberQuery = (orderNumber) => {
  const raw = String(orderNumber ?? "").trim();

  if (!raw) return { orderNumber: raw };

  const normalized = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  return {
    $or: [
      { orderNumber: raw },
      { orderNumber: { $regex: escapeRegExp(normalized), $options: "i" } },
    ],
  };
};

// ==========================================
// ORDER STATUS CONSTANTS
// ==========================================

// ==========================================
// CREATE ORDER
// ==========================================

export const createOrder = async (req, res) => {
  const reservedItems = [];
  try {
    const {
      items,
      shippingAddress,
      address,
      paymentMethod = "COD",
      deliveryType = "courier",
      customerNote = "",
      userId,
    } = req.body;

    const resolvedShippingAddress = shippingAddress || address;
    const normalizedPaymentMethod = String(paymentMethod || "COD").trim().toUpperCase();
    const normalizedAddress = {
      name: resolvedShippingAddress?.name || resolvedShippingAddress?.fullName || "",
      phone: resolvedShippingAddress?.phone || "",
      addressLine1: resolvedShippingAddress?.addressLine1 || resolvedShippingAddress?.line1 || resolvedShippingAddress?.address || "",
      addressLine2: resolvedShippingAddress?.addressLine2 || resolvedShippingAddress?.line2 || "",
      city: resolvedShippingAddress?.city || "",
      state: resolvedShippingAddress?.state || resolvedShippingAddress?.region || "",
      postalCode: resolvedShippingAddress?.postalCode || resolvedShippingAddress?.pin || resolvedShippingAddress?.pincode || resolvedShippingAddress?.pinCode || "",
      country: resolvedShippingAddress?.country || "India",
    };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain products",
      });
    }

    if (!resolvedShippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    if (!normalizedAddress.state) {
      return res.status(400).json({
        success: false,
        message: "Shipping address state is required",
      });
    }

    let user = req.user;
    if (!user && userId) {
      user = await User.findById(userId);
    }

    if (!user) {
      const guestEmail = `guest-${Date.now()}@honeyvision.local`;
      const guestUser = new User({
        name: resolvedShippingAddress.name || "Guest Customer",
        email: guestEmail,
        phone: resolvedShippingAddress.phone || "+919999999999",
        interest: "AI Cameras",
        role: "customer",
        status: "Active",
        profile: {
          fullName: resolvedShippingAddress.name || "Guest Customer",
          email: guestEmail,
          phone: resolvedShippingAddress.phone || "+919999999999",
          country: resolvedShippingAddress.country || "India",
        },
      });
      // Call setPassword method to set passwordHash and passwordSalt
      guestUser.setPassword("guest-user-default-pass");
      console.log('After setPassword - passwordSalt:', guestUser.passwordSalt, 'passwordHash:', guestUser.passwordHash ? guestUser.passwordHash.substring(0, 10) + '...' : 'undefined');
      user = await guestUser.save();
      console.log('After save - user._id:', user._id);
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const productRef = item?.product?._id || item?.product?.id || item?.productId || item?.product;
      console.log('Looking for product with ref:', productRef, 'Type:', typeof productRef);
      const product = await Product.findById(productRef);
      console.log('Product found:', product ? product.name : 'NOT FOUND');

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${productRef || item.product || item.productId}`,
        });
      }

      const quantity = Number(item.quantity ?? item.qty ?? 1);

      if (!quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid product quantity",
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.name} does not have enough stock`,
        });
      }

      const itemTotal = (Number(product.price ?? item.price ?? 0) * quantity);
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name || item.name || "Product",
        sku: product.sku,
        thumbnail: product.thumbnail || item.image || "",
        quantity,
        price: Number(product.price ?? item.price ?? 0),
        image: product.thumbnail || item.image || "",
      });
    }

    const shippingFee = 0;
    const discount = 0;
    const tax = 0;
    const totalAmount = subtotal + shippingFee - discount + tax;

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: user._id,
      items: orderItems,
      subtotal,
      shippingCharge: shippingFee,
      discount,
      totalAmount,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: "PENDING",
      shippingAddress: {
        ...normalizedAddress,
        name: normalizedAddress.name || user.name,
        phone: normalizedAddress.phone || user.phone,
      },
      status: ORDER_STATUSES.ORDER_PLACED,
      trackingEvents: [
        {
          status: ORDER_STATUSES.ORDER_PLACED,
          title: STATUS_TITLES.ORDER_PLACED,
          description: STATUS_DESCRIPTIONS.ORDER_PLACED,
          location: resolvedShippingAddress.city || "",
          timestamp: new Date(),
          completed: true,
        },
      ],
    });

    // Reserve stock with a conditional update so concurrent checkouts cannot oversell.
    for (const item of orderItems) {
      const reservedProduct = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true },
      );

      if (!reservedProduct) {
        throw new Error(`${item.name} is no longer available in the requested quantity`);
      }

      reservedItems.push(item);
      await Product.updateOne(
        { _id: item.product },
        [{ $set: { stockStatus: { $cond: [
          { $eq: ["$stock", 0] }, "out_of_stock",
          { $cond: [{ $lte: ["$stock", "$lowStockThreshold"] }, "low_stock", "in_stock"] },
        ] } } }],
      );
    }

    const populatedOrder = await Order.findById(order._id)
      .populate("items.product", "name slug thumbnail price")
      .populate("user", "name email phone");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: populatedOrder,
    });
  } catch (error) {
    for (const item of reservedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      }).catch((rollbackError) => console.error("Stock rollback failed:", rollbackError));
    }
    console.error("createOrder error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// ==========================================
// CANCEL ORDER (CUSTOMER)
// ==========================================

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne(buildOrderNumberQuery(req.params.orderNumber));

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (String(order.user) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const cancellableStatuses = [
      ORDER_STATUSES.ORDER_PLACED,
      ORDER_STATUSES.PAYMENT_CONFIRMED,
      ORDER_STATUSES.PROCESSING,
      ORDER_STATUSES.PACKED,
    ];

    if (!cancellableStatuses.includes(order.status)) {
      return res.status(409).json({
        success: false,
        message: `Orders cannot be cancelled after ${order.status.toLowerCase().replaceAll("_", " ")}`,
      });
    }

    const cancelledOrder = await Order.findOneAndUpdate(
      { _id: order._id, status: { $in: cancellableStatuses }, stockRestoredAt: null },
      {
        $set: { status: ORDER_STATUSES.CANCELLED, cancelledAt: new Date(), stockRestoredAt: new Date() },
        $push: {
          trackingEvents: {
            status: ORDER_STATUSES.CANCELLED,
            title: STATUS_TITLES.CANCELLED,
            description: STATUS_DESCRIPTIONS.CANCELLED,
            timestamp: new Date(),
            completed: true,
            source: "SYSTEM",
          },
        },
      },
      { new: true },
    );

    if (!cancelledOrder) {
      return res.status(409).json({ success: false, message: "Order was already updated" });
    }

    await Promise.all(cancelledOrder.items.map((item) =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }),
    ));

    return res.json({ success: true, message: "Order cancelled successfully", order: cancelledOrder });
  } catch (error) {
    console.error("cancelOrder error:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel order", error: error.message });
  }
};

// ==========================================
// GET MY ORDERS
// ==========================================

export const getMyOrders = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const orders = await Order.find({ user: req.user._id })
      .populate("items.product", "name slug thumbnail price")
      .sort({ createdAt: -1 });

    for (const order of orders) {
      if (order.deliveryAgent && !order.trackingNumber) {
        order.trackingNumber = await generateUniqueHoneyVisionTrackingNumber(
          (candidate) => Order.exists({ trackingNumber: candidate, _id: { $ne: order._id } }),
        );
        await Order.updateOne(
          { _id: order._id },
          { $set: { trackingNumber: order.trackingNumber } },
        );
      }
    }

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("getMyOrders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// Helper: Create a test order for tracking demonstration
export const createTestOrder = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if a test order already exists for this user
    const existingTestOrder = await Order.findOne({
      user: req.user._id,
      orderNumber: /^TEST-/i,
    });

    if (existingTestOrder) {
      return res.status(200).json({
        success: true,
        message: "Test order already exists",
        order: existingTestOrder,
      });
    }

    const fallbackProduct = await Product.findOne({}).lean();

    if (!fallbackProduct) {
      return res.status(400).json({
        success: false,
        message: "No product exists in database to attach to the test order.",
      });
    }

    // Create a simple test order
    const testOrder = await Order.create({
      orderNumber: `TEST-${generateOrderNumber()}`,
      user: req.user._id,
      items: [
        {
          product: fallbackProduct._id,
          name: fallbackProduct.name || "Sample Product",
          quantity: 1,
          price: fallbackProduct.price || 5000,
          image: fallbackProduct.thumbnail || "/placeholder.png",
        },
      ],
      shippingAddress: {
        name: req.user.name || "Test User",
        phone: req.user.phone || "+919876543210",
        addressLine1: "123 Test Street",
        city: "Bhubaneswar",
        state: "Odisha",
        postalCode: "751001",
        country: "India",
      },
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      subtotal: 5000,
      shippingCharge: 0,
      discount: 0,
      totalAmount: 5000,
      status: ORDER_STATUSES.PROCESSING,
      trackingNumber: generateTrackingNumber(),
      courierName: "HoneyVision Delivery",
      trackingEvents: [
        {
          status: ORDER_STATUSES.ORDER_PLACED,
          title: STATUS_TITLES.ORDER_PLACED,
          description: STATUS_DESCRIPTIONS.ORDER_PLACED,
          location: "Bhubaneswar",
          timestamp: new Date(),
          completed: true,
        },
        {
          status: ORDER_STATUSES.PROCESSING,
          title: STATUS_TITLES.PROCESSING,
          description: STATUS_DESCRIPTIONS.PROCESSING,
          location: "Warehouse, Bhubaneswar",
          timestamp: new Date(Date.now() - 3600000),
          completed: true,
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Test order created for tracking demonstration",
      order: testOrder,
      trackingUrl: `/orders/${testOrder.orderNumber}/tracking`,
    });
  } catch (error) {
    console.error("createTestOrder error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create test order",
      error: error.message,
    });
  }
};

// ==========================================
// GET ORDER BY NUMBER
// ==========================================

export const getOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne(buildOrderNumberQuery(orderNumber))
      .populate("items.product", "name slug thumbnail price")
      .populate("user", "name email phone");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Customer can only access own order
    if (req.user && String(order.user._id) !== String(req.user._id)) {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("getOrderByNumber error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// ==========================================
// GET ORDER TRACKING
// ==========================================

export const getOrderTracking = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const lookupOrderNumber = orderNumber || req.query?.order || req.query?.orderNumber;

    if (!lookupOrderNumber) {
      return res.status(400).json({
        success: false,
        message: "Order number is required",
      });
    }

    let order = await Order.findOne(buildOrderNumberQuery(lookupOrderNumber))
      .populate("items.product", "name slug thumbnail price")
      .populate("user", "name email phone")
      .populate("deliveryAgent", "name phone email status");

    if (!order) {
      const normalizedOrderNumber = String(lookupOrderNumber).trim().toUpperCase();
      const isGeneratedDemoOrder = /^HV(?:[-_]?)[A-Z0-9]+$/i.test(normalizedOrderNumber);

      if (!isGeneratedDemoOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      order = {
        orderNumber: lookupOrderNumber,
        status: ORDER_STATUSES.PROCESSING,
        totalAmount: 0,
        shippingAddress: {
          name: "Demo Customer",
          phone: "+91 98765 43210",
          addressLine1: "Demo Address",
          city: "Bhubaneswar",
          state: "Odisha",
          postalCode: "751001",
          country: "India",
        },
        items: [
          {
            name: "Demo Product",
            quantity: 1,
            price: 0,
            image: "/placeholder.png",
          },
        ],
        trackingEvents: [
          {
            status: ORDER_STATUSES.ORDER_PLACED,
            title: STATUS_TITLES.ORDER_PLACED,
            description: STATUS_DESCRIPTIONS.ORDER_PLACED,
            location: "Bhubaneswar",
            timestamp: new Date(Date.now() - 3600000),
            completed: true,
          },
          {
            status: ORDER_STATUSES.PROCESSING,
            title: STATUS_TITLES.PROCESSING,
            description: STATUS_DESCRIPTIONS.PROCESSING,
            location: "Warehouse, Bhubaneswar",
            timestamp: new Date(),
            completed: true,
          },
        ],
        createdAt: new Date(),
      };
    }

    if (order.deliveryAgent && !order.trackingNumber) {
      order.trackingNumber = await generateUniqueHoneyVisionTrackingNumber(
        (candidate) => Order.exists({ trackingNumber: candidate, _id: { $ne: order._id } }),
      );
      await Order.updateOne(
        { _id: order._id },
        { $set: { trackingNumber: order.trackingNumber } },
      );
    }

    // Customer can only view own order tracking
    if (req.user && order.user && String(order.user._id) !== String(req.user._id)) {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    // Format tracking response
    const tracking = {
      orderNumber: order.orderNumber,
      status: order.status,
      trackingNumber: order.trackingNumber || "N/A",
      carrier: order.courierName || (order.deliveryAgent ? "HoneyVision Delivery" : "Not assigned"),
      carrierCode: order.courierCode || "",
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      shippedAt: order.trackingEvents?.find((e) => e.status === ORDER_STATUSES.SHIPPED)
        ?.timestamp,
      outForDeliveryAt: order.trackingEvents?.find((e) => e.status === ORDER_STATUSES.OUT_FOR_DELIVERY)
        ?.timestamp,
      deliveredAt: order.deliveredAt,
      currentLocation: {
        address: order.shippingAddress?.city || "",
        updatedAt: order.updatedAt || order.createdAt,
      },
      agent: order.deliveryAgent ? {
        id: order.deliveryAgent._id,
        name: order.deliveryAgent.name,
        phone: order.deliveryAgent.phone,
      } : null,
      deliveryAssignedAt: order.deliveryAssignedAt,
      deliveryStartedAt: order.deliveryStartedAt,
      deliveryLocation: Number.isFinite(order.deliveryLocation?.latitude) && Number.isFinite(order.deliveryLocation?.longitude)
        ? order.deliveryLocation
        : null,
      deliveryProof: order.deliveryProof?.capturedAt ? {
        notes: order.deliveryProof.notes || "",
        capturedAt: order.deliveryProof.capturedAt,
      } : null,
      failedDelivery: order.failedDeliveryAt ? {
        reason: order.failedDeliveryReason,
        failedAt: order.failedDeliveryAt,
      } : null,
    };

    res.status(200).json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber || null,
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress,
        items: order.items,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        deliveryAgent: order.deliveryAgent ? {
          id: order.deliveryAgent._id,
          name: order.deliveryAgent.name,
          phone: order.deliveryAgent.phone,
        } : null,
        deliveryProof: order.deliveryProof?.capturedAt ? {
          notes: order.deliveryProof.notes || "",
          capturedAt: order.deliveryProof.capturedAt,
        } : null,
        failedDelivery: order.failedDeliveryAt ? {
          reason: order.failedDeliveryReason,
          failedAt: order.failedDeliveryAt,
        } : null,
      },
      tracking,
      timeline: order.trackingEvents || [],
    });
  } catch (error) {
    console.error("getOrderTracking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tracking",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE ORDER STATUS (ADMIN ONLY)
// ==========================================

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { status } = req.body;

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    if (!status || !ORDER_STATUS_VALUES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${ORDER_STATUS_VALUES.join(", ")}`,
      });
    }

    const currentOrder = await Order.findOne(buildOrderNumberQuery(orderNumber)).select("status");
    if (!currentOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const result = await applyOrderTrackingUpdate({
      orderId: orderNumber,
      status,
      source: "ADMIN",
      metadata: { updatedBy: req.user._id },
    });

    const updatedOrder = await Order.findOne(buildOrderNumberQuery(orderNumber))
      .populate("items.product", "name slug thumbnail price")
      .populate("user", "name email phone");

    res.status(200).json({
      success: true,
      message: `Order status updated from ${currentOrder.status} to ${status}`,
      order: updatedOrder,
      tracking: {
        status: updatedOrder.status,
        trackingNumber: updatedOrder.trackingNumber,
        carrier: updatedOrder.courierName,
        estimatedDeliveryDate: updatedOrder.estimatedDeliveryDate,
      },
      event: result.trackingEvent,
    });
  } catch (error) {
    console.error("updateOrderStatus error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE TRACKING INFO (ADMIN ONLY)
// ==========================================

export const updateOrderTracking = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { trackingNumber, carrier, carrierCode, estimatedDeliveryDate } = req.body;

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const order = await Order.findOne(buildOrderNumberQuery(orderNumber)).populate("user", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    if (carrier) {
      order.courierName = carrier;
    }
    if (carrierCode) {
      order.courierCode = carrierCode;
    }
    if (estimatedDeliveryDate) {
      order.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
    }

    await order.save();

    const updatedOrder = await Order.findOne(buildOrderNumberQuery(orderNumber))
      .populate("items.product", "name slug thumbnail price")
      .populate("user", "name email phone");

    res.status(200).json({
      success: true,
      message: "Tracking information updated",
      order: updatedOrder,
      tracking: {
        trackingNumber: updatedOrder.trackingNumber,
        carrier: updatedOrder.courierName,
        carrierCode: updatedOrder.courierCode,
        estimatedDeliveryDate: updatedOrder.estimatedDeliveryDate,
      },
    });
  } catch (error) {
    console.error("updateOrderTracking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update tracking info",
      error: error.message,
    });
  }
};

// ==========================================
// ADD TRACKING EVENT (ADMIN ONLY)
// ==========================================

export const addTrackingEvent = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { status, title, description, location, metadata } = req.body;

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    if (!status || !title || !ORDER_STATUS_VALUES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status and title are required. Allowed statuses: ${ORDER_STATUS_VALUES.join(", ")}`,
      });
    }

    const order = await Order.findOne(buildOrderNumberQuery(orderNumber));

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const result = await applyOrderTrackingUpdate({
      orderId: orderNumber,
      status,
      title,
      description,
      location,
      metadata: { ...(metadata || {}), updatedBy: req.user._id },
      source: "ADMIN",
    });

    const updatedOrder = await Order.findOne(buildOrderNumberQuery(orderNumber))
      .populate("items.product", "name slug thumbnail price")
      .populate("user", "name email phone");

    res.status(201).json({
      success: true,
      message: "Tracking event added",
      order: updatedOrder,
      event: result.trackingEvent,
    });
  } catch (error) {
    console.error("addTrackingEvent error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add tracking event",
      error: error.message,
    });
  }
};

// ==========================================
// ASSIGN DELIVERY AGENT (ADMIN ONLY)
// ==========================================

export const assignDeliveryAgent = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { agentId } = req.body;

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: "Agent ID is required",
      });
    }

    const order = await Order.findOne(buildOrderNumberQuery(orderNumber)).populate("user", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      ["DELIVERED", "CANCELLED", "RETURNED"].includes(order.status)
      || (order.status === "OUT_FOR_DELIVERY" && order.deliveryAgent)
    ) {
      return res.status(409).json({
        success: false,
        message: "Delivery agent cannot be changed after delivery starts or the order closes",
      });
    }

    const agent = await User.findOne({
      _id: agentId,
      role: "delivery_agent",
      status: "Active",
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Delivery agent not found",
      });
    }

    const recoveryOtp = order.status === "OUT_FOR_DELIVERY" && !order.deliveryAgent
      ? createDeliveryOtp()
      : null;

    if (recoveryOtp) {
      const recoveryOtpExpiresAt = new Date(Date.now() + DELIVERY_OTP_TTL_MS);
      await sendDeliveryOtpSms({
        phone: order.shippingAddress?.phone,
        customerName: order.shippingAddress?.name || order.user?.name,
        orderNumber: order.orderNumber,
        otp: recoveryOtp,
        expiresAt: recoveryOtpExpiresAt,
      });
      try {
        await sendDeliveryOtpEmail({
          email: order.user?.email,
          customerName: order.user?.name,
          orderNumber: order.orderNumber,
          otp: recoveryOtp,
          expiresAt: recoveryOtpExpiresAt,
        });
      } catch (emailError) {
        console.warn("Delivery OTP email skipped:", emailError.message);
      }
    }

    order.deliveryAgent = agent._id;
    order.deliveryAssignedAt = new Date();
    if (recoveryOtp) {
      order.deliveryOtpHash = hashDeliveryOtp(recoveryOtp);
      order.deliveryOtpExpiresAt = new Date(Date.now() + DELIVERY_OTP_TTL_MS);
      order.deliveryOtpVerifiedAt = null;
      order.deliveryOtpAttempts = 0;
    }
    if (!order.trackingNumber) {
      order.trackingNumber = await generateUniqueHoneyVisionTrackingNumber(
        (candidate) => Order.exists({ trackingNumber: candidate, _id: { $ne: order._id } }),
      );
    }
    await order.save();

    const result = await applyOrderTrackingUpdate({
      orderId: order.orderNumber,
      status: order.status,
      title: "Delivery Agent Assigned",
      description: `Delivery agent ${agent.name} has been assigned to your order.`,
      location: order.shippingAddress?.city || "",
      source: "ADMIN",
      allowTransition: false,
      metadata: {
        agentId: agent._id,
        agentName: agent.name,
        agentPhone: agent.phone,
        updatedBy: req.user._id,
      },
      deliveryAgent: {
        id: agent._id,
        name: agent.name,
        phone: agent.phone,
      },
    });

    const updatedOrder = await Order.findOne(buildOrderNumberQuery(orderNumber))
      .populate("items.product", "name slug thumbnail price")
      .populate("user", "name email phone");

    res.status(200).json({
      success: true,
      message: "Delivery agent assigned",
      order: updatedOrder,
      agent: {
        id: agent._id,
        name: agent.name,
        phone: agent.phone,
      },
      event: result.trackingEvent,
      ...(canExposeDevelopmentOtp() && recoveryOtp ? { developmentOtp: recoveryOtp } : {}),
    });
  } catch (error) {
    console.error("assignDeliveryAgent error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign delivery agent",
      error: error.message,
    });
  }
};

// ==========================================
// ASSIGN SHIPMENT (LEGACY - for compatibility)
// ==========================================

export const assignShipment = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { trackingNumber, carrier, estimatedDeliveryDate } = req.body;

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    // Use updateOrderTracking logic
    return updateOrderTracking(req, res);
  } catch (error) {
    console.error("assignShipment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign shipment",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORT STATUS CONSTANTS
// ==========================================

export { ORDER_STATUSES, STATUS_TITLES, STATUS_DESCRIPTIONS };

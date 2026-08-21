import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Shipment from "../models/Shipment.js";
import User from "../models/User.js";
import { generateOrderNumber, generateTrackingNumber } from "../utils/tracking.js";

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

const ORDER_STATUSES = {
  ORDER_PLACED: "ORDER_PLACED",
  PAYMENT_CONFIRMED: "PAYMENT_CONFIRMED",
  PROCESSING: "PROCESSING",
  PACKED: "PACKED",
  SHIPPED: "SHIPPED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  RETURN_REQUESTED: "RETURN_REQUESTED",
  RETURNED: "RETURNED",
};

const STATUS_TITLES = {
  ORDER_PLACED: "Order Placed",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Order Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Order Cancelled",
  RETURN_REQUESTED: "Return Requested",
  RETURNED: "Returned",
};

const STATUS_DESCRIPTIONS = {
  ORDER_PLACED: "Your order has been placed successfully.",
  PAYMENT_CONFIRMED: "Payment has been confirmed.",
  PROCESSING: "Your order is being processed.",
  PACKED: "Your order has been packed and is ready for shipment.",
  SHIPPED: "Your order has been shipped and is on its way.",
  OUT_FOR_DELIVERY: "Your order is out for delivery.",
  DELIVERED: "Your order has been delivered successfully.",
  CANCELLED: "Your order has been cancelled.",
  RETURN_REQUESTED: "Return has been requested.",
  RETURNED: "Your order has been returned.",
};

// ==========================================
// CREATE ORDER
// ==========================================

export const createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      address,
      paymentMethod = "cod",
      deliveryType = "courier",
      customerNote = "",
      userId,
    } = req.body;

    const resolvedShippingAddress = shippingAddress || address;

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
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "PENDING" : "PENDING",
      shippingAddress: {
        name: resolvedShippingAddress.name || user.name,
        phone: resolvedShippingAddress.phone || user.phone,
        addressLine1: resolvedShippingAddress.addressLine1 || resolvedShippingAddress.line1 || resolvedShippingAddress.address || "",
        addressLine2: resolvedShippingAddress.addressLine2 || resolvedShippingAddress.line2 || "",
        city: resolvedShippingAddress.city || "",
        state: resolvedShippingAddress.state || "",
        postalCode: resolvedShippingAddress.postalCode || resolvedShippingAddress.pin || resolvedShippingAddress.pincode || "",
        country: resolvedShippingAddress.country || "India",
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

    // Reduce product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
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
    console.error("createOrder error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
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
      .populate("user", "name email phone");

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
      carrier: order.courierName || "Not assigned",
      carrierCode: order.courierCode || "",
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      shippedAt: order.trackingEvents?.find((e) => e.status === ORDER_STATUSES.SHIPPED)
        ?.timestamp,
      outForDeliveryAt: order.trackingEvents?.find((e) => e.status === ORDER_STATUSES.OUT_FOR_DELIVERY)
        ?.timestamp,
      deliveredAt: order.deliveredAt,
      currentLocation: {
        address: order.shippingAddress?.city || "",
        updatedAt: new Date(),
      },
    };

    res.status(200).json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress,
        items: order.items,
        createdAt: order.createdAt,
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

    if (!status || !Object.values(ORDER_STATUSES).includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${Object.values(ORDER_STATUSES).join(", ")}`,
      });
    }

    const order = await Order.findOne(buildOrderNumberQuery(orderNumber));

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const previousStatus = order.status;
    order.status = status;

    // Auto-create tracking event when status changes
    const trackingEvent = {
      status,
      title: STATUS_TITLES[status] || status,
      description: STATUS_DESCRIPTIONS[status] || `Status changed to ${status}`,
      location: order.shippingAddress?.city || "",
      timestamp: new Date(),
      completed: true,
      updatedBy: req.user._id,
    };

    order.trackingEvents = order.trackingEvents || [];
    order.trackingEvents.push(trackingEvent);

    // Update delivery timestamps
    if (status === ORDER_STATUSES.SHIPPED) {
      order.shippedAt = new Date();
    } else if (status === ORDER_STATUSES.OUT_FOR_DELIVERY) {
      order.outForDeliveryAt = new Date();
    } else if (status === ORDER_STATUSES.DELIVERED) {
      order.deliveredAt = new Date();
    }

    await order.save();

    const updatedOrder = await Order.findOne(buildOrderNumberQuery(orderNumber))
      .populate("items.product", "name slug thumbnail price")
      .populate("user", "name email phone");

    res.status(200).json({
      success: true,
      message: `Order status updated from ${previousStatus} to ${status}`,
      order: updatedOrder,
      tracking: {
        status: updatedOrder.status,
        trackingNumber: updatedOrder.trackingNumber,
        carrier: updatedOrder.courierName,
        estimatedDeliveryDate: updatedOrder.estimatedDeliveryDate,
      },
      event: trackingEvent,
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

    const order = await Order.findOne(buildOrderNumberQuery(orderNumber));

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

    if (!status || !title) {
      return res.status(400).json({
        success: false,
        message: "Status and title are required",
      });
    }

    const order = await Order.findOne(buildOrderNumberQuery(orderNumber));

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const trackingEvent = {
      status,
      title,
      description: description || "",
      location: location || order.shippingAddress?.city || "",
      timestamp: new Date(),
      completed: true,
      updatedBy: req.user._id,
      metadata: metadata || {},
    };

    order.trackingEvents = order.trackingEvents || [];
    order.trackingEvents.push(trackingEvent);

    await order.save();

    const updatedOrder = await Order.findOne(buildOrderNumberQuery(orderNumber))
      .populate("items.product", "name slug thumbnail price")
      .populate("user", "name email phone");

    res.status(201).json({
      success: true,
      message: "Tracking event added",
      order: updatedOrder,
      event: trackingEvent,
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

    const order = await Order.findOne(buildOrderNumberQuery(orderNumber));

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify agent exists
    const agent = await User.findById(agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Delivery agent not found",
      });
    }

    // Store agent info (extend Order model if needed)
    // For now, store in trackingEvents metadata
    const trackingEvent = {
      status: "AGENT_ASSIGNED",
      title: "Delivery Agent Assigned",
      description: `Delivery agent ${agent.name} has been assigned to your order.`,
      location: order.shippingAddress?.city || "",
      timestamp: new Date(),
      completed: true,
      updatedBy: req.user._id,
      metadata: {
        agentId: agent._id,
        agentName: agent.name,
        agentPhone: agent.phone,
      },
    };

    order.trackingEvents = order.trackingEvents || [];
    order.trackingEvents.push(trackingEvent);

    // Optional: add deliveryAgent field to Order model
    // order.deliveryAgent = agentId;

    await order.save();

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
      event: trackingEvent,
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

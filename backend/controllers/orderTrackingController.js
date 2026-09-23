import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Shipment from "../models/Shipment.js";
import User from "../models/User.js";
import mongoose from "mongoose";
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
import { sendOTP } from "../services/twoFactorService.js";
import { checkDeliveryServiceability } from "../services/deliveryServiceabilityService.js";
import { canCustomerCancelOrder, getOrderActions } from "../services/orderLifecycleService.js";
import { confirmedOrderFilter } from "../utils/orderQueries.js";
import { notifyAdmins, notifyCustomer } from "../services/notificationService.js";
import inventoryService, { assertInventoryAuthorityReady, isInventoryAuthorityEnabled } from "../services/inventoryService.js";

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const canExposeDevelopmentOtp = () => process.env.NODE_ENV === "development"
  && process.env.ALLOW_DEV_OTP_EXPOSURE === "true";

const coordinateValue = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const hasValidCoordinatePair = (latitude, longitude) => (
  latitude !== null
  && longitude !== null
  && latitude >= -90
  && latitude <= 90
  && longitude >= -180
  && longitude <= 180
  && !(latitude === 0 && longitude === 0)
);

const findOrderProduct = async (productRef) => {
  const normalizedRef = String(productRef || "").trim();
  if (!normalizedRef) return null;
  if (mongoose.isValidObjectId(normalizedRef)) return Product.findById(normalizedRef);
  return Product.findOne({ $or: [{ slug: normalizedRef }, { sku: normalizedRef }] });
};

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
  let reservationReferenceId = "";
  try {
    await assertInventoryAuthorityReady();
    const {
      items,
      shippingAddress,
      address,
      paymentMethod = "COD",
      deliveryType = "courier",
      customerNote = "",
      clientRequestId = "",
    } = req.body;

    const normalizedClientRequestId = String(clientRequestId || "").trim().slice(0, 120);
    if (normalizedClientRequestId && req.user?._id) {
      const existingRequest = await Order.findOne({ user: req.user._id, clientRequestId: normalizedClientRequestId })
        .populate("items.product", "name slug thumbnail price");
      if (existingRequest) {
        return res.status(200).json({ success: true, message: "Order request already processed", order: existingRequest, idempotent: true });
      }
    }

    const resolvedShippingAddress = shippingAddress || address;
    const normalizedPaymentMethod = String(paymentMethod || "COD").trim().toUpperCase();
    const isCodOrder = normalizedPaymentMethod === "COD";
    const normalizedAddress = {
      name: resolvedShippingAddress?.name || resolvedShippingAddress?.fullName || "",
      phone: resolvedShippingAddress?.phone || "",
      addressLine1: resolvedShippingAddress?.addressLine1 || resolvedShippingAddress?.line1 || resolvedShippingAddress?.address || "",
      addressLine2: resolvedShippingAddress?.addressLine2 || resolvedShippingAddress?.line2 || "",
      landmark: resolvedShippingAddress?.landmark || "",
      label: resolvedShippingAddress?.label || resolvedShippingAddress?.addressType || "Home",
      deliveryInstructions: resolvedShippingAddress?.deliveryInstructions || "",
      addressType: String(resolvedShippingAddress?.addressType || resolvedShippingAddress?.type || "HOME").toUpperCase(),
      district: resolvedShippingAddress?.district || "",
      city: resolvedShippingAddress?.city || "",
      state: resolvedShippingAddress?.state || resolvedShippingAddress?.region || "",
      postalCode: resolvedShippingAddress?.postalCode || resolvedShippingAddress?.pin || resolvedShippingAddress?.pincode || resolvedShippingAddress?.pinCode || "",
      pincode: resolvedShippingAddress?.pincode || resolvedShippingAddress?.postalCode || resolvedShippingAddress?.pin || resolvedShippingAddress?.pinCode || "",
      country: resolvedShippingAddress?.country ?? "India",
      latitude: coordinateValue(resolvedShippingAddress?.latitude),
      longitude: coordinateValue(resolvedShippingAddress?.longitude),
      locationResolved: false,
      googlePlaceId: String(resolvedShippingAddress?.googlePlaceId || "").trim(),
      formattedAddress: String(resolvedShippingAddress?.formattedAddress || "").trim(),
    };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain products",
      });
    }

    if (!normalizedAddress.name || !normalizedAddress.phone || !normalizedAddress.addressLine1 || !normalizedAddress.city || !normalizedAddress.state || !/^\d{6}$/.test(String(normalizedAddress.postalCode || ""))) {
      return res.status(400).json({ success: false, message: "A complete valid shipping address is required." });
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

    const serviceability = await checkDeliveryServiceability({
      country: normalizedAddress.country,
      state: normalizedAddress.state,
      city: normalizedAddress.city,
      pincode: normalizedAddress.postalCode,
    });
    if (!serviceability.valid || !serviceability.serviceable) {
      return res.status(400).json({
        success: false,
        message: serviceability.valid
          ? "Delivery is currently not available at the selected address."
          : serviceability.validationError,
      });
    }

    const hasLatitude = normalizedAddress.latitude !== null;
    const hasLongitude = normalizedAddress.longitude !== null;
    if (hasLatitude !== hasLongitude || (hasLatitude && !hasValidCoordinatePair(normalizedAddress.latitude, normalizedAddress.longitude))) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude must both be valid when provided.",
      });
    }
    normalizedAddress.locationResolved = hasValidCoordinatePair(normalizedAddress.latitude, normalizedAddress.longitude);

    let user = req.user;

    if (!user) {
      const guestEmail = `guest-${Date.now()}@honeyvision.local`;
      const guestUser = new User({
        name: resolvedShippingAddress.name || "Guest Customer",
        email: guestEmail,
        phone: resolvedShippingAddress.phone || "9777941117",
        interest: "AI Cameras",
        role: "customer",
        status: "Active",
        profile: {
          fullName: resolvedShippingAddress.name || "Guest Customer",
          email: guestEmail,
          phone: resolvedShippingAddress.phone || "9777941117",
          country: resolvedShippingAddress.country || "India",
        },
      });
      // Call setPassword method to set passwordHash and passwordSalt
      guestUser.setPassword("guest-user-default-pass");
      console.log('After setPassword - passwordSalt:', guestUser.passwordSalt, 'passwordHash:', guestUser.passwordHash ? guestUser.passwordHash.substring(0, 10) + '...' : 'undefined');
      user = await guestUser.save();
      console.log('After save - user._id:', user._id);
    }

    if (req.body?.orderId) {
      const existingOrder = await Order.findOne({ orderNumber: String(req.body.orderId), user: user._id });
      if (existingOrder) {
        if (existingOrder.orderLifecycleStatus === "CONFIRMED" || existingOrder.paymentStatus === "PAID") {
          return res.status(409).json({ success: false, message: "Order has already been confirmed." });
        }
        existingOrder.paymentMethod = normalizedPaymentMethod;
        existingOrder.paymentStatus = "PENDING";
        existingOrder.orderLifecycleStatus = "PAYMENT_PENDING";
        if (isCodOrder) {
          existingOrder.orderLifecycleStatus = "CONFIRMED";
        }
        await existingOrder.save();
        const existingPopulatedOrder = await Order.findById(existingOrder._id)
          .populate("items.product", "name slug thumbnail price")
          .populate("user", "name email phone");
        return res.status(200).json({ success: true, message: "Existing payment order reused", order: existingPopulatedOrder });
      }
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const productRef = item?.product?._id || item?.product?.id || item?.productId || item?.product;
      console.log('Looking for product with ref:', productRef, 'Type:', typeof productRef);
      const product = await findOrderProduct(productRef);
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

      if (!isInventoryAuthorityEnabled() && product.stock < quantity) {
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
        unitPrice: Number(product.price ?? item.price ?? 0),
        discount: 0,
        tax: 0,
        finalPrice: Number(product.price ?? item.price ?? 0) * quantity,
        image: product.thumbnail || item.image || "",
      });
    }

    const shippingFee = Number(serviceability.deliveryCharge || 0);
    const discount = 0;
    const tax = 0;
    const totalAmount = subtotal + shippingFee - discount + tax;

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      ...(normalizedClientRequestId ? { clientRequestId: normalizedClientRequestId } : {}),
      user: user._id,
      items: orderItems,
      subtotal,
      shippingCharge: shippingFee,
      discount,
      totalAmount,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: "PENDING",
      orderLifecycleStatus: isCodOrder ? "CONFIRMED" : "PAYMENT_PENDING",
      shippingAddress: {
        ...normalizedAddress,
        fullName: normalizedAddress.name,
        locationResolved: Boolean(normalizedAddress.locationResolved && normalizedAddress.latitude !== undefined && normalizedAddress.longitude !== undefined),
        name: normalizedAddress.name || user.name,
        phone: normalizedAddress.phone || user.phone,
        label: normalizedAddress.label || "Home",
        addressType: ["HOME", "WORK", "OTHER"].includes(normalizedAddress.addressType) ? normalizedAddress.addressType : "HOME",
        deliveryInstructions: normalizedAddress.deliveryInstructions || "",
      },
      deliveryDetails: {
        serviceable: true,
        country: serviceability.location.country,
        state: serviceability.location.state,
        city: serviceability.location.city,
        pincode: normalizedAddress.postalCode,
        deliveryCharge: Number(serviceability.deliveryCharge || 0),
        estimatedDeliveryDays: serviceability.estimatedDeliveryDays || { min: 1, max: 2 },
      },
      stockReservationStatus: "NONE",
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
    reservationReferenceId = order.orderNumber;
    console.info(`[ORDER_CREATED] order=${order.orderNumber} lifecycle=${order.orderLifecycleStatus} paymentMethod=${order.paymentMethod}`);
    const notification = isCodOrder
      ? {
          type: "ORDER_PLACED",
          title: "COD order placed successfully",
          message: `Your COD order ${order.orderNumber} has been placed successfully.`,
          eventKey: `order:${order.orderNumber}:cod-placed`,
        }
      : {
          type: "PAYMENT_PENDING",
          title: "Payment pending",
          message: `Complete payment for order ${order.orderNumber} to confirm it.`,
          eventKey: `order:${order.orderNumber}:payment-pending`,
        };
    void notifyCustomer({ ...notification, recipient: order.user, orderId: order._id, orderNumber: order.orderNumber });
    void notifyAdmins({ ...notification, orderId: order._id, orderNumber: order.orderNumber });

    // Reserve stock with a conditional update so concurrent checkouts cannot oversell.
    for (const item of orderItems) {
      if (isInventoryAuthorityEnabled()) {
        await inventoryService.reserveInventory(item.product, item.quantity, { type: "ORDER", id: order.orderNumber });
      } else {
        const reservedProduct = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true },
        );

        if (!reservedProduct) {
          throw new Error(`${item.name} is no longer available in the requested quantity`);
        }

        const stockStatus = reservedProduct.stock <= 0
          ? "out_of_stock"
          : reservedProduct.stock <= reservedProduct.lowStockThreshold
            ? "low_stock"
            : "in_stock";
        await Product.updateOne(
          { _id: item.product },
          { $set: { stockStatus } },
        );
      }
      reservedItems.push(item);
    }
    order.stockReservationStatus = "RESERVED";
    await order.save();

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
      if (isInventoryAuthorityEnabled()) {
        await inventoryService.releaseInventory(item.product, item.quantity, { type: "ORDER", id: reservationReferenceId || normalizedClientRequestId }).catch((rollbackError) => console.error("Inventory rollback failed:", rollbackError));
      } else {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        }).catch((rollbackError) => console.error("Stock rollback failed:", rollbackError));
      }
    }

    if (error?.code === 11000 && normalizedClientRequestId && user?._id) {
      const existingOrder = await Order.findOne({
        user: user._id,
        clientRequestId: normalizedClientRequestId,
      })
        .populate("items.product", "name slug thumbnail price")
        .populate("user", "name email phone");

      if (existingOrder) {
        return res.status(200).json({
          success: true,
          message: "Order request already processed",
          order: existingOrder,
          idempotent: true,
        });
      }
    }

    console.error("createOrder error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
};

// ==========================================
// CANCEL ORDER (CUSTOMER)
// ==========================================

export const cancelOrder = async (req, res) => {
  try {
    const cancellationReason = String(req.body?.reason || "").trim();
    const order = await Order.findOne(buildOrderNumberQuery(req.params.orderNumber));

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (String(order.user) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const cancellation = canCustomerCancelOrder(order);
    if (!cancellation.allowed) {
      return res.status(409).json({
        success: false,
        message: cancellation.reason,
      });
    }

    const cancellationResult = await applyOrderTrackingUpdate({
      orderId: order.orderNumber,
      status: ORDER_STATUSES.CANCELLED,
      source: "SYSTEM",
      cancellationReason,
    });

    return res.json({ success: true, message: "Order cancelled successfully", order: cancellationResult.order });
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

    const orders = await Order.find(confirmedOrderFilter({ user: req.user._id }))
      .populate("items.product", "name slug thumbnail price installationAvailable")
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
      orders: await Promise.all(orders.map(async (order) => ({
        ...order.toObject(),
        actions: await getOrderActions(order),
      }))),
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
        phone: req.user.phone || "9777941117",
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

    if (req.user?.role !== "admin" && order.orderLifecycleStatus !== "CONFIRMED" && order.paymentStatus !== "PAID") {
      return res.status(404).json({ success: false, message: "Order not found" });
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
      actions: await getOrderActions(order),
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
          phone: "9777941117",
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

    if (req.user?.role !== "admin" && order.orderLifecycleStatus !== "CONFIRMED" && order.paymentStatus !== "PAID") {
      return res.status(404).json({ success: false, message: "Order not found" });
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

    if (order.deliveryAgent && !order.trackingNumber) {
      order.trackingNumber = await generateUniqueHoneyVisionTrackingNumber(
        (candidate) => Order.exists({ trackingNumber: candidate, _id: { $ne: order._id } }),
      );
      await Order.updateOne(
        { _id: order._id },
        { $set: { trackingNumber: order.trackingNumber } },
      );
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
        actions: await getOrderActions(order),
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

export const updateOrderDestination = async (req, res) => {
  try {
    const latitude = Number(req.body?.latitude);
    const longitude = Number(req.body?.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 || (latitude === 0 && longitude === 0)) {
      return res.status(400).json({ success: false, message: "Valid destination coordinates are required" });
    }

    const order = await Order.findOne(buildOrderNumberQuery(req.params.orderNumber));
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (String(order.user) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    order.shippingAddress = {
      ...order.shippingAddress.toObject(),
      latitude,
      longitude,
      locationResolved: true,
    };
    await order.save();
    return res.json({ success: true, shippingAddress: order.shippingAddress });
  } catch (error) {
    console.error("updateOrderDestination error:", error);
    return res.status(500).json({ success: false, message: "Failed to save destination coordinates" });
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

    if (order.orderLifecycleStatus !== "CONFIRMED" && order.paymentStatus !== "PAID" && order.paymentMethod !== "COD") {
      return res.status(409).json({ success: false, message: "Payment must be confirmed before delivery assignment." });
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
      await sendOTP({ phone: order.shippingAddress?.phone, otp: recoveryOtp });
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
    if (error.isSmsError) {
      return res.status(502).json({
        success: false,
        message: "Unable to send delivery OTP SMS. Please try again later.",
      });
    }
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

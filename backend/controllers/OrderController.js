import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Shipment from "../models/Shipment.js";
import {
  generateOrderNumber,
  generateTrackingNumber,
} from "../utils/tracking.js";
import { ORDER_STATUSES } from "../constants/orderStatuses.js";

// ==========================================
// CREATE ORDER
// ==========================================

export const createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod = "cod",
      deliveryType = "courier",
      customerNote = "",
    } = req.body;

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain products",
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    const normalizedShippingAddress = {
      name: shippingAddress.name || shippingAddress.fullName,
      phone: shippingAddress.phone,
      addressLine1: shippingAddress.addressLine1 || shippingAddress.line1 || shippingAddress.address,
      addressLine2: shippingAddress.addressLine2 || shippingAddress.line2 || "",
      landmark: shippingAddress.landmark || "",
      district: shippingAddress.district || "",
      city: shippingAddress.city,
      state: shippingAddress.state,
      postalCode: shippingAddress.postalCode || shippingAddress.pincode || shippingAddress.pinCode || shippingAddress.pin,
      pincode: shippingAddress.pincode || shippingAddress.postalCode || shippingAddress.pinCode || shippingAddress.pin,
      country: shippingAddress.country || "India",
      latitude: Number.isFinite(Number(shippingAddress.latitude)) ? Number(shippingAddress.latitude) : undefined,
      longitude: Number.isFinite(Number(shippingAddress.longitude)) ? Number(shippingAddress.longitude) : undefined,
    };

    if (!normalizedShippingAddress.name || !normalizedShippingAddress.addressLine1 || !normalizedShippingAddress.city || !normalizedShippingAddress.state || !/^\d{6}$/.test(String(normalizedShippingAddress.postalCode || ""))) {
      return res.status(400).json({ success: false, message: "A complete valid shipping address is required." });
    }

    let subtotal = 0;

    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(
        item.product
      );

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      const quantity = Number(item.quantity);

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

      const itemTotal =
        product.price * quantity;

      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        thumbnail: product.thumbnail,
        quantity,
        price: product.price,
        total: itemTotal,
      });
    }

    const shippingFee = 0;
    const discount = 0;

    const tax = 0;

    const totalAmount =
      subtotal +
      shippingFee -
      discount +
      tax;

    const order = await Order.create({
      orderNumber: generateOrderNumber(),

      user: req.user._id,

      items: orderItems,

      subtotal,

      shippingFee,

      discount,

      tax,

      totalAmount,

      paymentMethod,

      paymentStatus:
        paymentMethod === "cod"
          ? "pending"
          : "pending",

      shippingAddress: normalizedShippingAddress,

      deliveryType,

      customerNote,

      status: ORDER_STATUSES.ORDER_PLACED,
    });

    // ==========================================
    // REDUCE STOCK
    // ==========================================

    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            stock: -item.quantity,
          },
        }
      );
    }

    // ==========================================
    // CREATE SHIPMENT
    // ==========================================

    const shipment =
      await Shipment.create({
        order: order._id,

        trackingNumber:
          generateTrackingNumber(),

        deliveryType,

        status: ORDER_STATUSES.ORDER_PLACED,

        trackingEvents: [
          {
            status: ORDER_STATUSES.ORDER_PLACED,
            message:
              "Your order has been placed successfully.",
            location: "",
            timestamp: new Date(),
          },
        ],
      });

    order.shipment = shipment._id;

    await order.save();

    const populatedOrder =
      await Order.findById(order._id)
        .populate("items.product")
        .populate("shipment");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error(
      "createOrder:",
      error
    );

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

export const getMyOrders = async (
  req,
  res
) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const orders =
      await Order.find({
        user: req.user._id,
      })
        .populate(
          "items.product",
          "name slug thumbnail price"
        )
        .populate("shipment")
        .sort({
          createdAt: -1,
        });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(
      "getMyOrders:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE ORDER
// ==========================================

export const getOrderById = async (
  req,
  res
) => {
  try {
    const order =
      await Order.findById(
        req.params.id
      )
        .populate(
          "items.product",
          "name slug thumbnail price"
        )
        .populate("shipment");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Customer can only access own order
    if (
      req.user &&
      String(order.user) !==
        String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "getOrderById:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};
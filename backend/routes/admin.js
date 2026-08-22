import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import {
  ORDER_STATUS_VALUES,
} from '../constants/orderStatuses.js';
import { emitDeliveryUpdate } from '../services/realtimeService.js';
import { emitAdminNotification } from '../services/realtimeService.js';
import { updateOrderTracking } from '../services/orderTrackingService.js';
import inventoryService from '../services/inventoryService.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

router.use(protect, requireAdmin);

/**
 * GET /api/admin/products
 * Get the complete product catalog, including inactive records.
 */
router.get('/products', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 100));
    const total = await Product.countDocuments();
    const products = await Product.find()
      .populate('category', 'name slug parentCategory')
      .populate('subCategory', 'name slug parentCategory')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      count: products.length,
      totalProducts: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit) || 1,
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Get order statistics
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments({ isActive: { $ne: false } });
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['ORDER_PLACED', 'PAYMENT_CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'] },
    });
    const deliveredOrders = await Order.countDocuments({
      status: 'DELIVERED',
    });
    const cancelledOrders = await Order.countDocuments({
      status: 'CANCELLED',
    });

    // Get revenue
    const revenue = await Order.aggregate([
      {
        $match: { status: 'DELIVERED' },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get inventory stats
    const inventoryStats = await inventoryService.getInventoryStats();

    const dashboard = {
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      customers: { total: totalCustomers },
      products: { total: totalProducts },
      revenue: revenue[0] || { totalRevenue: 0, count: 0 },
      inventory: inventoryStats,
      timestamp: new Date(),
    };

    res.json({ success: true, dashboard });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/orders
 * Get all orders with filtering
 */
router.get('/orders', async (req, res) => {
  try {
    const { status, paymentStatus, startDate, endDate, limit = 50, skip = 0 } = req.query;

    const filter = {};
    if (status) {
      if (!ORDER_STATUS_VALUES.includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid order status' });
      }
      filter.status = status;
    }
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .populate('deliveryAgent', 'name phone email status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await Order.countDocuments(filter);

    res.json({ success: true, orders, total });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/admin/orders/:orderId/status
 * Update order status
 */
router.put('/orders/:orderId/status', protect, requireAdmin, async (req, res) => {
  try {
    const { newStatus, description, location } = req.body;

    if (!ORDER_STATUS_VALUES.includes(newStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid order status' });
    }

    const result = await updateOrderTracking({
      orderId: req.params.orderId,
      status: newStatus,
      description,
      location,
      source: 'ADMIN',
    });

    res.json({ success: true, order: result.order, event: result.trackingEvent });
  } catch (error) {
    const statusCode = error.message === 'Order not found' ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/admin/orders/:orderId/delivery
 * Update delivery information
 */
router.put('/orders/:orderId/delivery', protect, requireAdmin, async (req, res) => {
  try {
    const { expectedDeliveryDate, carrier, trackingNumber, location } = req.body;

    const order = await Order.findOne({ orderNumber: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (expectedDeliveryDate) order.estimatedDeliveryDate = new Date(expectedDeliveryDate);
    if (carrier) order.courierName = carrier;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    await order.save();

    let trackingEvent = null;
    if (location) {
      const result = await updateOrderTracking({
        orderId: order.orderNumber,
        status: order.status,
        title: 'Delivery Location Updated',
        description: `Delivery location updated: ${location}`,
        location,
        source: 'ADMIN',
        allowTransition: false,
      });
      trackingEvent = result.trackingEvent;
    }

    emitDeliveryUpdate(order.orderNumber, order.user, location, order.estimatedDeliveryDate);

    res.json({ success: true, order, event: trackingEvent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/inventory/stats
 * Get inventory statistics
 */
router.get('/inventory/stats', async (req, res) => {
  try {
    const stats = await inventoryService.getInventoryStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/inventory/low-stock
 * Get low stock products
 */
router.get('/inventory/low-stock', async (req, res) => {
  try {
    const products = await inventoryService.getLowStockProducts(req.query.limit || 20);
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/inventory/alerts
 * Get inventory alerts
 */
router.get('/inventory/alerts', async (req, res) => {
  try {
    const alerts = await inventoryService.getAlerts(req.query.limit || 50);
    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/broadcast
 * Broadcast announcement
 */
router.post('/broadcast', protect, requireAdmin, async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const { broadcastAnnouncement } = await import('../services/realtimeService.js');
    broadcastAnnouncement(title, message, type);

    res.json({ success: true, message: 'Announcement broadcast sent' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/notification
 * Send admin notification
 */
router.post('/notification', protect, requireAdmin, async (req, res) => {
  try {
    const { message, data, level } = req.body;
    emitAdminNotification(message, data, level);

    res.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

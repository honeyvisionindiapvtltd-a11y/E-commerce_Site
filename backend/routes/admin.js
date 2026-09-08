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
import DeliveryZone from '../models/DeliveryZone.js';
import Category from '../models/Category.js';
import Installation from '../models/Installation.js';
import { confirmedOrderFilter } from '../utils/orderQueries.js';

const router = express.Router();

router.use(protect, requireAdmin);

router.get('/users', async (req, res) => {
  try {
    const { role, status, search } = req.query || {};
    const filter = {};

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: new RegExp(String(search).trim(), 'i') },
        { email: new RegExp(String(search).trim(), 'i') },
        { phone: new RegExp(String(search).trim(), 'i') },
      ];
    }

    const users = await User.find(filter)
      .select('name email phone role status createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: users, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
});

router.get('/delivery-zones', async (req, res) => {
  try {
    const filter = {};
    if (req.query.city) filter.city = new RegExp(`^${String(req.query.city).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    if (req.query.pincode) filter.pincode = String(req.query.pincode).trim();
    if (req.query.active !== undefined) filter.active = req.query.active === 'true';
    if (req.query.serviceable !== undefined) filter.serviceable = req.query.serviceable === 'true';
    const zones = await DeliveryZone.find(filter).sort({ city: 1, pincode: 1 }).lean();
    res.json({ success: true, zones });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch delivery zones' });
  }
});

router.get('/delivery-zones/:id', async (req, res) => {
  const zone = await DeliveryZone.findById(req.params.id).lean();
  if (!zone) return res.status(404).json({ success: false, message: 'Delivery zone not found' });
  return res.json({ success: true, zone });
});

router.post('/delivery-zones', async (req, res) => {
  try {
    const zone = await DeliveryZone.create(req.body);
    return res.status(201).json({ success: true, zone });
  } catch (error) {
    const duplicate = error.code === 11000;
    return res.status(duplicate ? 409 : 400).json({ success: false, message: duplicate ? 'A zone already exists for this city and PIN code' : error.message });
  }
});

router.put('/delivery-zones/:id', async (req, res) => {
  try {
    const zone = await DeliveryZone.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!zone) return res.status(404).json({ success: false, message: 'Delivery zone not found' });
    return res.json({ success: true, zone });
  } catch (error) {
    return res.status(error.code === 11000 ? 409 : 400).json({ success: false, message: error.code === 11000 ? 'A zone already exists for this city and PIN code' : error.message });
  }
});

router.patch('/delivery-zones/:id/status', async (req, res) => {
  const zone = await DeliveryZone.findByIdAndUpdate(req.params.id, { active: Boolean(req.body.active) }, { new: true, runValidators: true });
  if (!zone) return res.status(404).json({ success: false, message: 'Delivery zone not found' });
  return res.json({ success: true, zone });
});

router.patch('/delivery-zones/:id/serviceability', async (req, res) => {
  const zone = await DeliveryZone.findByIdAndUpdate(req.params.id, { serviceable: Boolean(req.body.serviceable) }, { new: true, runValidators: true });
  if (!zone) return res.status(404).json({ success: false, message: 'Delivery zone not found' });
  return res.json({ success: true, zone });
});

router.delete('/delivery-zones/:id', async (req, res) => {
  const zone = await DeliveryZone.findByIdAndDelete(req.params.id);
  if (!zone) return res.status(404).json({ success: false, message: 'Delivery zone not found' });
  return res.json({ success: true, message: 'Delivery zone deleted' });
});

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
    const periodDays = { '7days': 7, '30days': 30, '6months': 180, year: 365 }[req.query.period || '7days'];
    if (!periodDays) return res.status(400).json({ success: false, error: 'Invalid dashboard period' });

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - periodDays + 1);
    startDate.setHours(0, 0, 0, 0);
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - periodDays);
    const validOrderFilter = confirmedOrderFilter();
    const paidOrderFilter = { paymentStatus: 'PAID', status: { $nin: ['CANCELLED', 'RETURNED'] } };
    const pendingStatuses = ['ORDER_PLACED', 'PAYMENT_CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'];
    const statusCounts = Object.fromEntries(ORDER_STATUS_VALUES.map((status) => [status, 0]));
    const dateLabels = [];
    for (let index = 0; index < periodDays; index += 1) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      dateLabels.push(date.toISOString().slice(0, 10));
    }

    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      totalCategories,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      currentRevenue,
      allTimeRevenue,
      paidRevenue,
      previousRevenue,
      currentOrders,
      previousOrders,
      statusRows,
      salesRows,
      recentOrders,
      lowStockCount,
      lowStockProducts,
      topSellingProducts,
      inventoryStats,
      installationStats,
    ] = await Promise.all([
      Order.countDocuments(validOrderFilter),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ isActive: { $ne: false } }),
      Category.countDocuments({ isActive: { $ne: false } }),
      Order.countDocuments({ ...validOrderFilter, status: { $in: pendingStatuses } }),
      Order.countDocuments({ ...validOrderFilter, status: 'DELIVERED' }),
      Order.countDocuments({ status: 'CANCELLED', orderLifecycleStatus: { $ne: 'PAYMENT_PENDING' } }),
      Order.aggregate([{ $match: { ...paidOrderFilter, createdAt: { $gte: startDate, $lte: endDate } } }, { $group: { _id: null, value: { $sum: '$totalAmount' } } }]),
      Order.aggregate([{ $match: paidOrderFilter }, { $group: { _id: null, value: { $sum: '$totalAmount' } } }]),
      Order.aggregate([{ $match: paidOrderFilter }, { $group: { _id: null, value: { $sum: '$totalAmount' } } }]),
      Order.aggregate([{ $match: { ...paidOrderFilter, createdAt: { $gte: previousStartDate, $lt: startDate } } }, { $group: { _id: null, value: { $sum: '$totalAmount' } } }]),
      Order.countDocuments({ ...validOrderFilter, createdAt: { $gte: startDate, $lte: endDate } }),
      Order.countDocuments({ ...validOrderFilter, createdAt: { $gte: previousStartDate, $lt: startDate } }),
      Order.aggregate([{ $match: validOrderFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { ...paidOrderFilter, createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.find(validOrderFilter).populate('user', 'name email').sort({ createdAt: -1 }).limit(5).select('orderNumber user items totalAmount status paymentStatus createdAt').lean(),
      Product.countDocuments({ isActive: { $ne: false }, $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
      Product.find({ isActive: { $ne: false }, $expr: { $lte: ['$stock', '$lowStockThreshold'] } }).sort({ stock: 1 }).limit(5).select('name images thumbnail stock lowStockThreshold').lean(),
      Order.aggregate([
        { $match: validOrderFilter },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', name: { $first: '$items.name' }, image: { $first: '$items.image' }, unitsSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } } } },
        { $sort: { unitsSold: -1, revenue: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, productId: '$_id', name: { $ifNull: ['$product.name', '$name'] }, image: { $ifNull: ['$product.thumbnail', '$image'] }, unitsSold: 1, revenue: 1 } },
      ]),
      inventoryService.getInventoryStats(),
      Installation.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    statusRows.forEach((row) => { if (row._id in statusCounts) statusCounts[row._id] = row.count; });
    const salesByDate = Object.fromEntries(salesRows.map((row) => [row._id, row]));
    const salesOverview = {
      period: req.query.period || '7days',
      labels: dateLabels.map((label) => new Date(`${label}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })),
      revenue: dateLabels.map((label) => salesByDate[label]?.revenue || 0),
      orders: dateLabels.map((label) => salesByDate[label]?.orders || 0),
    };
    const percentageChange = (current, previous) => previous ? Number((((current - previous) / previous) * 100).toFixed(2)) : current ? 100 : 0;
    const summary = {
      totalRevenue: allTimeRevenue[0]?.value || 0,
      paidRevenue: paidRevenue[0]?.value || 0,
      totalOrders,
      totalCustomers,
      totalProducts,
      totalCategories,
      pendingOrders,
      lowStockItems: lowStockCount,
      revenueChange: { current: currentRevenue[0]?.value || 0, previous: previousRevenue[0]?.value || 0, percentageChange: percentageChange(currentRevenue[0]?.value || 0, previousRevenue[0]?.value || 0) },
      ordersChange: { current: currentOrders, previous: previousOrders, percentageChange: percentageChange(currentOrders, previousOrders) },
    };
    const installationStatusCounts = Object.fromEntries((installationStats || []).map((entry) => [entry._id, entry.count]));
    const dashboard = { orders: { total: totalOrders, pending: pendingOrders, delivered: deliveredOrders, cancelled: cancelledOrders }, customers: { total: totalCustomers }, products: { total: totalProducts }, revenue: { totalRevenue: summary.totalRevenue, count: currentOrders }, inventory: inventoryStats, installation: { total: Object.values(installationStatusCounts).reduce((sum, value) => sum + Number(value || 0), 0), statuses: installationStatusCounts }, timestamp: new Date() };
    res.json({ success: true, summary, salesOverview, orderStatus: statusCounts, recentOrders: recentOrders.map((order) => ({ ...order, customerName: order.user?.name || order.shippingAddress?.name || 'Unknown customer', customerEmail: order.user?.email || '', products: order.items || [] })), lowStockProducts, topSellingProducts, dashboard, installationStats: installationStatusCounts });
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

    const filter = status || paymentStatus ? {} : confirmedOrderFilter();
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

import express from 'express';
import OrderTracking from '../models/OrderTracking.js';
import { emitOrderStatusUpdate, emitAdminNotification } from '../services/realtimeService.js';
import inventoryService from '../services/inventoryService.js';
import { getDB } from '../db.js';

const router = express.Router();

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Get order statistics
    const totalOrders = await OrderTracking.countDocuments();
    const pendingOrders = await OrderTracking.countDocuments({
      orderStatus: { $in: ['order_placed', 'confirmed', 'processing'] },
    });
    const deliveredOrders = await OrderTracking.countDocuments({
      orderStatus: 'delivered',
    });
    const cancelledOrders = await OrderTracking.countDocuments({
      orderStatus: 'cancelled',
    });

    // Get revenue
    const revenue = await OrderTracking.aggregate([
      {
        $match: { orderStatus: 'delivered' },
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
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    const orders = await OrderTracking.find(filter)
      .sort({ orderDate: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await OrderTracking.countDocuments(filter);

    res.json({ success: true, orders, total });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/services', async (req, res) => {
  try {
    const services = await getDB().collection('services').find({}).sort({ title: 1 }).toArray();
    res.json({ success: true, services });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const database = getDB();
    const [orders, installations, products] = await Promise.all([
      database.collection('orders').find({}).sort({ createdAt: -1 }).limit(5).toArray(),
      database.collection('installations').find({}).sort({ createdAt: -1 }).limit(5).toArray(),
      database.collection('products').find({ stock: { $lte: 5 } }).sort({ stock: 1 }).limit(5).toArray(),
    ]);
    const notifications = [
      ...orders.map((order) => ({ id: `order-${order.id || order._id}`, type: 'order', level: 'info', message: `Order ${order.orderNumber || order.orderId || order.id || ''} received`, timestamp: order.createdAt || order.orderDate })),
      ...installations.map((installation) => ({ id: `installation-${installation.id || installation._id}`, type: 'installation', level: 'info', message: `Installation request from ${installation.customer?.name || installation.userId || 'customer'}`, timestamp: installation.createdAt })),
      ...products.map((product) => ({ id: `stock-${product._id}`, type: 'inventory', level: 'warning', message: `${product.name || 'Product'} has ${product.stock || 0} left`, timestamp: product.updatedAt || product.createdAt })),
    ].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)).slice(0, 10);
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/services', async (req, res) => {
  try {
    const service = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
    await getDB().collection('services').insertOne(service);
    res.status(201).json({ success: true, service });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/services/:id', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const result = await getDB().collection('services').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) }, { $set: { ...req.body, updatedAt: new Date() } }, { returnDocument: 'after' },
    );
    if (!result.value) return res.status(404).json({ success: false, error: 'Service not found' });
    res.json({ success: true, service: result.value });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/services/:id', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const result = await getDB().collection('services').deleteOne({ _id: new ObjectId(req.params.id) });
    if (!result.deletedCount) return res.status(404).json({ success: false, error: 'Service not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/installations', async (req, res) => {
  try {
    const installations = await getDB().collection('installations').find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, installations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/installations/:id/status', async (req, res) => {
  try {
    const allowed = ['requested', 'confirmed', 'scheduled', 'in_progress', 'completed', 'cancelled'];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ success: false, error: 'Invalid installation status' });
    const result = await getDB().collection('installations').findOneAndUpdate(
      { id: req.params.id }, { $set: { status: req.body.status, updatedAt: new Date().toISOString() } }, { returnDocument: 'after' },
    );
    if (!result.value) return res.status(404).json({ success: false, error: 'Installation not found' });
    res.json({ success: true, installation: result.value });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/admin/orders/:orderId/status
 * Update order status
 */
router.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { newStatus, description, location, notes } = req.body;

    const order = await OrderTracking.findOne({ orderId: req.params.orderId });
    if (!order) {
      const nativeStatus = {
        order_placed: 'Order placed',
        processing: 'Processing',
        shipped: 'Shipped',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
      }[newStatus] || newStatus;
      const result = await getDB().collection('orders').findOneAndUpdate(
        { $or: [{ id: req.params.orderId }, { orderId: req.params.orderId }, { orderNumber: req.params.orderId }] },
        { $set: { status: nativeStatus, updatedAt: new Date().toISOString() } },
        { returnDocument: 'after' },
      );
      if (!result.value) return res.status(404).json({ success: false, error: 'Order not found' });
      return res.json({ success: true, order: result.value });
    }

    // Update status
    order.orderStatus = newStatus;
    order.timeline.push({
      status: newStatus,
      timestamp: new Date(),
      description,
      location,
      notes,
    });

    // Update delivery info if provided
    if (location) {
      order.delivery.lastLocation = location;
    }

    await order.save();

    // Emit real-time update
    emitOrderStatusUpdate(req.params.orderId, order.userId, newStatus, {
      description,
      location,
    });

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/admin/orders/:orderId/delivery
 * Update delivery information
 */
router.put('/orders/:orderId/delivery', async (req, res) => {
  try {
    const { expectedDeliveryDate, estimatedDeliveryTime, carrier, trackingNumber, deliveryAgent, location } = req.body;

    const order = await OrderTracking.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (expectedDeliveryDate) order.delivery.expectedDeliveryDate = expectedDeliveryDate;
    if (estimatedDeliveryTime) order.delivery.estimatedDeliveryTime = estimatedDeliveryTime;
    if (carrier) order.delivery.carrier = carrier;
    if (trackingNumber) order.delivery.trackingNumber = trackingNumber;
    if (deliveryAgent) order.delivery.deliveryAgent = deliveryAgent;
    if (location) {
      order.delivery.lastLocation = location;
      order.timeline.push({
        status: 'delivery_update',
        timestamp: new Date(),
        description: `Delivery location updated: ${location}`,
        location,
      });
    }

    await order.save();

    // Emit real-time delivery update
    const { emitDeliveryUpdate } = await import('../services/realtimeService.js');
    emitDeliveryUpdate(req.params.orderId, order.userId, location, estimatedDeliveryTime);

    res.json({ success: true, order });
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
router.post('/broadcast', async (req, res) => {
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
router.post('/notification', async (req, res) => {
  try {
    const { message, data, level } = req.body;
    emitAdminNotification(message, data, level);

    res.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

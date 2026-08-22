import { Server } from 'socket.io';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Order from '../models/Order.js';

/**
 * Real-time Service using Socket.io
 * Handles WebSocket connections for live updates
 */

let io;
const connectedUsers = new Map(); // userId -> socket ids
const userRooms = new Map(); // userId -> room names

export const initializeRealtime = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const authorization = socket.handshake.headers.authorization || '';
      const token = socket.handshake.auth?.token
        || (authorization.startsWith('Bearer ') ? authorization.slice(7) : null);

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || 'honeyvision_secret_key_2024'
      );
      const user = await User.findById(payload.userId).select('_id role status').exec();

      if (!user || user.status && user.status !== 'Active') {
        return next(new Error('Unauthorized'));
      }

      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User authentication and room joining
    socket.on('user:login', () => {
      const userId = String(socket.user._id);
      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, []);
      }
      connectedUsers.get(userId).push(socket.id);

      // Join user-specific room for notifications
      socket.join(`user:${userId}`);
      socket.join('orders'); // Join orders room for global updates
      if (socket.user.role === 'admin') {
        socket.join('admins');
      }

      console.log(`User ${userId} joined notifications`);
    });

    // Real-time order tracking subscription
    socket.on('order:subscribe', async (orderId) => {
      try {
        const order = await Order.findOne({ orderNumber: String(orderId) })
          .select('orderNumber user deliveryAgent')
          .lean();

        if (!order) {
          return socket.emit('order:subscriptionError', {
            message: 'Order not found',
          });
        }

        const isOwner = String(order.user) === String(socket.user._id);
        const isPrivileged = socket.user.role === 'admin'
          || (socket.user.role === 'delivery_agent' && String(order.deliveryAgent) === String(socket.user._id));

        if (!isOwner && !isPrivileged) {
          return socket.emit('order:subscriptionError', {
            message: 'You are not authorized to subscribe to this order',
          });
        }

        socket.join(`order:${order.orderNumber}`);
        console.log(`Socket subscribed to order: ${order.orderNumber}`);
      } catch (error) {
        socket.emit('order:subscriptionError', {
          message: 'Unable to authorize order subscription',
        });
      }
    });

    // Real-time inventory subscription
    socket.on('product:subscribe', (productId) => {
      socket.join(`product:${productId}`);
      console.log(`Socket subscribed to product: ${productId}`);
    });

    socket.on('disconnect', () => {
      // Remove user from connected users map
      for (const [userId, socketIds] of connectedUsers.entries()) {
        const index = socketIds.indexOf(socket.id);
        if (index > -1) {
          socketIds.splice(index, 1);
          if (socketIds.length === 0) {
            connectedUsers.delete(userId);
          }
        }
      }
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Emit real-time order status update
 */
export const emitOrderStatusUpdate = (orderId, userId, status, details) => {
  if (!io) return;

  const update = {
    orderId,
    status,
    trackingEvent: details?.trackingEvent,
    estimatedDeliveryDate: details?.estimatedDeliveryDate,
    trackingNumber: details?.trackingNumber,
    carrier: details?.carrier,
    deliveryAgent: details?.deliveryAgent,
    failedDelivery: details?.failedDelivery,
    updatedAt: details?.updatedAt || new Date(),
  };

  // Send to specific order subscribers
  io.to(`order:${orderId}`).emit('order:statusUpdate', update);

  // Send to user's notification room
  io.to(`user:${userId}`).emit('notification:orderStatus', {
    message: `Your order status: ${status}`,
    update,
  });

  // Send to all admins
  io.to('admins').emit('admin:orderUpdate', update);
};

/**
 * Emit real-time delivery update
 */
export const emitDeliveryUpdate = (orderId, userId, location, eta) => {
  if (!io) return;

  const update = {
    orderId,
    location,
    eta,
    updatedAt: new Date(),
  };

  io.to(`order:${orderId}`).emit('delivery:update', update);
  io.to(`user:${userId}`).emit('notification:delivery', {
    message: `Delivery update: ${location}`,
    update,
  });
};

export const emitDeliveryLocationUpdate = (orderId, userId, location) => {
  if (!io) return;

  const update = {
    orderNumber: orderId,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    updatedAt: location.updatedAt,
  };

  if (process.env.NODE_ENV !== "production") {
    console.debug("Delivery GPS emitted:", update);
  }

  io.to(`order:${orderId}`).emit('delivery:locationUpdate', update);
  io.to(`user:${userId}`).emit('notification:deliveryLocation', {
    message: 'Your delivery location was updated.',
    update,
  });
};

/**
 * Emit inventory update (low stock alert, back in stock, etc)
 */
export const emitInventoryUpdate = (productId, quantity, status) => {
  if (!io) return;

  const update = {
    productId,
    quantity,
    status, // 'in_stock', 'low_stock', 'out_of_stock', 'back_in_stock'
    timestamp: new Date(),
  };

  io.to(`product:${productId}`).emit('inventory:update', update);

  // Notify users with this product in wishlist
  io.to('wishlist').emit('notification:inventory', {
    productId,
    status,
  });
};

/**
 * Emit price change notification
 */
export const emitPriceUpdate = (productId, oldPrice, newPrice, discount) => {
  if (!io) return;

  const update = {
    productId,
    oldPrice,
    newPrice,
    discount,
    timestamp: new Date(),
  };

  io.to(`product:${productId}`).emit('price:update', update);
  io.to('wishlist').emit('notification:priceChange', update);
};

/**
 * Emit chat message (for live support)
 */
export const emitChatMessage = (conversationId, senderId, message) => {
  if (!io) return;

  io.to(`chat:${conversationId}`).emit('chat:message', {
    conversationId,
    senderId,
    message,
    timestamp: new Date(),
  });
};

/**
 * Emit admin notification
 */
export const emitAdminNotification = (message, data, level = 'info') => {
  if (!io) return;

  io.to('admins').emit('admin:notification', {
    message,
    data,
    level, // 'info', 'warning', 'error', 'success'
    timestamp: new Date(),
  });
};

/**
 * Broadcast server-wide announcement
 */
export const broadcastAnnouncement = (title, message, type = 'info') => {
  if (!io) return;

  io.emit('announcement', {
    title,
    message,
    type, // 'info', 'warning', 'promotion', 'maintenance'
    timestamp: new Date(),
  });
};

/**
 * Get connected users count
 */
export const getConnectedUsersCount = () => {
  return connectedUsers.size;
};

/**
 * Get Socket.io instance
 */
export const getIO = () => {
  return io;
};

/**
 * Join user to admin room
 */
export const joinAdminRoom = (socketId) => {
  if (!io) return;
  const socket = io.sockets.sockets.get(socketId);
  if (socket) {
    socket.join('admins');
  }
};

import { Server } from 'socket.io';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Order from '../models/Order.js';
import ChatConversation from '../models/ChatConversation.js';
import ChatMessage from '../models/ChatMessage.js';
import { notifyAdmin, notifyCustomer, notifyDeliveryAgent, notifyAdmins as persistAdminNotifications } from './notificationService.js';
import { markAgentOnline, markAgentOffline, recordAgentHeartbeat } from './deliveryPresenceService.js';

/**
 * Real-time Service using Socket.io
 * Handles WebSocket connections for live updates
 */

let io;
const connectedUsers = new Map(); // userId -> socket ids
const userRooms = new Map(); // userId -> room names
const localFrontendOrigins = [
  'capacitor://localhost',
  'https://localhost',
  'http://localhost',
  'https://honeyvision.in',
  'https://www.honeyvision.in',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://192.168.31.5:5173',
];
const configuredFrontendOrigins = String(process.env.FRONTEND_URL || '')
  .split(',').map((origin) => origin.trim()).filter(Boolean);
const allowedOrigins = new Set([...localFrontendOrigins, ...configuredFrontendOrigins]);
const isAllowedDevelopmentOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.31\.5):\d+$/.test(origin);

export const initializeRealtime = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin) || isAllowedDevelopmentOrigin(origin)) return callback(null, true);
        return callback(new Error('Origin is not allowed by Socket.IO CORS'));
      },
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

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.userId).select('_id role status').exec();

      if (!user || user.status && user.status !== 'Active') {
        return next(new Error('Unauthorized'));
      }
      if (payload.role && payload.role !== user.role) {
        return next(new Error('Unauthorized'));
      }

      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User authentication and room joining
    const userId = String(socket.user._id);
    if (!connectedUsers.has(userId)) connectedUsers.set(userId, []);
    connectedUsers.get(userId).push(socket.id);
    socket.join(`user:${userId}`);
    socket.join('orders');
    
    // Delivery agent specific rooms and presence
    if (socket.user.role === 'delivery_agent') {
      socket.join(`agent:${userId}`);
      console.log(`Delivery agent ${userId} joined agent room`);
      
      // Mark agent as online through presence service
      try {
        await markAgentOnline(socket.user._id, socket.id);
      } catch (err) {
        console.warn(`Failed to mark agent online: ${err.message}`);
      }
      
      // Emit delivery agent connected event
      socket.emit('delivery:agentConnected', {
        agentId: userId,
        timestamp: new Date(),
      });
    }
    
    if (socket.user.role === 'admin') socket.join('admins');
    console.log(`User ${userId} joined notifications`);

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

    socket.on('chat:join', async (conversationId) => {
      if (!conversationId) return socket.emit('chat:error', { message: 'Conversation is required.' });
      const conversation = await ChatConversation.findById(conversationId).select('customer assignedAgent');
      const allowed = conversation && (String(conversation.customer) === String(socket.user._id)
        || socket.user.role === 'admin'
        || String(conversation.assignedAgent) === String(socket.user._id));
      if (!allowed) return socket.emit('chat:error', { message: 'You are not authorized to join this conversation.' });
      socket.join(`chat:${conversationId}`);
    });

    socket.on('chat:leave', (conversationId) => socket.leave(`chat:${conversationId}`));
    socket.on('chat:typing', (conversationId) => socket.to(`chat:${conversationId}`).emit('chat:typing', { conversationId, userType: socket.user.role === 'admin' ? 'agent' : 'customer' }));
    socket.on('chat:stopTyping', (conversationId) => socket.to(`chat:${conversationId}`).emit('chat:stopTyping', { conversationId }));

    // Installation subscription
    socket.on('installation:subscribe', async (installationId) => {
      try {
        const Installation = (await import('../models/Installation.js')).default;
        const installation = await Installation.findOne({
          $or: [{ id: String(installationId) }, { _id: installationId }, { bookingNumber: String(installationId) }],
        }).select('id userId assignedAgentId');

        if (!installation) {
          return socket.emit('installation:subscriptionError', {
            message: 'Installation not found',
          });
        }

        const isOwner = String(installation.userId) === String(socket.user._id);
        const isAgent = String(installation.assignedAgentId) === String(socket.user._id);
        const isPrivileged = socket.user.role === 'admin';

        if (!isOwner && !isAgent && !isPrivileged) {
          return socket.emit('installation:subscriptionError', {
            message: 'You are not authorized to subscribe to this installation',
          });
        }

        socket.join(`installation:${installation.id}`);
        console.log(`Socket subscribed to installation: ${installation.id}`);
      } catch (error) {
        socket.emit('installation:subscriptionError', {
          message: 'Unable to authorize installation subscription',
        });
      }
    });

    socket.on('delivery:heartbeat', async () => {
      if (socket.user?.role === 'delivery_agent') {
        try {
          await recordAgentHeartbeat(socket.user._id);
          socket.emit('delivery:heartbeatAck', { timestamp: new Date() });
        } catch (err) {
          console.warn(`Failed to record heartbeat for agent ${socket.user._id}: ${err.message}`);
        }
      }
    });

    socket.on('disconnect', () => {
      // Mark delivery agent as offline (with grace period for reconnection)
      if (socket.user?.role === 'delivery_agent') {
        try {
          markAgentOffline(socket.user._id, true).catch((err) => {
            console.warn(`Failed to mark agent offline: ${err.message}`);
          });
        } catch (err) {
          console.warn(`Failed to handle agent disconnect: ${err.message}`);
        }
      }

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

  const isCancellation = status === 'CANCELLED';
  const title = isCancellation ? 'Order cancelled' : details?.trackingEvent?.title || `Order ${String(status).replaceAll('_', ' ')}`;
  const message = isCancellation ? `Your order #${orderId} has been cancelled.` : details?.trackingEvent?.description || `Your order ${orderId} status is ${String(status).replaceAll('_', ' ')}.`;
  const eventKey = details?.trackingEvent?._id || details?.trackingEvent?.timestamp || details?.updatedAt || Date.now();
    const category = status.includes('PAYMENT') ? 'PAYMENT' : status.includes('DELIVERY') || status === 'OUT_FOR_DELIVERY' ? 'DELIVERY' : 'ORDER';
    const actionUrl = `/orders/${encodeURIComponent(orderId)}/tracking`;
    void notifyCustomer({ recipient: userId, type: `ORDER_${status}`, category, title, message, orderNumber: orderId, actionUrl, eventKey: `order:${orderId}:event:${eventKey}` });
    void persistAdminNotifications({ type: isCancellation ? 'ORDER_CANCELLED' : 'ORDER_STATUS_UPDATE', category: 'ORDER', title: isCancellation ? 'Order cancelled' : `Order ${orderId} updated`, message: isCancellation ? `Order #${orderId} was cancelled by the customer.` : `${orderId}: ${title}`, orderNumber: orderId, actionUrl: '/admin/orders', eventKey: `admin:order:${orderId}:event:${eventKey}` });
    if (details?.deliveryAgent?.id) void notifyDeliveryAgent({ recipient: details.deliveryAgent.id, type: `ORDER_${status}`, category: 'delivery', title, message: `${orderId}: ${title}`, orderNumber: orderId, actionUrl: '/delivery-agent', eventKey: `agent:${details.deliveryAgent.id}:order:${orderId}:event:${eventKey}` });
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
};

export const emitDeliveryLocationUpdate = (orderId, userId, location) => {
  if (!io) return;

  const update = {
    orderNumber: orderId,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    heading: location.heading,
    speed: location.speed,
    deliveryAgentId: location.deliveryAgentId,
    updatedAt: location.updatedAt,
  };

  if (process.env.NODE_ENV !== "production") {
    console.debug("Delivery GPS emitted:", update);
  }

  io.to(`order:${orderId}`).emit('delivery:locationUpdate', update);
  // GPS updates remain transient map events and never create persistent notifications.
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
  io.to('admins').emit('admin:dashboardUpdate', update);

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

export const emitChatEvent = (event, conversation, message) => {
  if (!io) return;
  const payload = {
    conversationId: String(conversation._id || conversation),
    conversation: conversation.toObject ? conversation.toObject() : undefined,
    message: message?.toObject ? message.toObject() : message,
  };
  io.to(`chat:${payload.conversationId}`).emit(event, payload);
  if (event === 'chat:conversationUpdate' || event === 'chat:agentAssigned' || event === 'chat:resolved' || event === 'chat:closed') io.to('admins').emit(event, payload);
};

/**
 * Emit admin notification
 */
export const emitAdminNotification = (message, data, level = 'info') => {
  return persistAdminNotifications({
    category: data?.category || 'SYSTEM',
    type: data?.type || 'ADMIN_ALERT',
    actionUrl: data?.actionUrl || '',
    title: level === 'error' ? 'Important admin alert' : 'Admin notification',
    message,
    relatedId: data?.conversationId || data?.productId || '',
    eventKey: data?.eventKey || `admin:${message}:${JSON.stringify(data || {})}`,
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

// ==========================================
// INSTALLATION REAL-TIME EVENTS
// ==========================================

/**
 * Subscribe to installation updates
 */
export const subscribeToInstallation = (socket, installationId) => {
  if (!socket) return;
  socket.join(`installation:${installationId}`);
};

/**
 * Emit installation status update
 */
export const emitInstallationStatusUpdate = (installationId, customerId, agentId, status, details = {}) => {
  if (!io) return;

  const update = {
    installationId,
    status,
    previousStatus: details.previousStatus,
    statusLabel: details.statusLabel,
    timestamp: new Date(),
    note: details.note,
  };

  // Send to installation subscribers (real-time page viewers)
  io.to(`installation:${installationId}`).emit('installation:statusUpdate', update);

  // Send to customer
  io.to(`user:${customerId}`).emit('notification:installationStatus', {
    message: `Installation ${installationId}: ${details.statusLabel}`,
    update,
  });

  void notifyCustomer({
    recipient: customerId,
    type: `INSTALLATION_${status}`,
    category: 'INSTALLATION',
    title: details.statusLabel || 'Installation updated',
    message: details.note || `Your installation ${installationId} is now ${details.statusLabel || status}.`,
    relatedId: installationId,
    relatedType: 'Installation',
    actionUrl: `/installation/history/${encodeURIComponent(installationId)}`,
    eventKey: `installation:${installationId}:status:${status}:${details.timestamp || details.updatedAt || 'current'}`,
  });

  // Send to assigned agent
  if (agentId) {
    io.to(`user:${agentId}`).emit('notification:installationStatus', {
      message: `Installation ${installationId}: ${details.statusLabel}`,
      update,
    });
  }

  // Send to all admins
  io.to('admins').emit('admin:installationUpdate', update);
};

/**
 * Emit installation agent assignment
 */
export const emitInstallationAssigned = (installationId, customerId, agentId, agentName) => {
  if (!io) return;

  const update = {
    installationId,
    agentId,
    agentName,
    assignedAt: new Date(),
  };

  io.to(`installation:${installationId}`).emit('installation:assigned', update);
  io.to(`user:${customerId}`).emit('notification:installationAssigned', {
    message: `Agent ${agentName} has been assigned to your installation`,
    update,
  });
  void notifyCustomer({
    recipient: customerId,
    type: 'INSTALLATION_ASSIGNED',
    category: 'INSTALLATION',
    title: 'Installation technician assigned',
    message: `${agentName || 'A technician'} has been assigned to your installation.`,
    relatedId: installationId,
    relatedType: 'Installation',
    actionUrl: `/installation/history/${encodeURIComponent(installationId)}`,
    eventKey: `installation:${installationId}:assigned:${agentId}`,
  });
  io.to(`user:${agentId}`).emit('notification:installationAssigned', {
    message: `You have been assigned a new installation`,
    update,
  });
  io.to('admins').emit('admin:installationAssigned', update);
};

/**
 * Emit installation location update
 */
export const emitInstallationLocationUpdate = (installationId, customerId, agentId, location) => {
  if (!io) return;

  // Validate coordinates
  const lat = Number(location.latitude);
  const lng = Number(location.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 && lng === 0) {
    return; // Silently ignore invalid coordinates
  }

  const update = {
    installationId,
    latitude: lat,
    longitude: lng,
    accuracy: location.accuracy,
    heading: location.heading,
    speed: location.speed,
    timestamp: new Date(),
  };

  // Send to installation page viewers
  io.to(`installation:${installationId}`).emit('installation:locationUpdate', update);

  // GPS updates are transient and don't create persistent notifications
};

/**
 * Emit installation completion
 */
export const emitInstallationCompleted = (installationId, customerId, agentId, details = {}) => {
  if (!io) return;

  const update = {
    installationId,
    completedAt: new Date(),
    agentNotes: details.agentNotes,
    photosUrl: details.photosUrl || [],
    workDuration: details.workDuration,
  };

  io.to(`installation:${installationId}`).emit('installation:completed', update);
  io.to(`user:${customerId}`).emit('notification:installationCompleted', {
    message: `Your installation has been completed`,
    update,
  });
  io.to('admins').emit('admin:installationCompleted', update);
};

/**
 * Emit installation failure
 */
export const emitInstallationFailed = (installationId, customerId, agentId, reason, notes) => {
  if (!io) return;

  const update = {
    installationId,
    failedAt: new Date(),
    reason,
    agentNotes: notes,
  };

  io.to(`installation:${installationId}`).emit('installation:failed', update);
  io.to(`user:${customerId}`).emit('notification:installationFailed', {
    message: `Installation could not be completed: ${reason}`,
    update,
  });
  io.to('admins').emit('admin:installationFailed', update);
};

/**
 * Emit installation cancellation
 */
export const emitInstallationCancelled = (installationId, customerId, reason) => {
  if (!io) return;

  const update = {
    installationId,
    cancelledAt: new Date(),
    reason,
  };

  io.to(`installation:${installationId}`).emit('installation:cancelled', update);
  io.to(`user:${customerId}`).emit('notification:installationCancelled', {
    message: `Installation has been cancelled`,
    update,
  });
  io.to('admins').emit('admin:installationCancelled', update);
};

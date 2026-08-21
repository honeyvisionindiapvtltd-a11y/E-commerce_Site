import { Server } from 'socket.io';

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

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User authentication and room joining
    socket.on('user:login', (userId) => {
      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, []);
      }
      connectedUsers.get(userId).push(socket.id);

      // Join user-specific room for notifications
      socket.join(`user:${userId}`);
      socket.join('orders'); // Join orders room for global updates

      console.log(`User ${userId} joined notifications`);
    });

    socket.on('admin:login', () => {
      socket.join('admins');
      console.log(`Admin ${socket.id} joined notifications`);
    });

    // Real-time order tracking subscription
    socket.on('order:subscribe', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`Socket subscribed to order: ${orderId}`);
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
    userId,
    status,
    details,
    timestamp: new Date(),
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
    timestamp: new Date(),
  };

  io.to(`order:${orderId}`).emit('delivery:update', update);
  io.to(`user:${userId}`).emit('notification:delivery', {
    message: `Delivery update: ${location}`,
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

import { useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

/**
 * useRealtimeUpdates Hook
 * Manages Socket.io connection and real-time updates
 */

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

export const useRealtimeUpdates = (userId) => {
  const socketRef = useRef(null);
  const listenersRef = useRef({});

  // Initialize socket connection
  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      socketRef.current.emit('user:login', userId);
      if (userId === 'admin') socketRef.current.emit('admin:login');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId]);

  /**
   * Subscribe to order tracking updates
   */
  const subscribeToOrder = useCallback((orderId, callback) => {
    if (!socketRef.current) return;

    socketRef.current.emit('order:subscribe', orderId);
    socketRef.current.on('order:statusUpdate', callback);

    return () => {
      socketRef.current?.off('order:statusUpdate', callback);
    };
  }, []);

  /**
   * Subscribe to delivery updates
   */
  const subscribeToDelivery = useCallback((orderId, callback) => {
    if (!socketRef.current) return;

    socketRef.current.on('delivery:update', callback);

    return () => {
      socketRef.current?.off('delivery:update', callback);
    };
  }, []);

  /**
   * Subscribe to inventory updates
   */
  const subscribeToInventory = useCallback((productId, callback) => {
    if (!socketRef.current) return;

    socketRef.current.emit('product:subscribe', productId);
    socketRef.current.on('inventory:update', callback);

    return () => {
      socketRef.current?.off('inventory:update', callback);
    };
  }, []);

  /**
   * Subscribe to notifications
   */
  const subscribeToNotifications = useCallback((callback) => {
    if (!socketRef.current) return;

    socketRef.current.on('notification:orderStatus', callback);
    socketRef.current.on('notification:delivery', callback);
    socketRef.current.on('notification:inventory', callback);
    socketRef.current.on('notification:priceChange', callback);

    return () => {
      socketRef.current?.off('notification:orderStatus', callback);
      socketRef.current?.off('notification:delivery', callback);
      socketRef.current?.off('notification:inventory', callback);
      socketRef.current?.off('notification:priceChange', callback);
    };
  }, []);

  /**
   * Subscribe to announcements
   */
  const subscribeToAnnouncements = useCallback((callback) => {
    if (!socketRef.current) return;

    socketRef.current.on('announcement', callback);

    return () => {
      socketRef.current?.off('announcement', callback);
    };
  }, []);

  /**
   * Subscribe to admin notifications (for admins only)
   */
  const subscribeToAdminNotifications = useCallback((callback) => {
    if (!socketRef.current) return;

    socketRef.current.on('admin:notification', callback);
    socketRef.current.on('admin:orderUpdate', callback);

    return () => {
      socketRef.current?.off('admin:notification', callback);
      socketRef.current?.off('admin:orderUpdate', callback);
    };
  }, []);

  /**
   * Send message (for chat)
   */
  const sendMessage = useCallback((conversationId, message) => {
    if (!socketRef.current) return;
    socketRef.current.emit('chat:send', { conversationId, message });
  }, []);

  /**
   * Get socket instance
   */
  const getSocket = useCallback(() => socketRef.current, []);

  return {
    subscribeToOrder,
    subscribeToDelivery,
    subscribeToInventory,
    subscribeToNotifications,
    subscribeToAnnouncements,
    subscribeToAdminNotifications,
    sendMessage,
    getSocket,
  };
};

export default useRealtimeUpdates;

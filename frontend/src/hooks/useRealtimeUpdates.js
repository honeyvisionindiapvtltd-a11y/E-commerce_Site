import { useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../lib/socketConfig.js';

let sharedSocket = null;
let sharedSocketKey = '';
let sharedConsumers = 0;
let disconnectTimer = null;

/**
 * useRealtimeUpdates Hook
 * Manages Socket.io connection and real-time updates
 */

export const useRealtimeUpdates = (userId, token) => {
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!userId || !token) return;

    const socketKey = `${userId}:${token}`;
    if (disconnectTimer) {
      window.clearTimeout(disconnectTimer);
      disconnectTimer = null;
    }
    if (!sharedSocket || sharedSocketKey !== socketKey) {
      sharedSocket?.disconnect();
      sharedSocket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });
      sharedSocketKey = socketKey;
      sharedSocket.on('connect', () => {
        console.log('Socket connected:', sharedSocket.id);
      });
      sharedSocket.on('disconnect', () => console.log('Socket disconnected'));
    }
    socketRef.current = sharedSocket;
    sharedConsumers += 1;

    return () => {
      sharedConsumers = Math.max(0, sharedConsumers - 1);
      if (sharedConsumers === 0 && sharedSocketKey === socketKey) {
        disconnectTimer = window.setTimeout(() => {
          if (sharedConsumers !== 0 || sharedSocketKey !== socketKey) return;
          sharedSocket?.disconnect();
          sharedSocket = null;
          sharedSocketKey = '';
          disconnectTimer = null;
        }, 1000);
      }
      socketRef.current = null;
    };
  }, [userId, token]);

  /**
   * Subscribe to order tracking updates
   */
  const subscribeToOrder = useCallback((orderId, callback) => {
    if (!socketRef.current) return;

    socketRef.current.on('order:statusUpdate', callback);
    const subscribe = () => socketRef.current?.emit('order:subscribe', orderId);
    if (socketRef.current.connected) subscribe();
    else socketRef.current.once('connect', subscribe);

    return () => {
      socketRef.current?.off('connect', subscribe);
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

  const subscribeToPersistentNotifications = useCallback((callback) => {
    if (!socketRef.current) return;
    socketRef.current.on('notification:new', callback);
    return () => socketRef.current?.off('notification:new', callback);
  }, []);

  const subscribeToNotificationState = useCallback(({ onRead, onUnreadCount }) => {
    if (!socketRef.current) return;
    if (onRead) socketRef.current.on('notification:read', onRead);
    if (onUnreadCount) socketRef.current.on('notification:unreadCount', onUnreadCount);
    return () => {
      if (onRead) socketRef.current?.off('notification:read', onRead);
      if (onUnreadCount) socketRef.current?.off('notification:unreadCount', onUnreadCount);
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
    subscribeToPersistentNotifications,
    subscribeToNotificationState,
    subscribeToAnnouncements,
    sendMessage,
    getSocket,
  };
};

export default useRealtimeUpdates;

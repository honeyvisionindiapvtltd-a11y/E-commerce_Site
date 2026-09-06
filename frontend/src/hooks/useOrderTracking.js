import { useState, useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import { getOrderTracking } from "../services/orderTrackingService.js";
import { SOCKET_URL } from "../lib/socketConfig.js";
import { normalizeDeliveryLocation } from "../utils/locationUtils.js";

/**
 * Custom hook for real-time order tracking with polling fallback
 * Features:
 * - Real-time Socket.IO updates with sequence number ordering
 * - Polling fallback when Socket.IO is unavailable
 * - Prevents old events from overwriting new state
 * 
 * Usage:
 * const { order, tracking, timeline, loading, error, refresh } = useOrderTracking(orderNumber, token);
 */
export const useOrderTracking = (orderNumber, token, pollInterval = 15000) => {
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [locationDebug, setLocationDebug] = useState(null);
  const socketRef = useRef(null);
  const socketConnectedRef = useRef(false);
  const orderRef = useRef(null);
  const latestRealtimeAtRef = useRef(0);
  const latestSequenceRef = useRef(-1); // Track event sequence for ordering
  const isMountedRef = useRef(true);
  const fetchInFlightRef = useRef(false);

  // Fetch tracking data
  const fetchTracking = useCallback(async () => {
    if (!orderNumber || fetchInFlightRef.current) return;
    fetchInFlightRef.current = true;

    try {
      setLoading(true);
      setError(null);

      const response = await getOrderTracking(orderNumber, token);

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch tracking");
      }

      const apiUpdatedAt = new Date(response.order?.updatedAt || response.tracking?.updatedAt || 0).getTime();
      if (isMountedRef.current && apiUpdatedAt >= latestRealtimeAtRef.current) {
        orderRef.current = response.order;
        setOrder(response.order);
        setTracking(response.tracking);
        setTimeline(response.timeline || []);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || "Failed to fetch tracking data");
        console.error("useOrderTracking error:", err);
      }
    } finally {
      fetchInFlightRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [orderNumber, token]);

  useEffect(() => {
    latestRealtimeAtRef.current = 0;
    orderRef.current = null;
  }, [orderNumber]);

  useEffect(() => {
    isMountedRef.current = true;
    const initialFetch = window.setTimeout(fetchTracking, 0);

    return () => {
      isMountedRef.current = false;
      window.clearTimeout(initialFetch);
    };
  }, [fetchTracking]);

  useEffect(() => {
    if (!orderNumber || !token) return undefined;

    const socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      reconnection: false,
    });
    socketRef.current = socket;
    let stopped = false;
    let reconnectTimer = null;
    let reconnectAttempt = 0;
    let connecting = false;
    let pageHidden = false;

    const matchesOrder = (update) => String(update?.orderId) === String(orderNumber);
    const markRealtimeUpdate = (update) => {
      const timestamp = new Date(update?.updatedAt || update?.trackingEvent?.timestamp || 0).getTime();
      latestRealtimeAtRef.current = Math.max(latestRealtimeAtRef.current, timestamp || Date.now());
      // Update sequence number if available
      if (typeof update?.sequence === 'number' && update.sequence >= 0) {
        latestSequenceRef.current = Math.max(latestSequenceRef.current, update.sequence);
      }
    };
    const isFreshRealtimeUpdate = (update) => {
      // Check sequence number first (if available from new delivery event service)
      if (typeof update?.sequence === 'number' && update.sequence >= 0) {
        if (update.sequence < latestSequenceRef.current) {
          // Old event based on sequence number - ignore it
          if (import.meta.env.DEV) {
            console.debug('Ignoring old event with sequence', update.sequence, 'vs latest', latestSequenceRef.current);
          }
          return false;
        }
      }
      
      // Fall back to timestamp-based freshness check
      const timestamp = new Date(update?.updatedAt || update?.trackingEvent?.timestamp || 0).getTime();
      return !timestamp || timestamp >= latestRealtimeAtRef.current;
    };
    const applyStatusUpdate = (update) => {
      if (!isMountedRef.current || !matchesOrder(update)) return;
      if (!isFreshRealtimeUpdate(update)) return;
      markRealtimeUpdate(update);

      const trackingEvent = update.trackingEvent;
      const isActiveDelivery = update.status === "OUT_FOR_DELIVERY";
      setOrder((currentOrder) => currentOrder ? {
        ...currentOrder,
        status: update.status,
        actions: {
          ...currentOrder.actions,
          canCancel: ["ORDER_PLACED", "PAYMENT_CONFIRMED", "PROCESSING", "PACKED"].includes(update.status),
          canReturn: update.status === "DELIVERED" ? currentOrder.actions?.canReturn : false,
        },
        deliveryAgent: update.deliveryAgent || currentOrder.deliveryAgent,
        failedDelivery: update.failedDelivery ?? (isActiveDelivery ? null : currentOrder.failedDelivery),
        deliveryLocation: isActiveDelivery ? currentOrder.deliveryLocation : null,
        updatedAt: update.updatedAt || currentOrder.updatedAt,
      } : currentOrder);
      orderRef.current = orderRef.current ? {
        ...orderRef.current,
        status: update.status,
        updatedAt: update.updatedAt || orderRef.current.updatedAt,
      } : orderRef.current;
      setTracking((currentTracking) => currentTracking ? {
        ...currentTracking,
        status: update.status,
        agent: update.deliveryAgent || currentTracking.agent,
        estimatedDeliveryDate: update.estimatedDeliveryDate || currentTracking.estimatedDeliveryDate,
        trackingNumber: update.trackingNumber || currentTracking.trackingNumber,
        carrier: update.carrier || currentTracking.carrier,
        failedDelivery: update.failedDelivery ?? (isActiveDelivery ? null : currentTracking.failedDelivery),
        deliveryLocation: isActiveDelivery ? currentTracking.deliveryLocation : null,
      } : currentTracking);
      if (trackingEvent) {
        setTimeline((events) => {
          const eventKey = `${trackingEvent.status}:${new Date(trackingEvent.timestamp).getTime()}`;
          if (events.some((event) => `${event.status}:${new Date(event.timestamp).getTime()}` === eventKey)) {
            return events;
          }
          return [...events, trackingEvent];
        });
      }
    };
    const applyLocationUpdate = (update) => {
      if (!isMountedRef.current || String(update?.orderNumber) !== String(orderNumber)) return;

      const candidate = {
        ...update,
        ...(update?.payload || {}),
        ...(Array.isArray(update?.location?.coordinates) ? {
          latitude: update.latitude ?? update.payload?.latitude ?? Number(update.location.coordinates[1]),
          longitude: update.longitude ?? update.payload?.longitude ?? Number(update.location.coordinates[0]),
          accuracy: update.accuracy ?? update.payload?.accuracy ?? null,
          heading: update.heading ?? update.payload?.heading ?? null,
          speed: update.speed ?? update.payload?.speed ?? null,
          updatedAt: update.updatedAt ?? update.eventTimestamp ?? update.payload?.updatedAt ?? null,
        } : {}),
      };

      const normalized = normalizeDeliveryLocation(candidate);
      if (!normalized) return;

      if (!isFreshRealtimeUpdate(update)) return;
      markRealtimeUpdate(update);

      const location = {
        latitude: normalized.latitude,
        longitude: normalized.longitude,
        accuracy: normalized.accuracy,
        updatedAt: normalized.timestamp || update.updatedAt || update.eventTimestamp,
      };

      if (import.meta.env.DEV) {
        setLocationDebug({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          updatedAt: location.updatedAt,
        });
        console.debug("Customer received delivery GPS:", {
          orderNumber,
          ...location,
        });
      }
      setTracking((currentTracking) => currentTracking ? {
        ...currentTracking,
        deliveryLocation: location,
      } : currentTracking);
      setOrder((currentOrder) => currentOrder ? {
        ...currentOrder,
        deliveryLocation: location,
        updatedAt: location.updatedAt || currentOrder.updatedAt,
      } : currentOrder);
    };
    const applyDeliveryUpdate = (update) => {
      if (!isMountedRef.current || !matchesOrder(update)) return;
      markRealtimeUpdate(update);
      setTracking((currentTracking) => currentTracking ? {
        ...currentTracking,
        currentLocation: update.location
          ? { address: update.location, updatedAt: update.updatedAt }
          : currentTracking.currentLocation,
        estimatedDeliveryDate: update.eta || currentTracking.estimatedDeliveryDate,
      } : currentTracking);
    };
    const handleSubscriptionError = (subscriptionError) => {
      if (isMountedRef.current) {
        setError(subscriptionError?.message || "Unable to subscribe to order updates");
      }
    };
    const handleConnectError = (connectError) => {
      connecting = false;
      socketConnectedRef.current = false;
      setConnectionStatus("reconnecting");
      if (isMountedRef.current) {
        setError(connectError?.message || "Unable to connect to live order updates");
      }
      if (!stopped && reconnectAttempt < 5) {
        reconnectAttempt += 1;
        reconnectTimer = window.setTimeout(connectSocket, Math.min(30000, 5000 * reconnectAttempt));
      }
    };

    const subscribe = () => {
      connecting = false;
      reconnectAttempt = 0;
      socketConnectedRef.current = true;
      setConnectionStatus("connected");
      setError(null);
      if (orderRef.current) socket.emit("order:subscribe", orderRef.current.orderNumber || orderNumber);
    };
    const markDisconnected = () => {
      connecting = false;
      socketConnectedRef.current = false;
      if (!stopped && !pageHidden) {
        setConnectionStatus("reconnecting");
        if (!reconnectTimer) {
          reconnectAttempt += 1;
          reconnectTimer = window.setTimeout(connectSocket, Math.min(30000, 5000 * reconnectAttempt));
        }
      } else {
        setConnectionStatus("disconnected");
      }
    };
    const handlePageHide = () => {
      pageHidden = true;
      socketConnectedRef.current = false;
      socket.disconnect();
    };
    function connectSocket() {
      if (stopped || connecting || socket.connected) return;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      connecting = true;
      setConnectionStatus("reconnecting");
      socket.connect();
    }
    const handlePageShow = (event) => {
      if (!event.persisted || !isMountedRef.current) return;
      pageHidden = false;
      setConnectionStatus("reconnecting");
      connectSocket();
    };

    socket.on("connect", subscribe);
    socket.on("connect_error", handleConnectError);
    socket.on("reconnect_attempt", () => setConnectionStatus("reconnecting"));
    socket.on("disconnect", markDisconnected);
    socket.on("order:subscriptionError", handleSubscriptionError);
    socket.on("order:statusUpdate", applyStatusUpdate);
    socket.on("delivery:update", applyDeliveryUpdate);
    socket.on("delivery:locationUpdate", applyLocationUpdate);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);

    const poll = window.setInterval(() => {
      if (isMountedRef.current) {
        fetchTracking();
      }
    }, pollInterval);

    connectSocket();

    return () => {
      stopped = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
      socketConnectedRef.current = false;
      window.clearInterval(poll);
      socket.off("connect", subscribe);
      socket.off("connect_error", handleConnectError);
      socket.off("reconnect_attempt");
      socket.off("disconnect", markDisconnected);
      socket.off("order:subscriptionError", handleSubscriptionError);
      socket.off("order:statusUpdate", applyStatusUpdate);
      socket.off("delivery:update", applyDeliveryUpdate);
      socket.off("delivery:locationUpdate", applyLocationUpdate);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderNumber, pollInterval, token, fetchTracking]);

  useEffect(() => {
    if (socketConnectedRef.current && order?.orderNumber && String(order.orderNumber) === String(orderNumber)) {
      socketRef.current?.emit("order:subscribe", order.orderNumber);
    }
  }, [order?.orderNumber, orderNumber]);

  // Manual refresh function
  const refresh = useCallback(() => {
    return fetchTracking();
  }, [fetchTracking]);

  return {
    order,
    tracking,
    timeline,
    loading,
    error,
    connectionStatus,
    locationDebug,
    refresh,
  };
};

export default useOrderTracking;

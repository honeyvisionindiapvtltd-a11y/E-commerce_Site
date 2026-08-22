import { useState, useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import { getOrderTracking } from "../services/orderTrackingService.js";
import { SOCKET_URL } from "../lib/socketConfig.js";

/**
 * Custom hook for real-time order tracking with polling fallback
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
  const isMountedRef = useRef(true);

  // Fetch tracking data
  const fetchTracking = useCallback(async () => {
    if (!orderNumber) return;

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
      reconnection: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    const matchesOrder = (update) => String(update?.orderId) === String(orderNumber);
    const markRealtimeUpdate = (update) => {
      const timestamp = new Date(update?.updatedAt || update?.trackingEvent?.timestamp || 0).getTime();
      latestRealtimeAtRef.current = Math.max(latestRealtimeAtRef.current, timestamp || Date.now());
    };
    const isFreshRealtimeUpdate = (update) => {
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
      if (!isFreshRealtimeUpdate(update)) return;
      markRealtimeUpdate(update);
      const location = {
        latitude: update.latitude,
        longitude: update.longitude,
        accuracy: update.accuracy,
        updatedAt: update.updatedAt,
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
        updatedAt: update.updatedAt || currentOrder.updatedAt,
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
      setConnectionStatus("reconnecting");
      if (isMountedRef.current) {
        setError(connectError?.message || "Unable to connect to live order updates");
      }
    };

    const subscribe = () => {
      socketConnectedRef.current = true;
      setConnectionStatus("connected");
      setError(null);
      if (orderRef.current) socket.emit("order:subscribe", orderRef.current.orderNumber || orderNumber);
    };
    const markDisconnected = () => {
      socketConnectedRef.current = false;
      setConnectionStatus("disconnected");
    };
    const handlePageHide = () => {
      socketConnectedRef.current = false;
      socket.disconnect();
    };
    const handlePageShow = (event) => {
      if (!event.persisted || !isMountedRef.current) return;
      setConnectionStatus("reconnecting");
      socket.connect();
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
      if (!socketConnectedRef.current && isMountedRef.current) {
        fetchTracking();
      }
    }, pollInterval);

    return () => {
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

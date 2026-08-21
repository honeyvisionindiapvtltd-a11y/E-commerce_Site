import { useState, useEffect, useCallback, useRef } from "react";
import {
  getOrderTracking,
  getTrackingEvents,
  shouldContinuePolling,
} from "../services/orderTrackingService.js";

/**
 * Custom hook for real-time order tracking with polling
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
  const pollTimeoutRef = useRef(null);
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

      if (isMountedRef.current) {
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

  // Polling effect
  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch
    fetchTracking();

    // Set up polling
    const setupPolling = () => {
      pollTimeoutRef.current = setTimeout(() => {
        // Only continue polling if order is not delivered/cancelled
        if (isMountedRef.current && order && shouldContinuePolling(order.status)) {
          fetchTracking();
          setupPolling();
        }
      }, pollInterval);
    };

    setupPolling();

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [orderNumber, token, pollInterval, fetchTracking, order?.status]);

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
    refresh,
  };
};

export default useOrderTracking;

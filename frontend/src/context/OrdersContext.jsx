import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./useAuth";
import { useCatalog } from "./CatalogContext";
import { useDelivery } from "./DeliveryContext";
import { useCart } from "./CartContext";
import { computeTotals } from "../lib/orderTotals";

const OrdersContext = createContext(null);

function sameProductId(first, second) {
  return String(first?.id || first?.productId || first) === String(second?.id || second?.productId || second);
}

export function OrdersProvider({ children }) {
  const { authToken, user, requestJson } = useAuth();
  const isCustomer = user?.role === "customer";
  const { products } = useCatalog();
  const { couponApplied } = useDelivery();
  const { cart, clearCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [installationBookings, setInstallationBookings] = useState([]);

  // Load user orders when logged in
  useEffect(() => {
    if (!authToken || !user?.id || !isCustomer) {
      const timer = window.setTimeout(() => {
        setOrders([]);
        setInstallationBookings([]);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    let ignore = false;

    const loadUserOrders = async () => {
      try {
        const [ordersData, installationsData] = await Promise.all([
          requestJson("/orders/my-orders").catch(() => ({ orders: [] })),
          requestJson("/installations").catch(() => []),
        ]);

        if (ignore) return;

        const serverOrders = Array.isArray(ordersData)
          ? ordersData
          : Array.isArray(ordersData.orders)
            ? ordersData.orders
            : Array.isArray(ordersData.data)
              ? ordersData.data
              : [];
        const mergedOrders = new Map();
        serverOrders.forEach((order) => {
          const key = order.orderNumber || order._id || order.id;
          if (key) mergedOrders.set(String(key), order);
        });
        setOrders(Array.from(mergedOrders.values()));

        const serverInstallations = Array.isArray(installationsData) ? installationsData : installationsData.data || [];
        setInstallationBookings(serverInstallations);
      } catch (error) {
        console.error("Failed to load orders and installations:", error);
      }
    };

    loadUserOrders();

    return () => {
      ignore = true;
    };
  }, [authToken, user?.id, user?.role, isCustomer, requestJson]);

  const placeOrder = useCallback(
    async ({ address, paymentMethod, installationSlot, secureShipping = false, items: itemsOverride, orderId, clientRequestId }) => {
      const sourceItems = Array.isArray(itemsOverride) ? itemsOverride : cart;
      const items = sourceItems
        .map((item) => ({ ...item, product: products.find((product) => sameProductId(product, item)) }))
        .filter((item) => item.product);

      const orderPayload = {
        clientRequestId: clientRequestId || window.crypto?.randomUUID?.() || `order-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        orderId,
        items,
        shippingAddress: {
          ...address,
          name: address.name || address.fullName,
          addressLine1: address.addressLine1 || address.line1 || address.address,
          postalCode: address.postalCode || address.pincode || address.pinCode || address.pin,
          pincode: address.pincode || address.postalCode || address.pinCode || address.pin,
        },
        paymentMethod,
        installationSlot,
        couponApplied,
      };

      const data = await requestJson("/orders", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      });

      const createdOrder = data.order || data;
      const isCodOrder = String(paymentMethod || "").trim().toUpperCase() === "COD";
      if (isCodOrder) {
        setOrders((current) => [createdOrder, ...current]);
        clearCart();
      }

      return createdOrder;
    },
    [user?.id, cart, products, couponApplied, requestJson, clearCart]
  );

  const fetchOrders = useCallback(async () => {
    if (!authToken || !user?.id || !isCustomer) return [];
    try {
      const data = await requestJson("/orders/my-orders");
      const nextOrders = Array.isArray(data) ? data : data.orders || [];
      setOrders(nextOrders);
      return nextOrders;
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      return orders;
    }
  }, [authToken, user?.id, isCustomer, orders, requestJson]);

  const fetchInstallations = useCallback(async () => {
    if (!authToken || !user?.id || !isCustomer) return [];
    try {
      const data = await requestJson("/installations");
      const nextInstallations = Array.isArray(data) ? data : data.data || [];
      setInstallationBookings(nextInstallations);
      return nextInstallations;
    } catch (error) {
      console.error("Failed to fetch installations:", error);
      throw error;
    }
  }, [authToken, user?.id, isCustomer, requestJson]);

  const createInstallationBooking = useCallback(
    async (booking) => {
      if (!authToken || !(user?.id || user?._id) || !isCustomer) {
        throw new Error("Please log in as a customer to book installation.");
      }

      const data = await requestJson("/installations", {
        method: "POST",
        body: JSON.stringify(booking),
      });
      const savedBooking = data?.data || data;

      if (!savedBooking || !(savedBooking.id || savedBooking._id || savedBooking.bookingNumber)) {
        throw new Error(data?.message || "Unable to create installation booking.");
      }

      setInstallationBookings((current) => [savedBooking, ...current]);
      return savedBooking;
    },
    [authToken, user?.id, user?._id, isCustomer, requestJson]
  );

  const createInstallationPayment = useCallback(async (bookingId, paymentMethod = "upi") => {
    const data = await requestJson(`/installations/${encodeURIComponent(bookingId)}/payment/create-order`, { method: "POST", body: JSON.stringify({ paymentMethod }) });
    return data?.data || data;
  }, [requestJson]);

  const verifyInstallationPayment = useCallback(async (bookingId, payment) => {
    const data = await requestJson(`/installations/${encodeURIComponent(bookingId)}/payment/verify`, {
      method: "POST",
      body: JSON.stringify(payment),
    });
    const installation = data?.data?.installation || data?.installation;
    if (installation) setInstallationBookings((current) => [installation, ...current.filter((item) => String(item._id || item.id || item.bookingNumber) !== String(installation._id || installation.id || installation.bookingNumber))]);
    return data?.data || data;
  }, [requestJson]);

  const markInstallationPaymentFailed = useCallback(async (bookingId) => {
    const data = await requestJson(`/installations/${encodeURIComponent(bookingId)}/payment/failed`, { method: "POST" });
    const installation = data?.data || data;
    if (installation) setInstallationBookings((current) => [installation, ...current.filter((item) => String(item._id || item.id || item.bookingNumber) !== String(installation._id || installation.id || installation.bookingNumber))]);
    return installation;
  }, [requestJson]);

  const markInstallationPaymentCancelled = useCallback(async (bookingId) => {
    const data = await requestJson(`/installations/${encodeURIComponent(bookingId)}/payment/cancelled`, { method: "POST" });
    const installation = data?.data || data;
    if (installation) setInstallationBookings((current) => [installation, ...current.filter((item) => String(item._id || item.id || item.bookingNumber) !== String(installation._id || installation.id || installation.bookingNumber))]);
    return installation;
  }, [requestJson]);

  const fetchInstallation = useCallback(async (bookingId) => {
    const data = await requestJson(`/customer/installations/${encodeURIComponent(bookingId)}`);
    return data?.data || data;
  }, [requestJson]);

  const value = {
    orders,
    installationBookings,
    placeOrder,
    fetchOrders,
    fetchInstallations,
    createInstallationBooking,
    createInstallationPayment,
    verifyInstallationPayment,
    markInstallationPaymentFailed,
    markInstallationPaymentCancelled,
    fetchInstallation,
  };

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) throw new Error("useOrders must be used within OrdersProvider");
  return context;
}

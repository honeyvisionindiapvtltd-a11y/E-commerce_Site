import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useCatalog } from "./CatalogContext";
import { useDelivery } from "./DeliveryContext";
import { useCart } from "./CartContext";
import { computeTotals } from "../lib/orderTotals";

const OrdersContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_URL || "/api";

function sameProductId(first, second) {
  return String(first?.id || first?.productId || first) === String(second?.id || second?.productId || second);
}

export function OrdersProvider({ children }) {
  const { authToken, user, requestJson } = useAuth();
  const { products } = useCatalog();
  const { couponApplied } = useDelivery();
  const { cart, clearCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [installationBookings, setInstallationBookings] = useState([]);

  // Load user orders when logged in
  useEffect(() => {
    if (!authToken || !user?.id) {
      setOrders([]);
      setInstallationBookings([]);
      return;
    }

    let ignore = false;

    const loadUserOrders = async () => {
      try {
        const [ordersData, installationsData] = await Promise.all([
          requestJson("/orders/my-orders").catch(() => ({ orders: [] })),
          requestJson("/installations").catch(() => []),
        ]);

        if (ignore) return;

        const serverOrders = Array.isArray(ordersData.orders) ? ordersData.orders : [];
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
  }, [authToken, user?.id, requestJson]);

  const placeOrder = useCallback(
    async ({ address, paymentMethod, installationSlot, secureShipping = false }) => {
      const items = cart
        .map((item) => ({ ...item, product: products.find((product) => sameProductId(product, item)) }))
        .filter((item) => item.product);

      const totals = computeTotals(items, { coupon: couponApplied, secureShipping });

      const orderPayload = {
        userId: user?.id || null,
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
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        installationFee: totals.installationFee,
        discount: totals.discount,
        insurance: totals.insurance,
        total: totals.total,
      };

      const data = await requestJson("/orders", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      });

      const createdOrder = data.order || data;
      setOrders((current) => [createdOrder, ...current]);
      clearCart();

      return createdOrder;
    },
    [user?.id, cart, products, couponApplied, requestJson, clearCart]
  );

  const fetchOrders = useCallback(async () => {
    if (!authToken || !user?.id) return [];
    try {
      const data = await requestJson("/orders/my-orders");
      const nextOrders = Array.isArray(data) ? data : data.orders || [];
      setOrders(nextOrders);
      return nextOrders;
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      return orders;
    }
  }, [authToken, user?.id, orders, requestJson]);

  const fetchInstallations = useCallback(async () => {
    if (!authToken || !user?.id) return [];
    try {
      const data = await requestJson("/installations");
      setInstallationBookings(Array.isArray(data) ? data : data.data || []);
      return installationBookings;
    } catch (error) {
      console.error("Failed to fetch installations:", error);
      return installationBookings;
    }
  }, [authToken, user?.id, installationBookings, requestJson]);

  const addInstallationBooking = useCallback(
    async (booking) => {
      let data;
      if (authToken && user?.id) {
        data = await requestJson("/installations", {
          method: "POST",
          body: JSON.stringify(booking),
        });
      } else {
        data = {
          ...booking,
          id: `INSTALL-${Date.now().toString().slice(-6)}`,
          status: "requested",
          userId: user?.id || null,
          createdAt: new Date().toISOString(),
        };
      }

      setInstallationBookings((current) => [data, ...current]);
      return data;
    },
    [authToken, user?.id, requestJson]
  );

  const value = {
    orders,
    installationBookings,
    placeOrder,
    fetchOrders,
    fetchInstallations,
    addInstallationBooking,
  };

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) throw new Error("useOrders must be used within OrdersProvider");
  return context;
}

import { createContext, useContext, useState, useCallback } from "react";

const DeliveryContext = createContext(null);
const DELIVERY_STORAGE_KEY = "hv-delivery";
const API_BASE = import.meta.env.VITE_API_URL || "/api";

function readDeliveryStore() {
  try {
    const raw = localStorage.getItem(DELIVERY_STORAGE_KEY);
    if (!raw) {
      return {
        deliveryPin: "751001",
        deliveryLocation: {
          pincode: "751001",
          city: "Bhubaneswar",
          state: "Odisha",
        },
        couponApplied: false,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      deliveryPin: parsed.deliveryPin || "751001",
      deliveryLocation: parsed.deliveryLocation || {
        pincode: "751001",
        city: "Bhubaneswar",
        state: "Odisha",
      },
      couponApplied: Boolean(parsed.couponApplied),
    };
  } catch {
    return {
      deliveryPin: "751001",
      deliveryLocation: {
        pincode: "751001",
        city: "Bhubaneswar",
        state: "Odisha",
      },
      couponApplied: false,
    };
  }
}

function writeDeliveryStore(delivery) {
  try {
    localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify(delivery));
  } catch {
    console.error("Failed to persist delivery to localStorage");
  }
}

export function DeliveryProvider({ children }) {
  const [delivery, setDelivery] = useState(readDeliveryStore);

  const updateDelivery = (next) => {
    if (typeof next === "function") {
      setDelivery((current) => {
        const updated = next(current);
        writeDeliveryStore(updated);
        return updated;
      });
    } else {
      writeDeliveryStore(next);
      setDelivery(next);
    }
  };

  const setCouponApplied = useCallback(
    (value) => {
      updateDelivery((current) => ({
        ...current,
        couponApplied: Boolean(value),
      }));
    },
    []
  );

  const setDeliveryPin = useCallback(
    (pin) => {
      const normalized = String(pin || "").replace(/\D/g, "").slice(0, 6);
      updateDelivery((current) => ({
        ...current,
        deliveryPin: normalized,
      }));
    },
    []
  );

  const checkDeliveryByPincode = useCallback(async ({ pincode, productId = null }) => {
    const normalizedPin = String(pincode || "").replace(/\s+/g, "").replace(/\D/g, "").slice(0, 6);
    const url = `/delivery/check/${encodeURIComponent(normalizedPin)}` + (productId ? `?productId=${encodeURIComponent(productId)}` : "");

    try {
      const response = await fetch(`${API_BASE}${url}`);
      if (!response.ok) throw new Error("Failed to check delivery");

      const data = await response.json();

      if (data.success) {
        const location = data.location || {};
        updateDelivery((current) => ({
          ...current,
          deliveryPin: location.pincode || normalizedPin,
          deliveryLocation: {
            ...current.deliveryLocation,
            ...location,
          },
        }));
      }

      return data;
    } catch (error) {
      console.error("Delivery check error:", error);
      throw error;
    }
  }, []);

  const checkDeliveryByLocation = useCallback(async ({ latitude, longitude, productId = null }) => {
    try {
      const response = await fetch(`${API_BASE}/location/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude, productId }),
      });

      if (!response.ok) throw new Error("Failed to check delivery by location");

      const data = await response.json();

      if (data.success) {
        const location = data.location || {};
        updateDelivery((current) => ({
          ...current,
          deliveryPin: location.pincode,
          deliveryLocation: {
            ...current.deliveryLocation,
            ...location,
          },
        }));
      }

      return data;
    } catch (error) {
      console.error("Location check error:", error);
      throw error;
    }
  }, []);

  const value = {
    deliveryPin: delivery.deliveryPin,
    deliveryLocation: delivery.deliveryLocation,
    couponApplied: delivery.couponApplied,
    setCouponApplied,
    setDeliveryPin,
    checkDeliveryByPincode,
    checkDeliveryByLocation,
  };

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

export function useDelivery() {
  const context = useContext(DeliveryContext);
  if (!context) throw new Error("useDelivery must be used within DeliveryProvider");
  return context;
}

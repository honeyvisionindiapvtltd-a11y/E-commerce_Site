import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "hv-cart";

function sameProductId(first, second) {
  return String(first?.id || first?.productId || first) === String(second?.id || second?.productId || second);
}

function readCartStore() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { guest: parsed, users: {} };
    return {
      guest: Array.isArray(parsed.guest) ? parsed.guest : [],
      users: parsed.users && typeof parsed.users === "object" ? parsed.users : {},
    };
  } catch {
    return { guest: [], users: {} };
  }
}

function writeCartStore(store) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(store));
  } catch {
    console.error("Failed to persist cart to localStorage");
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || user?._id || null;
  const [cart, setCart] = useState(() => readCartStore().guest);
  const initializedUserIdRef = useRef(undefined);

  useEffect(() => {
    if (initializedUserIdRef.current !== userId) return;
    const current = readCartStore();
    const nextStorage = userId
      ? { ...current, users: { ...current.users, [String(userId)]: cart } }
      : { ...current, guest: cart };
    writeCartStore(nextStorage);
  }, [cart, userId]);

  useEffect(() => {
    const current = readCartStore();
    if (!userId) {
      setCart(current.guest);
      initializedUserIdRef.current = null;
      return;
    }

    const userCart = current.users[String(userId)] || [];
    const merged = [...userCart];
    current.guest.forEach((guestItem) => {
      const existing = merged.find((item) => sameProductId(item, guestItem));
      if (existing) existing.quantity += guestItem.quantity;
      else merged.push(guestItem);
    });
    const nextStorage = { guest: [], users: { ...current.users, [String(userId)]: merged } };
    setCart(merged);
    initializedUserIdRef.current = String(userId);
    writeCartStore(nextStorage);
  }, [userId]);

  const addToCart = (productId, quantity = 1, installation = false) => {
    setCart((current) => {
      const existing = current.find((item) => sameProductId(item, productId));
      if (existing) {
        return current.map((item) =>
          sameProductId(item, productId)
            ? { ...item, quantity: item.quantity + quantity, installation: item.installation || installation }
            : item
        );
      }
      return [...current, { id: productId, productId, quantity, installation }];
    });
  };

  const setQuantity = (productId, quantity) => {
    setCart((current) =>
      quantity < 1
        ? current.filter((item) => !sameProductId(item, productId))
        : current.map((item) => (sameProductId(item, productId) ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (productId) => {
    setCart((current) => current.filter((item) => !sameProductId(item, productId)));
  };

  const clearCart = () => {
    setCart([]);
  };

  const value = {
    cart,
    addToCart,
    setQuantity,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}

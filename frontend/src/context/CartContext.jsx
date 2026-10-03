import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "hv-cart";

function sameCartLine(first, second) {
  const firstIsBundle = first?.type === "bundle" || Boolean(first?.bundleId);
  const secondIsBundle = second?.type === "bundle" || Boolean(second?.bundleId);
  if (firstIsBundle || secondIsBundle) {
    return firstIsBundle && secondIsBundle
      && String(first?.bundleId || first?.id || "") === String(second?.bundleId || second?.id || "");
  }
  return String(first?.id || first?.productId || first) === String(second?.id || second?.productId || second);
}

function normalizeCartItem(item) {
  if ((item?.type === "bundle" || item?.bundleId) && item?.bundleId) {
    return {
      ...item,
      id: `bundle:${item.bundleId}`,
      productId: `bundle:${item.bundleId}`,
      type: "bundle",
      quantity: Math.max(1, Number(item.quantity || 1)),
    };
  }
  const productId = item?.productId || item?.id;
  return productId
    ? { ...item, id: productId, productId, quantity: Number(item.quantity || 0) }
    : null;
}

function normalizeCartItems(items) {
  return (Array.isArray(items) ? items : []).map(normalizeCartItem).filter(Boolean);
}

function readCartStore() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { guest: normalizeCartItems(parsed), users: {} };
    return {
      guest: normalizeCartItems(parsed.guest),
      users: parsed.users && typeof parsed.users === "object"
        ? Object.fromEntries(Object.entries(parsed.users).map(([userId, items]) => [userId, normalizeCartItems(items)]))
        : {},
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
  const [cart, setCart] = useState(() => {
    const storedCart = readCartStore();
    return userId
      ? storedCart.users[String(userId)] || []
      : storedCart.guest;
  });
  const initializedUserIdRef = useRef(userId);

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
      const existing = merged.find((item) => sameCartLine(item, guestItem));
      if (existing) existing.quantity += guestItem.quantity;
      else merged.push(guestItem);
    });
    const nextStorage = { guest: [], users: { ...current.users, [String(userId)]: merged } };
    setCart(merged);
    initializedUserIdRef.current = String(userId);
    writeCartStore(nextStorage);
  }, [userId]);

  const addToCart = (productId, quantity = 1, installation = false, product = null) => {
    setCart((current) => {
      const productRef = { id: productId, type: "product" };
      const existing = current.find((item) => sameCartLine(item, productRef));
      if (existing) {
        return current.map((item) =>
          sameCartLine(item, productRef)
            ? { ...item, id: productId, productId, product: product || item.product, quantity: Number(item.quantity || 0) + quantity, installation: item.installation || installation }
            : item
        );
      }
      return [...current, { id: productId, productId, product, quantity, installation }];
    });
  };

  const addBundleToCart = (bundleId, bundle) => {
    const bundleRef = { type: "bundle", bundleId: String(bundleId) };
    setCart((current) => {
      const existing = current.find((item) => sameCartLine(item, bundleRef));
      if (existing) {
        return current.map((item) => sameCartLine(item, bundleRef)
          ? { ...item, bundle, quantity: Number(item.quantity || 1) + 1 }
          : item);
      }
      return [...current, normalizeCartItem({ ...bundleRef, bundle, quantity: 1 })];
    });
  };

  const setQuantity = (productId, quantity) => {
    const target = typeof productId === "object" ? productId : { id: productId, type: "product" };
    setCart((current) =>
      quantity < 1
        ? current.filter((item) => !sameCartLine(item, target))
        : current.map((item) => (sameCartLine(item, target) ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (productId) => {
    const target = typeof productId === "object" ? productId : { id: productId, type: "product" };
    setCart((current) => current.filter((item) => !sameCartLine(item, target)));
  };

  const clearCart = () => {
    setCart([]);
  };

  const value = {
    cart,
    addToCart,
    addBundleToCart,
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

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);
const WISHLIST_STORAGE_KEY = "hv-wishlist";

function readWishlistStore() {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
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

function writeWishlistStore(store) {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(store));
  } catch {
    console.error("Failed to persist wishlist to localStorage");
  }
}

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || user?._id || null;
  const [wishlist, setWishlist] = useState(() => readWishlistStore().guest);
  const initializedUserIdRef = useRef(undefined);

  useEffect(() => {
    if (initializedUserIdRef.current !== userId) return;
    const current = readWishlistStore();
    const nextStorage = userId
      ? { ...current, users: { ...current.users, [String(userId)]: wishlist } }
      : { ...current, guest: wishlist };
    writeWishlistStore(nextStorage);
  }, [wishlist, userId]);

  useEffect(() => {
    const current = readWishlistStore();
    if (!userId) {
      setWishlist(current.guest);
      initializedUserIdRef.current = null;
      return;
    }

    const merged = [...new Set([...(current.users[String(userId)] || []), ...current.guest])];
    const nextStorage = { guest: [], users: { ...current.users, [String(userId)]: merged } };
    setWishlist(merged);
    initializedUserIdRef.current = String(userId);
    writeWishlistStore(nextStorage);
  }, [userId]);

  const toggleWishlist = (productId) => {
    setWishlist((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]
    );
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  const moveToCart = (productIds, addToCartFn) => {
    const ids = new Set(productIds);
    ids.forEach((productId) => {
      addToCartFn(productId, 1, false);
    });
    setWishlist((current) => current.filter((id) => !ids.has(id)));
  };

  const value = {
    wishlist,
    toggleWishlist,
    clearWishlist,
    moveToCart,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
}

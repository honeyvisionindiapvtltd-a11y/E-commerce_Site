import { createContext, useContext, useEffect, useState } from "react";
import { products } from "../lib/products";

const CommerceContext = createContext(null);
const storageKey = "honey-vision-commerce";

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

export function CommerceProvider({ children }) {
  const [store, setStore] = useState(readStore);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(store));
  }, [store]);

  const cart = store.cart || [];
  const wishlist = store.wishlist || [];
  const orders = store.orders || [];

  const update = (next) => setStore((current) => ({ ...current, ...next }));

  const addToCart = (productId, quantity = 1, installation = false) => {
    setStore((current) => {
      const currentCart = current.cart || [];
      return { ...current, cart: currentCart.some((item) => item.productId === productId)
        ? currentCart.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity, installation: item.installation || installation }
              : item
          )
        : [...currentCart, { productId, quantity, installation }],
      };
    });
  };

  const setQuantity = (productId, quantity) => {
    update({
      cart: quantity < 1 ? cart.filter((item) => item.productId !== productId) : cart.map((item) => item.productId === productId ? { ...item, quantity } : item),
    });
  };

  const toggleWishlist = (productId) => {
    setStore((current) => {
      const currentWishlist = current.wishlist || [];
      return { ...current, wishlist: currentWishlist.includes(productId) ? currentWishlist.filter((id) => id !== productId) : [...currentWishlist, productId] };
    });
  };

  const moveWishlistToCart = (productIds) => {
    setStore((current) => {
      const ids = new Set(productIds);
      const currentCart = current.cart || [];
      const nextCart = [...currentCart];
      ids.forEach((productId) => {
        const existing = nextCart.find((item) => item.productId === productId);
        if (existing) existing.quantity += 1;
        else nextCart.push({ productId, quantity: 1, installation: false });
      });
      return { ...current, cart: nextCart, wishlist: (current.wishlist || []).filter((id) => !ids.has(id)) };
    });
  };

  const placeOrder = ({ address, paymentMethod, installationSlot }) => {
    const items = cart.map((item) => ({ ...item, product: products.find((product) => product.id === item.productId) })).filter((item) => item.product);
    const subtotal = items.reduce((total, item) => total + item.product.price * item.quantity, 0);
    const installationFee = items.filter((item) => item.installation).length * 499;
    const order = {
      id: `HV${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
      status: paymentMethod === "cod" ? "Order placed" : "Payment pending",
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "Pay on delivery" : "Awaiting payment gateway",
      address,
      installationSlot: installationFee ? installationSlot : null,
      items,
      subtotal,
      shipping: subtotal >= 999 ? 0 : 99,
      installationFee,
      total: subtotal + (subtotal >= 999 ? 0 : 99) + installationFee,
    };
    update({ orders: [order, ...orders], cart: [] });
    return order;
  };

  const clearWishlist = () => update({ wishlist: [] });

  const value = {
    products,
    cart,
    wishlist,
    orders,
    deliveryPin: store.deliveryPin || "751001",
    setDeliveryPin: (deliveryPin) => update({ deliveryPin }),
    addToCart,
    setQuantity,
    removeFromCart: (productId) => setQuantity(productId, 0),
    toggleWishlist,
    moveWishlistToCart,
    clearWishlist,
    placeOrder,
  };

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCommerce() {
  const context = useContext(CommerceContext);
  if (!context) throw new Error("useCommerce must be used within CommerceProvider");
  return context;
}

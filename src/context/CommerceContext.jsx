import { createContext, useContext, useEffect, useState } from "react";
import { products } from "../lib/products";

const CommerceContext = createContext(null);
const storageKey = "honey-vision-commerce";

const defaultProfile = {
  fullName: "Biswapriti Jena",
  email: "info@honeyvision.in",
  phone: "+91 98765 43210",
  alternatePhone: "+91 674 123 4567",
  dateOfBirth: "",
  gender: "Female",
  location: "Bhubaneswar, Odisha",
  city: "Bhubaneswar",
  state: "Odisha",
  pinCode: "751001",
  country: "India",
  address: "Plot No. 123, Patia, Bhubaneswar",
  emergencyContact: "+91 70000 12345",
  bio: "",
  memberSince: "2026",
};

const defaultAddresses = [
  {
    id: 1,
    type: "Home",
    label: "Default Address",
    fullName: "Biswapriti Jena",
    phone: "+91 98765 43210",
    address: "Plot No. 123, Patia",
    city: "Bhubaneswar",
    state: "Odisha",
    pin: "751024",
    country: "India",
    isDefault: true,
  },
  {
    id: 2,
    type: "Office",
    label: "Work Address",
    fullName: "Biswapriti Jena",
    phone: "+91 70445 12345",
    address: "Honey Vision Office, 3rd Floor",
    city: "Bhubaneswar",
    state: "Odisha",
    pin: "751001",
    country: "India",
    isDefault: false,
  },
];

const defaultPaymentMethods = [
  {
    id: 1,
    type: "Visa",
    last4: "4242",
    holder: "Biswapriti Jena",
    expiry: "09/29",
    default: true,
  },
  {
    id: 2,
    type: "Mastercard",
    last4: "8891",
    holder: "Biswapriti Jena",
    expiry: "12/28",
    default: false,
  },
];

const defaultNotifications = [
  { id: 1, title: "Order Updates", description: "Shipment and delivery status updates", enabled: true, icon: "mail" },
  { id: 2, title: "Promotions", description: "Offers, discounts, and new arrivals", enabled: true, icon: "message" },
  { id: 3, title: "Security Alerts", description: "Important account safety notifications", enabled: true, icon: "shield" },
  { id: 4, title: "App Push", description: "Instant alerts on your mobile device", enabled: false, icon: "phone" },
];

const defaultAccountSettings = [
  { id: 1, title: "Profile Visibility", description: "Choose who can view your public account details.", enabled: true },
  { id: 2, title: "Security Preferences", description: "Manage your login security and verification methods.", enabled: true },
  { id: 3, title: "Password & Access", description: "Update your password and recovery options.", enabled: true },
  { id: 4, title: "Alerts & Activity", description: "Track recent sign-ins and account activity.", enabled: false },
];

function readStore() {
  const fallback = {
    cart: [],
    wishlist: [],
    orders: [],
    deliveryPin: "751001",
    profile: defaultProfile,
    addresses: defaultAddresses,
    paymentMethods: defaultPaymentMethods,
    notifications: defaultNotifications,
    accountSettings: defaultAccountSettings,
  };

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) || {};

    return {
      ...fallback,
      ...parsed,
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      deliveryPin: parsed.deliveryPin || "751001",
      profile: { ...defaultProfile, ...(parsed.profile || {}) },
      addresses: Array.isArray(parsed.addresses) ? parsed.addresses : defaultAddresses,
      paymentMethods: Array.isArray(parsed.paymentMethods) ? parsed.paymentMethods : defaultPaymentMethods,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : defaultNotifications,
      accountSettings: Array.isArray(parsed.accountSettings) ? parsed.accountSettings : defaultAccountSettings,
    };
  } catch {
    return fallback;
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
  const profile = store.profile || defaultProfile;
  const addresses = store.addresses || defaultAddresses;
  const paymentMethods = store.paymentMethods || defaultPaymentMethods;
  const notifications = store.notifications || defaultNotifications;
  const accountSettings = store.accountSettings || defaultAccountSettings;

  const update = (next) => setStore((current) => ({ ...current, ...next }));

  const addToCart = (productId, quantity = 1, installation = false) => {
    setStore((current) => {
      const currentCart = current.cart || [];
      return {
        ...current,
        cart: currentCart.some((item) => item.productId === productId)
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
    setStore((current) => ({
      ...current,
      cart: quantity < 1 ? (current.cart || []).filter((item) => item.productId !== productId) : (current.cart || []).map((item) => item.productId === productId ? { ...item, quantity } : item),
    }));
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
    const items = cart
      .map((item) => ({ ...item, product: products.find((product) => product.id === item.productId) }))
      .filter((item) => item.product);
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

  const updateProfile = (nextProfile) => {
    update({
      profile: {
        ...profile,
        ...nextProfile,
        location: nextProfile.location || `${nextProfile.city || profile.city || "Bhubaneswar"}, ${nextProfile.state || profile.state || "Odisha"}`,
      },
    });
  };

  const addAddress = (newAddress) => {
    setStore((current) => {
      const currentAddresses = current.addresses || defaultAddresses;
      const withNew = [...currentAddresses, { ...newAddress, id: newAddress.id || Date.now() }];
      return { ...current, addresses: withNew };
    });
  };

  const removeAddress = (id) => {
    setStore((current) => ({
      ...current,
      addresses: (current.addresses || []).filter((address) => address.id !== id),
    }));
  };

  const setDefaultAddress = (id) => {
    setStore((current) => ({
      ...current,
      addresses: (current.addresses || []).map((address) => ({
        ...address,
        isDefault: address.id === id,
      })),
    }));
  };

  const addPaymentMethod = (card) => {
    setStore((current) => ({
      ...current,
      paymentMethods: [...(current.paymentMethods || []), { ...card, id: card.id || Date.now() }],
    }));
  };

  const removePaymentMethod = (id) => {
    setStore((current) => ({
      ...current,
      paymentMethods: (current.paymentMethods || []).filter((card) => card.id !== id),
    }));
  };

  const setDefaultPaymentMethod = (id) => {
    setStore((current) => ({
      ...current,
      paymentMethods: (current.paymentMethods || []).map((card) => ({
        ...card,
        default: card.id === id,
      })),
    }));
  };

  const toggleNotification = (id) => {
    setStore((current) => ({
      ...current,
      notifications: (current.notifications || []).map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item),
    }));
  };

  const toggleAccountSetting = (id) => {
    setStore((current) => ({
      ...current,
      accountSettings: (current.accountSettings || []).map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item),
    }));
  };

  const value = {
    products,
    cart,
    wishlist,
    orders,
    profile,
    addresses,
    paymentMethods,
    notifications,
    accountSettings,
    deliveryPin: store.deliveryPin || "751001",
    setDeliveryPin: (deliveryPin) => update({ deliveryPin }),
    addToCart,
    setQuantity,
    removeFromCart: (productId) => setQuantity(productId, 0),
    toggleWishlist,
    moveWishlistToCart,
    clearWishlist,
    placeOrder,
    updateProfile,
    addAddress,
    removeAddress,
    setDefaultAddress,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    toggleNotification,
    toggleAccountSetting,
  };

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCommerce() {
  const context = useContext(CommerceContext);
  if (!context) throw new Error("useCommerce must be used within CommerceProvider");
  return context;
}

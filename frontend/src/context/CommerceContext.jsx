import { createContext, useContext, useEffect, useState } from "react";
import { products } from "../lib/products";

const CommerceContext = createContext(null);
const storageKey = "honey-vision-commerce";
const API_BASE = import.meta.env.VITE_API_URL || "/api";

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

function sanitizeProfile(profile = {}) {
  return Object.entries(defaultProfile).reduce((clean, [key, defaultValue]) => ({
    ...clean,
    [key]: profile[key] != null && profile[key] !== defaultValue ? profile[key] : "",
  }), {});
}

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
    installationBookings: [],
    isLoggedIn: false,
    user: null,
    authToken: null,
    deliveryPin: "751001",
    profile: defaultProfile,
    addresses: defaultAddresses,
    paymentMethods: defaultPaymentMethods,
    notifications: defaultNotifications,
    accountSettings: defaultAccountSettings,
    userStates: {},
  };

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) || {};
    const userStates = parsed.userStates || {};
    const isLoggedIn = Boolean(parsed.isLoggedIn) || Boolean(parsed.user);
    const profile = isLoggedIn ? sanitizeProfile(parsed.profile || {}) : { ...defaultProfile, ...(parsed.profile || {}) };
    const currentUserId = parsed.user?.id || parsed.user?._id || null;
    const userState = currentUserId ? userStates[currentUserId] || {} : null;

    const storedCart = Array.isArray(parsed.cart) ? parsed.cart : [];
    const storedWishlist = Array.isArray(parsed.wishlist) ? parsed.wishlist : [];
    const storedOrders = Array.isArray(parsed.orders) ? parsed.orders : [];
    const storedInstallationBookings = Array.isArray(parsed.installationBookings) ? parsed.installationBookings : [];
    const storedAddresses = Array.isArray(parsed.addresses) ? parsed.addresses : defaultAddresses;

    return {
      ...fallback,
      ...parsed,
      userStates,
      cart: userState?.cart ?? storedCart,
      wishlist: userState?.wishlist ?? storedWishlist,
      orders: userState?.orders ?? storedOrders,
      installationBookings: userState?.installationBookings ?? storedInstallationBookings,
      isLoggedIn,
      user: parsed.user || null,
      authToken: parsed.authToken || null,
      deliveryPin: parsed.deliveryPin || "751001",
      profile,
      addresses: userState?.addresses ?? storedAddresses,
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
  const installationBookings = store.installationBookings || [];
  const isLoggedIn = Boolean(store.isLoggedIn);
  const user = store.user || null;
  const authToken = store.authToken || null;
  const profile = store.profile || defaultProfile;
  const addresses = store.addresses || defaultAddresses;
  const paymentMethods = store.paymentMethods || defaultPaymentMethods;
  const notifications = store.notifications || defaultNotifications;
  const accountSettings = store.accountSettings || defaultAccountSettings;

  const requestJson = async (path, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    const response = await fetch(`${API_BASE}${path}`, {
      headers,
      ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        update({ isLoggedIn: false, user: null, authToken: null, profile: defaultProfile });
      }
      throw new Error(data.message || data.error || "Request failed");
    }

    return data;
  };

  const update = (next) => setStore((current) => {
    const merged = { ...current, ...next };
    const userId = merged.user?.id || null;
    const userStates = merged.userStates || current.userStates || {};

    if (userId) {
      userStates[userId] = {
        ...userStates[userId],
        cart: merged.cart,
        wishlist: merged.wishlist,
        addresses: merged.addresses,
        orders: merged.orders,
        installationBookings: merged.installationBookings,
      };
    }

    return { ...merged, userStates };
  });

  const addToCart = (productId, quantity = 1, installation = false) => {
    update({
      cart: cart.some((item) => item.productId === productId)
        ? cart.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity, installation: item.installation || installation }
              : item
          )
        : [...cart, { productId, quantity, installation }],
    });
  };

  const setQuantity = (productId, quantity) => {
    update({
      cart: quantity < 1 ? cart.filter((item) => item.productId !== productId) : cart.map((item) => item.productId === productId ? { ...item, quantity } : item),
    });
  };

  const toggleWishlist = (productId) => {
    update({
      wishlist: wishlist.includes(productId) ? wishlist.filter((id) => id !== productId) : [...wishlist, productId],
    });
  };

  const moveWishlistToCart = (productIds) => {
    const ids = new Set(productIds);
    const nextCart = [...cart];
    ids.forEach((productId) => {
      const existing = nextCart.find((item) => item.productId === productId);
      if (existing) existing.quantity += 1;
      else nextCart.push({ productId, quantity: 1, installation: false });
    });
    update({ cart: nextCart, wishlist: wishlist.filter((id) => !ids.has(id)) });
  };

  const placeOrder = async ({ address, paymentMethod, installationSlot }) => {
    const items = cart
      .map((item) => ({ ...item, product: products.find((product) => product.id === item.productId) }))
      .filter((item) => item.product);

    const orderPayload = {
      userId: user?.id || null,
      items,
      address,
      paymentMethod,
      installationSlot,
    };

    const data = authToken
      ? await requestJson("/orders", {
          method: "POST",
          body: JSON.stringify(orderPayload),
        })
      : {
          ...orderPayload,
          id: `HV${Date.now().toString().slice(-8)}`,
          createdAt: new Date().toISOString(),
          status: paymentMethod === "cod" ? "Order placed" : "Payment pending",
          paymentStatus: paymentMethod === "cod" ? "Pay on delivery" : "Awaiting payment gateway",
          subtotal: items.reduce((total, item) => total + item.product.price * item.quantity, 0),
          shipping: items.reduce((total, item) => total + item.product.price * item.quantity, 0) >= 999 ? 0 : 99,
          installationFee: items.filter((item) => item.installation).length * 499,
          total:
            items.reduce((total, item) => total + item.product.price * item.quantity, 0) +
            (items.reduce((total, item) => total + item.product.price * item.quantity, 0) >= 999 ? 0 : 99) +
            items.filter((item) => item.installation).length * 499,
        };

    update({ orders: [data, ...orders], cart: [] });
    return data;
  };

  const clearWishlist = () => update({ wishlist: [] });

  const login = async (email, password) => {
    const data = await requestJson("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setStore((current) => {
      const userStates = current.userStates || {};
      const userState = userStates[data.user.id] || {};

      return {
        ...current,
        isLoggedIn: true,
        user: data.user,
        authToken: data.token,
        profile: { ...profile, ...data.profile },
        cart: userState.cart || current.cart || [],
        wishlist: userState.wishlist || current.wishlist || [],
        orders: userState.orders || current.orders || [],
        installationBookings: userState.installationBookings || current.installationBookings || [],
        addresses: userState.addresses || current.addresses || defaultAddresses,
        userStates: {
          ...userStates,
          [data.user.id]: {
            ...userState,
            cart: userState.cart || current.cart || [],
            wishlist: userState.wishlist || current.wishlist || [],
            orders: userState.orders || current.orders || [],
            installationBookings: userState.installationBookings || current.installationBookings || [],
            addresses: userState.addresses || current.addresses || defaultAddresses,
          },
        },
      };
    });

    return data.user;
  };

  const register = async (payload) => {
    const data = await requestJson("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setStore((current) => {
      const userStates = current.userStates || {};
      const userState = userStates[data.user.id] || {};

      return {
        ...current,
        isLoggedIn: true,
        user: data.user,
        authToken: data.token,
        profile: { ...profile, ...data.profile },
        cart: userState.cart || current.cart || [],
        wishlist: userState.wishlist || current.wishlist || [],
        orders: userState.orders || current.orders || [],
        installationBookings: userState.installationBookings || current.installationBookings || [],
        addresses: userState.addresses || current.addresses || defaultAddresses,
        userStates: {
          ...userStates,
          [data.user.id]: {
            ...userState,
            cart: userState.cart || current.cart || [],
            wishlist: userState.wishlist || current.wishlist || [],
            orders: userState.orders || current.orders || [],
            installationBookings: userState.installationBookings || current.installationBookings || [],
            addresses: userState.addresses || current.addresses || defaultAddresses,
          },
        },
      };
    });

    return data.user;
  };

  const fetchProfile = async () => {
    const data = await requestJson("/auth/profile");
    update({
      isLoggedIn: true,
      user: data.user,
      profile: { ...profile, ...data.profile },
    });
    return data;
  };

  const fetchOrders = async () => {
    if (!authToken || !user?.id) return [];
    const data = await requestJson(`/orders?userId=${encodeURIComponent(user.id)}`);
    update({ orders: data });
    return data;
  };

  const fetchInstallations = async () => {
    if (!authToken || !user?.id) return [];
    const data = await requestJson(`/installations?userId=${encodeURIComponent(user.id)}`);
    update({ installationBookings: data });
    return data;
  };

  useEffect(() => {
    if (authToken) {
      Promise.all([fetchProfile(), fetchOrders(), fetchInstallations()]).catch(() => {});
    }
  }, [authToken]);

  const logout = () => {
    setStore((current) => ({
      ...current,
      cart: [],
      wishlist: [],
      orders: [],
      installationBookings: [],
      isLoggedIn: false,
      user: null,
      authToken: null,
      profile: defaultProfile,
      addresses: defaultAddresses,
    }));
  };

  const addInstallationBooking = async (booking) => {
    const data = authToken
      ? await requestJson("/installations", {
          method: "POST",
          body: JSON.stringify({ ...booking, userId: user?.id }),
        })
      : {
          ...booking,
          id: `INSTALL-${Date.now().toString().slice(-6)}`,
          status: "requested",
          userId: user?.id || null,
          createdAt: new Date().toISOString(),
        };

    update({ installationBookings: [data, ...installationBookings] });

    return data;
  };

  const updateProfile = async (nextProfile) => {
    if (!authToken) {
      throw new Error("Unauthorized. Please log in to update your profile.");
    }

    const payload = {
      ...nextProfile,
      location: nextProfile.location || [nextProfile.city || profile.city, nextProfile.state || profile.state].filter(Boolean).join(", "),
    };

    const data = await requestJson("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    const updatedProfile = { ...profile, ...data.profile };

    update({
      profile: updatedProfile,
      user: data.user
        ? {
            ...user,
            name: data.user.name || user?.name,
            email: data.user.email || user?.email,
            phone: data.user.phone || user?.phone,
          }
        : user,
    });

    return data;
  };

  const addAddress = (newAddress) => {
    const withNew = [
      ...addresses,
      {
        ...newAddress,
        id: newAddress.id || Date.now(),
        userId: user?.id || null,
      },
    ];
    update({ addresses: withNew });
  };

  const removeAddress = (id) => {
    update({ addresses: addresses.filter((address) => address.id !== id) });
  };

  const setDefaultAddress = (id) => {
    update({
      addresses: addresses.map((address) => ({
        ...address,
        isDefault: address.id === id,
      })),
    });
  };

  const addPaymentMethod = (card) => {
    update({ paymentMethods: [...paymentMethods, { ...card, id: card.id || Date.now() }] });
  };

  const removePaymentMethod = (id) => {
    update({ paymentMethods: paymentMethods.filter((card) => card.id !== id) });
  };

  const setDefaultPaymentMethod = (id) => {
    update({
      paymentMethods: paymentMethods.map((card) => ({
        ...card,
        default: card.id === id,
      })),
    });
  };

  const toggleNotification = (id) => {
    update({
      notifications: notifications.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item),
    });
  };

  const toggleAccountSetting = (id) => {
    update({
      accountSettings: accountSettings.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item),
    });
  };

  const value = {
    products,
    cart,
    wishlist,
    orders,
    installationBookings,
    isLoggedIn,
    user,
    authToken,
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
    login,
    register,
    logout,
    addInstallationBooking,
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

import { createElement } from "react";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "./useAuth";
import { CartProvider, useCart } from "./CartContext";
import { WishlistProvider, useWishlist } from "./WishlistContext";
import { ProfileProvider, useProfile } from "./ProfileContext";
import { UIProvider, useUI } from "./UIContext";
import { CatalogProvider, useCatalog } from "./CatalogContext";
import { DeliveryProvider, useDelivery } from "./DeliveryContext";
import { OrdersProvider, useOrders } from "./OrdersContext";
import { NotificationProvider } from "./NotificationContext";
import { useNotificationContext } from "./useNotificationContext";

/**
 * CommerceProvider - Main wrapper for all commerce-related contexts
 * Replaces the monolithic CommerceContext with a modular architecture
 */
export function CommerceProvider({ children }) {
  const providers = [
    AuthProvider,
    CartProvider,
    WishlistProvider,
    ProfileProvider,
    UIProvider,
    CatalogProvider,
    DeliveryProvider,
    OrdersProvider,
    NotificationProvider,
  ];

  return providers.reduceRight(
    (content, Provider) => createElement(Provider, null, content),
    children
  );
}

/**
 * useCommerce - Compatibility hook that assembles the old useCommerce interface
 * This allows existing components to continue working without immediate refactoring
 */
export function useCommerce() {
  const auth = useAuth();
  const cartCtx = useCart();
  const wishlistCtx = useWishlist();
  const profileCtx = useProfile();
  const uiCtx = useUI();
  const catalogCtx = useCatalog();
  const deliveryCtx = useDelivery();
  const ordersCtx = useOrders();

  return {
    // Auth
    isLoggedIn: auth.isLoggedIn,
    user: auth.user,
    authToken: auth.authToken,
    login: auth.login,
    register: auth.register,
    logout: auth.logout,
    loginWithGoogle: auth.loginWithGoogle,
    requestPasswordReset: auth.requestPasswordReset,
    resetPassword: auth.resetPassword,

    // Cart
    cart: Array.isArray(cartCtx.cart) ? cartCtx.cart : [],
    addToCart: cartCtx.addToCart,
    removeFromCart: cartCtx.removeFromCart,
    setQuantity: cartCtx.setQuantity,
    clearCart: cartCtx.clearCart,

    // Wishlist
    wishlist: Array.isArray(wishlistCtx.wishlist) ? wishlistCtx.wishlist : [],
    toggleWishlist: wishlistCtx.toggleWishlist,
    clearWishlist: wishlistCtx.clearWishlist,
    moveWishlistToCart: (productIds) => wishlistCtx.moveToCart(productIds, cartCtx.addToCart),

    // Profile
    profile: profileCtx.profile,
    addresses: profileCtx.addresses,
    paymentMethods: profileCtx.paymentMethods,
    fetchProfile: profileCtx.fetchProfile,
    updateProfile: profileCtx.updateProfile,
    fetchAddresses: profileCtx.fetchAddresses,
    addAddress: profileCtx.addAddress,
    updateAddress: profileCtx.updateAddress,
    removeAddress: profileCtx.removeAddress,
    setDefaultAddress: profileCtx.setDefaultAddress,
    validateAddress: profileCtx.validateAddress,
    refreshAddresses: profileCtx.fetchAddresses,
    addPaymentMethod: profileCtx.addPaymentMethod,
    removePaymentMethod: profileCtx.removePaymentMethod,
    setDefaultPaymentMethod: profileCtx.setDefaultPaymentMethod,

    // UI
    notifications: uiCtx.notifications,
    accountSettings: uiCtx.accountSettings,
    toggleNotification: uiCtx.toggleNotification,
    toggleAccountSetting: uiCtx.toggleAccountSetting,

    // Catalog
    products: Array.isArray(catalogCtx.products) ? catalogCtx.products : [],

    // Delivery
    deliveryPin: deliveryCtx.deliveryPin,
    deliveryLocation: deliveryCtx.deliveryLocation,
    couponApplied: deliveryCtx.couponApplied,
    selectedDeliveryAddress: deliveryCtx.selectedDeliveryAddress,
    setCouponApplied: deliveryCtx.setCouponApplied,
    setDeliveryPin: deliveryCtx.setDeliveryPin,
    setSelectedDeliveryAddress: deliveryCtx.setSelectedDeliveryAddress,
    checkDeliveryByPincode: deliveryCtx.checkDeliveryByPincode,
    checkDeliveryByLocation: deliveryCtx.checkDeliveryByLocation,

    // Orders
    orders: ordersCtx.orders,
    installationBookings: ordersCtx.installationBookings,
    placeOrder: ordersCtx.placeOrder,
    fetchOrders: ordersCtx.fetchOrders,
    fetchInstallations: ordersCtx.fetchInstallations,
    createInstallationBooking: ordersCtx.createInstallationBooking,
    createInstallationPayment: ordersCtx.createInstallationPayment,
    verifyInstallationPayment: ordersCtx.verifyInstallationPayment,
    markInstallationPaymentFailed: ordersCtx.markInstallationPaymentFailed,
    markInstallationPaymentCancelled: ordersCtx.markInstallationPaymentCancelled,
    fetchInstallation: ordersCtx.fetchInstallation,

    // Internal helpers
    requestJson: auth.requestJson,

    // Persistent notifications
    notificationContext: useNotificationContext(),
  };
}

/**
 * localStorage Migration Utility
 * Handles migration from old monolithic storage key to new modular keys
 */

const OLD_KEY = "honey-vision-commerce";
const NEW_KEYS = {
  auth: "hv-auth",
  cart: "hv-cart",
  wishlist: "hv-wishlist",
  delivery: "hv-delivery",
  ui: "hv-ui-prefs",
};

/**
 * Migrate old localStorage format to new modular format
 * Safe to call multiple times - will only migrate once
 */
export function migrateOldLocalStorage() {
  try {
    // Check if migration already done
    if (localStorage.getItem("hv-migration-done")) {
      return;
    }

    const oldRaw = localStorage.getItem(OLD_KEY);
    if (!oldRaw) {
      // No old data to migrate
      localStorage.setItem("hv-migration-done", "true");
      return;
    }

    const oldData = JSON.parse(oldRaw);
    if (!oldData || typeof oldData !== "object" || Array.isArray(oldData)) {
      throw new Error("Legacy commerce storage must contain an object");
    }

    const setIfMissing = (key, value) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));
    };

    // Migrate auth data
    const auth = {
      isLoggedIn: Boolean(oldData.isLoggedIn && oldData.authToken),
      user: oldData.user || null,
      authToken: oldData.authToken || null,
    };
    setIfMissing(NEW_KEYS.auth, auth);

    // Migrate cart data
    const cart = Array.isArray(oldData.cart) ? oldData.cart : [];
    const currentUserId = oldData.user?.id || oldData.user?._id;
    const userCarts = {};
    if (oldData.userStates && typeof oldData.userStates === "object") {
      Object.entries(oldData.userStates).forEach(([userId, userState]) => {
        if (Array.isArray(userState?.cart)) userCarts[userId] = userState.cart;
      });
    }
    if (currentUserId && !userCarts[String(currentUserId)]) userCarts[String(currentUserId)] = cart;
    setIfMissing(NEW_KEYS.cart, { guest: currentUserId ? [] : cart, users: userCarts });

    // Migrate wishlist data
    const wishlist = Array.isArray(oldData.wishlist) ? oldData.wishlist : [];
    const userWishlists = {};
    if (oldData.userStates && typeof oldData.userStates === "object") {
      Object.entries(oldData.userStates).forEach(([userId, userState]) => {
        if (Array.isArray(userState?.wishlist)) userWishlists[userId] = userState.wishlist;
      });
    }
    if (currentUserId && !userWishlists[String(currentUserId)]) userWishlists[String(currentUserId)] = wishlist;
    setIfMissing(NEW_KEYS.wishlist, { guest: currentUserId ? [] : wishlist, users: userWishlists });

    // Migrate delivery data
    const delivery = {
      deliveryPin: oldData.deliveryPin || "751001",
      deliveryLocation: oldData.deliveryLocation || {
        pincode: "751001",
        city: "Bhubaneswar",
        state: "Odisha",
      },
      couponApplied: Boolean(oldData.couponApplied),
    };
    setIfMissing(NEW_KEYS.delivery, delivery);

    // Migrate UI preferences
    const ui = {};
    if (Array.isArray(oldData.notifications) && oldData.notifications.length) ui.notifications = oldData.notifications;
    if (Array.isArray(oldData.accountSettings) && oldData.accountSettings.length) ui.accountSettings = oldData.accountSettings;
    setIfMissing(NEW_KEYS.ui, ui);

    // Mark migration as done
    localStorage.setItem("hv-migration-done", "true");

    // Optionally remove old key (uncomment if safe to delete)
    // localStorage.removeItem(OLD_KEY);

    console.log("✓ Successfully migrated localStorage from old format to new modular format");
  } catch (error) {
    console.error("Failed to migrate localStorage:", error);
    // Don't throw - migration is non-critical
  }
}

const RECENTLY_VIEWED_STORAGE_KEY = "honeyvision_recently_viewed";
export const RECENTLY_VIEWED_EVENT = "honeyvision-recently-viewed";

function readRecentlyViewedStore() {
  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    if (!raw) return { guest: [], users: {} };

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { guest: parsed, users: {} };

    return {
      guest: Array.isArray(parsed.guest) ? parsed.guest : [],
      users: parsed.users && typeof parsed.users === "object" ? parsed.users : {},
    };
  } catch (error) {
    console.error("Failed to read recently viewed products from localStorage", error);
    return { guest: [], users: {} };
  }
}

function getUserViewedProducts(store, userId) {
  if (userId == null) return store.guest;
  const viewed = store.users[String(userId)];
  return Array.isArray(viewed) ? viewed : [];
}

export function getRecentlyViewed(userId) {
  return getUserViewedProducts(readRecentlyViewedStore(), userId);
}

export function trackRecentlyViewed(productId, userId) {
  const store = readRecentlyViewedStore();
  const viewedIds = getUserViewedProducts(store, userId);
  const nextIds = [
    productId,
    ...viewedIds.filter((id) => String(id) !== String(productId)),
  ].slice(0, 6);

  const nextStore = userId == null
    ? { ...store, guest: nextIds }
    : { ...store, users: { ...store.users, [String(userId)]: nextIds } };

  try {
    window.localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(nextStore));
    window.dispatchEvent(new Event(RECENTLY_VIEWED_EVENT));
  } catch (error) {
    console.error("Failed to persist recently viewed products to localStorage", error);
  }

  return nextIds;
}

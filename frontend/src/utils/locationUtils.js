export const LOCATION_DELAYED_THRESHOLD_MS = 120000;
export const LOCATION_STALE_THRESHOLD_MS = 300000;
export const DELIVERY_NEARBY_DISTANCE_METERS = 500;

export const getGoogleCoordinate = (value) => {
  const coordinate = typeof value === "function" ? value() : value;
  return Number(coordinate);
};

export const isValidCoordinatePair = (latitude, longitude) => (
  Number.isFinite(latitude)
  && Number.isFinite(longitude)
  && latitude >= -90
  && latitude <= 90
  && longitude >= -180
  && longitude <= 180
  && !(latitude === 0 && longitude === 0)
);

export const normalizeDeliveryLocation = (location) => {
  if (!location) return null;

  const candidate = Array.isArray(location)
    ? { coordinates: location }
    : typeof location === "object"
      ? location
      : null;

  if (!candidate) return null;

  const geoCoordinates = Array.isArray(candidate.location?.coordinates)
    ? candidate.location.coordinates
    : Array.isArray(candidate.coordinates)
      ? candidate.coordinates
      : null;

  const latitudeFromGeo = Array.isArray(geoCoordinates) && geoCoordinates.length >= 2
    ? Number(geoCoordinates[1])
    : null;
  const longitudeFromGeo = Array.isArray(geoCoordinates) && geoCoordinates.length >= 2
    ? Number(geoCoordinates[0])
    : null;

  const latitude = Number(
    candidate.latitude ??
    candidate.lat ??
    candidate?.coordinates?.latitude ??
    candidate?.coordinates?.lat ??
    candidate?.location?.latitude ??
    candidate?.location?.lat ??
    latitudeFromGeo ??
    candidate?.latitudeValue ??
    null,
  );
  const longitude = Number(
    candidate.longitude ??
    candidate.lng ??
    candidate?.coordinates?.longitude ??
    candidate?.coordinates?.lng ??
    candidate?.location?.longitude ??
    candidate?.location?.lng ??
    longitudeFromGeo ??
    candidate?.longitudeValue ??
    null,
  );

  if (!isValidCoordinatePair(latitude, longitude)) return null;

  const accuracy = Number(candidate.accuracy ?? candidate.accuracyMeters ?? candidate?.location?.accuracy ?? null);
  const timestamp = candidate.updatedAt || candidate.timestamp || candidate?.location?.updatedAt || candidate?.location?.timestamp || null;

  return {
    lat: latitude,
    lng: longitude,
    latitude,
    longitude,
    accuracy: Number.isFinite(accuracy) ? accuracy : null,
    timestamp: timestamp ? new Date(timestamp).toISOString() : null,
  };
};

export const toLocationPoint = (value) => {
  const normalized = normalizeDeliveryLocation(value);
  if (!normalized) return null;

  return { latitude: normalized.latitude, longitude: normalized.longitude };
};

export const calculateDistanceMeters = (first, second) => {
  const start = toLocationPoint(first);
  const end = toLocationPoint(second);
  if (!start || !end) return null;

  const earthRadiusMeters = 6371000;
  const toRadians = (angle) => (angle * Math.PI) / 180;
  const latitudeDelta = toRadians(end.latitude - start.latitude);
  const longitudeDelta = toRadians(end.longitude - start.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(start.latitude)) *
      Math.cos(toRadians(end.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatRelativeTime = (milliseconds) => {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return "just now";

  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  if (totalSeconds < 60) return totalSeconds <= 5 ? "just now" : `${totalSeconds} seconds ago`;

  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} minute${totalMinutes === 1 ? "" : "s"} ago`;

  const totalHours = Math.round(totalMinutes / 60);
  if (totalHours < 24) return `${totalHours} hour${totalHours === 1 ? "" : "s"} ago`;

  const totalDays = Math.round(totalHours / 24);
  return `${totalDays} day${totalDays === 1 ? "" : "s"} ago`;
};

export const getLocationFreshness = (location, now = Date.now()) => {
  if (!location || !location.updatedAt) {
    return {
      state: "missing",
      ageMs: null,
      label: "Waiting for live GPS",
      detail: "Waiting for the delivery agent's live location...",
    };
  }

  const updatedAt = new Date(location.updatedAt).getTime();
  if (Number.isNaN(updatedAt)) {
    return {
      state: "missing",
      ageMs: null,
      label: "Waiting for live GPS",
      detail: "Waiting for the delivery agent's live location...",
    };
  }

  const ageMs = Math.max(0, now - updatedAt);

  if (ageMs <= LOCATION_DELAYED_THRESHOLD_MS) {
    return {
      state: "live",
      ageMs,
      label: "Live",
      detail: ageMs < 60000 ? "Location updated just now" : `Updated ${formatRelativeTime(ageMs)}`,
    };
  }

  if (ageMs <= LOCATION_STALE_THRESHOLD_MS) {
    return {
      state: "delayed",
      ageMs,
      label: "Location update delayed",
      detail: `Last updated ${formatRelativeTime(ageMs)}`,
    };
  }

  return {
    state: "stale",
    ageMs,
    label: "Live location temporarily unavailable",
    detail: `Last known location: ${formatRelativeTime(ageMs)}`,
  };
};

export const estimateDurationMinutes = (distanceMeters) => {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) return null;
  return Math.max(1, Math.round((distanceMeters / 1000 / 25) * 60));
};

export const isTerminalOrderStatus = (status) => ["DELIVERED", "FAILED_DELIVERY", "RETURNED", "CANCELLED"].includes(status);

const geocodeCacheKey = "honeyvision_forward_geocode_cache_v1";

const getGoogleGeocodingLibrary = async () => {
  if (typeof window === "undefined") return Promise.reject(new Error("Location service is available only in a browser."));
  if (!window.google?.maps) {
    throw new Error("Google Maps is still loading. Please try again in a moment.");
  }
  if (!window.google.maps.importLibrary) {
    throw new Error("Google Maps loaded without library support. Check that the Maps JavaScript API is enabled.");
  }
  return window.google.maps.importLibrary("geocoding");
};

const readGeocodeCache = () => {
  try {
    const value = JSON.parse(localStorage.getItem(geocodeCacheKey) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
};

export const normalizeAddress = (address = {}) => {
  const cityAliases = { bhubaneshwar: "Bhubaneswar", khurda: "Khordha" };
  const clean = (value) => String(value || "").replace(/\s+/g, " ").replace(/\s*,\s*/g, ",").replace(/,{2,}/g, ",").replace(/^,|,$/g, "").trim();
  const city = clean(address.city);
  return {
    addressLine1: clean(address.addressLine1 || address.line1 || address.address),
    addressLine2: clean(address.addressLine2 || address.line2),
    landmark: clean(address.landmark),
    city: cityAliases[city.toLowerCase()] || city,
    district: clean(address.district),
    state: clean(address.state),
    pincode: clean(address.pincode || address.postalCode || address.pinCode || address.pin),
    country: clean(address.country) || "India",
  };
};

export const buildAddressText = (address = {}, options = {}) => {
  const normalized = normalizeAddress(address);
  return [
    normalized.addressLine1,
    options.includeAddressLine2 === false ? "" : normalized.addressLine2,
    options.includeLandmark === false ? "" : normalized.landmark,
    normalized.city,
    normalized.district,
    normalized.state,
    normalized.pincode,
    normalized.country,
  ].filter(Boolean).join(", ");
};

export const geocodeAddress = async (address) => {
  const normalized = normalizeAddress(address);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!normalized.addressLine1 || !normalized.city || !normalized.state || !normalized.pincode) {
    throw new Error("Please enter a valid delivery address.");
  }
  if (!apiKey) throw new Error("Location service is currently unavailable. Your address details can still be reviewed.");

  const cache = readGeocodeCache();
  const queries = [
    buildAddressText(normalized),
    buildAddressText(normalized, { includeLandmark: false }),
    buildAddressText(normalized, { includeLandmark: false, includeAddressLine2: false }),
    [normalized.addressLine1, normalized.city, normalized.state, normalized.pincode, normalized.country].filter(Boolean).join(", "),
    [normalized.city, normalized.state, normalized.pincode, normalized.country].filter(Boolean).join(", "),
  ].filter((query, index, list) => query && list.indexOf(query) === index);
  let lastStatus = "UNKNOWN_ERROR";

  let maps;
  try {
    maps = await getGoogleGeocodingLibrary();
  } catch (error) {
    if (import.meta.env.DEV) console.debug("Google Maps JavaScript API load failed", { message: error.message });
    throw error;
  }
  const geocoder = new maps.Geocoder();

  for (const text of queries) {
    if (cache[text]) return cache[text];
    const result = await new Promise((resolve) => geocoder.geocode({ address: text }, (results, status) => resolve({ results, status })));
    lastStatus = result.status || "UNKNOWN_ERROR";
    const location = result.results?.[0]?.geometry?.location;
    const latitude = getGoogleCoordinate(location?.lat);
    const longitude = getGoogleCoordinate(location?.lng);
    if (lastStatus === "OK" && isValidCoordinatePair(latitude, longitude)) {
      const coordinates = { latitude, longitude };
      try {
        localStorage.setItem(geocodeCacheKey, JSON.stringify({ ...cache, [text]: coordinates }));
      } catch {
        // Coordinate caching is best effort.
      }
      return coordinates;
    }
    if (import.meta.env.DEV) console.debug("Google geocoding attempt failed", { status: lastStatus, query: text });
  }

  const message = lastStatus === "REQUEST_DENIED" || lastStatus === "OVER_QUERY_LIMIT"
    ? "Google Maps could not verify this location right now. You can still save the delivery address."
    : "Google Maps could not locate this address. Please check your address details or save it and verify the location later.";
  throw new Error(message);
};

export const reverseGeocodeCoordinates = async (latitude, longitude) => {
  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);

  if (!isValidCoordinatePair(numericLatitude, numericLongitude)) {
    throw new Error("A valid latitude and longitude are required to resolve the address.");
  }

  if (typeof window === "undefined" || !window.google?.maps) {
    throw new Error("Google Maps is still loading. Please try again in a moment.");
  }

  const geocoder = new window.google.maps.Geocoder();
  const result = await new Promise((resolve, reject) => {
    geocoder.geocode({ location: { lat: numericLatitude, lng: numericLongitude } }, (responses, status) => {
      if (status === "OK" && Array.isArray(responses) && responses.length > 0) {
        resolve(responses[0]);
        return;
      }

      if (status === "ZERO_RESULTS") {
        resolve(null);
        return;
      }

      if (status === "OVER_QUERY_LIMIT") {
        reject(new Error("Google Maps rate limit was reached. Please wait a moment and try again."));
        return;
      }

      if (status === "REQUEST_DENIED") {
        reject(new Error("Google Maps access was denied. You can continue by entering the address manually."));
        return;
      }

      if (status === "INVALID_REQUEST") {
        reject(new Error("The selected location could not be resolved. Please finish the address manually."));
        return;
      }

      reject(new Error("Google Maps could not resolve this location. Please continue with a manual address entry if needed."));
    });
  });

  const addressComponents = Object.fromEntries(
    (result?.address_components || []).flatMap((component) => component.types.map((type) => [type, component.long_name]))
  );

  const houseNumber = addressComponents.street_number || "";
  const street = addressComponents.route || "";
  const area = addressComponents.neighborhood || addressComponents.sublocality || addressComponents.sublocality_level_1 || "";
  const locality = addressComponents.locality || addressComponents.administrative_area_level_2 || "";
  const city = locality || addressComponents.suburb || "";
  const state = addressComponents.administrative_area_level_1 || "";
  const pincode = addressComponents.postal_code || "";
  const country = addressComponents.country || "";
  const formattedAddress = result?.formatted_address || [
    [houseNumber, street].filter(Boolean).join(" "),
    area,
    city,
    state,
    pincode,
    country,
  ].filter(Boolean).join(", ");

  return {
    formattedAddress,
    addressLine1: [houseNumber, street].filter(Boolean).join(" ").trim(),
    addressLine2: area,
    landmark: "",
    city,
    state,
    pincode,
    country,
    latitude: numericLatitude,
    longitude: numericLongitude,
    status: result ? "OK" : "ZERO_RESULTS",
  };
};

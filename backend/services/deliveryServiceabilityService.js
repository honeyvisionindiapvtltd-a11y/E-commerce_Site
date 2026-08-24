import deliveryServiceability from "../config/deliveryServiceability.js";
import DeliveryZone from "../models/DeliveryZone.js";
import {
  isValidPincode,
  normalizeCity,
  normalizeLocationValue,
  normalizePincode,
} from "../utils/normalizeLocation.js";

export const SERVICEABILITY_UNAVAILABLE_MESSAGE = "Sorry, delivery is currently not available at this location.";

export const checkDeliveryServiceability = async ({ country, state, city, pincode }) => {
  const normalizedCountry = normalizeLocationValue(country);
  const normalizedState = normalizeLocationValue(state);
  const normalizedPincode = normalizePincode(pincode);
  const normalizedCity = normalizeCity(city, deliveryServiceability.cities);

  const validationError = !normalizedCountry
    ? "Country is required"
    : !normalizedState
      ? "State is required"
      : !normalizedCity
        ? "City is required"
        : !isValidPincode(normalizedPincode)
          ? "Please provide a valid 6-digit PIN code."
          : null;

  if (validationError) {
    return {
      valid: false,
      serviceable: false,
      validationError,
      location: null,
    };
  }

  const blocked = deliveryServiceability.blockedPincodes.includes(normalizedPincode);
  let zone = null;
  let matchingCity = null;
  if (!blocked) {
    try {
      const candidateZones = await DeliveryZone.find({
        country: deliveryServiceability.country,
        state: deliveryServiceability.state,
        pincode: normalizedPincode,
      }).lean();
      zone = candidateZones.find((candidate) => [candidate.city, ...(candidate.aliases || [])]
        .map(normalizeLocationValue)
        .includes(normalizedCity));
      matchingCity = candidateZones.find((candidate) => [candidate.city, ...(candidate.aliases || [])]
        .map(normalizeLocationValue)
        .includes(normalizedCity));
    } catch (error) {
      console.error("Delivery zone lookup failed:", error.message);
    }
  }
  const serviceable = normalizedCountry === normalizeLocationValue(deliveryServiceability.country)
    && normalizedState === normalizeLocationValue(deliveryServiceability.state)
    && Boolean(zone?.serviceable && zone.active);

  return {
    valid: true,
    serviceable,
    unavailableReason: blocked
      ? "Delivery is currently unavailable for this PIN code."
      : matchingCity && !zone
        ? "This PIN code is not serviceable for the selected city."
        : undefined,
    location: serviceable ? { city: zone.city, state: zone.state, country: zone.country } : null,
    deliveryCharge: serviceable ? zone.deliveryCharge : undefined,
    estimatedDeliveryDays: serviceable ? zone.estimatedDeliveryDays : undefined,
  };
};

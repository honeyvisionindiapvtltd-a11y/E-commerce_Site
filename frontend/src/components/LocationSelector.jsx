import { useEffect, useMemo, useRef, useState } from "react";
import { Map, Marker, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Building2, Compass, Home, MapPin, Navigation, Plus, Search, X } from "lucide-react";
import { useCommerce } from "../context/index.js";
import { getGoogleCoordinate, isValidCoordinatePair, normalizeAddress, reverseGeocodeCoordinates } from "../utils/locationUtils.js";

const defaultCenter = { lat: 20.2961, lng: 85.8245 };
const emptyDraft = {
  type: "Home",
  label: "",
  fullName: "",
  phone: "",
  address: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  pin: "",
  country: "India",
  latitude: null,
  longitude: null,
  locationResolved: false,
  googlePlaceId: "",
  formattedAddress: "",
  deliveryInstructions: "",
};

const normalizeSavedAddressDraft = (address = {}) => ({
  ...emptyDraft,
  ...address,
  type: address.type || (address.addressType === "WORK" ? "Office" : address.addressType === "OTHER" ? "Other" : "Home"),
  label: address.label || "",
  fullName: address.fullName || address.name || "",
  phone: address.phone || "",
  address: address.address || address.addressLine1 || "",
  city: address.city || "",
  state: address.state || "",
  pin: address.pin || address.pincode || address.postalCode || "",
  country: address.country || "India",
  latitude: Number.isFinite(Number(address.latitude)) ? Number(address.latitude) : null,
  longitude: Number.isFinite(Number(address.longitude)) ? Number(address.longitude) : null,
  locationResolved: Boolean(address.locationResolved || (Number.isFinite(Number(address.latitude)) && Number.isFinite(Number(address.longitude)))),
  formattedAddress: address.formattedAddress || "",
  deliveryInstructions: address.deliveryInstructions || "",
});

export default function LocationSelector({ onClose }) {
  const { user, profile, addresses, addAddress, selectedDeliveryAddress, setSelectedDeliveryAddress, setDeliveryPin, checkDeliveryByLocation, checkDeliveryByPincode } = useCommerce();
  const placesLibrary = useMapsLibrary("places");
  const searchInputRef = useRef(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(() => ({
    ...emptyDraft,
    fullName: profile.fullName || user?.name || "",
    phone: profile.phone || "",
    city: profile.city || "",
    state: profile.state || "",
    pin: profile.pinCode || "",
  }));
  const [searchValue, setSearchValue] = useState("");
  const [serviceability, setServiceability] = useState({ status: "idle", message: "" });
  const [isLocating, setIsLocating] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [mapsUnavailable, setMapsUnavailable] = useState(false);
  const locationRequestRef = useRef(0);

  const displayAddresses = useMemo(() => {
    if (!user?.id) return addresses;
    return addresses.filter((address) => String(address.userId || address.user_id || "") === String(user.id));
  }, [addresses, user?.id]);

  useEffect(() => {
    if (selectedDeliveryAddress) {
      setDraft((current) => ({ ...current, ...normalizeSavedAddressDraft(selectedDeliveryAddress) }));
    }
  }, [selectedDeliveryAddress]);

  useEffect(() => {
    if (!placesLibrary && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      setMapsUnavailable(true);
    }

    if (!placesLibrary || !searchInputRef.current) return undefined;
    setMapsUnavailable(false);

    const autocomplete = new placesLibrary.Autocomplete(searchInputRef.current, {
      fields: ["address_components", "formatted_address", "geometry", "place_id"],
      componentRestrictions: { country: "in" },
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const location = place.geometry?.location;
      const latitude = getGoogleCoordinate(location?.lat);
      const longitude = getGoogleCoordinate(location?.lng);

      if (!isValidCoordinatePair(latitude, longitude)) {
        setError("Please choose a place with a valid map pin.");
        return;
      }

      const components = Object.fromEntries((place.address_components || []).flatMap((component) => component.types.map((type) => [type, component.long_name])));
      setDraft((current) => ({
        ...current,
        address: components.street_number && components.route ? `${components.street_number} ${components.route}` : current.address || place.formatted_address || "",
        city: components.locality || components.administrative_area_level_2 || current.city,
        state: components.administrative_area_level_1 || current.state,
        pin: components.postal_code || current.pin,
        country: components.country || current.country,
        latitude,
        longitude,
        locationResolved: true,
        googlePlaceId: place.place_id || "",
        formattedAddress: place.formatted_address || "",
      }));
      setSearchValue(place.formatted_address || "");
      setError("");
    });

    return () => listener.remove();
  }, [placesLibrary]);

  useEffect(() => {
    if (mapsUnavailable) {
      setShowAddAddress(true);
    }
  }, [mapsUnavailable]);

  useEffect(() => {
    const latitude = Number(draft.latitude);
    const longitude = Number(draft.longitude);
    const pin = String(draft.pin || "").replace(/\D/g, "").slice(0, 6);

    if (isValidCoordinatePair(latitude, longitude)) {
      const requestId = ++locationRequestRef.current;
      const timer = window.setTimeout(async () => {
        try {
          setIsResolvingLocation(true);
          setError("");
          const resolved = await reverseGeocodeCoordinates(latitude, longitude);
          if (requestId !== locationRequestRef.current) return;

          setDraft((current) => ({
            ...current,
            address: [resolved.addressLine1, resolved.addressLine2].filter(Boolean).join(", ") || resolved.formattedAddress || current.address || "",
            addressLine2: resolved.addressLine2 || "",
            landmark: resolved.landmark || "",
            city: resolved.city || current.city || "",
            state: resolved.state || current.state || "",
            pin: resolved.pincode || current.pin || "",
            country: resolved.country || "India",
            formattedAddress: resolved.formattedAddress || current.formattedAddress || "",
            locationResolved: true,
          }));

          setSearchValue((current) => current || resolved.formattedAddress || "");
          setServiceability({ status: "checking", message: "Checking delivery availability..." });

          try {
            const result = await checkDeliveryByLocation({ latitude, longitude });
            if (requestId !== locationRequestRef.current) return;
            setServiceability({
              status: result?.success && result?.serviceable ? "available" : "unavailable",
              message: result?.message || (result?.success && result?.serviceable ? "Delivery available" : "Delivery unavailable"),
            });
            if (result?.success && result?.location) {
              setDraft((current) => ({
                ...current,
                city: current.city || result.location.city || "",
                state: current.state || result.location.state || "",
                pin: current.pin || result.location.pincode || "",
                country: current.country || result.location.country || "India",
              }));
            }
          } catch (requestError) {
            if (requestId === locationRequestRef.current) {
              setServiceability({
                status: "idle",
                message: requestError.message || "Unable to verify delivery availability for this location.",
              });
            }
          }
        } catch (requestError) {
          if (requestId !== locationRequestRef.current) return;
          setError(requestError.message || "Google Maps could not resolve this location. You can continue by entering the address manually.");
          setServiceability({ status: "idle", message: "Location selected. Fill in the delivery details and PIN to continue." });
        } finally {
          if (requestId === locationRequestRef.current) {
            setIsResolvingLocation(false);
          }
        }
      }, 350);

      return () => {
        window.clearTimeout(timer);
      };
    }

    if (pin.length === 6 && !(Number.isFinite(latitude) && Number.isFinite(longitude))) {
      setServiceability({ status: "checking", message: "Checking delivery coverage..." });
      ((async () => {
        try {
          const result = await checkDeliveryByPincode({ pincode: pin, productId: null });
          setServiceability({
            status: result?.success && result?.serviceable ? "available" : "unavailable",
            message: result?.message || (result?.success && result?.serviceable ? "Delivery available" : "Delivery unavailable"),
          });
        } catch (requestError) {
          setServiceability({ status: "unavailable", message: requestError.message || "Unable to verify delivery availability." });
        }
      })());
      return;
    }

    if (!isValidCoordinatePair(latitude, longitude)) {
      setServiceability({ status: "idle", message: "" });
    }
  }, [checkDeliveryByLocation, checkDeliveryByPincode, draft.latitude, draft.longitude, draft.pin]);

  const center = useMemo(() => (
    isValidCoordinatePair(Number(draft.latitude), Number(draft.longitude))
      ? { lat: Number(draft.latitude), lng: Number(draft.longitude) }
      : defaultCenter
  ), [draft.latitude, draft.longitude]);

  const updateDraft = (next) => setDraft((current) => ({ ...current, ...next }));

  const getAddressPayload = () => {
    const normalized = normalizeAddress({ ...draft, addressLine1: draft.address, pincode: draft.pin });
    const latitude = Number(draft.latitude);
    const longitude = Number(draft.longitude);
    return {
      type: draft.type || "Home",
      label: draft.label || draft.type || "Home",
      fullName: draft.fullName.trim(),
      phone: draft.phone.trim(),
      address: draft.address.trim(),
      addressLine1: normalized.addressLine1,
      addressLine2: draft.addressLine2.trim(),
      landmark: draft.landmark.trim(),
      city: normalized.city,
      district: draft.city,
      state: normalized.state,
      pin: normalized.pincode,
      pincode: normalized.pincode,
      country: normalized.country,
      latitude: isValidCoordinatePair(latitude, longitude) ? latitude : null,
      longitude: isValidCoordinatePair(latitude, longitude) ? longitude : null,
      locationResolved: isValidCoordinatePair(latitude, longitude),
      googlePlaceId: draft.googlePlaceId,
      formattedAddress: draft.formattedAddress || draft.address,
      deliveryInstructions: draft.deliveryInstructions.trim(),
      addressType: draft.type === "Office" ? "WORK" : draft.type === "Other" ? "OTHER" : "HOME",
      isDefault: false,
    };
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("This browser does not support geolocation. Please enter the delivery address manually.");
      return;
    }

    setIsLocating(true);
    setError("");
    setServiceability({ status: "checking", message: "Detecting your location..." });

    navigator.geolocation.getCurrentPosition(async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      if (!isValidCoordinatePair(latitude, longitude) || (latitude === 0 && longitude === 0)) {
        setIsLocating(false);
        setError("The GPS location is invalid. Please choose a different location or enter the address manually.");
        setServiceability({ status: "idle", message: "Location not available yet." });
        return;
      }

      setDraft((current) => ({
        ...current,
        latitude,
        longitude,
        locationResolved: true,
      }));

      try {
        const resolved = await reverseGeocodeCoordinates(latitude, longitude);
        setDraft((current) => ({
          ...current,
          address: current.address || resolved.addressLine1 || "",
          addressLine2: current.addressLine2 || resolved.addressLine2 || "",
          landmark: current.landmark || resolved.landmark || "",
          city: current.city || resolved.city || "",
          state: current.state || resolved.state || "",
          pin: current.pin || resolved.pincode || "",
          country: current.country || resolved.country || "India",
          formattedAddress: resolved.formattedAddress || current.formattedAddress || "",
          locationResolved: true,
        }));

        const result = await checkDeliveryByLocation({ latitude, longitude });
        setServiceability({
          status: result?.success && result?.serviceable ? "available" : "unavailable",
          message: result?.message || (result?.success && result?.serviceable ? "Delivery available" : "Delivery unavailable"),
        });
      } catch (requestError) {
        setServiceability({
          status: "idle",
          message: requestError.message || "Unable to verify this location yet.",
        });
        setError(requestError.message || "We could not resolve this current location. Please complete the address manually.");
      } finally {
        setIsLocating(false);
      }
    }, (geoError) => {
      setIsLocating(false);
      setServiceability({ status: "idle", message: "Location permission is required to use current GPS." });
      const permissionMessage = geoError.code === geoError.PERMISSION_DENIED
        ? "Location permission was denied. Please allow GPS access or enter the address manually."
        : geoError.code === geoError.POSITION_UNAVAILABLE
          ? "Your current location is temporarily unavailable. Please try again or enter the address manually."
          : geoError.code === geoError.TIMEOUT
            ? "Your location request timed out. Please try again or enter the address manually."
            : "We could not access your current location. Please enter the address manually.";
      setError(permissionMessage);
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 });
  };

  const handleSaveAndUse = async () => {
    const normalized = getAddressPayload();
    if (!normalized.fullName || !normalized.phone || !normalized.address || !normalized.city || !normalized.state || !/^\d{6}$/.test(normalized.pin)) {
      setError("Please complete the delivery address with name, phone, address, city, state, and valid PIN code.");
      return;
    }

    if (serviceability.status === "unavailable") {
      setError("This delivery location is outside the service area. Please choose another address.");
      return;
    }

    const payload = {
      ...normalized,
      addressType: normalized.addressType,
      pincode: normalized.pin,
      isDefault: !displayAddresses.length,
    };

    setIsSaving(true);
    setError("");

    try {
      const saved = await addAddress(payload);
      const selected = { ...saved, ...payload, id: saved?.id || saved?._id || payload.id };
      setSelectedDeliveryAddress(selected);
      setDeliveryPin(String(payload.pin || payload.pincode || ""));
      onClose?.();
    } catch (saveError) {
      setError(saveError.message || "Unable to save this delivery address.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectSavedAddress = async (address) => {
    const nextSelection = normalizeSavedAddressDraft(address);
    setDraft((current) => ({ ...current, ...nextSelection }));
    setSelectedDeliveryAddress(nextSelection);
    setDeliveryPin(String(nextSelection.pin || nextSelection.pincode || ""));
    setServiceability({
      status: isValidCoordinatePair(Number(nextSelection.latitude), Number(nextSelection.longitude)) ? "available" : "idle",
      message: isValidCoordinatePair(Number(nextSelection.latitude), Number(nextSelection.longitude)) ? "Delivery address selected" : "Address selected",
    });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Deliver to</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Choose delivery location</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100" aria-label="Close delivery selector">
            <X size={18} className="text-slate-600" />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-slate-200 p-4 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="flex flex-col gap-3">
              <label className="relative block">
                <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search for an address or landmark"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none focus:border-amber-400 focus:bg-white"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleUseCurrentLocation} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60" disabled={isLocating}>
                  <Compass size={16} className="text-amber-500" />
                  {isLocating ? "Finding your location..." : "Use my current location"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAddress(true);
                    requestAnimationFrame(() => {
                      document.getElementById("manual-address-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Plus size={16} className="text-amber-500" /> Add new address
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex items-center justify-between text-sm font-medium text-slate-700">
                  <span className="flex items-center gap-2"><MapPin size={16} className="text-amber-500" /> Delivery area</span>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${serviceability.status === "available" ? "bg-emerald-100 text-emerald-700" : serviceability.status === "unavailable" ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-600"}`}>
                    {serviceability.status === "available" ? "Delivery available" : serviceability.status === "unavailable" ? "Delivery unavailable" : "Checking"}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{serviceability.message || "Choose an address to verify serviceability."}</p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              {mapsUnavailable ? (
                <div className="flex h-64 w-full flex-col items-center justify-center bg-slate-100 px-6 text-center">
                  <MapPin className="mb-3 text-amber-500" size={28} />
                  <p className="text-base font-bold text-slate-800">Map unavailable</p>
                  <p className="mt-2 max-w-md text-sm text-slate-600">
                    Google Maps is not authorized for this domain yet. Enter the delivery address manually below and continue with the existing checkout flow.
                  </p>
                  <p className="mt-3 text-xs text-slate-500">Allow the localhost referrer in Google Cloud to restore the map search and pin selection.</p>
                </div>
              ) : (
                <div className="h-64 w-full bg-slate-100">
                  <Map
                    center={center}
                    zoom={15}
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                    className="h-full w-full"
                    onDragEnd={(event) => {
                      const location = event?.latLng;
                      const latitude = getGoogleCoordinate(location?.lat);
                      const longitude = getGoogleCoordinate(location?.lng);
                      if (isValidCoordinatePair(latitude, longitude)) {
                        setDraft((current) => ({ ...current, latitude, longitude, locationResolved: true }));
                        setServiceability({ status: "checking", message: "Updating exact delivery pin..." });
                      }
                    }}
                  >
                    {isValidCoordinatePair(Number(draft.latitude), Number(draft.longitude)) && (
                      <Marker
                        position={{ lat: Number(draft.latitude), lng: Number(draft.longitude) }}
                        draggable
                        onDragEnd={(event) => {
                          const location = event.latLng;
                          const latitude = getGoogleCoordinate(location?.lat);
                          const longitude = getGoogleCoordinate(location?.lng);
                          if (isValidCoordinatePair(latitude, longitude)) {
                            setDraft((current) => ({ ...current, latitude, longitude, locationResolved: true }));
                            setServiceability({ status: "checking", message: "Updating exact delivery pin..." });
                            setError("");
                          }
                        }}
                      />
                    )}
                  </Map>
                </div>
              )}
            </div>

            {(draft.formattedAddress || draft.address || isResolvingLocation) && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Selected location</p>
                <p className="text-sm text-slate-700">
                  {isResolvingLocation ? "Resolving a readable address from the selected map point..." : draft.formattedAddress || draft.address || "Location selected"}
                </p>
              </div>
            )}

            {showAddAddress && (
              <div id="manual-address-form" className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Address details</p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">Add new delivery address</h3>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-700">Manual entry</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                    Address type
                    <select value={draft.type} onChange={(event) => updateDraft({ type: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200">
                      <option value="Home">Home</option>
                      <option value="Office">Office</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                    Label
                    <input value={draft.label} onChange={(event) => updateDraft({ label: event.target.value })} placeholder="Label" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200" />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                    Full name
                    <input value={draft.fullName} onChange={(event) => updateDraft({ fullName: event.target.value })} placeholder="Full name" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200" />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                    Phone number
                    <input value={draft.phone} onChange={(event) => updateDraft({ phone: event.target.value })} placeholder="Phone number" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200" />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
                    House / Flat / Building
                    <input value={draft.address} onChange={(event) => updateDraft({ address: event.target.value })} placeholder="House / Flat / Building" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200" />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                    Area / Street
                    <input value={draft.addressLine2} onChange={(event) => updateDraft({ addressLine2: event.target.value })} placeholder="Area / Street" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200" />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                    Landmark
                    <input value={draft.landmark} onChange={(event) => updateDraft({ landmark: event.target.value })} placeholder="Landmark" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200" />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                    City
                    <input value={draft.city} onChange={(event) => updateDraft({ city: event.target.value })} placeholder="City" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200" />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                    State
                    <input value={draft.state} onChange={(event) => updateDraft({ state: event.target.value })} placeholder="State" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200" />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                    PIN Code
                    <input value={draft.pin} onChange={(event) => updateDraft({ pin: event.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="PIN Code" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200" />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                    Country
                    <input value={draft.country} onChange={(event) => updateDraft({ country: event.target.value })} placeholder="Country" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200" />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
                    Delivery instructions
                    <textarea value={draft.deliveryInstructions} onChange={(event) => updateDraft({ deliveryInstructions: event.target.value })} rows={2} placeholder="Delivery instructions" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200" />
                  </label>
                </div>
              </div>
            )}

            {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          </div>

          <aside className="bg-slate-50 p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Navigation size={16} className="text-amber-500" /> Saved delivery addresses
            </div>
            <div className="space-y-3">
              {displayAddresses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">No saved addresses yet. Add one to save your preferred delivery spot.</div>
              ) : (
                displayAddresses.map((address) => (
                  <button key={address.id || address._id} type="button" onClick={() => handleSelectSavedAddress(address)} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-amber-300 hover:bg-amber-50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {address.type === "Office" ? <Building2 size={16} className="text-slate-600" /> : <Home size={16} className="text-slate-600" />}
                        <span className="font-semibold text-slate-800">{address.label || address.type || "Address"}</span>
                      </div>
                      {address.isDefault && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">Default</span>}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {address.fullName || address.name}
                      <br />
                      {address.address || address.addressLine1}
                      <br />
                      {address.city}, {address.state} - {address.pin || address.pincode || address.postalCode}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button type="button" onClick={() => {
                const nextSelection = { ...draft, ...getAddressPayload() };
                const pin = String(nextSelection.pin || nextSelection.pincode || "").replace(/\D/g, "").slice(0, 6);
                if (!nextSelection.fullName || !nextSelection.phone || !nextSelection.address || !nextSelection.city || !nextSelection.state || !/^\d{6}$/.test(pin)) {
                  setError("Please complete your delivery details before confirming the address.");
                  return;
                }
                if (serviceability.status === "unavailable") {
                  setError("This location is outside the available delivery zone.");
                  return;
                }
                setSelectedDeliveryAddress(nextSelection);
                setDeliveryPin(pin);
                onClose?.();
              }} className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">Confirm address</button>
              <button type="button" onClick={handleSaveAndUse} disabled={isSaving} className="flex-1 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-900 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60">
                {isSaving ? "Saving..." : "Save & use"}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

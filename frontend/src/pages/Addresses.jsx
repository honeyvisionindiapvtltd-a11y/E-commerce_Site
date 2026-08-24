import { useEffect, useRef, useState } from "react";
import { Home, MapPin, Plus, Save, Trash2 } from "lucide-react";
import { Map, Marker, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useCommerce } from "../context/index.js";
import { geocodeAddress, getGoogleCoordinate, isValidCoordinatePair, normalizeAddress } from "../utils/locationUtils";

const emptyAddress = {
  type: "Home",
  label: "",
  fullName: "",
  phone: "",
  address: "",
  addressLine2: "",
  landmark: "",
  district: "",
  city: "",
  state: "",
  pin: "",
  country: "India",
  isDefault: false,
};

export default function Addresses() {
  const { user, profile, addresses, addAddress, updateAddress, removeAddress, setDefaultAddress, refreshAddresses } = useCommerce();
  const userAddresses = user?.id ? addresses.filter((address) => address.userId === user.id) : addresses;
  const fallbackAddress = profile.address ? [{
    id: `profile-${user?.id || 'anon'}`,
    userId: user?.id || null,
    type: 'Home',
    label: 'Saved Address',
    fullName: profile.fullName,
    phone: profile.phone,
    address: profile.address,
    city: profile.city,
    state: profile.state,
    pin: profile.pinCode,
    country: profile.country,
    isDefault: true,
  }] : [];
  const displayAddresses = userAddresses.length > 0 ? userAddresses : fallbackAddress;
  const defaultAddress = displayAddresses.find((address) => address.isDefault) || displayAddresses[0] || {};
  const defaultZone = [defaultAddress.city || profile.city, defaultAddress.state || profile.state].filter(Boolean).join(", ");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [locationPreview, setLocationPreview] = useState({ status: "idle", message: "" });
  const addressInputRef = useRef(null);
  const placesLibrary = useMapsLibrary("places");
  const migratedAddressesRef = useRef(new Set());
  const editingAddressRef = useRef(null);
  const [form, setForm] = useState({
    ...emptyAddress,
    fullName: profile.fullName,
    phone: profile.phone,
    city: profile.city,
    state: profile.state,
    pin: profile.pinCode,
  });

  useEffect(() => {
    if (!placesLibrary || !addressInputRef.current) return undefined;
    const autocomplete = new placesLibrary.Autocomplete(addressInputRef.current, {
      fields: ["address_components", "formatted_address", "geometry", "place_id"],
      componentRestrictions: { country: "in" },
    });
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const location = place.geometry?.location;
      const latitude = getGoogleCoordinate(location?.lat);
      const longitude = getGoogleCoordinate(location?.lng);
      if (!isValidCoordinatePair(latitude, longitude)) {
        setLocationPreview({ status: "unavailable", message: "Select an address with a map location." });
        return;
      }
      const components = Object.fromEntries((place.address_components || []).flatMap((component) => (
        component.types.map((type) => [type, component.long_name])
      )));
      setForm((current) => ({
        ...current,
        address: components.street_number && components.route
          ? `${components.street_number} ${components.route}`
          : current.address,
        city: components.locality || components.administrative_area_level_2 || current.city,
        district: components.administrative_area_level_2 || current.district,
        state: components.administrative_area_level_1 || current.state,
        pin: components.postal_code || current.pin,
        country: components.country || current.country,
        latitude,
        longitude,
        locationResolved: true,
        googlePlaceId: place.place_id || "",
        formattedAddress: place.formatted_address || "",
      }));
      setLocationPreview({ status: "found", message: "Location selected. Confirm the pin before saving." });
    });
    return () => listener.remove();
  }, [placesLibrary]);

  useEffect(() => {
    refreshAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;
    const repairMissingCoordinates = async () => {
      for (const address of userAddresses) {
        const id = address.id || address._id;
        const latitude = Number(address.latitude);
        const longitude = Number(address.longitude);
        if (!id || (Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180) || migratedAddressesRef.current.has(String(id))) continue;
        migratedAddressesRef.current.add(String(id));
        try {
          const coordinates = await geocodeAddress(address);
          if (active) await updateAddress(id, { ...address, ...coordinates });
        } catch {
          // Keep the address unchanged until the customer edits it with a resolvable location.
        }
      }
    };
    if (user?.id && userAddresses.length) repairMissingCoordinates();
    return () => { active = false; };
  }, [user?.id, userAddresses, updateAddress]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const previewLocation = async () => {
    if (!form.address || !form.city || !form.state || !/^\d{6}$/.test(form.pin)) {
      setLocationPreview({ status: "error", message: "Please enter a valid delivery address." });
      return;
    }
    setLocationPreview({ status: "resolving", message: "Finding your delivery location..." });
    try {
      const coordinates = await geocodeAddress(form);
      setForm((current) => ({ ...current, ...coordinates, locationResolved: true }));
      setLocationPreview({ status: "found", message: `${form.city}, ${form.state}, ${form.country || "India"}` });
    } catch (error) {
      setLocationPreview({ status: "unavailable", message: error.message || "We could not verify the map location right now. You can still save your delivery address." });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.fullName || !form.phone || !form.address || !form.city || !form.state || !/^\d{6}$/.test(form.pin)) {
      setMessage("Please complete all required address fields with a valid 6-digit PIN.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
        const original = editingAddressRef.current;
        const addressFieldsChanged = original && ["address", "addressLine2", "landmark", "city", "district", "state", "pin", "country"]
          .some((field) => String(original[field] || "").trim() !== String(form[field] || "").trim());
        const hasValidCoordinates = Number.isFinite(Number(form.latitude)) && Number.isFinite(Number(form.longitude));
        let coordinates = hasValidCoordinates && !addressFieldsChanged
          ? { latitude: Number(form.latitude), longitude: Number(form.longitude) }
          : null;
        let locationMessage = "Location found";
        if (!coordinates) {
          try {
            coordinates = await geocodeAddress(form);
          } catch (error) {
            locationMessage = error.message || "We could not verify the map location right now. You can still save your delivery address.";
          }
        }
        const normalizedForm = normalizeAddress(form);
        const locationFields = {
          ...normalizedForm,
          ...coordinates,
          latitude: coordinates?.latitude ?? null,
          longitude: coordinates?.longitude ?? null,
          locationResolved: Boolean(coordinates),
          googlePlaceId: form.googlePlaceId || "",
          formattedAddress: form.formattedAddress || "",
        };
      const saved = editingId
          ? await updateAddress(editingId, { ...form, ...locationFields })
          : await addAddress({ ...form, ...locationFields, isDefault: addresses.length === 0 });
      if (!saved) throw new Error("The address was not saved.");
      await refreshAddresses();
      setForm({ ...emptyAddress, fullName: profile.fullName, phone: profile.phone, city: profile.city, state: profile.state, pin: profile.pinCode, country: profile.country });
      setEditingId(null);
      editingAddressRef.current = null;
      setShowForm(false);
      setMessage(coordinates ? "Address saved successfully. Location found." : `Address saved successfully. ${locationMessage}`);
    } catch (error) {
      setMessage(error.message || "Unable to save address.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F7FA] py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#F4B400]">Account</p>
            <h1 className="mt-2 text-3xl font-bold text-[#071426] md:text-4xl">My Addresses</h1>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#071426] px-5 py-3 font-semibold text-white transition hover:bg-[#F4B400] hover:text-[#071426]"
          >
            <Plus size={18} />
            {showForm ? "Close" : "Add New Address"}
          </button>
        </div>

        {message && <p className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700" role="alert">{message}</p>}

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <select name="type" value={form.type} onChange={handleChange} className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]">
                <option value="Home">Home</option>
                <option value="Office">Office</option>
                <option value="Other">Other</option>
              </select>

              <input name="label" value={form.label} onChange={handleChange} placeholder="Label" className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]" />

              <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full name" className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]" />

              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]" />

              <div className="md:col-span-2">
                <input ref={addressInputRef} name="address" value={form.address} onChange={handleChange} placeholder="Search or enter street address" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-[#071426] outline-none focus:border-[#F4B400]" />
              </div>

              {isValidCoordinatePair(Number(form.latitude), Number(form.longitude)) && (
                <div className="sm:col-span-2">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Confirm delivery location</p>
                  <div className="h-64 overflow-hidden rounded-xl border border-slate-200">
                    <Map center={{ lat: Number(form.latitude), lng: Number(form.longitude) }} zoom={16} gestureHandling="greedy" className="h-full w-full">
                      <Marker
                        position={{ lat: Number(form.latitude), lng: Number(form.longitude) }}
                        draggable
                        onDragEnd={(event) => {
                          const location = event.latLng;
                          const latitude = getGoogleCoordinate(location?.lat);
                          const longitude = getGoogleCoordinate(location?.lng);
                          if (isValidCoordinatePair(latitude, longitude)) {
                            setForm((current) => ({ ...current, latitude, longitude, locationResolved: true }));
                            setLocationPreview({ status: "found", message: "Pin updated. Confirm the location before saving." });
                          }
                        }}
                      />
                    </Map>
                  </div>
                </div>
              )}

              <input name="addressLine2" value={form.addressLine2} onChange={handleChange} placeholder="Address line 2 (optional)" className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]" />
              <input name="landmark" value={form.landmark} onChange={handleChange} placeholder="Landmark (optional)" className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]" />

              <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]" />

              <input name="district" value={form.district} onChange={handleChange} placeholder="District (optional)" className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]" />

              <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]" />

              <input name="pin" value={form.pin} onChange={handleChange} placeholder="PIN code" className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]" />

              <select name="country" value={form.country} onChange={handleChange} className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]">
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
              </select>
            </div>

            <div className="mt-4 flex justify-end">
              {locationPreview.status !== "idle" && <p className={`mr-auto self-center text-sm ${locationPreview.status === "found" ? "text-emerald-600" : locationPreview.status === "resolving" ? "text-slate-500" : "text-amber-700"}`} role="status">{locationPreview.status === "found" ? "📍 Location found: " : ""}{locationPreview.message}</p>}
              <button type="button" onClick={previewLocation} disabled={locationPreview.status === "resolving"} className="mr-3 rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 disabled:opacity-60">{locationPreview.status === "resolving" ? "Finding..." : "Find location"}</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-[#F4B400] px-5 py-2.5 font-bold text-[#071426] transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving..." : editingId ? "Update Address" : "Save Address"}</button>
            </div>
          </form>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            {displayAddresses.length === 0 && <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-slate-500">No saved address yet. Add a delivery address to continue.</div>}
            {displayAddresses.map((address) => (
              <div key={address.id || address._id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF7DB] text-[#D99D00]">
                      <Home size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#071426]">{address.type}</h2>
                      <p className="text-sm text-slate-500">{address.label || "Saved Address"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {address.isDefault && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Default</span>
                    )}
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-[#F9FAFB] p-4">
                  <p className="font-bold text-[#071426]">{address.fullName}</p>
                  <p className="mt-3 leading-7 text-slate-600">
                    {address.address}
                    <br />
                    {address.city}, {address.state} - {address.pin}
                    <br />
                    {address.country}
                  </p>
                  <p className="mt-3 text-sm font-medium text-slate-600">Phone: {address.phone}</p>
                  <p className={`mt-2 text-sm font-semibold ${isValidCoordinatePair(Number(address.latitude), Number(address.longitude)) ? "text-emerald-600" : "text-amber-700"}`}>
                    {isValidCoordinatePair(Number(address.latitude), Number(address.longitude)) ? "Location confirmed" : "Location needs confirmation"}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {!address.isDefault && (
                    <button type="button" onClick={() => setDefaultAddress(address.id)} className="inline-flex items-center gap-2 rounded-xl bg-[#F4B400] px-4 py-2.5 font-semibold text-[#071426] transition hover:bg-yellow-400">
                      <Save size={16} />
                      Set as Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => { try { await removeAddress(address.id || address._id); setMessage("Address removed."); } catch (error) { setMessage(error.message); } }}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                  <button type="button" onClick={() => { setEditingId(address.id || address._id); editingAddressRef.current = { ...address }; setForm({ ...emptyAddress, ...address }); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50">Edit</button>
                </div>
              </div>
            ))}
          </div>

          <aside className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#071426]">
                <MapPin size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#071426]">Delivery Setup</h2>
                <p className="text-sm text-slate-500">Preferred logistics info</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-[#F9FAFB] p-4">
                <p className="text-sm text-slate-500">Saved Locations</p>
                <p className="mt-2 text-2xl font-bold text-[#071426]">{addresses.length}</p>
              </div>
              <div className="rounded-2xl bg-[#F9FAFB] p-4">
                <p className="text-sm text-slate-500">Default Zone</p>
                <p className="mt-2 text-lg font-bold text-[#071426]">{defaultZone || "No default location set"}</p>
              </div>
              <div className="rounded-2xl bg-[#F9FAFB] p-4">
                <p className="text-sm text-slate-500">Delivery Status</p>
                <p className="mt-2 text-lg font-bold text-green-600">Available</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

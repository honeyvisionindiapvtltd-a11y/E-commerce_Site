import { useState } from "react";
import { Home, MapPin, Plus, Save, Trash2 } from "lucide-react";
import { useCommerce } from "../context/CommerceContext";

const emptyAddress = {
  type: "Home",
  label: "",
  fullName: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pin: "",
  country: "India",
  isDefault: false,
};

export default function Addresses() {
  const { user, profile, addresses, addAddress, removeAddress, setDefaultAddress } = useCommerce();
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
  const displayAddresses = userAddresses.length > 0 ? userAddresses : fallbackAddress.length > 0 ? fallbackAddress : addresses;
  const defaultAddress = displayAddresses.find((address) => address.isDefault) || displayAddresses[0] || {};
  const defaultZone = [defaultAddress.city || profile.city, defaultAddress.state || profile.state].filter(Boolean).join(", ");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    ...emptyAddress,
    fullName: profile.fullName,
    phone: profile.phone,
    city: profile.city,
    state: profile.state,
    pin: profile.pinCode,
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.address || !form.city || !form.state || !form.pin) return;

    addAddress({
      ...form,
      id: Date.now(),
      label: `${form.type} Address`,
      isDefault: addresses.length === 0,
    });

    setForm({
      ...emptyAddress,
      fullName: profile.fullName,
      phone: profile.phone,
      city: profile.city,
      state: profile.state,
      pin: profile.pinCode,
      country: profile.country,
    });
    setShowForm(false);
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
                <textarea name="address" value={form.address} onChange={handleChange} rows="3" placeholder="Street address" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-[#071426] outline-none focus:border-[#F4B400]" />
              </div>

              <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]" />

              <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]" />

              <input name="pin" value={form.pin} onChange={handleChange} placeholder="PIN code" className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]" />

              <select name="country" value={form.country} onChange={handleChange} className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]">
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
              </select>
            </div>

            <div className="mt-4 flex justify-end">
              <button type="submit" className="rounded-xl bg-[#F4B400] px-5 py-2.5 font-bold text-[#071426] transition hover:bg-yellow-400">Save Address</button>
            </div>
          </form>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            {displayAddresses.map((address) => (
              <div key={address.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
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
                    onClick={() => removeAddress(address.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
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

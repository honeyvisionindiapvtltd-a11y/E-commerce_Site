import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { useCommerce } from "../context/index.js";

export default function LocationSelector({ onClose }) {
  const { deliveryPin, setDeliveryPin, checkDeliveryByPincode } = useCommerce();
  const [pin, setPin] = useState(deliveryPin || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedPin = pin.replace(/\D/g, "").slice(0, 6);
    if (normalizedPin.length !== 6) {
      setMessage("Enter a valid 6-digit PIN code.");
      return;
    }
    try {
      setLoading(true);
      await checkDeliveryByPincode({ pincode: normalizedPin });
      setDeliveryPin(normalizedPin);
      onClose();
    } catch (error) {
      setMessage(error.message || "Unable to check this PIN code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-label="Select delivery location">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3"><MapPin className="text-amber-500" size={22} /><h2 className="text-xl font-black text-[#071426]">Select delivery location</h2></div>
          <button type="button" onClick={onClose} aria-label="Close location selector" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <p className="mt-3 text-sm text-slate-500">Enter your PIN code to check delivery availability.</p>
        <form onSubmit={handleSubmit} className="mt-5">
          <input value={pin} onChange={(event) => setPin(event.target.value)} inputMode="numeric" maxLength={6} placeholder="6-digit PIN code" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-amber-500" />
          {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
          <button type="submit" disabled={loading} className="mt-4 w-full rounded-xl bg-[#071426] px-4 py-3 font-bold text-white disabled:opacity-60">{loading ? "Checking..." : "Check delivery"}</button>
        </form>
      </div>
    </div>
  );
}
import { useState } from "react";
import { CheckCircle2, MapPin, XCircle } from "lucide-react";
import { checkDeliveryServiceability } from "../services/deliveryServiceability";

const unavailableMessage = "Sorry, HoneyVision currently delivers only in Bhubaneswar and Khordha.";

export default function DeliveryAvailability({ initialCity = "", initialState = "Odisha", initialCountry = "India", initialPincode = "" }) {
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [country, setCountry] = useState(initialCountry);
  const [pincode, setPincode] = useState(initialPincode);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const check = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setStatus("error");
      setMessage("Please enter a valid 6-digit PIN code.");
      return;
    }

    setStatus("loading");
    setMessage("");
    try {
      const result = await checkDeliveryServiceability({ country, state, city, pincode });
      setStatus(result.serviceable ? "available" : "unavailable");
      setMessage(result.serviceable
        ? `HoneyVision delivers to your location. Estimated delivery: ${result.estimatedDeliveryDays?.min}-${result.estimatedDeliveryDays?.max} days. Delivery charge: ${Number(result.deliveryCharge || 0) === 0 ? "Free" : `₹${result.deliveryCharge}`}.`
        : unavailableMessage);
    } catch {
      setStatus("error");
      setMessage("Unable to check delivery availability. Please try again.");
    }
  };

  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(7,20,38,0.05)] sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3d76d]/20 text-[#071426]">
          <MapPin size={20} />
        </div>
        <div>
          <h3 className="text-[19px] font-extrabold tracking-tight text-[#071426] sm:text-[22px]">
            Check delivery availability
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Enter your PIN code to check delivery availability.
          </p>
        </div>
      </div>

      <form onSubmit={check} className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <input
          aria-label="Country"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          placeholder="India"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-[#F4B400] focus:bg-white"
        />
        <input
          aria-label="State"
          value={state}
          onChange={(event) => setState(event.target.value)}
          placeholder="Odisha"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-[#F4B400] focus:bg-white"
        />
        <input
          aria-label="City"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="City"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-[#F4B400] focus:bg-white"
        />
        <input
          aria-label="PIN code"
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(event) => setPincode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="PIN code"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-[#F4B400] focus:bg-white"
        />

        <button
          type="submit"
          disabled={status === "loading"}
          className="md:col-span-4 mt-1 w-full rounded-xl bg-[#071426] px-4 py-3 text-base font-extrabold text-white transition hover:bg-[#0B315A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Checking delivery..." : "Check Delivery"}
        </button>
      </form>

      {status === "available" && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>
            <strong>Delivery Available</strong>
            <br />
            {message}
          </span>
        </div>
      )}

      {(status === "unavailable" || status === "error") && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-3 text-sm text-red-800">
          <XCircle size={18} className="mt-0.5 shrink-0" />
          <span>
            <strong>{status === "error" ? "Delivery check failed" : "Delivery Not Available"}</strong>
            <br />
            {message}
          </span>
        </div>
      )}
    </section>
  );
}

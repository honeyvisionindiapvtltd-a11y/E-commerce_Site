import {
  ArrowRight,
  Banknote,
  Check,
  ChevronRight,
  CreditCard,
  LockKeyhole,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Smartphone,
  Tag,
  WalletCards,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const paymentOptions = [
  {
    id: "googlepay",
    group: "UPI",
    title: "Google Pay",
    description: "Choose Google Pay inside Razorpay Checkout.",
    icon: WalletCards,
  },
  {
    id: "phonepe",
    group: "UPI",
    title: "PhonePe",
    description: "Choose PhonePe inside Razorpay Checkout.",
    icon: Smartphone,
  },
  {
    id: "paytm",
    group: "UPI",
    title: "Paytm",
    description: "Choose Paytm inside Razorpay Checkout.",
    icon: Smartphone,
  },
  {
    id: "card",
    group: "Cards",
    title: "Credit / Debit Card",
    description: "Secure card payment in Razorpay Checkout",
    icon: CreditCard,
  },
  {
    id: "netbanking",
    group: "Net Banking",
    title: "Net Banking",
    description: "All major banks through Razorpay Checkout",
    icon: Banknote,
  },
  {
    id: "razorpay",
    group: "Other",
    title: "Razorpay",
    description: "Pay securely using Razorpay Checkout. Available payment options include UPI, cards and net banking.",
    icon: ShieldCheck,
  },
  {
    id: "cod",
    group: "Other",
    title: "Cash on Delivery",
    description: "Pay when your order arrives",
    icon: Banknote,
  },
];

const methodLabel = (method) => ({
  phonepe: "PhonePe",
  googlepay: "Google Pay",
  paytm: "Paytm",
  razorpay: "Razorpay",
  upi: "UPI",
  card: "Credit / Debit Card",
  netbanking: "Net Banking",
  cod: "Cash on Delivery",
}[method] || "UPI");

export default function PaymentExperience({
  paymentMethod,
  setPaymentMethod,
  setSelectedUpiApp,
  paymentError,
  paymentErrorType,
  isRazorpayBlocked,
  razorpayMinimumAmount,
  handlePayment,
  isSubmitting,
  termsAccepted,
  setTermsAccepted,
  billingName,
  billingPhone,
  billingAddressLine,
  billingCity,
  billingState,
  billingPin,
  billingCountry,
  checkoutItems,
  itemCount,
  subtotal,
  discount,
  shipping,
  installationFee,
  insurance,
  total,
  navigate,
}) {
  const groupedOptions = paymentOptions.reduce((groups, option) => {
    groups[option.group] = [...(groups[option.group] || []), option];
    return groups;
  }, {});
  const isProviderUnavailable = false;
  const selectedMethodId = paymentMethod;
  const selectedOption = paymentOptions.find((option) => option.id === selectedMethodId) || paymentOptions[0];
  const SelectedIcon = selectedOption.icon;
  const ctaLabel = paymentMethod === "cod"
    ? `Place Order ${formatPrice(total)}`
    : isProviderUnavailable
      ? `${methodLabel(paymentMethod)} unavailable`
      : `Pay ${formatPrice(total)} with ${methodLabel(paymentMethod)}`;

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-[#071426]">
      <header className="border-b border-[#dfe5ec] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="HoneyVision home">
            <img src="https://res.cloudinary.com/vhrkwyzs/image/upload/v1788235324/logo1_fzsjda.png" alt="Honey Vision" className="h-10 w-auto" />
            <span className="hidden border-l border-slate-200 pl-3 text-sm font-bold text-slate-500 sm:block">Secure Checkout</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 sm:text-sm">
            <LockKeyhole size={16} className="text-[#f4b400]" /> Secure payment
          </div>
        </div>
        <nav aria-label="Checkout progress" className="mx-auto max-w-7xl overflow-x-auto px-5 pb-4 sm:px-8">
          <ol className="flex min-w-[420px] items-center gap-2 text-xs font-bold sm:text-sm">
            <ProgressStep label="Cart" complete />
            <ProgressLine />
            <ProgressStep label="Address" complete />
            <ProgressLine />
            <ProgressStep label="Payment" active />
            <ProgressLine />
            <ProgressStep label="Confirmation" />
          </ol>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-6 pt-10 sm:px-8 sm:pt-12 lg:pb-9 lg:pt-14">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b17b00]">Step 3 of 4</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Choose how you want to pay</h1>
            <p className="mt-2 text-sm text-slate-500">Your payment is completed securely through the configured gateway.</p>
          </div>
          <button type="button" onClick={() => navigate(-1)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:border-[#f4b400] hover:text-[#071426]">
            <ChevronRight size={16} className="rotate-180" /> Back to address
          </button>
        </div>

        {isRazorpayBlocked && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-[#fff9e8] p-4 text-sm text-amber-900">
            <ShieldCheck size={19} className="mt-0.5 shrink-0 text-[#b17b00]" />
            <div><p className="font-bold">Minimum order amount for online payment</p><p className="mt-1">Razorpay requires an order value of {formatPrice(razorpayMinimumAmount)} or more. Cash on Delivery remains available.</p></div>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
          <section className="overflow-hidden rounded-xl border border-[#dfe5ec] bg-white shadow-[0_8px_30px_rgba(7,20,38,0.06)]">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Payment Options</p>
              <h2 className="mt-1 text-xl font-black">Select a payment method</h2>
            </div>
            <div className="grid md:grid-cols-[250px_minmax(0,1fr)]">
              <div className="border-b border-slate-200 bg-[#fafbfd] p-3 md:border-b-0 md:border-r">
                {Object.entries(groupedOptions).map(([group, options]) => (
                  <div key={group} className="mb-4 last:mb-0">
                    <p className="px-3 pb-2 pt-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{group}</p>
                    <div className="space-y-1">
                      {options.map((option) => {
                        const Icon = option.icon;
                        const active = option.id === selectedMethodId;
                        return (
                          <button key={option.id} type="button" onClick={() => { setPaymentMethod(option.id); setSelectedUpiApp(option.id === "googlepay" || option.id === "phonepe" || option.id === "paytm" ? option.id : ""); }} role="radio" aria-checked={active} className={`flex min-h-14 w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition ${active ? "border-[#f4b400] bg-[#fff8df] text-[#071426]" : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white"}`}>
                            <Icon size={18} className={`mt-0.5 shrink-0 ${active ? "text-[#b17b00]" : "text-slate-400"}`} />
                            <span className="min-w-0 flex-1">
                              <span className="block break-words text-sm font-bold leading-5">{option.title}</span>
                            </span>
                            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${active ? "border-[#f4b400]" : "border-slate-300"}`}>{active && <span className="h-2.5 w-2.5 rounded-full bg-[#f4b400]" />}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 sm:p-7">
                <div className="flex items-start gap-3 border-b border-slate-200 pb-5">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#fff8df] text-[#b17b00]"><SelectedIcon size={22} /></div>
                  <div><p className="text-lg font-black">{methodLabel(paymentMethod)}</p><p className="mt-1 text-sm text-slate-500">{selectedOption.description}</p></div>
                </div>

                {paymentError && (
                  <div role="status" className={`mt-5 flex items-start gap-3 rounded-lg border p-4 text-sm ${isProviderUnavailable || paymentErrorType === "unavailable" || paymentErrorType === "cancelled" || paymentErrorType === "validation" ? "border-amber-200 bg-[#fffaf0] text-amber-900" : "border-red-200 bg-red-50 text-red-700"}`}>
                    {paymentErrorType !== "failed" ? <ShieldCheck size={19} className="mt-0.5 shrink-0" /> : <X size={19} className="mt-0.5 shrink-0" />}
                    <div>
                      <p className="font-bold">{paymentErrorType === "cancelled" ? "Payment was cancelled" : paymentErrorType === "failed" ? "Payment failed" : "Payment information"}</p>
                      <p className="mt-1">{paymentError}</p>
                    </div>
                  </div>
                )}

                {selectedMethodId === "cod" ? (
                  <div className="mt-6 rounded-lg border border-amber-200 bg-[#fffaf0] p-5"><div className="flex gap-3"><PackageCheck className="shrink-0 text-[#b17b00]" /><div><p className="font-bold">Pay when your order arrives</p><p className="mt-1 text-sm leading-6 text-slate-600">Your order will be placed as pending and collected on delivery.</p></div></div></div>
                ) : ["googlepay", "phonepe", "paytm"].includes(selectedMethodId) ? (
                  <div className="mt-6 rounded-lg border border-[#dbe7f5] bg-[#f7fbff] p-5 text-sm text-slate-600">{methodLabel(selectedMethodId)} will open Razorpay Checkout. Select the matching UPI app inside the secure Razorpay window.</div>
                ) : (
                  <div className="mt-6 space-y-4">
                    <div className="rounded-lg border border-[#dbe7f5] bg-[#f7fbff] p-5">
                      <p className="font-black">{selectedOption.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{selectedMethodId === "razorpay" ? "Pay securely using Razorpay Checkout. Available payment options include UPI, cards and net banking." : "The configured payment provider will open after you continue. Complete your payment there using the selected method."}</p>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm text-slate-600"><CreditCard size={18} className="mt-0.5 shrink-0 text-slate-500" /><p>Card and net banking details are entered only inside Razorpay Checkout. HoneyVision does not collect or store card numbers, CVV, UPI PINs, or OTPs.</p></div>
                  </div>
                )}

                <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-start gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-[#b17b00]" /><div className="min-w-0"><p className="text-sm font-black">Delivering to {billingName || "your selected address"}</p><p className="mt-1 text-xs leading-5 text-slate-500">{billingAddressLine}{billingCity ? `, ${billingCity}` : ""}{billingState ? `, ${billingState}` : ""}{billingPin ? ` - ${billingPin}` : ""}{billingCountry ? `, ${billingCountry}` : ""}{billingPhone ? ` · ${billingPhone}` : ""}</p></div></div>
                </div>

                <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-slate-600"><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-[#f4b400]" /><span>I agree to the HoneyVision Terms &amp; Conditions and Privacy Policy.</span></label>
              </div>
            </div>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-5">
            <section className="rounded-xl border border-[#dfe5ec] bg-white p-5 shadow-[0_8px_30px_rgba(7,20,38,0.06)] sm:p-6">
              <h2 className="text-lg font-black">Price Details</h2>
              <div className="mt-5 space-y-3 text-sm"><SummaryRow label={`Product${itemCount === 1 ? "" : "s"} (${itemCount})`} value={formatPrice(subtotal)} /><SummaryRow label="Discount" value={discount ? `-${formatPrice(discount)}` : "-"} valueClass="text-emerald-600" /><SummaryRow label="Delivery Charges" value={shipping ? formatPrice(shipping) : "FREE"} valueClass={shipping ? "" : "text-emerald-600"} />{installationFee > 0 && <SummaryRow label="Installation" value={formatPrice(installationFee)} />}{insurance > 0 && <SummaryRow label="Shipping insurance" value={formatPrice(insurance)} />}</div>
              <div className="my-5 border-t border-dashed border-slate-300" /><div className="flex items-end justify-between gap-3"><span className="font-black">Total Amount</span><span className="text-2xl font-black">{formatPrice(total)}</span></div>
              {discount > 0 && <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#effaf1] px-3 py-2 text-xs font-bold text-emerald-700"><Tag size={15} /> You will save {formatPrice(discount)} on this order</div>}
              <p className="mt-3 text-[11px] leading-5 text-slate-400">Final payable amount is confirmed by HoneyVision's backend when the order is created.</p>
              <button type="button" onClick={handlePayment} disabled={isSubmitting || !termsAccepted || isProviderUnavailable || (paymentMethod !== "cod" && isRazorpayBlocked)} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#f4b400] px-4 text-base font-black text-[#071426] shadow-sm transition hover:bg-[#ffc933] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">{isSubmitting ? "Processing Payment..." : ctaLabel} {!isSubmitting && <ArrowRight size={18} />}</button>
            </section>

            <section className="rounded-xl border border-[#dfe5ec] bg-white p-5 shadow-[0_8px_30px_rgba(7,20,38,0.06)] sm:p-6">
              <h2 className="text-lg font-black">Order Summary</h2>
              <div className="mt-4 space-y-4">{checkoutItems.map((item) => <div key={item.product.id} className="flex gap-3"><img src={item.product.image || "/placeholder.png"} alt={item.product.name} className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 bg-slate-50 object-contain" /><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-bold">{item.product.name}</p><p className="mt-1 text-xs text-slate-500">Qty: {item.quantity}</p></div><p className="text-sm font-black">{formatPrice(item.product.price * item.quantity)}</p></div>)}</div>
            </section>

            <section className="rounded-xl border border-[#dfe5ec] bg-white p-5 shadow-[0_8px_30px_rgba(7,20,38,0.06)] sm:p-6"><div className="flex items-center gap-3"><ShieldCheck className="text-[#b17b00]" /><div><h2 className="font-black">Safe &amp; Secure Payments</h2><p className="mt-1 text-xs text-slate-500">Your payment information is encrypted and securely processed.</p></div></div><ul className="mt-4 space-y-2 text-xs text-slate-600"><li className="flex gap-2"><Check size={15} className="text-emerald-600" /> Secure payment gateway</li><li className="flex gap-2"><Check size={15} className="text-emerald-600" /> 100% server-side payment verification</li><li className="flex gap-2"><Check size={15} className="text-emerald-600" /> Card and UPI details are not stored by HoneyVision</li></ul></section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function ProgressStep({ label, complete = false, active = false }) {
  return <li className={`flex items-center gap-2 whitespace-nowrap ${active ? "text-[#071426]" : "text-slate-400"}`}><span className={`grid h-7 w-7 place-items-center rounded-full border text-xs ${active ? "border-[#f4b400] bg-[#f4b400] font-black" : complete ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"}`}>{complete ? <Check size={14} /> : active ? "3" : "4"}</span>{label}</li>;
}

function ProgressLine() { return <li aria-hidden="true" className="h-px min-w-5 flex-1 bg-slate-200" />; }

function SummaryRow({ label, value, valueClass = "" }) { return <div className="flex justify-between gap-4 text-slate-600"><span>{label}</span><span className={`font-semibold text-[#071426] ${valueClass}`}>{value}</span></div>; }

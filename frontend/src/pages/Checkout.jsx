import { ChevronLeft, CreditCard, MapPin, Truck, Wrench } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCommerce } from "../context/CommerceContext";
import { money } from "../lib/products";
import { computeTotals } from "../lib/orderTotals";

export default function Checkout() {
  const { cart, products, deliveryPin, setDeliveryPin, profile, addresses, user, isLoggedIn, couponApplied } = useCommerce();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [slot, setSlot] = useState("Tomorrow, 10:00 AM - 1:00 PM");
  const [formError, setFormError] = useState("");
  const userAddresses = user?.id ? addresses.filter((addr) => addr.userId === user.id) : [];
  const defaultAddress = userAddresses.find((addr) => addr.isDefault) || userAddresses[0] || {};
  const initialAddress = isLoggedIn
    ? {
        name: defaultAddress.fullName || profile.fullName || "",
        phone: defaultAddress.phone || profile.phone || "",
        line1: defaultAddress.address || profile.address || "",
        city: defaultAddress.city || profile.city || "",
        state: defaultAddress.state || profile.state || "",
        pin: defaultAddress.pin || profile.pinCode || deliveryPin,
      }
    : {
        name: "",
        phone: "",
        line1: "",
        city: "",
        state: "",
        pin: deliveryPin || "",
      };

  const [address, setAddress] = useState(initialAddress);
  const items = cart.map((item) => ({ ...item, product: products.find((product) => product.id === item.productId) })).filter((item) => item.product);
  const { subtotal, installationFee, shipping, discount, total } = computeTotals(items, { coupon: couponApplied, secureShipping: false });
  const valid = address.name && address.phone.length >= 10 && address.line1 && address.city && address.state && address.pin.length === 6;

  const submit = async (event) => {
    event.preventDefault();
    if (!isLoggedIn) {
      // Prompt the user to sign in before continuing
      window.alert('Please sign in to continue to checkout.');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    if (!valid || !items.length) {
      setFormError('Please complete all required address fields, including state, and enter a valid 6-digit PIN code before continuing.');
      return;
    }

    setFormError("");
    setDeliveryPin(address.pin);
    navigate('/payment', { state: { address, slot, paymentMethod } });
  };

  if (!items.length) return <main className="min-h-screen bg-slate-50 p-12 text-center"><h1 className="text-2xl font-bold">Your cart is empty</h1><Link to="/products" className="mt-4 inline-block text-amber-600">Shop products</Link></main>;

return (
    <main className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Link to="/cart" className="flex items-center gap-1 text-sm text-slate-600">
          <ChevronLeft size={16} /> Back to cart
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold text-slate-900">Checkout</h1>
        <form onSubmit={submit} className="mt-7 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-5">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <MapPin className="text-amber-500" /> Delivery address
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Full name" value={address.name} onChange={(name) => setAddress({ ...address, name })} />
                <Field label="Mobile number" type="tel" value={address.phone} onChange={(phone) => setAddress({ ...address, phone })} />
                <Field label="Address" value={address.line1} onChange={(line1) => setAddress({ ...address, line1 })} className="sm:col-span-2" />
                <Field label="City" value={address.city} onChange={(city) => { setAddress({ ...address, city }); setFormError(""); }} />
                <Field label="State" value={address.state} onChange={(state) => { setAddress({ ...address, state }); setFormError(""); }} />
                <Field label="PIN code" value={address.pin} onChange={(pin) => { setAddress({ ...address, pin: pin.replace(/\D/g, "").slice(0, 6) }); setFormError(""); }} />
                {formError ? <p className="mt-4 text-sm text-red-600" role="alert">{formError}</p> : null}
              </div>
            </div>
            {installationFee > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <Wrench className="text-amber-500" /> Installation appointment
                </h2>
                <p className="mt-2 text-sm text-slate-600">A technician will confirm this slot after your order is placed.</p>
                <select value={slot} onChange={(event) => setSlot(event.target.value)} className="mt-4 w-full rounded-lg border px-4 py-3">
                  <option>Tomorrow, 10:00 AM - 1:00 PM</option>
                  <option>Tomorrow, 2:00 PM - 5:00 PM</option>
                  <option>Day after tomorrow, 10:00 AM - 1:00 PM</option>
                </select>
              </div>
            )}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <CreditCard className="text-amber-500" /> Payment method
              </h2>
              <PaymentOption label="Cash on delivery" description="Pay when the delivery arrives." checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
              <PaymentOption label="UPI / Card / Net Banking" description="Payment gateway handoff is ready for server integration." checked={paymentMethod === "online"} onChange={() => setPaymentMethod("online")} />
            </div>
          </section>
          <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-xl font-bold">Order summary</h2>
            {items.map((item) => (
              <div key={item.productId} className="mt-4 flex justify-between gap-4 text-sm">
                <span>{item.product.name} × {item.quantity}</span>
                <b>{money(item.product.price * item.quantity)}</b>
              </div>
            ))}
            <div className="mt-5 border-t pt-4 text-sm">
              <Line label="Subtotal" value={money(subtotal)} />
              {discount > 0 && <Line label="Discount" value={`- ${money(discount)}`} />}
              <Line label="Shipping" value={shipping ? money(shipping) : "FREE"} />
              <Line label="Installation" value={money(installationFee)} />
            </div>
            <div className="mt-4 flex justify-between text-lg font-extrabold">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
            <button type="submit" className="mt-6 w-full rounded-lg bg-amber-500 px-5 py-3 font-bold text-slate-950">Place order</button>
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Truck size={15} /> Your order will be confirmed by SMS/WhatsApp.</p>
          </aside>
        </form>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = "text", className = "" }) { return <label className={className}><span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span><input required type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border px-4 py-3 outline-none focus:border-amber-500" /></label>; }
function PaymentOption({ label, description, checked, onChange }) { return <label className="mt-4 flex cursor-pointer items-center justify-between rounded-lg border p-4"><span><b>{label}</b><span className="mt-1 block text-sm text-slate-500">{description}</span></span><input type="radio" name="payment" checked={checked} onChange={onChange} /></label>; }
function Line({ label, value }) { return <div className="mt-3 flex justify-between text-slate-600"><span>{label}</span><span>{value}</span></div>; }

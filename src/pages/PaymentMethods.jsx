import { CreditCard, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { useCommerce } from "../context/CommerceContext";

const emptyCard = {
  type: "Visa",
  last4: "",
  holder: "",
  expiry: "",
};

export default function PaymentMethods() {
  const { paymentMethods, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod } = useCommerce();
  const [showForm, setShowForm] = useState(false);
  const [card, setCard] = useState(emptyCard);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCard((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!card.last4 || !card.holder || !card.expiry) return;

    addPaymentMethod({
      ...card,
      id: Date.now(),
      default: paymentMethods.length === 0,
    });

    setCard(emptyCard);
    setShowForm(false);
  };

  return (
    <main className="min-h-screen bg-[#F5F7FA] py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#F4B400]">Account</p>
            <h1 className="mt-2 text-3xl font-bold text-[#071426] md:text-4xl">Payment Methods</h1>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#071426] px-5 py-3 font-semibold text-white transition hover:bg-[#F4B400] hover:text-[#071426]"
          >
            <Plus size={18} />
            {showForm ? "Close" : "Add Card"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-4">
              <select name="type" value={card.type} onChange={handleChange} className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]">
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
                <option value="RuPay">RuPay</option>
                <option value="Amex">Amex</option>
              </select>

              <input name="holder" value={card.holder} onChange={handleChange} placeholder="Card holder" className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]" />

              <input name="last4" value={card.last4} onChange={handleChange} placeholder="Last 4 digits" maxLength={4} className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]" />

              <input name="expiry" value={card.expiry} onChange={handleChange} placeholder="MM/YY" className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-[#071426] outline-none focus:border-[#F4B400]" />
            </div>

            <div className="mt-4 flex justify-end">
              <button type="submit" className="rounded-xl bg-[#F4B400] px-5 py-2.5 font-bold text-[#071426] transition hover:bg-yellow-400">Save Card</button>
            </div>
          </form>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            {paymentMethods.map((card) => (
              <div key={card.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF7DB] text-[#D99D00]">
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#071426]">{card.type} ending in {card.last4}</h2>
                      <p className="text-sm text-slate-500">{card.holder}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {card.default && <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Default</span>}
                    {!card.default && (
                      <button type="button" onClick={() => setDefaultPaymentMethod(card.id)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-[#071426] transition hover:border-[#F4B400] hover:bg-[#FFF9E8]">
                        Set Default
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#F9FAFB] p-4 text-sm text-slate-600">
                  <span>Expires {card.expiry}</span>
                  <button type="button" onClick={() => removePaymentMethod(card.id)} className="inline-flex items-center gap-2 font-semibold text-red-600 transition hover:text-red-700">
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#071426]">Secure Checkout</h2>
                <p className="text-sm text-slate-500">Encryption enabled</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-[#F9FAFB] p-4">
                <p className="text-sm text-slate-500">Saved Cards</p>
                <p className="mt-2 text-2xl font-bold text-[#071426]">{paymentMethods.length}</p>
              </div>
              <div className="rounded-2xl bg-[#F9FAFB] p-4">
                <p className="text-sm text-slate-500">Last Used</p>
                <p className="mt-2 text-lg font-bold text-[#071426]">{paymentMethods[0] ? `${paymentMethods[0].type} •••• ${paymentMethods[0].last4}` : "No card"}</p>
              </div>
              <div className="rounded-2xl bg-[#F9FAFB] p-4">
                <p className="text-sm text-slate-500">Protection</p>
                <p className="mt-2 text-lg font-bold text-green-600">PCI Compliant</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

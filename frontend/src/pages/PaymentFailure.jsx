import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, ShoppingBag, RefreshCcw } from "lucide-react";

export default function PaymentFailure() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const orderId = state.orderId || "";

  return (
    <main className="min-h-screen bg-[#f8fafc] p-6 md:p-10">
      <div className="mx-auto max-w-xl rounded-[28px] border border-red-200 bg-white p-8 shadow-lg">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle size={36} />
          </div>
        </div>

        <h1 className="mt-6 text-center text-3xl font-extrabold text-slate-900">Payment failed or was cancelled.</h1>
        <p className="mt-3 text-center text-sm text-slate-600">
          Your order has not been confirmed and your cart has been kept intact so you can retry payment safely.
        </p>

        {orderId && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <span className="font-semibold">Order:</span> {orderId}
          </div>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => navigate('/payment', { state: { orderId } })}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#061a36] px-4 py-3 text-sm font-semibold text-white hover:bg-[#fbb900] hover:text-[#071426]"
          >
            <RefreshCcw size={16} />
            Retry Payment
          </button>
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ShoppingBag size={16} />
            View Order
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowRight size={16} />
            Continue Shopping
          </button>
        </div>
      </div>
    </main>
  );
}

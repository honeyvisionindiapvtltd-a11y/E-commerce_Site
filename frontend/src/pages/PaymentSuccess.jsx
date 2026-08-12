import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Download,
  ShieldCheck,
  PackageCheck,
  CircleCheck,
  Clock3,
} from "lucide-react";

const formatPrice = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

const paymentMethodLabel = (method) => {
  switch (method) {
    case "cod":
      return "Cash on Delivery";
    case "upi":
      return "UPI Payment";
    case "razorpay":
      return "Razorpay";
    case "card":
      return "Card Payment";
    case "netbanking":
      return "Net Banking";
    case "wallet":
      return "Wallet";
    case "emi":
      return "EMI";
    default:
      return method?.toUpperCase() || "Online Payment";
  }
};

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const query = new URLSearchParams(location.search);
  const orderId = state.orderId || query.get("orderId");
  const [order, setOrder] = useState(state.order || null);
  const [loading, setLoading] = useState(!state.order && Boolean(orderId));
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const itemCount = (order && Array.isArray(order.items))
    ? order.items.reduce((count, item) => count + Number(item.quantity || 1), 0)
    : 0;

  useEffect(() => {
    if (!order && orderId) {
      fetch(`/api/payments/order/${encodeURIComponent(orderId)}`)
        .then(async (resp) => {
          if (!resp.ok) {
            const body = await resp.json().catch(() => ({}));
            throw new Error(body.error || body.message || "Unable to verify order");
          }
          return resp.json();
        })
        .then((data) => {
          setOrder(data.order || null);
        })
        .catch((err) => {
          setError(err.message || "Unable to verify order.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [order, orderId]);

  const handleDownloadInvoice = async () => {
    if (!orderId) return;

    setDownloading(true);
    setDownloadError("");

    try {
      const resp = await fetch(
        `/api/payments/order/${encodeURIComponent(orderId)}/invoice`
      );

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || body.message || "Invoice download failed");
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const disposition = resp.headers.get("content-disposition") || "";
      const filenameMatch = disposition.match(/filename="?(.*?)"?(;|$)/i);
      const filename = filenameMatch?.[1] || `${orderId}-invoice.pdf`;
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err.message || "Unable to download invoice.");
    } finally {
      setDownloading(false);
    }
  };

  if (!orderId) {
    return (
      <main className="min-h-screen bg-[#f8fafc] p-10 text-center">
        <div className="mx-auto max-w-xl rounded-3xl border border-gray-200 bg-white p-10 shadow-lg">
          <CheckCircle2 size={48} className="mx-auto text-yellow-600" />
          <h1 className="mt-6 text-3xl font-bold text-slate-900">No order found</h1>
          <p className="mt-4 text-gray-600">
            We could not find an order to verify. Please return to the cart and try again.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="inline-flex items-center justify-center rounded-full bg-[#061a36] px-6 py-3 text-sm font-semibold text-white hover:bg-[#fbb900] hover:text-[#071426] transition"
            >
              Go to Cart
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-[#071426] hover:bg-gray-50 transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8fafc] p-10 text-center">
        <div className="mx-auto max-w-xl rounded-3xl border border-blue-200 bg-blue-50 p-10 shadow-lg">
          <p className="text-lg font-bold text-blue-700">Verifying your order...</p>
          <p className="mt-3 text-sm text-blue-600">Please wait while we confirm your payment and load your order details.</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#f8fafc] p-10 text-center">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-red-50 p-10 shadow-lg">
          <CheckCircle2 size={48} className="mx-auto text-red-600" />
          <h1 className="mt-6 text-3xl font-bold text-slate-900">Unable to verify order</h1>
          <p className="mt-4 text-gray-600">
            {error || 'We could not load the order details. Please contact support or try again later.'}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="inline-flex items-center justify-center rounded-full bg-[#061a36] px-6 py-3 text-sm font-semibold text-white hover:bg-[#fbb900] hover:text-[#071426] transition"
            >
              View Orders
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-[#071426] hover:bg-gray-50 transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] p-10">
      <div className="mx-auto max-w-5xl rounded-[32px] bg-white p-10 shadow-xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900">Payment Successful</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Thank you for your purchase. Your payment has been verified and your order is now confirmed.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <section className="rounded-3xl border border-gray-200 bg-[#f8fafc] p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-gray-500">
                  Order confirmed
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-900">{order.id}</h2>
              </div>
              <div className="rounded-3xl bg-white px-5 py-3 text-sm font-bold text-green-700 shadow-sm">
                {order.paymentStatus || "Paid"}
              </div>
            </div>

            <div className="mt-8 space-y-4 text-sm text-slate-700">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Payment method</p>
                  <p className="mt-2 font-bold text-slate-900">{paymentMethodLabel(order.paymentMethod)}</p>
                </div>
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Amount paid</p>
                  <p className="mt-2 font-bold text-slate-900">{formatPrice(order.total)}</p>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ShieldCheck size={16} />
                  <span>Order verified by HoneyVision backend</span>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  Your order details have been recorded and verified. You can download the invoice for your records.
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Shipping address</p>
                <div className="mt-3 text-slate-700">
                  <p className="font-semibold">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  <p className="mt-1">Phone: {order.shippingAddress.phone}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Order summary</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{itemCount} item{itemCount === 1 ? "" : "s"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Total paid</p>
                  <p className="mt-2 text-xl font-black text-slate-900">{formatPrice(order.total)}</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {order.items.map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="rounded-3xl border border-gray-200 bg-[#f8fafc] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{item.product?.name || item.name || item.productId}</p>
                        <p className="mt-1 text-sm text-slate-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-slate-900">{formatPrice((item.product?.price || item.price || 0) * (item.quantity || 1))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {downloadError && (
              <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {downloadError}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleDownloadInvoice}
                disabled={downloading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#061a36] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#fbb900] hover:text-[#071426] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={18} />
                {downloading ? "Downloading..." : "Download PDF Invoice"}
              </button>
              <Link
                to="/orders"
                className="inline-flex items-center justify-center rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-[#071426] hover:bg-gray-50 transition"
              >
                View Order History
              </Link>
            </div>
          </section>

          <aside className="space-y-4 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="rounded-3xl bg-[#f1f5f9] p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Order verification</p>
              <p className="mt-3 text-slate-700">
                This page has verified your payment with the backend. Your order is recorded and ready for fulfillment.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-gray-200 bg-[#f8fafc] p-5">
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <CircleCheck size={18} className="text-green-600" />
                  <span>Order ID verified</span>
                </div>
                <p className="mt-3 text-slate-600">{order.id}</p>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-[#f8fafc] p-5">
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <Clock3 size={18} className="text-blue-600" />
                  <span>Order date</span>
                </div>
                <p className="mt-3 text-slate-600">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-[#f8fafc] p-5">
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <PackageCheck size={18} className="text-slate-700" />
                  <span>Delivery estimate</span>
                </div>
                <p className="mt-3 text-slate-600">{order.delivery?.estimatedDeliveryDays || "2-5 days"}</p>
              </div>
            </div>
          </aside>
        </div>

        {loading && (
          <div className="mt-10 rounded-3xl border border-blue-200 bg-blue-50 p-6 text-center text-blue-700">
            Verifying your order with our backend...
          </div>
        )}

        {error && (
          <div className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}

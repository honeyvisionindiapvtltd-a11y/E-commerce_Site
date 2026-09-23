import { ArrowLeft, CalendarDays, MapPin, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCommerce } from "../context/index.js";

export default function CustomerInstallationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { installationBookings, fetchInstallation, createInstallationPayment, verifyInstallationPayment, markInstallationPaymentFailed, markInstallationPaymentCancelled } = useCommerce();
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [remoteBooking, setRemoteBooking] = useState(null);
  const booking = remoteBooking || installationBookings.find((item) => String(item.id || item._id || item.bookingNumber) === String(id));

  useEffect(() => {
    if (!id || booking) return;
    fetchInstallation(id).then(setRemoteBooking).catch(() => {});
  }, [booking, fetchInstallation, id]);

  const retryPayment = async () => {
    setRetryingPayment(true);
    setPaymentError("");
    try {
      const bookingId = booking.id || booking._id || booking.bookingNumber;
      const paymentData = await createInstallationPayment(bookingId, String(booking.paymentMethod || "upi").toLowerCase());
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
          document.body.appendChild(script);
        });
      }
      const response = await new Promise((resolve, reject) => {
        let completed = false;
        const checkout = new window.Razorpay({
          key: paymentData.keyId,
          amount: paymentData.razorpayOrder.amount,
          currency: paymentData.razorpayOrder.currency,
          name: "Honey Vision",
          description: `Installation ${booking.bookingNumber || bookingId}`,
          order_id: paymentData.razorpayOrder.id,
          handler: async (razorpayResponse) => {
            completed = true;
            try { resolve(await verifyInstallationPayment(bookingId, razorpayResponse)); } catch (error) { reject(error); }
          },
          modal: { ondismiss: () => {
            if (completed) return;
            void markInstallationPaymentCancelled(bookingId).catch(() => {});
            reject(new Error("Payment was cancelled."));
          } },
        });
        checkout.on("payment.failed", () => {
          if (completed) return;
          completed = true;
          void markInstallationPaymentFailed(bookingId).catch(() => {});
          reject(new Error("Installation payment failed."));
        });
        checkout.open();
      });
      const confirmed = response.installation || response.data?.installation;
      if (confirmed) navigate("/installation/success", { state: { booking: confirmed } });
    } catch (error) {
      setPaymentError(error.message || "Unable to retry payment.");
    } finally {
      setRetryingPayment(false);
    }
  };

  if (!booking) {
    return (
      <main className="min-h-screen bg-[#f8fafc] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Wrench className="mx-auto text-slate-400" size={36} />
          <h1 className="mt-4 text-2xl font-black text-[#071426]">Installation not found</h1>
          <Link to="/installation/history" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#071426] px-4 py-2.5 text-sm font-bold text-white"><ArrowLeft size={16} /> Back to history</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link to="/installation/history" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#071426]"><ArrowLeft size={16} /> Installation history</Link>
        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-wide text-amber-600">Booking {booking.id || booking._id}</p><h1 className="mt-2 text-3xl font-black text-[#071426]">{booking.service || "Installation"}</h1></div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold capitalize text-amber-700">{String(booking.status || "requested").replaceAll("_", " ")}</span>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Info icon={CalendarDays} label="Preferred date" value={booking.preferredDate || "Not scheduled"} />
            <Info icon={MapPin} label="Location" value={booking.customer?.address || booking.address || "Address pending"} />
          </div>
          {booking.paymentStatus !== "PAID" && !["COD", "CANCELLED", "INSTALLATION_COMPLETED"].includes(String(booking.paymentMethod || "").toUpperCase()) && booking.status !== "CANCELLED" && booking.status !== "INSTALLATION_COMPLETED" && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Payment is still pending.</p>
              {paymentError && <p className="mt-2 text-sm text-red-700">{paymentError}</p>}
              <button type="button" onClick={retryPayment} disabled={retryingPayment} className="mt-3 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-60">{retryingPayment ? "Opening payment..." : "Try Payment Again"}</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Info({ icon: Icon, label, value }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><Icon size={18} className="text-amber-500" /><p className="mt-3 text-xs text-slate-500">{label}</p><p className="mt-1 font-bold text-[#071426]">{value}</p></div>;
}
import { AlertTriangle, ArrowRight, RefreshCcw } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function InstallationPaymentFailure() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking || null;
  const bookingId = booking?.id || booking?._id || booking?.bookingNumber || "";
  const reason = location.state?.reason || "failed";
  const heading = reason === "cancelled" ? "Payment was cancelled" : "Payment failed";
  const message = reason === "cancelled"
    ? "Your installation payment was not completed. The booking remains unpaid and can be retried."
    : "Your installation payment was not completed. No successful payment has been recorded.";

  return (
    <main className="min-h-screen bg-[#f8fafc] px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-lg sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle size={38} />
        </div>
        <h1 className="mt-6 text-3xl font-black text-slate-900">{heading}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        {bookingId && <p className="mt-5 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">Booking: {booking.bookingNumber || bookingId}</p>}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {bookingId && <button type="button" onClick={() => navigate(`/installation/history/${encodeURIComponent(bookingId)}`)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#061a36] px-5 py-3 text-sm font-bold text-white"><RefreshCcw size={16} /> Retry Payment</button>}
          <button type="button" onClick={() => navigate("/installation/history")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700"><ArrowRight size={16} /> View Installations</button>
        </div>
      </div>
    </main>
  );
}

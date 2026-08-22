import { useRef, useState } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Phone,
  MapPin,
  AlertCircle,
  Package,
  Truck,
  CalendarDays,
  Copy,
  Check,
  Wifi,
  WifiOff,
  Headphones,
  ChevronDown,
  ChevronUp,
  ReceiptText,
} from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useCommerce } from "../context/CommerceContext";
import useOrderTracking from "../hooks/useOrderTracking";
import OrderStatusBadge from "../components/OrderStatusBadge";
import OrderProgress from "../components/OrderProgress";
import TrackingTimeline from "../components/TrackingTimeline";
import DeliveryAgentCard from "../components/DeliveryAgentCard";
import LiveDeliveryMap from "../components/LiveDeliveryMap";
import { isValidLocation } from "../lib/deliveryLocation";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDateTime = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const getStatusMessage = (status) => {
  const messages = {
    ORDER_PLACED: "Your order has been placed successfully.",
    PAYMENT_CONFIRMED: "Your payment has been confirmed.",
    PROCESSING: "Your order is being prepared.",
    PACKED: "Your order has been packed and is ready to ship.",
    SHIPPED: "Your order has been shipped and is on its way.",
    OUT_FOR_DELIVERY: "Your order is out for delivery.",
    DELIVERED: "Your order has been delivered successfully.",
    FAILED_DELIVERY: "The delivery attempt was unsuccessful. Our team will update you regarding the next delivery step.",
    CANCELLED: "This order has been cancelled.",
    RETURN_REQUESTED: "Your return request is being processed.",
    RETURNED: "This order has been returned.",
  };

  return messages[status] || "Your order status has been updated.";
};

const failedDeliveryReasonLabel = {
  CUSTOMER_UNAVAILABLE: "The customer was unavailable.",
  CUSTOMER_NOT_REACHABLE: "The customer could not be reached.",
  ADDRESS_NOT_FOUND: "The delivery address could not be located.",
  CUSTOMER_REFUSED: "The delivery was refused.",
  DELIVERY_LOCATION_UNREACHABLE: "The delivery location could not be reached.",
  CUSTOMER_REQUESTED_RESCHEDULE: "The customer requested a reschedule.",
  OTP_VERIFICATION_FAILED: "Delivery verification could not be completed.",
  OTHER: "The delivery attempt could not be completed.",
};

export default function OrderTracking() {
  const { id: routeOrderNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { authToken } = useCommerce();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [copied, setCopied] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnDescription, setReturnDescription] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnMessage, setReturnMessage] = useState("");
  const liveLocationRef = useRef(null);

  const queryOrderNumber = new URLSearchParams(location.search).get("order");
  const orderNumber = routeOrderNumber || queryOrderNumber;

  const token =
    authToken ||
    (() => {
      try {
        const raw = localStorage.getItem("honey-vision-commerce");
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.authToken || null;
      } catch {
        return null;
      }
    })();

  const {
    order,
    tracking,
    timeline,
    loading,
    error,
    connectionStatus,
    locationDebug,
    refresh,
  } = useOrderTracking(orderNumber, token, 15000);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const trackingNumber = [
    tracking?.trackingNumber,
    tracking?.shipment?.trackingNumber,
    order?.trackingNumber,
  ].find((value) => value && value !== "N/A") || null;

  const carrier =
    tracking?.carrier ||
    tracking?.courier ||
    tracking?.shipment?.carrier ||
    order?.carrier ||
    null;

  const estimatedDeliveryDate =
    tracking?.estimatedDeliveryDate ||
    tracking?.estimatedDelivery ||
    order?.estimatedDeliveryDate ||
    null;

  const events = Array.isArray(timeline) ? timeline : [];
  const visibleEvents =
    showAllEvents || events.length <= 5 ? events : events.slice(0, 5);

  const lastUpdated =
    order?.updatedAt ||
    tracking?.updatedAt ||
    events?.[0]?.createdAt ||
    events?.[0]?.timestamp;

  const handleCopyTrackingNumber = async () => {
    if (!trackingNumber || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleReturnRequest = async (event) => {
    event.preventDefault();
    if (!returnReason || returnSubmitting) return;

    setReturnSubmitting(true);
    setReturnMessage("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "/api"}/returns/${encodeURIComponent(order.orderNumber)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason: returnReason, description: returnDescription }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to request return");
      setReturnMessage("Return request submitted.");
      await refresh();
    } catch (requestError) {
      setReturnMessage(requestError.message);
    } finally {
      setReturnSubmitting(false);
    }
  };

  if (error && !order) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate("/orders")}
            className="mb-5 flex items-center gap-2 font-semibold text-[#071426] transition hover:text-[#F4B400]"
          >
            <ArrowLeft size={20} />
            Back to Orders
          </button>

          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <AlertCircle className="mb-3 text-red-500" size={28} />
            <p className="text-lg font-bold text-red-700">Order Not Found</p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top navigation */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate("/orders")}
              className="flex items-center gap-2 text-sm font-semibold text-[#071426] transition hover:text-[#F4B400]"
            >
              <ArrowLeft size={18} />
              Back to Orders
            </button>

            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
              <span>My Orders</span>
              <span>/</span>
              <span>Order Details</span>
              <span>/</span>
              <span className="font-medium text-[#071426]">Track Order</span>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#071426] shadow-sm transition hover:border-[#F4B400] hover:text-[#071426] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={isRefreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Premium order header */}
        {order && (
          <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F4B400]">
                  Order Tracking
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="break-all text-2xl font-bold text-[#071426] sm:text-3xl">
                    Order #{order.orderNumber}
                  </h1>

                  {connectionStatus === "connected" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <Wifi size={13} />
                      Live
                    </span>
                  ) : null}
                </div>

                <div className="mt-3">
                  <OrderStatusBadge status={order.status} size="lg" />
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  Last updated: {formatDateTime(lastUpdated)}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
                <div className="rounded-xl bg-[#071426] px-5 py-3 text-white">
                  <p className="text-xs text-slate-300">Order Total</p>
                  <p className="mt-1 text-2xl font-bold">
                    {money(order.totalAmount)}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    {order.items?.length || 0} item
                    {order.items?.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <a
                  href="mailto:support@honeyvision.com"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#071426] px-4 py-3 text-sm font-semibold text-[#071426] transition hover:bg-[#071426] hover:text-white"
                >
                  <Headphones size={18} />
                  Need Help
                </a>
              </div>
            </div>

            {connectionStatus !== "connected" && (
              <div className="flex items-center gap-2 border-t border-slate-100 bg-amber-50 px-5 py-3 text-xs text-amber-800 sm:px-7 sm:text-sm">
                <WifiOff size={16} />
                {connectionStatus === "reconnecting"
                  ? "Reconnecting to live updates..."
                  : "Live updates are temporarily unavailable. Latest order information is still available."}
              </div>
            )}
          </section>
        )}

        {/* Main current status card */}
        {order && (
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-[#F4B400]/15 p-2 text-[#071426]">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Current delivery status
                    </p>
                    <h2 className="text-xl font-bold text-[#071426]">
                      {getStatusMessage(order.status)}
                    </h2>
                  </div>
                </div>
              </div>

              {formatDate(estimatedDeliveryDate) && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <CalendarDays size={18} />
                  <div>
                    <p className="text-xs text-emerald-600">Expected delivery</p>
                    <p className="font-bold">
                      {formatDate(estimatedDeliveryDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <OrderProgress
              status={order.status}
              estimatedDeliveryDate={estimatedDeliveryDate}
            />
          </section>
        )}

        {/* TRUE LEFT / RIGHT CONTENT LAYOUT */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN */}
          <div className="space-y-6 lg:col-span-8">
            {/* Tracking timeline */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Delivery journey
                  </p>
                  <h2 className="text-xl font-bold text-[#071426]">
                    Tracking Details
                  </h2>
                </div>

                <div className="rounded-lg bg-slate-50 p-2 text-[#071426]">
                  <Truck size={20} />
                </div>
              </div>

              {visibleEvents.length > 0 ? (
                <TrackingTimeline events={visibleEvents} />
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Tracking events will appear here as your order progresses.
                </div>
              )}

              {events.length > 5 && (
                <button
                  onClick={() => setShowAllEvents((value) => !value)}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#071426] transition hover:text-[#F4B400]"
                >
                  {showAllEvents ? (
                    <>
                      <ChevronUp size={17} />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={17} />
                      Show More ({events.length - 5})
                    </>
                  )}
                </button>
              )}
            </section>

            {/* Order items */}
            {order?.items?.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Your purchase
                  </p>
                  <h2 className="text-xl font-bold text-[#071426]">
                    Order Items
                  </h2>
                </div>

                <div className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <div
                      key={item._id || item.product?._id || idx}
                      className="flex flex-col gap-4 py-5 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          {item.product?.thumbnail ? (
                            <img
                              src={item.product.thumbnail}
                              alt={item.name || item.product?.name || "Product"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="text-slate-400" size={28} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-bold text-[#071426]">
                            {item.name || item.product?.name || "Product"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Quantity: {item.quantity}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {money(item.price)} each
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 sm:text-right">
                        <p className="text-lg font-bold text-[#071426]">
                          {money(Number(item.price || 0) * Number(item.quantity || 0))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Support */}
            <section className="rounded-2xl bg-[#071426] p-6 text-white shadow-sm sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-300">
                    Need assistance?
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    We're here to help with your order.
                  </h2>
                </div>

                <a
                  href="mailto:support@honeyvision.com"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#F4B400] px-5 py-3 font-bold text-[#071426] transition hover:bg-white"
                >
                  <Headphones size={18} />
                  Contact Support
                </a>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <aside className="space-y-6 lg:col-span-4">
            {/* Delivery address */}
            {order?.shippingAddress && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                    <MapPin size={19} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Delivery
                    </p>
                    <h3 className="font-bold text-[#071426]">
                      Delivery Address
                    </h3>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-slate-600">
                  <p className="font-bold text-[#071426]">
                    {order.shippingAddress.name}
                  </p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && (
                    <p>{order.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {[
                      order.shippingAddress.city,
                      order.shippingAddress.state,
                      order.shippingAddress.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>

                  {order.shippingAddress.phone && (
                    <a
                      href={`tel:${order.shippingAddress.phone}`}
                      className="mt-3 inline-flex items-center gap-2 font-semibold text-blue-600 hover:underline"
                    >
                      <Phone size={16} />
                      {order.shippingAddress.phone}
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Shipment details */}
            {(trackingNumber || carrier || estimatedDeliveryDate) && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-[#F4B400]/15 p-2 text-[#071426]">
                    <Truck size={19} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Shipment
                    </p>
                    <h3 className="font-bold text-[#071426]">
                      Shipment Details
                    </h3>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  {carrier && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-slate-500">Courier</span>
                      <span className="text-right font-semibold text-[#071426]">
                        {carrier}
                      </span>
                    </div>
                  )}

                  {trackingNumber && (
                    <div>
                      <p className="mb-1 text-slate-500">Tracking Number</p>
                      <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                        <span className="min-w-0 truncate font-mono text-xs font-semibold text-[#071426]">
                          {trackingNumber}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyTrackingNumber}
                          className="shrink-0 rounded-lg p-1.5 text-[#071426] transition hover:bg-white"
                          title="Copy tracking number"
                        >
                          {copied ? (
                            <Check size={16} className="text-emerald-600" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {formatDate(estimatedDeliveryDate) && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-slate-500">Expected delivery</span>
                      <span className="text-right font-semibold text-[#071426]">
                        {formatDate(estimatedDeliveryDate)}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Delivery agent */}
            {tracking && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <DeliveryAgentCard tracking={tracking} />
              </section>
            )}

            {order?.status === "OUT_FOR_DELIVERY" && (
              <section ref={liveLocationRef} className="rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
                <button
                  type="button"
                  disabled={!isValidLocation(tracking?.deliveryLocation)}
                  onClick={() => liveLocationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className={`flex w-full items-start gap-3 text-left ${isValidLocation(tracking?.deliveryLocation) ? "cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400" : "cursor-default"}`}
                  aria-label={isValidLocation(tracking?.deliveryLocation) ? "Focus live delivery map" : undefined}
                >
                  <div className="rounded-xl bg-white p-2 text-sky-600">
                    <MapPin size={19} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                      Live delivery location
                    </p>
                    <h3 className="mt-1 font-bold text-[#071426]">
                      Delivery agent is on the way
                    </h3>
                    <p className="mt-1 text-sm text-sky-900/70">
                      Delivery OTP will be required when your order arrives.
                    </p>
                  </div>
                </button>
                {isValidLocation(tracking?.deliveryLocation) ? (
                  <>
                    <LiveDeliveryMap deliveryLocation={tracking.deliveryLocation} />
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-sky-900/70">
                      <span className="font-semibold text-emerald-700">Location sharing active</span>
                      <span>Last updated: {formatDateTime(tracking.deliveryLocation.updatedAt)}</span>
                      {Number.isFinite(tracking.deliveryLocation.accuracy) && (
                        <span>Accuracy: approximately {Math.round(tracking.deliveryLocation.accuracy)} m</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="mt-4 rounded-xl border border-sky-200 bg-white px-4 py-5 text-sm text-sky-900/70">
                    <p className="font-semibold text-sky-800">Preparing live delivery tracking...</p>
                    <p className="mt-1">Waiting for the delivery agent&apos;s location.</p>
                  </div>
                )}
                {import.meta.env.DEV && locationDebug && (
                  <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 font-mono text-[10px] text-slate-600">
                    <p>Received latitude: {locationDebug.latitude}</p>
                    <p>Received longitude: {locationDebug.longitude}</p>
                    <p>Accuracy: {locationDebug.accuracy ?? "-"} m</p>
                    <p>Last Socket.IO update: {locationDebug.updatedAt || "-"}</p>
                  </div>
                )}
              </section>
            )}

            {order?.status === "FAILED_DELIVERY" && (
              <section className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Delivery status</p>
                <h3 className="mt-1 font-bold text-red-950">Delivery Attempt Unsuccessful</h3>
                <p className="mt-2 text-sm text-red-900/80">Our team will update you regarding the next delivery step.</p>
                {tracking?.failedDelivery?.failedAt && (
                  <p className="mt-2 text-sm text-red-900/70">Attempted on {formatDateTime(tracking.failedDelivery.failedAt)}.</p>
                )}
                {tracking?.failedDelivery?.reason && (
                  <p className="mt-2 text-sm text-red-900/80">{failedDeliveryReasonLabel[tracking.failedDelivery.reason] || "The delivery attempt could not be completed."}</p>
                )}
              </section>
            )}

            {order?.status === "DELIVERED" && tracking?.deliveryProof && (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Proof of delivery</p>
                <h3 className="mt-1 font-bold text-emerald-950">Delivered successfully</h3>
                <p className="mt-1 text-sm text-emerald-900/75">
                  Delivery completed at {formatDateTime(tracking.deliveryProof.capturedAt)} after OTP verification.
                </p>
                {tracking.deliveryProof.notes && (
                  <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-sm text-emerald-950">
                    Note: {tracking.deliveryProof.notes}
                  </p>
                )}
              </section>
            )}

            {order?.status === "DELIVERED" && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">After delivery</p>
                <h3 className="mt-1 font-bold text-[#071426]">Request a return</h3>
                <form onSubmit={handleReturnRequest} className="mt-4 space-y-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Reason
                    <select value={returnReason} onChange={(event) => setReturnReason(event.target.value)} className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 font-normal">
                      <option value="">Select a reason</option>
                      <option value="Damaged product">Damaged product</option>
                      <option value="Wrong product">Wrong product</option>
                      <option value="Product not as described">Product not as described</option>
                      <option value="Changed my mind">Changed my mind</option>
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Details (optional)
                    <textarea value={returnDescription} onChange={(event) => setReturnDescription(event.target.value)} rows="3" maxLength="2000" className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 font-normal" />
                  </label>
                  <button type="submit" disabled={!returnReason || returnSubmitting} className="rounded-lg bg-[#071426] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                    {returnSubmitting ? "Submitting..." : "Submit return request"}
                  </button>
                  {returnMessage && <p className="text-sm font-semibold text-amber-900">{returnMessage}</p>}
                </form>
              </section>
            )}

            {/* Order summary */}
            {order && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-slate-100 p-2 text-[#071426]">
                    <ReceiptText size={19} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Payment
                    </p>
                    <h3 className="font-bold text-[#071426]">
                      Order Summary
                    </h3>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{money(order.subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Shipping</span>
                    <span className={Number(order.shippingCharge || 0) === 0 ? "font-semibold text-emerald-600" : ""}>
                      {Number(order.shippingCharge || 0) === 0
                        ? "FREE"
                        : money(order.shippingCharge)}
                    </span>
                  </div>

                  {Number(order.discount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span>-{money(order.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-slate-200 pt-4 text-base font-bold text-[#071426]">
                    <span>Total Paid</span>
                    <span>{money(order.totalAmount)}</span>
                  </div>
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

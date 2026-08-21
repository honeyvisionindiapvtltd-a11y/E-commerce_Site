import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useCommerce } from "../context/CommerceContext";
import useOrderTracking from "../hooks/useOrderTracking";
import OrderStatusBadge from "../components/OrderStatusBadge";
import OrderProgress from "../components/OrderProgress";
import TrackingTimeline from "../components/TrackingTimeline";
import TrackingSummary from "../components/TrackingSummary";
import DeliveryAgentCard from "../components/DeliveryAgentCard";


const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

/**
 * OrderTracking Page
 * Displays real-time order tracking with polling
 */
export default function OrderTracking() {
  const { id: routeOrderNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { authToken } = useCommerce();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryOrderNumber = new URLSearchParams(location.search).get("order");
  const orderNumber = routeOrderNumber || queryOrderNumber;

  const token = authToken || (() => {
    try {
      const raw = localStorage.getItem("honey-vision-commerce");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.authToken || null;
    } catch {
      return null;
    }
  })();

  // Use tracking hook for polling
  const { order, tracking, timeline, loading, error, refresh } = useOrderTracking(
    orderNumber,
    token,
    15000 // Poll every 15 seconds
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (error && !order) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate("/orders")}
            className="mb-4 flex items-center gap-2 text-[#071426] hover:text-[#F4B400] font-semibold"
          >
            <ArrowLeft size={20} />
            Back to Orders
          </button>

          <div className="rounded-lg bg-red-50 p-6 border border-red-200">
            <AlertCircle className="text-red-500 mb-2" size={24} />
            <p className="text-red-700 font-semibold">Order Not Found</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate("/orders")}
            className="flex items-center gap-2 text-[#071426] hover:text-[#F4B400] font-semibold transition"
          >
            <ArrowLeft size={20} />
            Back to Orders
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#071426] text-white hover:bg-[#F4B400] hover:text-[#071426] font-semibold transition disabled:opacity-50"
          >
            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#F4B400]">
            Order Tracking
          </p>
          {order && (
            <h1 className="mt-2 text-3xl font-bold text-[#071426] md:text-4xl">
              Order #{order.orderNumber}
            </h1>
          )}
        </div>

        {/* Status badge and key info */}
        {order && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-600 mb-2">Current Status</p>
              <div className="mb-4">
                <OrderStatusBadge status={order.status} size="lg" />
              </div>
              <p className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleTimeString("en-IN")}
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-600 mb-2">Order Total</p>
              <p className="text-3xl font-bold text-[#071426]">
                {money(order.totalAmount)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {/* Tracking summary */}
        {tracking && order && (
          <div className="mb-8">
            <TrackingSummary order={order} tracking={tracking} />
          </div>
        )}

        {/* Progress indicator */}
        {order && (
          <div className="mb-8">
            <OrderProgress status={order.status} estimatedDeliveryDate={tracking?.estimatedDeliveryDate} />
          </div>
        )}

        {/* Timeline */}
        {timeline && <div className="mb-8">
          <TrackingTimeline events={timeline} />
        </div>}

        {/* Delivery address */}
        {order?.shippingAddress && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <MapPin className="text-blue-600" size={20} />
              Delivery Address
            </h3>

            <div className="space-y-2 text-gray-700">
              <p className="font-semibold">{order.shippingAddress.name}</p>
              <p className="text-sm">{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && (
                <p className="text-sm">{order.shippingAddress.addressLine2}</p>
              )}
              <p className="text-sm">
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.postalCode}
              </p>
              {order.shippingAddress.phone && (
                <div className="flex items-center gap-2 text-sm mt-3">
                  <Phone size={16} className="text-blue-600" />
                  <a href={`tel:${order.shippingAddress.phone}`} className="text-blue-600 hover:underline">
                    {order.shippingAddress.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delivery Agent */}
        {order && <div className="mb-8">
          <DeliveryAgentCard tracking={tracking} />
        </div>}

        {/* Order items */}
        {order?.items && order.items.length > 0 && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Order Items</h3>

            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="flex items-center gap-3">
                    {item.product?.thumbnail && (
                      <img
                        src={item.product.thumbnail}
                        alt={item.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{money(item.price * item.quantity)}</p>
                    <p className="text-xs text-gray-500">
                      {money(item.price)} × {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Price summary */}
            <div className="mt-6 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{money(order.subtotal)}</span>
              </div>
              {order.shippingCharge > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{money(order.shippingCharge)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{money(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
                <span>Total</span>
                <span>{money(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Support section */}
        <div className="rounded-lg bg-gradient-to-r from-[#071426] to-blue-900 p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Need Help with Your Delivery?</h3>
          <p className="mb-6 text-blue-100">
            Our support team is here to help. Contact us if you have any questions about your order.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@honeyvision.com"
              className="px-6 py-3 rounded-lg bg-[#F4B400] text-[#071426] font-bold hover:bg-white transition"
            >
              📧 Email Support
            </a>
            <a
              href="tel:+919876543210"
              className="px-6 py-3 rounded-lg bg-green-500 text-white font-bold hover:bg-green-600 transition flex items-center justify-center gap-2"
            >
              <Phone size={18} />
              Call Support
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

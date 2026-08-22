import React from "react";
import { Package, Truck, Calendar, AlertCircle } from "lucide-react";

/**
 * TrackingSummary Component
 * Quick overview card showing key tracking information
 */
export const TrackingSummary = ({ order, tracking }) => {
  if (!tracking) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="text-center py-8">
          <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
          <p className="text-gray-500">Tracking information not available</p>
        </div>
      </div>
    );
  }

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Order ID */}
      <div className="rounded-lg bg-white p-4 shadow-sm border-l-4 border-blue-500">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
          Order ID
        </p>
        <p className="font-mono font-bold text-gray-900 break-all">
          {order?.orderNumber || "N/A"}
        </p>
      </div>

      {/* Tracking Number */}
      <div className="rounded-lg bg-white p-4 shadow-sm border-l-4 border-green-500">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1 flex items-center gap-1">
          <Truck size={14} /> Tracking
        </p>
        <p className="font-mono font-bold text-gray-900">
          {tracking?.trackingNumber || "Not assigned"}
        </p>
      </div>

      {/* Carrier */}
      <div className="rounded-lg bg-white p-4 shadow-sm border-l-4 border-orange-500">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1 flex items-center gap-1">
          <Package size={14} /> Carrier
        </p>
        <p className="font-bold text-gray-900">
          {tracking?.carrier || "N/A"}
        </p>
      </div>

      {/* Estimated Delivery */}
      <div className="rounded-lg bg-white p-4 shadow-sm border-l-4 border-purple-500">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1 flex items-center gap-1">
          <Calendar size={14} /> ETA
        </p>
        <p className="font-bold text-gray-900">
          {formatDate(tracking?.estimatedDeliveryDate || order?.estimatedDeliveryDate)}
        </p>
      </div>
    </div>
  );
};

export default TrackingSummary;

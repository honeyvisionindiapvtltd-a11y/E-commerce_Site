import React from "react";
import { CheckCircle2, Clock, AlertCircle, XCircle, RotateCw } from "lucide-react";
import { getStatusColor, getStatusLabel } from "../services/orderTrackingService";

/**
 * OrderStatusBadge Component
 * Displays order status with appropriate color and icon
 */
export const OrderStatusBadge = ({ status, size = "md" }) => {
  const colorClass = getStatusColor(status);
  const label = getStatusLabel(status);

  // Size classes
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  // Icon selection
  const getIcon = () => {
    if (status === "DELIVERED") {
      return <CheckCircle2 size={16} />;
    } else if (status === "CANCELLED" || status === "RETURNED") {
      return <XCircle size={16} />;
    } else if (status === "RETURN_REQUESTED") {
      return <RotateCw size={16} />;
    } else {
      return <Clock size={16} />;
    }
  };

  return (
    <div
      className={`
        inline-flex items-center gap-2 rounded-full font-semibold text-white
        ${colorClass} ${sizeClasses[size] || sizeClasses.md}
      `}
    >
      {getIcon()}
      <span>{label}</span>
    </div>
  );
};

export default OrderStatusBadge;

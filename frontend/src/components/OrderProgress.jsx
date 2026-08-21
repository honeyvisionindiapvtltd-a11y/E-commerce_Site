import React from "react";
import {
  Package,
  CheckCircle2,
  Truck,
  Home,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { ORDER_STATUSES } from "../services/orderTrackingService";

/**
 * OrderProgress Component
 * Visual progress indicator showing order journey
 */
export const OrderProgress = ({ status, estimatedDeliveryDate }) => {
  const steps = [
    {
      id: ORDER_STATUSES.ORDER_PLACED,
      label: "Order Placed",
      icon: Package,
      position: 0,
    },
    {
      id: ORDER_STATUSES.PAYMENT_CONFIRMED,
      label: "Payment Confirmed",
      icon: CheckCircle2,
      position: 1,
    },
    {
      id: ORDER_STATUSES.PROCESSING,
      label: "Processing",
      icon: Package,
      position: 2,
    },
    {
      id: ORDER_STATUSES.PACKED,
      label: "Packed",
      icon: Package,
      position: 3,
    },
    {
      id: ORDER_STATUSES.SHIPPED,
      label: "Shipped",
      icon: Truck,
      position: 4,
    },
    {
      id: ORDER_STATUSES.OUT_FOR_DELIVERY,
      label: "Out for Delivery",
      icon: Truck,
      position: 5,
    },
    {
      id: ORDER_STATUSES.DELIVERED,
      label: "Delivered",
      icon: Home,
      position: 6,
    },
  ];

  // Find current step index
  const currentStepIndex = steps.findIndex((step) => step.id === status);

  // Check if order is cancelled
  const isCancelled = status === ORDER_STATUSES.CANCELLED;

  if (isCancelled) {
    return (
      <div className="rounded-lg bg-red-50 p-6 border border-red-200">
        <div className="flex items-center gap-3">
          <XCircle className="text-red-500" size={24} />
          <div>
            <p className="font-semibold text-red-900">Order Cancelled</p>
            <p className="text-sm text-red-700">This order has been cancelled.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-lg font-bold text-gray-900">Delivery Progress</h3>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="relative">
          {/* Background line */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200" />

          {/* Filled line */}
          <div
            className="absolute top-5 left-0 h-1 bg-green-500 transition-all duration-500"
            style={{
              width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
            }}
          />

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStepIndex;
              const isCurrentStep = index === currentStepIndex;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  {/* Step circle */}
                  <div
                    className={`
                      flex h-10 w-10 items-center justify-center rounded-full border-4 border-white
                      transition-all duration-300
                      ${
                        isCompleted
                          ? "bg-green-500 shadow-md"
                          : isCurrentStep
                          ? "bg-blue-500 shadow-md"
                          : "bg-gray-300"
                      }
                    `}
                  >
                    <Icon
                      size={18}
                      className={isCompleted || isCurrentStep ? "text-white" : "text-gray-600"}
                    />
                  </div>

                  {/* Step label */}
                  <div className="mt-2 text-center">
                    <p
                      className={`
                        text-xs font-semibold uppercase tracking-tight
                        ${
                          isCurrentStep
                            ? "text-blue-600"
                            : isCompleted
                            ? "text-green-600"
                            : "text-gray-500"
                        }
                      `}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Estimated Delivery */}
      {estimatedDeliveryDate && (
        <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Estimated Delivery:</span>{" "}
            {new Date(estimatedDeliveryDate).toLocaleDateString("en-IN", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      )}
    </div>
  );
};

export default OrderProgress;

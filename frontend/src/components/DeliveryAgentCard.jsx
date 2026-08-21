import React from "react";
import { User, Phone, MapPin } from "lucide-react";

/**
 * DeliveryAgentCard Component
 * Displays delivery agent information if assigned
 */
export const DeliveryAgentCard = ({ agent, tracking }) => {
  // Try to extract agent info from tracking metadata or other sources
  const agentInfo = agent || tracking?.agent;

  if (!agentInfo) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
          <User size={20} className="text-blue-600" />
          Delivery Agent
        </h3>
        <p className="text-gray-500">
          Delivery agent will be assigned once your order ships.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-blue-50 p-6 shadow-sm border border-blue-200">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
        <User size={20} className="text-blue-600" />
        Delivery Agent
      </h3>

      <div className="space-y-3">
        {/* Agent name */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-200">
            <User size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Name
            </p>
            <p className="font-semibold text-gray-900">
              {agentInfo.name || "Not assigned"}
            </p>
          </div>
        </div>

        {/* Phone */}
        {agentInfo.phone && (
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-200">
              <Phone size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Contact
              </p>
              <p className="font-semibold text-gray-900">
                <a href={`tel:${agentInfo.phone}`} className="text-blue-600 hover:underline">
                  {agentInfo.phone}
                </a>
              </p>
              <button
                onClick={() => {
                  window.open(`tel:${agentInfo.phone}`);
                }}
                className="mt-1 text-sm px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition"
              >
                Call Agent
              </button>
            </div>
          </div>
        )}

        {/* Location if available */}
        {agentInfo.currentLocation && (
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-200">
              <MapPin size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Current Area
              </p>
              <p className="font-semibold text-gray-900">
                {agentInfo.currentLocation}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Agent note */}
      <div className="mt-4 rounded bg-white p-3 border border-blue-200">
        <p className="text-xs text-gray-600">
          📞 Contact your delivery agent if you have any queries about the delivery.
        </p>
      </div>
    </div>
  );
};

export default DeliveryAgentCard;

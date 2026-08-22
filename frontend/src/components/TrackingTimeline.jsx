import React from "react";
import { MapPin, CheckCircle2, Clock } from "lucide-react";

/**
 * TrackingTimeline Component
 * Displays timeline of tracking events
 */
export const TrackingTimeline = ({ events = [] }) => {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-gray-900">Tracking Timeline</h3>
        <p className="text-gray-500 text-center py-8">
          No tracking events yet. Check back soon!
        </p>
      </div>
    );
  }

  // Sort events by timestamp (newest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-lg font-bold text-gray-900">Tracking Timeline</h3>

      <div className="relative">
        {/* Vertical line */}
        {sortedEvents.length > 1 && (
          <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-gray-200" />
        )}

        {/* Events */}
        <div className="space-y-6">
          {sortedEvents.map((event, index) => (
            <div key={event._id || index} className="relative flex gap-4 pl-16">
              {/* Event circle */}
              <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full bg-white border-4 border-gray-200 shadow-sm">
                {event.completed ? (
                  <CheckCircle2 className="text-green-500" size={24} />
                ) : (
                  <Clock className="text-blue-500" size={24} />
                )}
              </div>

              {/* Event content */}
              <div className="flex-1 pb-4">
                {/* Title and timestamp */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">
                    {event.title || event.status}
                  </h4>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Time */}
                <p className="text-sm text-gray-500 mb-1">
                  {new Date(event.timestamp).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>

                {/* Description */}
                {event.description && (
                  <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                )}

                {/* Location */}
                {event.location && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                    <MapPin size={14} className="text-gray-400" />
                    {event.location}
                  </div>
                )}

                {/* Metadata/Notes */}
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className="mt-2 text-sm bg-gray-50 p-2 rounded border border-gray-200">
                    {event.metadata.agentName && (
                      <p className="text-gray-700">
                        <span className="font-semibold">Agent:</span> {event.metadata.agentName}
                      </p>
                    )}
                    {event.metadata.agentPhone && (
                      <p className="text-gray-700">
                        <span className="font-semibold">Phone:</span> {event.metadata.agentPhone}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackingTimeline;

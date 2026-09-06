import { useEffect, useMemo, useRef, useState } from "react";
import { InfoWindow, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { isValidLocation } from "../lib/deliveryLocation";
import { calculateDistanceMeters, geocodeAddress, normalizeDeliveryLocation } from "../utils/locationUtils";

const mapHeightClass = "h-[280px] sm:h-[360px]";
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const API_BASE = import.meta.env.VITE_API_URL || "/api";
const ROUTE_REFRESH_INTERVAL_MS = 30000;
const ROUTE_MIN_MOVEMENT_METERS = 100;

const calculateHeading = (from, to) => {
  if (!from || !to) return 0;
  const lat1 = from.lat * (Math.PI / 180);
  const lat2 = to.lat * (Math.PI / 180);
  const deltaLng = (to.lng - from.lng) * (Math.PI / 180);
  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
  let heading = (Math.atan2(y, x) * 180) / Math.PI;
  heading = (heading + 360) % 360;
  return heading;
};

const asLatLng = (location) => {
  const normalized = normalizeDeliveryLocation(location);
  if (!normalized) return null;
  if (import.meta.env.DEV) {
    console.log("LIVE DELIVERY LOCATION", {
      latitude: normalized.latitude,
      longitude: normalized.longitude,
      accuracy: normalized.accuracy,
      timestamp: normalized.timestamp,
    });
  }
  return {
    lat: normalized.lat,
    lng: normalized.lng,
  };
};

const getCoordinateCandidate = (value) => {
  if (!value || typeof value !== "object") return null;

  const coordinates = value.coordinates || value.location || value;
  const latitude = Number(
    coordinates?.latitude ?? coordinates?.lat ?? value?.latitude ?? value?.lat ?? null,
  );
  const longitude = Number(
    coordinates?.longitude ?? coordinates?.lng ?? value?.longitude ?? value?.lng ?? null,
  );

  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
};

const buildCustomerAddressText = (order) => {
  const address = order?.shippingAddress || {};
  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.landmark,
    address.city,
    address.district,
    address.state,
    address.postalCode || address.pincode,
    address.country,
  ].filter(Boolean);

  return parts.join(", ").trim() || "";
};

function RecenterMap({ position }) {
  const map = useMap();
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    if (!map || !position || hasCenteredRef.current) return;
    map.panTo(position);
    hasCenteredRef.current = true;
  }, [map, position]);

  return null;
}

function RouteLayer({ origin, destination, onSummary }) {
  const map = useMap();
  const lastRequestRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    if (!map) return undefined;
    let active = true;
    const loadRenderer = async () => {
      try {
        const routesLibrary = window.google?.maps?.importLibrary
          ? await window.google.maps.importLibrary("routes")
          : window.google?.maps;
        if (!active || !routesLibrary?.DirectionsRenderer) return;
        rendererRef.current = new routesLibrary.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#F4B400",
            strokeWeight: 5,
            strokeOpacity: 0.9,
          },
          preserveViewport: true,
        });
      } catch {
        onSummary?.({ status: "unavailable" });
      }
    };
    loadRenderer();

    return () => {
      active = false;
      rendererRef.current?.setMap(null);
      rendererRef.current = null;
      lastRequestRef.current = null;
    };
  }, [map, onSummary]);

  useEffect(() => {
    if (!map || !origin || !destination || !window.google?.maps) return undefined;

    const previous = lastRequestRef.current;
    const movedMeters = previous ? calculateDistanceMeters(
      { latitude: previous.origin.lat, longitude: previous.origin.lng },
      { latitude: origin.lat, longitude: origin.lng },
    ) : null;
    const destinationChanged = !previous || previous.destination.lat !== destination.lat || previous.destination.lng !== destination.lng;
    const enoughTime = !previous || Date.now() - previous.requestedAt >= ROUTE_REFRESH_INTERVAL_MS;
    if (previous && !destinationChanged && !enoughTime && movedMeters !== null && movedMeters < ROUTE_MIN_MOVEMENT_METERS) return undefined;

    const renderer = rendererRef.current;
    let active = true;
    const requestRoute = async () => {
      try {
        const routesLibrary = window.google.maps.importLibrary
          ? await window.google.maps.importLibrary("routes")
          : window.google.maps;
        if (!active || !renderer || !routesLibrary?.DirectionsService) return;
        const service = new routesLibrary.DirectionsService();
        lastRequestRef.current = { origin, destination, requestedAt: Date.now() };
        service.route({
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
        }, (result, status) => {
          if (!active) return;
      if (status !== window.google.maps.DirectionsStatus.OK || !result?.routes?.length) {
        onSummary?.({ status: "unavailable" });
        return;
      }

      renderer.setDirections(result);

      const route = result.routes[0];
      const leg = route.legs?.[route.legs.length - 1];
      const distanceMeters = leg?.distance?.value ?? 0;
      const minutes = leg?.duration?.value ? Math.max(1, Math.round(leg.duration.value / 60)) : null;

      onSummary?.({
        distanceText: leg?.distance?.text || `${(distanceMeters / 1000).toFixed(1)} km`,
        durationText: leg?.duration?.text || (minutes ? `${minutes} min` : "N/A"),
        etaMinutes: minutes,
        lastUpdated: new Date().toISOString(),
      });

      const bounds = new window.google.maps.LatLngBounds();
      route.overview_path?.forEach((point) => bounds.extend(point));
      if (route.overview_path?.length) {
        map.fitBounds(bounds, { top: 60, right: 60, bottom: 80, left: 60 });
      }
        });
      } catch {
        if (active) onSummary?.({ status: "unavailable" });
      }
    };
    requestRoute();
    return () => { active = false; };

  }, [destination, map, onSummary, origin]);

  return null;
}

function MapBoundsController({ points }) {
  const map = useMap();
  const hasFitBoundsRef = useRef(false);

  useEffect(() => {
    if (!map || points.length < 2 || hasFitBoundsRef.current) return;

    const bounds = new window.google.maps.LatLngBounds();
    points.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, { top: 60, right: 60, bottom: 80, left: 60 });
    hasFitBoundsRef.current = true;
  }, [map, points]);

  return null;
}

function AccuracyCircle({ position, accuracy }) {
  const map = useMap();
  const circleRef = useRef(null);
  const initialAccuracyRef = useRef(accuracy);

  useEffect(() => {
    if (!map || !position || !Number.isFinite(initialAccuracyRef.current) || initialAccuracyRef.current <= 0) return undefined;

    circleRef.current = new window.google.maps.Circle({
      map,
      center: position,
      radius: initialAccuracyRef.current,
      strokeColor: "#0284c7",
      strokeOpacity: 0.8,
      strokeWeight: 1,
      fillColor: "#38bdf8",
      fillOpacity: 0.12,
    });

    return () => {
      circleRef.current?.setMap(null);
      circleRef.current = null;
    };
  }, [map, position]);

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setCenter(position);
    circleRef.current.setRadius(Number.isFinite(accuracy) && accuracy > 0 ? accuracy : 0);
  }, [accuracy, position]);

  return null;
}

function CenterControl({ position }) {
  const map = useMap();

  return (
    <button
      type="button"
      onClick={() => map?.panTo(position)}
      className="absolute bottom-3 right-3 z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-md transition hover:bg-slate-50"
    >
      Center map
    </button>
  );
}

export default function LiveDeliveryMap({ agentLocation, customerLocation, order, isTracking = true, onRouteSummary }) {
  const [resolvedCustomerLocation, setResolvedCustomerLocation] = useState(() => {
    const provided = customerLocation || (order?.shippingAddress?.locationResolved === false
      ? null
      : getCoordinateCandidate(order?.shippingAddress));
    return provided ? asLatLng(provided) : null;
  });
  const [routeSummary, setRouteSummary] = useState(null);
  const [mapError, setMapError] = useState("");
  const [animatedAgentPosition, setAnimatedAgentPosition] = useState(null);
  const [agentHeading, setAgentHeading] = useState(0);
  const [officeLocation, setOfficeLocation] = useState(null);
  const geocodeInFlightRef = useRef(false);
  const previousAgentPositionRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/location/honeyvision-office`)
      .then((response) => response.json())
      .then((payload) => {
        if (!active || !payload.configured) return;
        const lat = Number(payload.location?.coordinates?.lat);
        const lng = Number(payload.location?.coordinates?.lng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setOfficeLocation({ lat, lng, name: payload.location.name });
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    onRouteSummary?.(routeSummary ?? null);
  }, [onRouteSummary, routeSummary]);

  useEffect(() => {
    if (!agentLocation) {
      const resetId = window.setTimeout(() => {
        setAnimatedAgentPosition(null);
        setAgentHeading(0);
      }, 0);
      previousAgentPositionRef.current = null;
      return () => window.clearTimeout(resetId);
    }

    const nextPosition = asLatLng(agentLocation);
    if (!nextPosition) {
      const resetId = window.setTimeout(() => setAnimatedAgentPosition(null), 0);
      previousAgentPositionRef.current = null;
      return () => window.clearTimeout(resetId);
    }

    const previousPosition = previousAgentPositionRef.current || nextPosition;
    setAgentHeading(calculateHeading(previousPosition, nextPosition));
    const movementMeters = calculateDistanceMeters(
      { latitude: previousPosition.lat, longitude: previousPosition.lng },
      { latitude: nextPosition.lat, longitude: nextPosition.lng },
    );
    if (movementMeters !== null && movementMeters > 2000) {
      window.cancelAnimationFrame(animationFrameRef.current);
      previousAgentPositionRef.current = nextPosition;
      setAnimatedAgentPosition(nextPosition);
      return undefined;
    }
    const start = performance.now();
    const duration = 700;
    const totalLatDelta = nextPosition.lat - previousPosition.lat;
    const totalLngDelta = nextPosition.lng - previousPosition.lng;

    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedAgentPosition({
        lat: previousPosition.lat + totalLatDelta * eased,
        lng: previousPosition.lng + totalLngDelta * eased,
      });

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(animate);
      } else {
        previousAgentPositionRef.current = nextPosition;
      }
    };

    window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, [agentLocation]);

  useEffect(() => {
    const directCustomerLocation = customerLocation || (order?.shippingAddress?.locationResolved === false
      ? null
      : getCoordinateCandidate(order?.shippingAddress));
    if (directCustomerLocation) {
      const nextLocation = asLatLng(directCustomerLocation);
      const syncId = window.setTimeout(() => setResolvedCustomerLocation(nextLocation), 0);
      return () => window.clearTimeout(syncId);
    }

    const addressText = buildCustomerAddressText(order);
    if (!addressText || !GOOGLE_MAPS_API_KEY || geocodeInFlightRef.current) return;

    geocodeInFlightRef.current = true;
    setMapError("");

    geocodeAddress(order.shippingAddress)
      .then((coordinates) => {
        setResolvedCustomerLocation(asLatLng(coordinates));
      })
      .catch((error) => {
        setMapError(error.message || "Customer location could not be loaded right now.");
        setResolvedCustomerLocation(null);
      })
      .finally(() => {
        geocodeInFlightRef.current = false;
      });
  }, [customerLocation, order]);

  const agentPosition = useMemo(() => asLatLng(agentLocation), [agentLocation]);
  const customerPosition = useMemo(() => asLatLng(customerLocation) || resolvedCustomerLocation, [customerLocation, resolvedCustomerLocation]);
  const points = useMemo(() => [officeLocation, agentPosition, customerPosition].filter(Boolean), [agentPosition, customerPosition, officeLocation]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className={`mt-4 flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-5 text-sm text-amber-900 ${mapHeightClass}`}>
        Google Maps is unavailable because the map API key is not configured.
      </div>
    );
  }

  if (!agentPosition && !customerPosition) {
    return (
      <div className={`mt-4 flex items-center justify-center rounded-xl border border-sky-200 bg-white px-5 text-sm text-sky-900/70 ${mapHeightClass}`}>
        {isTracking ? "Waiting for the delivery agent’s live GPS location..." : "Customer location is still being resolved."}
      </div>
    );
  }

  const centerPosition = agentPosition || customerPosition;
  const accuracy = Number(agentLocation?.accuracy || 0);
  const hasAccuracy = Number.isFinite(accuracy) && accuracy > 0;

  return (
    <div className={`relative mt-4 overflow-hidden rounded-xl border border-sky-200 bg-white shadow-sm ${mapHeightClass}`}>
        {routeSummary && routeSummary.status !== "unavailable" && (
          <div className="absolute left-3 top-3 z-10 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700">Live route</p>
            <div className="mt-1 flex items-center gap-4 text-xs text-slate-700">
              <span>{routeSummary.distanceText}</span>
              <span className="text-slate-400">•</span>
              <span>{routeSummary.durationText}</span>
            </div>
          </div>
        )}

        {routeSummary?.status === "unavailable" && (
          <div className="absolute left-3 top-3 z-10 rounded-xl border border-amber-200 bg-amber-50/95 px-3 py-2 text-xs text-amber-900 shadow-md backdrop-blur-sm">
            Unable to calculate the delivery route right now.
          </div>
        )}

        {mapError && (
          <div className="absolute inset-x-3 bottom-3 z-10 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {mapError}
          </div>
        )}

        <Map
          defaultCenter={centerPosition}
          defaultZoom={13}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          className="h-full w-full"
        >
          <RecenterMap position={centerPosition} />
          {points.length > 1 && <MapBoundsController points={points} />}
          {animatedAgentPosition && (
            <>
              <Marker
                position={animatedAgentPosition}
                title="Delivery partner"
                rotation={agentHeading}
                icon={{
                  url: "https://maps.google.com/mapfiles/ms/icons/truck.png",
                }}
              />
              <InfoWindow position={animatedAgentPosition}>
                <div className="p-1 text-xs text-slate-700">
                  <div className="font-semibold text-slate-900">Delivery Partner</div>
                  <div>Currently on the way</div>
                </div>
              </InfoWindow>
              {hasAccuracy && <AccuracyCircle position={animatedAgentPosition} accuracy={accuracy} />}
            </>
          )}

          {customerPosition && (
            <Marker position={customerPosition} title="Customer location" icon={{ url: "https://maps.google.com/mapfiles/ms/icons/home.png" }} />
          )}

          {officeLocation && (
            <Marker position={officeLocation} title="HoneyVision Dispatch Center" icon={{ url: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png" }} />
          )}

          {agentPosition && customerPosition && (
            <RouteLayer
              origin={agentPosition}
              destination={customerPosition}
              onSummary={setRouteSummary}
            />
          )}
        </Map>

        {animatedAgentPosition && <CenterControl position={animatedAgentPosition} />}
    </div>
  );
}

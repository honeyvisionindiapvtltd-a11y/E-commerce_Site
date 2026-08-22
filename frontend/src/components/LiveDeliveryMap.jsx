import { useEffect, useRef } from "react";
import { APIProvider, InfoWindow, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { isValidLocation } from "../lib/deliveryLocation";

const mapHeightClass = "h-[260px] sm:h-[320px]";
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    map?.panTo(position);
  }, [map, position]);

  return null;
}

function AccuracyCircle({ position, accuracy }) {
  const map = useMap();
  const circleRef = useRef(null);
  const initialPositionRef = useRef(position);
  const initialAccuracyRef = useRef(accuracy);

  useEffect(() => {
    if (!map || !Number.isFinite(initialAccuracyRef.current) || initialAccuracyRef.current <= 0) return undefined;

    circleRef.current = new window.google.maps.Circle({
      map,
      center: initialPositionRef.current,
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
  }, [map]);

  useEffect(() => {
    circleRef.current?.setCenter(position);
    circleRef.current?.setRadius(accuracy);
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
      Center on delivery agent
    </button>
  );
}

export default function LiveDeliveryMap({ deliveryLocation }) {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className={`mt-4 flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-5 text-sm text-amber-900 ${mapHeightClass}`}>
        Google Maps is unavailable because VITE_GOOGLE_MAPS_API_KEY is not configured.
      </div>
    );
  }

  if (!isValidLocation(deliveryLocation)) {
    return (
      <div className={`mt-4 flex items-center justify-center rounded-xl border border-sky-200 bg-white px-5 text-sm text-sky-900/70 ${mapHeightClass}`}>
        Waiting for the delivery agent&apos;s first GPS location...
      </div>
    );
  }

  const latitude = Number(deliveryLocation.latitude);
  const longitude = Number(deliveryLocation.longitude);
  const accuracy = Number(deliveryLocation.accuracy);
  const position = { lat: latitude, lng: longitude };
  const hasAccuracy = Number.isFinite(accuracy) && accuracy > 0;

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className={`relative mt-4 overflow-hidden rounded-xl border border-sky-200 bg-slate-100 ${mapHeightClass}`}>
        <Map
          center={position}
          zoom={16}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          className="h-full w-full"
        >
          <RecenterMap position={position} />
          <AccuracyCircle position={position} accuracy={accuracy} />
          <Marker position={position} title="Delivery agent live location" />
          {hasAccuracy && <InfoWindow position={position}>Delivery agent live location</InfoWindow>}
        </Map>
        <CenterControl position={position} />
      </div>
    </APIProvider>
  );
}

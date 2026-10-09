import { APIProvider } from "@vis.gl/react-google-maps";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function GoogleMapsProvider({ children }) {
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={["places", "geocoding", "routes"]}>
      {children}
    </APIProvider>
  );
}

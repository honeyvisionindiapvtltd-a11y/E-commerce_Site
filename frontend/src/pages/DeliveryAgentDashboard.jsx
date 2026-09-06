import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, KeyRound, LogOut, MapPin, Navigation, Package, Phone, Play, RefreshCw, Truck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCommerce } from "../context/index.js";
import LiveDeliveryMap from "../components/LiveDeliveryMap";
import { isValidLocation } from "../lib/deliveryLocation";
import { geocodeAddress } from "../utils/locationUtils";
import unifiedGPSService from "../services/unifiedGPSService.js";
import { getLocationFreshnessStatus, getLocationAge } from "../config/deliveryConfig.js";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const geocodeCustomerAddress = async (order) => {
  try {
    return await geocodeAddress(order.shippingAddress);
  } catch {
    return null;
  }
};

const statusLabel = {
  PACKED: "Ready for delivery",
  SHIPPED: "Ready for delivery",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
};

const getCustomerLocation = (order) => {
  const address = order?.shippingAddress || {};
  const candidate = address.coordinates || address.location || address;
  const latitude = Number(
    candidate?.latitude ?? candidate?.lat ?? candidate?.coordinates?.latitude ?? candidate?.coordinates?.lat ?? address?.latitude ?? address?.lat ?? null,
  );
  const longitude = Number(
    candidate?.longitude ?? candidate?.lng ?? candidate?.coordinates?.longitude ?? candidate?.coordinates?.lng ?? address?.longitude ?? address?.lng ?? null,
  );

  return isValidLocation({ latitude, longitude }) ? { latitude, longitude } : null;
};

export default function DeliveryAgentDashboard() {
  const { authToken, user, logout } = useCommerce();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [workingOrder, setWorkingOrder] = useState(null);
  const [error, setError] = useState("");
  const [customerLocations, setCustomerLocations] = useState({});
  const [completionOrder, setCompletionOrder] = useState(null);
  const [completionOtp, setCompletionOtp] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [completionError, setCompletionError] = useState("");
  const [failureOrder, setFailureOrder] = useState(null);
  const [failureReason, setFailureReason] = useState("");
  const [failureNotes, setFailureNotes] = useState("");
  const [failureError, setFailureError] = useState("");
  const retryLocationAccess = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setError("");
      },
      () => {
        setError("Location permission is required to share your live delivery location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000,
      },
    );
  };
  const [successMessage, setSuccessMessage] = useState("");
  const [developmentOtps, setDevelopmentOtps] = useState({});
  const [locationStates, setLocationStates] = useState({});
  const [locationDebug, setLocationDebug] = useState({});
  const [currentAgentLocation, setCurrentAgentLocation] = useState(null);
  const unsubscribeRefs = useRef(new Map()); // Store unsubscribe functions

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/delivery/orders`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Unable to load deliveries");
      setOrders(payload.orders || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (!authToken) return undefined;
    const initialLoad = window.setTimeout(loadOrders, 0);
    return () => window.clearTimeout(initialLoad);
  }, [authToken, loadOrders]);

  useEffect(() => {
    let active = true;

    const resolveCustomerLocations = async () => {
      const nextLocations = {};

      for (const order of orders.filter((entry) => entry.status === "OUT_FOR_DELIVERY")) {
        const direct = getCustomerLocation(order);
        if (direct) {
          nextLocations[order.orderNumber] = direct;
          continue;
        }

        const geocoded = await geocodeCustomerAddress(order);
        if (active && geocoded) {
          nextLocations[order.orderNumber] = geocoded;
        }
      }

      if (active) {
        setCustomerLocations((current) => ({ ...current, ...nextLocations }));
      }
    };

    if (orders.length) {
      resolveCustomerLocations();
    }

    return () => {
      active = false;
    };
  }, [orders]);

  /**
   * Single GPS watcher subscription effect
   * REPLACES individual order watchers
   * ONE GPS watcher broadcasts to ALL active orders
   */
  useEffect(() => {
    const activeOrderNumbers = new Set(
      orders
        .filter((order) => order.status === "OUT_FOR_DELIVERY")
        .map((order) => order.orderNumber)
    );

    // Clean up subscriptions for orders that are no longer active
    for (const [orderNumber, unsubscribe] of unsubscribeRefs.current.entries()) {
      if (!activeOrderNumbers.has(orderNumber)) {
        unsubscribe();
        unsubscribeRefs.current.delete(orderNumber);
        setLocationStates((current) => {
          const next = { ...current };
          delete next[orderNumber];
          return next;
        });
      }
    }

    // Subscribe to GPS updates for all active orders
    activeOrderNumbers.forEach((orderNumber) => {
      if (unsubscribeRefs.current.has(orderNumber)) {
        return; // Already subscribed
      }

      if (!navigator.geolocation) {
        setLocationStates((current) => ({ ...current, [orderNumber]: "unsupported" }));
        return;
      }

      setLocationStates((current) => ({ ...current, [orderNumber]: "starting" }));

      // Subscribe to GPS updates from unified service
      const unsubscribe = unifiedGPSService.subscribe(
        orderNumber,
        async (locationUpdate) => {
          // Update agent's current location in state
          setCurrentAgentLocation({
            ...locationUpdate,
            accuracy: locationUpdate.accuracy,
            heading: locationUpdate.heading,
            speed: locationUpdate.speed,
          });

          if (import.meta.env.DEV) {
            setLocationDebug((current) => ({
              ...current,
              [orderNumber]: {
                ...current[orderNumber],
                latitude: locationUpdate.latitude,
                longitude: locationUpdate.longitude,
                accuracy: locationUpdate.accuracy,
                lastGpsUpdate: new Date().toISOString(),
              },
            }));
          }

          // Send location to backend for this order
          try {
            const response = await fetch(
              `${API_BASE}/delivery/orders/${encodeURIComponent(orderNumber)}/location`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                  orderNumber,
                  latitude: locationUpdate.latitude,
                  longitude: locationUpdate.longitude,
                  accuracy: locationUpdate.accuracy,
                  heading: locationUpdate.heading,
                  speed: locationUpdate.speed,
                  timestamp: locationUpdate.timestamp,
                }),
              }
            );

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
              const error = new Error(payload.message || `Location update failed (${response.status})`);
              error.status = response.status;
              throw error;
            }

            const locationAge = getLocationAge(locationUpdate.timestamp);
            const freshness = getLocationFreshnessStatus(locationUpdate.timestamp);

            setLocationStates((current) => ({
              ...current,
              [orderNumber]: "active",
            }));

            if (import.meta.env.DEV) {
              setLocationDebug((current) => ({
                ...current,
                [orderNumber]: {
                  ...current[orderNumber],
                  lastApiUpdate: new Date().toISOString(),
                  lastApiError: null,
                  locationAge,
                  freshness,
                },
              }));
            }
          } catch (locationError) {
            if (import.meta.env.DEV) {
              setLocationDebug((current) => ({
                ...current,
                [orderNumber]: {
                  ...current[orderNumber],
                  lastApiError: locationError.message,
                },
              }));
              console.debug("GPS LOCATION API ERROR", {
                orderNumber,
                message: locationError.message,
                status: locationError.status,
              });
            }

            if (locationError.status === 401 || locationError.status === 403) {
              setLocationStates((current) => ({
                ...current,
                [orderNumber]: "unauthorized",
              }));
            } else if (locationError.status === 404) {
              setLocationStates((current) => ({
                ...current,
                [orderNumber]: "not-assigned",
              }));
            } else if (
              locationError.status === 409 ||
              locationError.message.includes("out for delivery")
            ) {
              setLocationStates((current) => ({
                ...current,
                [orderNumber]: "inactive",
              }));
            } else if (locationError.status) {
              setLocationStates((current) => ({
                ...current,
                [orderNumber]: `server-error:${locationError.message}`,
              }));
            } else {
              setLocationStates((current) => ({
                ...current,
                [orderNumber]: "network-error",
              }));
            }
          }
        }
      );

      unsubscribeRefs.current.set(orderNumber, unsubscribe);
    });

    // Handle GPS permission/startup errors
    const onGPSError = (error) => {
      console.error("GPS Error:", error);
      activeOrderNumbers.forEach((orderNumber) => {
        if (error.code === "PERMISSION_DENIED") {
          setLocationStates((current) => ({
            ...current,
            [orderNumber]: "denied",
          }));
        } else if (error.code === "POSITION_UNAVAILABLE") {
          setLocationStates((current) => ({
            ...current,
            [orderNumber]: "unavailable",
          }));
        } else if (error.code === "TIMEOUT") {
          setLocationStates((current) => ({
            ...current,
            [orderNumber]: "timeout",
          }));
        }
      });
    };

    unifiedGPSService.onError(onGPSError);

    return () => {
      // Cleanup is handled by the unsubscribe functions stored in refs
    };
  }, [orders, authToken]);

  // Clean up GPS service on unmount
  useEffect(
    () => () => {
      // Unsubscribe all orders
      for (const unsubscribe of unsubscribeRefs.current.values()) {
        unsubscribe();
      }
      unsubscribeRefs.current.clear();
    },
    []
  );

  const handleLogout = () => {
    // Clean up GPS service
    for (const unsubscribe of unsubscribeRefs.current.values()) {
      unsubscribe();
    }
    unsubscribeRefs.current.clear();
    unifiedGPSService.destroy();

    logout();
    navigate("/login", { replace: true });
  };

  const updateStatus = async (orderNumber, action) => {
    setWorkingOrder(orderNumber);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/delivery/orders/${encodeURIComponent(orderNumber)}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Unable to update delivery");
      }
      setOrders((current) => current.map((order) => order.orderNumber === orderNumber ? payload.order : order));
      if (action === "start" && payload.smsSent) {
        setSuccessMessage("Delivery started. Verification OTP sent to the customer.");
      }
      if (payload.developmentOtp) {
        setDevelopmentOtps((current) => ({ ...current, [orderNumber]: payload.developmentOtp }));
      }
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setWorkingOrder(null);
    }
  };

  const completeDelivery = async (event) => {
    event.preventDefault();
    if (!completionOrder) return;
    setWorkingOrder(completionOrder);
    setCompletionError("");
    try {
      const response = await fetch(`${API_BASE}/delivery/orders/${encodeURIComponent(completionOrder)}/deliver`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ otp: completionOtp, notes: completionNotes }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Unable to complete delivery");
      setOrders((current) => current.map((order) => order.orderNumber === completionOrder ? payload.order : order));
      setCompletionOrder(null);
      setCompletionOtp("");
      setCompletionNotes("");
    } catch (completionRequestError) {
      setCompletionError(completionRequestError.message);
    } finally {
      setWorkingOrder(null);
    }
  };

  const failDelivery = async (event) => {
    event.preventDefault();
    if (!failureOrder) return;
    setWorkingOrder(failureOrder);
    setFailureError("");
    try {
      const response = await fetch(`${API_BASE}/delivery/orders/${encodeURIComponent(failureOrder)}/fail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reason: failureReason, notes: failureNotes }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Unable to record failed delivery");
      setOrders((current) => current.map((order) => order.orderNumber === failureOrder ? payload.order : order));
      setFailureOrder(null);
      setFailureReason("");
      setFailureNotes("");
      setSuccessMessage("Failed delivery recorded. GPS sharing has stopped for this order.");
    } catch (failureRequestError) {
      setFailureError(failureRequestError.message);
    } finally {
      setWorkingOrder(null);
    }
  };

  const visibleOrders = orders.filter((order) => {
    if (filter === "READY") return ["PACKED", "SHIPPED"].includes(order.status);
    if (filter === "OUT") return order.status === "OUT_FOR_DELIVERY";
    if (filter === "DELIVERED") return order.status === "DELIVERED";
    return true;
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">HoneyVision delivery</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">My deliveries</h1>
            <p className="mt-1 text-sm text-slate-500">Signed in as {user?.name || "delivery partner"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={loadOrders} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              <RefreshCw size={16} /> Refresh
            </button>
            <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        <nav className="mb-6 flex flex-wrap gap-2" aria-label="Delivery filters">
          {[['ALL', 'All'], ['READY', 'Ready for delivery'], ['OUT', 'Out for delivery'], ['DELIVERED', 'Delivered']].map(([value, label]) => (
            <button key={value} onClick={() => setFilter(value)} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === value ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
              {label}
            </button>
          ))}
        </nav>

        {error && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {successMessage && <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p>}
        {loading ? <p className="text-sm text-slate-500">Loading assigned deliveries...</p> : null}
        {!loading && visibleOrders.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No assigned deliveries in this view.</p> : null}

        <div className="grid gap-5 lg:grid-cols-2">
          {visibleOrders.map((order) => {
            const busy = workingOrder === order.orderNumber;
            const customerLocation = customerLocations[order.orderNumber] || getCustomerLocation(order);
            return (
              <article key={order._id || order.orderNumber} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Order</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">#{order.orderNumber}</h2>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{statusLabel[order.status] || order.status}</span>
                </div>
                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <p className="flex gap-2"><Package size={17} /> {order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ") || "Order items"}</p>
                  <p className="flex gap-2"><MapPin size={17} /> {order.shippingAddress?.addressLine1}, {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
                  <p className="flex gap-2"><Phone size={17} /> {order.user?.phone || order.shippingAddress?.phone || "No contact number"}</p>
                </div>
                {order.status === "OUT_FOR_DELIVERY" && (
                  <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
                    <b>Live location sharing</b>
                    <p className="mt-1">
                      {{
                        starting: "Getting current location...",
                        active: "Location sharing active",
                        delayed: "Location update delayed. Trying to refresh your location...",
                        denied: "Location permission denied. Delivery can continue without GPS.",
                        unsupported: "This browser does not support GPS. Delivery can continue.",
                        timeout: "GPS timed out. Waiting for another location.",
                        unavailable: "GPS is temporarily unavailable.",
                        "network-error": "Location update failed temporarily. Retrying with the next GPS reading.",
                        inactive: "Location sharing stopped because this order is no longer active.",
                        unauthorized: "Location sharing was rejected because this session is no longer authorized.",
                        "not-assigned": "This order is no longer assigned to this delivery agent.",
                      }[locationStates[order.orderNumber]] || "Waiting for GPS permission..."}
                    </p>
                    {['denied', 'timeout', 'unavailable', 'unsupported'].includes(locationStates[order.orderNumber]) && (
                      <button type="button" onClick={retryLocationAccess} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white">
                        <Navigation size={13} /> Retry location access
                      </button>
                    )}
                  </div>
                )}
                {import.meta.env.DEV && order.status === "OUT_FOR_DELIVERY" && (
                  <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 font-mono text-[10px] text-slate-600">
                    <p>GPS supported: {locationDebug[order.orderNumber]?.supported === false ? "no" : "yes"}</p>
                    <p>Permission: {locationDebug[order.orderNumber]?.permission || "-"}</p>
                    <p>GPS latitude: {locationDebug[order.orderNumber]?.latitude ?? "-"}</p>
                    <p>GPS longitude: {locationDebug[order.orderNumber]?.longitude ?? "-"}</p>
                    <p>Accuracy: {locationDebug[order.orderNumber]?.accuracy ?? "-"} m</p>
                    <p>Last GPS update: {locationDebug[order.orderNumber]?.lastGpsUpdate || "-"}</p>
                    <p>Last API update: {locationDebug[order.orderNumber]?.lastApiUpdate || "-"}</p>
                    <p>Last GPS error: {locationDebug[order.orderNumber]?.lastGpsError || "-"}</p>
                    <p>Last API error: {locationDebug[order.orderNumber]?.lastApiError || "-"}</p>
                  </div>
                )}
                <div className="mt-5 flex flex-wrap gap-3">
                  {!["OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status) && (
                    <button disabled={busy} onClick={() => updateStatus(order.orderNumber, "start")} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                      <Play size={15} /> Start delivery
                    </button>
                  )}
                  {order.status === "OUT_FOR_DELIVERY" && (
                    <button disabled={busy} onClick={() => { setCompletionOrder(order.orderNumber); setCompletionError(""); }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                      <CheckCircle2 size={15} /> Complete delivery
                    </button>
                  )}
                  {order.status === "OUT_FOR_DELIVERY" && (
                    <button disabled={busy} onClick={() => { setFailureOrder(order.orderNumber); setFailureError(""); }} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                      <X size={15} /> Unable to deliver
                    </button>
                  )}
                  {import.meta.env.DEV && developmentOtps[order.orderNumber] && order.status === "OUT_FOR_DELIVERY" && (
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700">
                      <KeyRound size={14} /> Development OTP: {developmentOtps[order.orderNumber]}
                    </span>
                  )}
                  {order.status === "OUT_FOR_DELIVERY" && customerLocation ? (
                  <>
                    <button
                      type="button"
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${customerLocation.latitude},${customerLocation.longitude}&travelmode=driving`, "_blank", "noopener,noreferrer")}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Navigation size={15} /> Start navigation
                    </button>
                    <div className="mt-4">
                      <LiveDeliveryMap
                        agentLocation={currentAgentLocation}
                        customerLocation={customerLocation}
                        order={order}
                        isTracking
                      />
                    </div>
                  </>
                ) : null}
                  {order.status === "OUT_FOR_DELIVERY" && !customerLocation && (
                    <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                      <Navigation size={14} /> Customer coordinates unavailable
                    </span>
                  )}
                  {order.status === "DELIVERED" && <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><Truck size={16} /> Completed</span>}
                </div>
              </article>
            );
          })}
        </div>
        {completionOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4" role="dialog" aria-modal="true" aria-labelledby="complete-delivery-title">
            <form onSubmit={completeDelivery} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Proof of delivery</p>
                  <h2 id="complete-delivery-title" className="mt-1 text-xl font-bold text-slate-900">Verify customer OTP</h2>
                </div>
                <button type="button" onClick={() => setCompletionOrder(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">
                  <X size={18} />
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-600">Ask the customer for the 6-digit delivery OTP before completing this order.</p>
              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Delivery OTP
                <input
                  value={completionOtp}
                  onChange={(event) => setCompletionOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-center text-xl tracking-[0.35em] focus:border-emerald-500 focus:outline-none"
                />
              </label>
              <label className="mt-4 block text-sm font-semibold text-slate-700">
                Delivery notes (optional)
                <textarea value={completionNotes} onChange={(event) => setCompletionNotes(event.target.value.slice(0, 1000))} rows={3} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal focus:border-emerald-500 focus:outline-none" placeholder="Leave at reception, received by..." />
              </label>
              {completionError && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{completionError}</p>}
              <button type="submit" disabled={workingOrder === completionOrder} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                <CheckCircle2 size={16} /> Verify OTP and complete delivery
              </button>
            </form>
          </div>
        )}
        {failureOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4" role="dialog" aria-modal="true" aria-labelledby="failed-delivery-title">
            <form onSubmit={failDelivery} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-red-600">Delivery exception</p>
                  <h2 id="failed-delivery-title" className="mt-1 text-xl font-bold text-slate-900">Unable to Deliver</h2>
                </div>
                <button type="button" onClick={() => setFailureOrder(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
              </div>
              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Delivery failure reason
                <select required value={failureReason} onChange={(event) => setFailureReason(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal focus:border-red-500 focus:outline-none">
                  <option value="">Select a reason</option>
                  <option value="CUSTOMER_UNAVAILABLE">Customer unavailable</option>
                  <option value="CUSTOMER_NOT_REACHABLE">Customer not reachable</option>
                  <option value="ADDRESS_NOT_FOUND">Address not found</option>
                  <option value="CUSTOMER_REFUSED">Customer refused delivery</option>
                  <option value="OTP_VERIFICATION_FAILED">OTP verification failed</option>
                  <option value="DELIVERY_LOCATION_UNREACHABLE">Delivery location unreachable</option>
                  <option value="CUSTOMER_REQUESTED_RESCHEDULE">Customer requested reschedule</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className="mt-4 block text-sm font-semibold text-slate-700">
                Notes {failureReason === "OTHER" ? "(required)" : "(optional)"}
                <textarea value={failureNotes} onChange={(event) => setFailureNotes(event.target.value.slice(0, 1000))} required={failureReason === "OTHER"} rows={3} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal focus:border-red-500 focus:outline-none" placeholder="Describe what prevented delivery" />
              </label>
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">This order will be marked as failed delivery. You can only continue through the appropriate admin/rescheduling workflow.</p>
              {failureError && <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">{failureError}</p>}
              <div className="mt-5 flex gap-3">
                <button type="button" onClick={() => setFailureOrder(null)} className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={workingOrder === failureOrder} className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Confirm Failed Delivery</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Package, Truck, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { ORDER_STATUSES } from '../services/orderTrackingService';

const STATUS_STEPS = [
  { key: ORDER_STATUSES.ORDER_PLACED, label: 'Order Placed', icon: Package },
  { key: ORDER_STATUSES.PAYMENT_CONFIRMED, label: 'Payment Confirmed', icon: CheckCircle2 },
  { key: ORDER_STATUSES.PROCESSING, label: 'Processing', icon: Clock },
  { key: ORDER_STATUSES.PACKED, label: 'Packed', icon: Package },
  { key: ORDER_STATUSES.SHIPPED, label: 'Shipped', icon: Truck },
  { key: ORDER_STATUSES.OUT_FOR_DELIVERY, label: 'Out for Delivery', icon: Truck },
  { key: ORDER_STATUSES.DELIVERED, label: 'Delivered', icon: CheckCircle2 },
];

const formatStatus = (status = '') =>
  String(status)
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export default function TrackOrder() {
  const { trackingNumber } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTracking = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/tracking/${trackingNumber}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to track shipment');
        }

        setShipment(data.shipment || data.order || null);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Unable to load tracking');
      } finally {
        setLoading(false);
      }
    };

    if (trackingNumber) {
      loadTracking();
    }
  }, [trackingNumber]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-slate-500">Loading tracking information...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-20">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">Tracking unavailable</h1>
          <p className="mt-3 text-slate-500">{error}</p>
        </div>
      </main>
    );
  }

  if (!shipment) {
    return null;
  }

  const currentIndex = STATUS_STEPS.findIndex((step) => step.key === shipment.status);

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-7">
          <p className="text-sm font-semibold text-amber-500">HoneyVision</p>
          <h1 className="mt-2 text-3xl font-black text-[#071426] sm:text-4xl">Track Your Order</h1>
          <p className="mt-2 text-slate-500">
            Tracking number: <span className="font-bold text-[#071426]">{shipment.trackingNumber || trackingNumber}</span>
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <p className="text-sm text-slate-500">Current Status</p>
            <h2 className="mt-1 text-2xl font-black text-[#071426]">{formatStatus(shipment.status)}</h2>
          </div>

          <div className="space-y-6">
            {STATUS_STEPS.map((step, index) => {
              const Icon = step.icon;
              const completed = index <= currentIndex;

              return (
                <div key={step.key} className="flex items-start gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${completed ? 'bg-amber-400 text-[#071426]' : 'bg-slate-100 text-slate-400'}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className={`font-bold ${completed ? 'text-[#071426]' : 'text-slate-400'}`}>{step.label}</h3>
                    {shipment.trackingEvents
                      ?.filter((event) => event.status === step.key)
                      .slice(-1)
                      .map((event) => (
                        <div key={event._id || `${step.key}-${event.timestamp}`} className="mt-1 text-sm text-slate-500">
                          <p>{event.message}</p>
                          {event.location && (
                            <p className="mt-1 flex items-center gap-1">
                              <MapPin size={14} /> {event.location}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-slate-400">
                            {new Date(event.timestamp).toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-[#071426]">Delivery Details</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-500">
              <p><strong className="text-[#071426]">Courier:</strong> {shipment.courierName || 'HoneyVision Delivery'}</p>
              <p><strong className="text-[#071426]">Tracking:</strong> {shipment.trackingNumber || trackingNumber}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-[#071426]">Delivery Address</h2>
            {shipment.order?.shippingAddress ? (
              <div className="mt-4 text-sm leading-6 text-slate-500">
                <p className="font-semibold text-[#071426]">{shipment.order.shippingAddress.name}</p>
                <p>{shipment.order.shippingAddress.addressLine1}</p>
                {shipment.order.shippingAddress.addressLine2 && <p>{shipment.order.shippingAddress.addressLine2}</p>}
                <p>{shipment.order.shippingAddress.city}, {shipment.order.shippingAddress.state}</p>
                <p>PIN: {shipment.order.shippingAddress.pincode}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Delivery address not available.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

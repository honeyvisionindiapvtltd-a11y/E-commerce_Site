import React, { useState } from 'react';
import { useCommerce } from '../context/CommerceContext';

export default function DeliveryChecker({ productId = null, title = 'Check delivery availability' }) {
  const { deliveryPin, checkDeliveryByPincode, checkDeliveryByLocation, setDeliveryPin } = useCommerce();
  const [pincode, setPincode] = useState(deliveryPin || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleCheck = async () => {
    setError('');
    setResult(null);
    const pin = String(pincode || '').replace(/\D/g, '').slice(0, 6);
    if (pin.length !== 6) {
      setError('Please enter a valid 6-digit PIN code.');
      return;
    }

    setLoading(true);
    try {
      const resp = await checkDeliveryByPincode({ pincode: pin, productId });
      setResult(resp);
      if (resp && resp.success) setDeliveryPin(resp.location?.pincode || pin);
    } catch (err) {
      setError(err?.message || 'Unable to check delivery.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseLocation = () => {
    setError('');
    setResult(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const resp = await checkDeliveryByLocation({ latitude, longitude, productId });
          setResult(resp);
          if (resp && resp.success) setDeliveryPin(resp.location?.pincode || '');
        } catch (err) {
          setError(err?.message || 'Unable to resolve delivery at your location.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        setError(err?.message || 'Unable to access location.');
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>

      <div className="flex gap-2 items-center">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter 6-digit PIN code"
          className="w-40 rounded-lg border px-3 py-2 outline-none"
        />
        <button onClick={handleCheck} disabled={loading} className="rounded-lg bg-[#071426] text-white px-4 py-2 hover:opacity-90">
          {loading ? 'Checking...' : 'Check' }
        </button>
        <button onClick={handleUseLocation} disabled={loading} className="rounded-lg border px-3 py-2 hover:bg-slate-50">
          Use my location
        </button>
      </div>

      {error ? <p className="mt-3 text-red-600">{error}</p> : null}

      {result && result.success ? (
        <div className="mt-4">
          <p className="font-semibold">{result.serviceable ? 'Deliverable to this location' : 'Not deliverable'}</p>
          {result.location ? (
            <p className="text-sm text-slate-600">{result.location.city ? `${result.location.city}, ` : ''}{result.location.state} — PIN {result.location.pincode}</p>
          ) : null}
          {result.delivery ? (
            <div className="mt-2 text-sm text-slate-700">
              <div>Est: {result.delivery.estimatedDeliveryDays}</div>
              <div>Delivery charge: ₹{Number(result.delivery.deliveryCharge || 0)}</div>
              <div>COD: {result.delivery.codAvailable ? 'Available' : 'Not available'}</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const DEFAULT_GEOCODING_URL = 'https://nominatim.openstreetmap.org/reverse';

function parseLocationAddress(address = {}) {
  const postal = String(address.postcode || '').replace(/\D/g, '').slice(0, 6);
  const city = address.city || address.town || address.village || address.hamlet || address.county || '';
  const state = address.state || address.region || '';
  const country = address.country || '';

  return {
    pincode: postal,
    city: city.trim(),
    state: state.trim(),
    country: country.trim(),
  };
}

export async function reverseGeocodeCoordinates(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new Error('Invalid coordinates provided.');
  }

  const baseUrl = process.env.GEOCODING_API_URL || DEFAULT_GEOCODING_URL;
  const url = new URL(baseUrl);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(latitude));
  url.searchParams.set('lon', String(longitude));
  url.searchParams.set('addressdetails', '1');
  if (process.env.GEOCODING_API_KEY) {
    url.searchParams.set('key', process.env.GEOCODING_API_KEY);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'HoneyVision/1.0 (+https://honeyvision.in)',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error('Geocoding service returned an error.');
    }

    const data = await response.json();
    const location = parseLocationAddress(data.address);

    if (!location.pincode) {
      throw new Error('Unable to resolve PIN code from your location.');
    }

    return location;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Geocoding request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

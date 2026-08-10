export function normalizePincode(value) {
  if (value == null) return '';
  return String(value).replace(/\s+/g, '').replace(/\D/g, '').slice(0, 6);
}

export function isValidPincode(value) {
  const normalized = normalizePincode(value);
  return /^[1-9][0-9]{5}$/.test(normalized);
}

export function parseLatitude(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function parseLongitude(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function isValidLatitude(value) {
  return typeof value === 'number' && value >= -90 && value <= 90;
}

export function isValidLongitude(value) {
  return typeof value === 'number' && value >= -180 && value <= 180;
}

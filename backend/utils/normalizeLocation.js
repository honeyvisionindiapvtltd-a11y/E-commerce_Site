export const normalizeLocationValue = (value) => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

export const normalizePincode = (value) => String(value ?? "").trim();

export const isValidPincode = (value) => /^\d{6}$/.test(normalizePincode(value));

export const normalizeCity = (value, cities = []) => {
  const normalized = normalizeLocationValue(value);
  const match = cities.find((city) => [city.name, ...(city.aliases || [])]
    .map(normalizeLocationValue)
    .includes(normalized));

  return match ? normalizeLocationValue(match.name) : normalized;
};

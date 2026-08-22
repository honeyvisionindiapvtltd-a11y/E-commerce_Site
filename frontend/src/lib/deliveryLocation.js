export const isValidLocation = (location) => (
  Number.isFinite(Number(location?.latitude))
  && Number.isFinite(Number(location?.longitude))
  && Number(location.latitude) >= -90
  && Number(location.latitude) <= 90
  && Number(location.longitude) >= -180
  && Number(location.longitude) <= 180
  && !(Number(location.latitude) === 0 && Number(location.longitude) === 0)
);

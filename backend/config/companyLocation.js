const toCoordinate = (value, minimum, maximum) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null;
};

export const getHoneyVisionOffice = () => ({
  name: process.env.HONEYVISION_OFFICE_NAME || 'HoneyVision Dispatch Location',
  address: {
    addressLine1: process.env.HONEYVISION_OFFICE_ADDRESS || '',
    city: process.env.HONEYVISION_OFFICE_CITY || '',
    state: process.env.HONEYVISION_OFFICE_STATE || '',
    country: process.env.HONEYVISION_OFFICE_COUNTRY || 'India',
    pincode: process.env.HONEYVISION_OFFICE_PINCODE || '',
  },
  coordinates: {
    lat: toCoordinate(process.env.HONEYVISION_OFFICE_LAT, -90, 90),
    lng: toCoordinate(process.env.HONEYVISION_OFFICE_LNG, -180, 180),
  },
});

export default getHoneyVisionOffice;

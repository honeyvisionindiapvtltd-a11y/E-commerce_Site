import express from 'express';
import User from '../models/User.js';
import { protect, requireCustomer } from '../middleware/authMiddleware.js';
import { checkDeliveryServiceability } from '../services/deliveryServiceabilityService.js';

const router = express.Router();
const allowedTypes = new Set(['HOME', 'WORK', 'OTHER']);
const cityAliases = { bhubaneshwar: 'Bhubaneswar', khurda: 'Khordha' };
const coordinateValue = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizeAddress = (input = {}) => ({
  label: String(input.label || '').trim(),
  type: String(input.type || input.addressType || 'Home').trim(),
  fullName: String(input.fullName || input.name || '').trim(),
  phone: String(input.phone || '').trim(),
  addressLine1: String(input.addressLine1 || input.line1 || input.address || '').trim(),
  addressLine2: String(input.addressLine2 || input.line2 || '').trim(),
  landmark: String(input.landmark || '').trim(),
  city: cityAliases[String(input.city || '').trim().toLowerCase()] || String(input.city || '').trim(),
  district: String(input.district || '').trim(),
  state: String(input.state || '').trim(),
  country: String(input.country || 'India').trim(),
  pincode: String(input.pincode || input.postalCode || input.pinCode || input.pin || '').replace(/\s+/g, ''),
  latitude: coordinateValue(input.latitude),
  longitude: coordinateValue(input.longitude),
  locationResolved: Boolean(input.locationResolved && coordinateValue(input.latitude) !== null && coordinateValue(input.longitude) !== null),
  googlePlaceId: String(input.googlePlaceId || '').trim(),
  formattedAddress: String(input.formattedAddress || '').trim(),
  addressType: allowedTypes.has(String(input.addressType || input.type || '').toUpperCase()) ? String(input.addressType || input.type).toUpperCase() : 'HOME',
  isDefault: Boolean(input.isDefault),
});

const validateAddress = async (address) => {
  if (!address.fullName || !address.phone || !address.addressLine1 || !address.city || !address.state || !/^\d{6}$/.test(address.pincode)) {
    return { message: 'Full name, phone, address, city, state and a valid 6-digit pincode are required.', serviceability: null };
  }
  const hasLatitude = address.latitude !== null;
  const hasLongitude = address.longitude !== null;
  if (hasLatitude !== hasLongitude || (hasLatitude && (address.latitude === 0 && address.longitude === 0 || address.latitude < -90 || address.latitude > 90 || address.longitude < -180 || address.longitude > 180))) {
    return { message: 'Valid latitude and longitude are required for a saved address.', serviceability: null };
  }
  const serviceability = await checkDeliveryServiceability({
    country: address.country,
    state: address.state,
    city: address.city,
    pincode: address.pincode,
  });
  return { message: null, serviceability };
};

const safeAddresses = (user) => (user.addresses || []).map((address) => address.toJSON());

router.use(protect, requireCustomer);

router.get('/addresses', async (req, res) => {
  res.json({ success: true, addresses: safeAddresses(req.user) });
});

router.post('/addresses', async (req, res) => {
  try {
    const address = normalizeAddress(req.body);
    const validation = await validateAddress(address);
    if (validation.message) return res.status(400).json({ success: false, message: validation.message });

    const user = req.user;
    const shouldDefault = user.addresses.length === 0 || address.isDefault;
    if (shouldDefault) user.addresses.forEach((entry) => { entry.isDefault = false; });
    address.isDefault = shouldDefault;
    user.addresses.push(address);
    await user.save();
    res.status(201).json({ success: true, address: user.addresses[user.addresses.length - 1].toJSON(), addresses: safeAddresses(user), serviceability: validation.serviceability });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Unable to save address.' });
  }
});

router.put('/addresses/:addressId', async (req, res) => {
  try {
    const address = req.user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ success: false, message: 'Address not found.' });
    const next = normalizeAddress({ ...address.toObject(), ...req.body });
    const validation = await validateAddress(next);
    if (validation.message) return res.status(400).json({ success: false, message: validation.message });
    const shouldDefault = next.isDefault || !req.user.addresses.some((entry) => entry.isDefault && String(entry._id) !== String(address._id));
    if (shouldDefault) req.user.addresses.forEach((entry) => { entry.isDefault = false; });
    Object.assign(address, next, { isDefault: shouldDefault });
    await req.user.save();
    res.json({ success: true, address: address.toJSON(), addresses: safeAddresses(req.user), serviceability: validation.serviceability });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Unable to update address.' });
  }
});

router.delete('/addresses/:addressId', async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) return res.status(404).json({ success: false, message: 'Address not found.' });
  const wasDefault = address.isDefault;
  req.user.addresses.pull(address._id);
  if (wasDefault && req.user.addresses.length) req.user.addresses[0].isDefault = true;
  await req.user.save();
  res.json({ success: true, addresses: safeAddresses(req.user) });
});

router.patch('/addresses/:addressId/default', async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) return res.status(404).json({ success: false, message: 'Address not found.' });
  req.user.addresses.forEach((entry) => { entry.isDefault = String(entry._id) === String(address._id); });
  await req.user.save();
  res.json({ success: true, address: address.toJSON(), addresses: safeAddresses(req.user) });
});

export default router;

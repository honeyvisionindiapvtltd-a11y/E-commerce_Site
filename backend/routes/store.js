import { Router } from 'express';
import { getDB } from '../db.js';
import { findDeliveryDocument } from '../services/deliveryService.js';
import { normalizePincode, isValidPincode } from '../middleware/validation.js';
import { protect, requireStorefrontUser } from '../middleware/authMiddleware.js';

const router = Router();

const getOrdersCollection = () => getDB().collection('orders');
const getInstallationsCollection = () => getDB().collection('installations');

router.get('/products', (_req, res) => {
  res.json([
    {
      id: 'prod-1',
      name: 'Hikvision 4MP PTZ Camera',
      category: 'Cameras',
      price: 12499,
      stock: 15,
    },
    {
      id: 'prod-2',
      name: 'Dahua 8 Channel NVR',
      category: 'Recorders',
      price: 8999,
      stock: 10,
    },
    {
      id: 'prod-3',
      name: 'Seagate 1TB Surveillance HDD',
      category: 'Storage',
      price: 3999,
      stock: 20,
    },
  ]);
});

router.get('/orders', protect, requireStorefrontUser, async (req, res) => {
  const filter = { userId: String(req.user._id) };

  const orders = await getOrdersCollection().find(filter).sort({ createdAt: -1 }).toArray();
  res.json(orders);
});

router.post('/orders', protect, requireStorefrontUser, async (req, res) => {
  const { items = [], shippingAddress = null, address = null, paymentMethod = 'cod', installationSlot = null, secureShipping = false, couponApplied = false } = req.body;
  const userId = String(req.user._id);
  const orderAddress = shippingAddress || address || {};
  const normalizedPin = normalizePincode(orderAddress.pin || orderAddress.pincode || '');

  if (!isValidPincode(normalizedPin)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid 6-digit PIN code for shipping.' });
  }

  const itemProductIds = Array.isArray(items) ? items.map((item) => item.productId).filter(Boolean) : [];
  const deliveryResults = await Promise.all(
    itemProductIds.map((productId) => findDeliveryDocument(normalizedPin, productId))
  );

  const deliveryDocument = deliveryResults.find((doc) => doc && doc.serviceable && doc.active) || (await findDeliveryDocument(normalizedPin));
  const serviceable = Boolean(deliveryDocument?.serviceable && deliveryDocument?.active);
  const deliveryCharge = deliveryResults.reduce((maxCharge, doc) => Math.max(maxCharge, Number(doc?.deliveryCharge || 0)), 0);
  const estimatedDeliveryDays = Array.from(
    new Set(deliveryResults.filter((doc) => doc?.estimatedDeliveryDays).map((doc) => doc.estimatedDeliveryDays))
  ).join(', ') || deliveryDocument?.estimatedDeliveryDays || '2-5 days';

  // allow client to pass computed totals (from frontend) to keep UI and order values consistent
  const clientSubtotal = Number(req.body.subtotal ?? NaN);
  const clientShipping = Number(req.body.shipping ?? NaN);
  const clientInstallationFee = Number(req.body.installationFee ?? NaN);
  const clientDiscount = Number(req.body.discount ?? NaN);
  const clientInsurance = Number(req.body.insurance ?? NaN);
  const clientTotal = Number(req.body.total ?? NaN);

  const subtotal = Number.isFinite(clientSubtotal) ? clientSubtotal : items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const installationFee = Number.isFinite(clientInstallationFee) ? clientInstallationFee : items.some((item) => item.installation) ? 499 : 0;
  const shipping = Number.isFinite(clientShipping) ? clientShipping : (subtotal >= 999 ? 0 : 99);
  const discount = Number.isFinite(clientDiscount) ? clientDiscount : 0;
  const insurance = Number.isFinite(clientInsurance) ? clientInsurance : 0;

  const order = {
    id: `HV${Date.now().toString().slice(-8)}`,
    userId,
    createdAt: new Date().toISOString(),
    status: paymentMethod === 'cod' ? 'Order placed' : 'Payment pending',
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'Pay on delivery' : 'Awaiting payment gateway',
    shippingAddress: {
      name: orderAddress.name || '',
      phone: orderAddress.phone || '',
      addressLine1: orderAddress.line1 || orderAddress.address || '',
      addressLine2: orderAddress.line2 || '',
      city: orderAddress.city || '',
      state: orderAddress.state || '',
      pincode: normalizedPin,
      country: orderAddress.country || 'India',
    },
    delivery: {
      serviceable,
      estimatedDeliveryDays: deliveryDocument?.estimatedDeliveryDays || '2-5 days',
      deliveryCharge: Number(deliveryDocument?.deliveryCharge || 0),
      codAvailable: Boolean(deliveryDocument?.codAvailable),
    },
    installationSlot,
    items,
    subtotal,
    shipping,
    installationFee,
    discount,
    insurance,
    couponApplied,
    secureShipping,
    total: Number.isFinite(clientTotal) ? clientTotal : subtotal + shipping + installationFee + insurance - discount,
  };

  await getOrdersCollection().insertOne(order);
  res.status(201).json(order);
});

router.get('/installations', protect, requireStorefrontUser, async (req, res) => {
  const filter = { userId: String(req.user._id) };

  const installations = await getInstallationsCollection().find(filter).sort({ createdAt: -1 }).toArray();
  res.json(installations);
});

router.post('/installations', protect, requireStorefrontUser, async (req, res) => {
  const { userId: _ignoredUserId, customerId: _ignoredCustomerId, service, serviceId, orderId, orderNumber, customer = {}, preferredDate, preferredSlot, notes = '', installationPrice, additionalTotal, subtotal, gst, total, ...rest } = req.body || {};

  const authenticatedUserId = String(req.user._id);
  const selectedService = service || serviceId || rest.serviceId || 'installation';
  const customerName = String(customer.name || '').trim();
  const customerPhone = String(customer.phone || '').trim();
  const customerEmail = String(customer.email || '').trim();
  const customerAddress = String(customer.address || '').trim();
  const customerCity = String(customer.city || '').trim();
  const customerState = String(customer.state || '').trim();
  const customerPin = String(customer.pinCode || '').replace(/\D/g, '').slice(0, 6);
  const latitude = Number(customer.latitude ?? rest.latitude ?? null);
  const longitude = Number(customer.longitude ?? rest.longitude ?? null);
  const hasLocation = Number.isFinite(latitude) && Number.isFinite(longitude);

  if (!selectedService) {
    return res.status(400).json({ success: false, message: 'Please select an installation service.' });
  }

  if (!customerName || !customerPhone || !customerEmail || !customerAddress || !customerCity || !customerState || !customerPin || customerPin.length !== 6) {
    return res.status(400).json({ success: false, message: 'Complete customer and address details are required before booking installation.' });
  }

  if (!preferredDate || !preferredSlot) {
    return res.status(400).json({ success: false, message: 'Please choose a valid installation date and time slot.' });
  }

  if (hasLocation && (latitude === 0 || longitude === 0 || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)) {
    return res.status(400).json({ success: false, message: 'Please provide valid installation coordinates.' });
  }

  if (orderId) {
    const order = await getOrdersCollection().findOne({ userId: String(req.user._id), $or: [{ id: String(orderId) }, { _id: orderId }, { orderNumber: String(orderId) }] });
    if (!order) {
      return res.status(403).json({ success: false, message: 'The selected order does not belong to this customer.' });
    }
  }

  const booking = {
    ...rest,
    ...customer,
    id: `INSTALL-${Date.now().toString().slice(-6)}`,
    userId: authenticatedUserId,
    service: String(selectedService),
    serviceId: String(serviceId || selectedService),
    orderId: orderId ? String(orderId) : null,
    orderNumber: orderNumber ? String(orderNumber) : null,
    customer: {
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
      address: customerAddress,
      city: customerCity,
      state: customerState,
      pinCode: customerPin,
      latitude: hasLocation ? latitude : null,
      longitude: hasLocation ? longitude : null,
      addressType: customer.addressType || customer.type || 'Home',
      landmark: String(customer.landmark || '').trim(),
      installationInstructions: String(customer.installationInstructions || notes || '').trim(),
    },
    preferredDate: String(preferredDate),
    preferredSlot: String(preferredSlot),
    notes: String(notes || customer.installationInstructions || '').trim(),
    installationPrice: Number(installationPrice || 0),
    additionalTotal: Number(additionalTotal || 0),
    subtotal: Number(subtotal || 0),
    gst: Number(gst || 0),
    total: Number(total || subtotal || installationPrice || 0),
    createdAt: new Date().toISOString(),
    status: 'requested',
  };

  await getInstallationsCollection().insertOne(booking);
  res.status(201).json(booking);
});

export default router;

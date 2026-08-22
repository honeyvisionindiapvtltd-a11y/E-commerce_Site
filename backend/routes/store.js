import { Router } from 'express';
import { getDB } from '../db.js';
import { findDeliveryDocument } from '../services/deliveryService.js';
import { normalizePincode, isValidPincode } from '../middleware/validation.js';

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

router.get('/orders', async (req, res) => {
  const { userId } = req.query;
  const filter = {};
  if (userId) {
    filter.userId = String(userId);
  }

  const orders = await getOrdersCollection().find(filter).sort({ createdAt: -1 }).toArray();
  res.json(orders);
});

router.post('/orders', async (req, res) => {
  const { userId = null, items = [], shippingAddress = null, address = null, paymentMethod = 'cod', installationSlot = null, secureShipping = false, couponApplied = false } = req.body;
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

router.get('/installations', async (req, res) => {
  const { userId } = req.query;
  const filter = {};
  if (userId) {
    filter.userId = String(userId);
  }

  const installations = await getInstallationsCollection().find(filter).sort({ createdAt: -1 }).toArray();
  res.json(installations);
});

router.post('/installations', async (req, res) => {
  const booking = {
    id: `INSTALL-${Date.now().toString().slice(-6)}`,
    userId: req.body.userId || null,
    createdAt: new Date().toISOString(),
    status: 'requested',
    ...req.body,
  };

  await getInstallationsCollection().insertOne(booking);
  res.status(201).json(booking);
});

export default router;

import { Router } from 'express';

const router = Router();
const orders = [];
const installations = [];

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

router.get('/orders', (req, res) => {
  const { userId } = req.query;
  const filtered = userId ? orders.filter((order) => String(order.userId) === String(userId)) : orders;
  res.json(filtered);
});

router.post('/orders', (req, res) => {
  const { userId = null, items = [], address = {}, paymentMethod = 'cod', installationSlot = null } = req.body;
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const installationFee = items.filter((item) => item.installation).length * 499;
  const order = {
    id: `HV${Date.now().toString().slice(-8)}`,
    userId,
    createdAt: new Date().toISOString(),
    status: paymentMethod === 'cod' ? 'Order placed' : 'Payment pending',
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'Pay on delivery' : 'Awaiting payment gateway',
    address,
    installationSlot,
    items,
    subtotal,
    shipping,
    installationFee,
    total: subtotal + shipping + installationFee,
  };

  orders.unshift(order);
  res.status(201).json(order);
});

router.get('/installations', (req, res) => {
  const { userId } = req.query;
  const filtered = userId ? installations.filter((booking) => String(booking.userId) === String(userId)) : installations;
  res.json(filtered);
});

router.post('/installations', (req, res) => {
  const booking = {
    id: `INSTALL-${Date.now().toString().slice(-6)}`,
    userId: req.body.userId || null,
    createdAt: new Date().toISOString(),
    status: 'requested',
    ...req.body,
  };

  installations.unshift(booking);
  res.status(201).json(booking);
});

export default router;

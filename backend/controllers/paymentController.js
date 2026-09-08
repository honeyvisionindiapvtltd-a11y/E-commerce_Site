import Stripe from 'stripe';
import { getDB } from '../db.js';
import Razorpay from 'razorpay';
import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import Order from '../models/Order.js';
import { updateOrderTracking } from '../services/orderTrackingService.js';
import { notifyAdmins, notifyCustomer } from '../services/notificationService.js';
import Payment from '../models/Payment.js';
import { checkDeliveryServiceability } from '../services/deliveryServiceabilityService.js';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' }) : null;

const razorInstance = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

export const verifyRazorpaySignature = (secret, orderId, paymentId, receivedSignature) => {
  if (!secret || !orderId || !paymentId || !receivedSignature) {
    return false;
  }

  const signatureString = String(receivedSignature).trim();
  if (!/^[a-fA-F0-9]+$/.test(signatureString)) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (signatureString.length !== expectedSignature.length) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const providedBuffer = Buffer.from(signatureString, 'hex');

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
};

const findOrder = async (orderId) => {
  if (!orderId) return null;
  const query = [{ orderNumber: String(orderId) }];
  if (/^[a-f\d]{24}$/i.test(String(orderId))) {
    query.push({ _id: orderId });
  }
  return Order.findOne({ $or: query });
};

const requireOwnedOrder = async (orderId, userId) => {
  const order = await findOrder(orderId);
  if (!order || String(order.user) !== String(userId)) return null;
  return order;
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { amount, currency = 'INR', orderId, items, paymentMethod = 'razorpay' } = req.body || {};
    const normalizedPaymentMethod = String(paymentMethod).trim().toLowerCase();
    const supportedPaymentMethods = new Set(['razorpay', 'phonepe', 'googlepay', 'paytm', 'card', 'netbanking']);
    if (!supportedPaymentMethods.has(normalizedPaymentMethod)) {
      return res.status(400).json({ error: 'Unsupported Razorpay payment method' });
    }

    if (!process.env.STRIPE_ENABLED || !process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Stripe is not enabled on this server' });
    }
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe client is not configured on server' });
    }

    if (orderId) {
      const order = await requireOwnedOrder(orderId, req.user._id);
      if (!order) return res.status(404).json({ error: 'Order not found' });
    }

    const line_items = Array.isArray(items) && items.length
      ? items.map((it) => ({
          price_data: {
            currency: (it.currency || currency || 'INR').toLowerCase(),
            product_data: { name: it.name || `Item ${it.id || ''}` },
            unit_amount: Number(it.unit_amount || it.amount || 0),
          },
          quantity: Number(it.quantity || 1),
        }))
      : [
          {
            price_data: {
              currency: (currency || 'INR').toLowerCase(),
              product_data: { name: `Order ${orderId || 'purchase'}` },
              unit_amount: Number(amount || 0),
            },
            quantity: 1,
          },
        ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/success?session_id={CHECKOUT_SESSION_ID}&orderId=${orderId || ''}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/cancel`,
      metadata: { orderId: orderId || '' },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('createCheckoutSession error', error);
    res.status(500).json({ error: error.message || 'Unable to create checkout session' });
  }
};

export const handleWebhook = async (req, res) => {
  if (!process.env.STRIPE_ENABLED || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).send('Stripe webhook is not enabled');
  }

  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return res.status(500).send('Webhook secret not configured');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const orderId = session.metadata?.orderId || null;

      if (orderId) {
        try {
          const order = await findOrder(orderId);
          if (!order) throw new Error('Order not found');
          order.paymentStatus = 'PAID';
          await order.save();
          await updateOrderTracking({
            orderId: order.orderNumber,
            status: 'PAYMENT_CONFIRMED',
            source: 'PAYMENT',
          });
          void notifyCustomer({ recipient: order.user, type: 'PAYMENT_SUCCESS', category: 'payment', title: 'Payment successful', message: `Payment for order ${order.orderNumber} was successful.`, orderId: order._id, orderNumber: order.orderNumber, actionUrl: `/orders/${encodeURIComponent(order.orderNumber)}/tracking`, eventKey: `payment:${order.orderNumber}:stripe:${session.id}` });
          console.log(`Order ${orderId} marked as paid via webhook.`);
        } catch (err) {
          console.error('Failed to update order payment status', err);
        }
      }

      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId, paymentMethod = 'razorpay' } = req.body || {};
    const normalizedPaymentMethod = String(paymentMethod || 'razorpay').trim().toLowerCase();
    const supportedPaymentMethods = new Set(['razorpay', 'card', 'netbanking']);
    if (!supportedPaymentMethods.has(normalizedPaymentMethod)) {
      return res.status(400).json({ success: false, error: 'Unsupported Razorpay payment method' });
    }

    if (!req.user?._id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!process.env.RAZORPAY_ENABLED || !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ success: false, error: 'Razorpay is not enabled on this server' });
    }
    if (!razorInstance) {
      return res.status(500).json({ success: false, error: 'Razorpay client is not configured on server' });
    }
    if (!orderId) return res.status(400).json({ success: false, error: 'Order ID is required' });

    const localOrder = await requireOwnedOrder(orderId, req.user._id);
    if (!localOrder) return res.status(404).json({ success: false, error: 'Order not found' });
    if (localOrder.paymentStatus === 'PAID' || localOrder.orderLifecycleStatus === 'CONFIRMED') {
      return res.status(409).json({ success: false, error: 'Order has already been paid' });
    }
    if (!['PAYMENT_PENDING', 'PAYMENT_FAILED', 'PAYMENT_CANCELLED'].includes(localOrder.orderLifecycleStatus)) {
      return res.status(409).json({ success: false, error: 'Order is not available for online payment' });
    }

    const serverAmount = Number(localOrder.totalAmount || 0);
    if (!Number.isFinite(serverAmount) || serverAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Order amount must be greater than zero.' });
    }

    const amountInPaise = Math.round(serverAmount * 100);
    if (amountInPaise < 100) {
      return res.status(400).json({ success: false, error: 'Razorpay minimum order amount is ₹1. Please add more items or choose another payment method.' });
    }

    const serviceability = await checkDeliveryServiceability({
      country: localOrder.shippingAddress?.country,
      state: localOrder.shippingAddress?.state,
      city: localOrder.shippingAddress?.city,
      pincode: localOrder.shippingAddress?.postalCode || localOrder.shippingAddress?.pincode,
    });
    if (!serviceability.valid || !serviceability.serviceable) {
      return res.status(400).json({ success: false, error: 'Payment is unavailable for the selected delivery address' });
    }

    localOrder.paymentStatus = 'PENDING';
    localOrder.orderLifecycleStatus = 'PAYMENT_PENDING';
    localOrder.paymentProvider = 'razorpay';
    localOrder.paymentMethod = String(normalizedPaymentMethod).toUpperCase();

    if (localOrder.paymentOrderId) {
      try {
        const existingRazorpayOrder = await razorInstance.orders.fetch(localOrder.paymentOrderId);
        if (Number(existingRazorpayOrder.amount) === amountInPaise && String(existingRazorpayOrder.currency || '').toUpperCase() === 'INR') {
          await localOrder.save();
          return res.json({ success: true, order: existingRazorpayOrder, keyId: process.env.RAZORPAY_KEY_ID });
        }
      } catch (error) {
        console.warn('Existing Razorpay order could not be reused', error.message);
      }
    }

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: String(orderId),
      payment_capture: 1,
      notes: {
        orderId: String(orderId),
        paymentMethod: normalizedPaymentMethod,
      },
    };

    const order = await razorInstance.orders.create(options);
    localOrder.paymentOrderId = order.id;
    localOrder.paymentProvider = 'razorpay';
    localOrder.paymentMethod = String(normalizedPaymentMethod).toUpperCase();
    await localOrder.save();
    console.info(`[PAYMENT_INITIATED] order=${localOrder.orderNumber} razorpayOrder=${order.id}`);

    res.json({ success: true, order, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('createRazorpayOrder error', error);
    res.status(500).json({ success: false, error: error.message || 'Unable to create razorpay order' });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body || {};

    if (!req.user?._id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!process.env.RAZORPAY_ENABLED || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ success: false, error: 'Razorpay is not enabled on this server' });
    }
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Missing payment verification fields' });
    }

    const order = await requireOwnedOrder(orderId, req.user._id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    if (!['RAZORPAY', 'CARD', 'NETBANKING'].includes(String(order.paymentMethod || '').trim().toUpperCase())) {
      return res.status(400).json({ success: false, error: 'This payment provider is not configured for online checkout' });
    }
    if (order.paymentStatus === 'PAID' && order.paymentTransactionId === razorpay_payment_id) {
      return res.json({ success: true, order, message: 'Payment already verified' });
    }
    if (order.paymentOrderId && String(order.paymentOrderId) !== String(razorpay_order_id)) {
      return res.status(400).json({ success: false, error: 'Razorpay order does not match the local order' });
    }

    const isValidSignature = verifyRazorpaySignature(
      process.env.RAZORPAY_KEY_SECRET,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );
    if (!isValidSignature) {
      console.error('Razorpay signature mismatch', { razorpay_order_id, razorpay_payment_id });
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    const existingPayment = await Payment.findOne({ paymentId: razorpay_payment_id }).lean();
    if (existingPayment && String(existingPayment.userId) === String(req.user._id) && String(existingPayment.orderId) === String(order.orderNumber)) {
      return res.json({ success: true, order, message: 'Payment already verified' });
    }

    const expectedAmountInPaise = Math.round(Number(order.totalAmount || 0) * 100);
    if (!Number.isFinite(expectedAmountInPaise) || expectedAmountInPaise <= 0) {
      return res.status(400).json({ success: false, error: 'Order amount is invalid for payment verification' });
    }

    if (razorInstance) {
      try {
        const razorpayPayment = await razorInstance.payments.fetch(razorpay_payment_id);
        if (String(razorpayPayment.order_id) !== String(razorpay_order_id)) {
          return res.status(400).json({ success: false, error: 'Razorpay payment does not match the local order' });
        }
        if (Number(razorpayPayment.amount) !== expectedAmountInPaise) {
          return res.status(400).json({ success: false, error: 'Payment amount does not match the order total' });
        }
        if (String(razorpayPayment.currency || '').toUpperCase() !== 'INR') {
          return res.status(400).json({ success: false, error: 'Only INR payments are accepted' });
        }
        if (String(razorpayPayment.status || '').toLowerCase() !== 'captured') {
          return res.status(400).json({ success: false, error: 'Payment has not been captured yet' });
        }
      } catch (error) {
        console.error('Razorpay payment fetch failed during verification', error?.message || error);
        return res.status(400).json({ success: false, error: 'Unable to verify payment details' });
      }
    }

    const normalizedMethod = String(order.paymentMethod || 'RAZORPAY').trim().toUpperCase();
    const allowedMethodValues = new Set(['COD', 'RAZORPAY', 'PHONEPE', 'GOOGLEPAY', 'PAYTM', 'CARD', 'NETBANKING', 'UPI']);
    const paymentMethod = allowedMethodValues.has(normalizedMethod) ? normalizedMethod.toLowerCase() : 'razorpay';

    order.paymentStatus = 'PAID';
    order.orderLifecycleStatus = 'CONFIRMED';
    order.paymentProvider = 'razorpay';
    order.paymentMethod = normalizedMethod;
    order.paymentTransactionId = razorpay_payment_id;
    order.paymentOrderId = razorpay_order_id;
    order.status = 'ORDER_PLACED';
    await order.save();

    console.info(`[PAYMENT_VERIFIED] order=${order.orderNumber} razorpayPayment=${razorpay_payment_id}`);

    await Payment.findOneAndUpdate(
      { paymentId: razorpay_payment_id },
      {
        paymentId: razorpay_payment_id,
        orderId: order.orderNumber,
        userId: String(order.user),
        amount: Number(order.totalAmount || 0),
        currency: 'INR',
        status: 'completed',
        paymentMethod,
        paymentProvider: 'razorpay',
        paymentIntent: razorpay_order_id,
        transactionId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        completedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const result = await updateOrderTracking({
      orderId: order.orderNumber,
      status: 'PAYMENT_CONFIRMED',
      source: 'PAYMENT',
    });
    console.info(`[ORDER_CONFIRMED] order=${order.orderNumber} payment=${razorpay_payment_id}`);
    void notifyCustomer({ recipient: order.user, type: 'PAYMENT_SUCCESS', category: 'payment', title: 'Payment successful', message: `Payment for order ${order.orderNumber} was successful.`, orderId: order._id, orderNumber: order.orderNumber, actionUrl: `/orders/${encodeURIComponent(order.orderNumber)}/tracking`, eventKey: `payment:${order.orderNumber}:razorpay:${razorpay_payment_id}` });
    void notifyAdmins({ type: 'ORDER_CONFIRMED', category: 'order', title: 'Order confirmed', message: `Order ${order.orderNumber} has been confirmed after payment.`, orderId: order._id, orderNumber: order.orderNumber, eventKey: `order:${order.orderNumber}:confirmed:${razorpay_payment_id}` });

    return res.json({ success: true, order: result.order });
  } catch (error) {
    console.error('verifyRazorpayPayment error', error);
    res.status(500).json({ success: false, error: error.message || 'Verification failed' });
  }
};

const updateUnsuccessfulRazorpayAttempt = async (req, res, lifecycleStatus, paymentStatus, message) => {
  try {
    const order = await requireOwnedOrder(req.body?.orderId, req.user._id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.paymentStatus === 'PAID' || order.orderLifecycleStatus === 'CONFIRMED') {
      return res.status(409).json({ success: false, error: 'Order is already confirmed' });
    }
    order.paymentStatus = paymentStatus;
    order.orderLifecycleStatus = lifecycleStatus;
    await order.save();
    console.info(`[PAYMENT_${paymentStatus}] order=${order.orderNumber}`);
    return res.json({ success: true, order, message });
  } catch (error) {
    console.error('updateUnsuccessfulRazorpayAttempt error', error);
    return res.status(500).json({ success: false, error: 'Unable to update payment attempt' });
  }
};

export const markRazorpayPaymentFailed = (req, res) => updateUnsuccessfulRazorpayAttempt(req, res, 'PAYMENT_FAILED', 'FAILED', 'Payment failed. Your order has not been confirmed.');
export const markRazorpayPaymentCancelled = (req, res) => updateUnsuccessfulRazorpayAttempt(req, res, 'PAYMENT_CANCELLED', 'CANCELLED', 'Payment was cancelled. You can try again.');

export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params || {};

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const ownedOrder = await requireOwnedOrder(orderId, req.user._id);
    if (!ownedOrder) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: ownedOrder });
  } catch (error) {
    console.error('getOrderDetails error', error);
    res.status(500).json({ error: error.message || 'Unable to load order details' });
  }
};

export const downloadOrderInvoice = async (req, res) => {
  try {
    const { orderId } = req.params || {};

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const ownedOrder = await requireOwnedOrder(orderId, req.user._id);
    if (!ownedOrder) return res.status(404).json({ error: 'Order not found' });
    const orders = getDB().collection('orders');
    const order = await orders.findOne({ id: String(orderId) });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const lines = [];
    lines.push('HoneyVision Invoice');
    lines.push('------------------------------');
    lines.push(`Order ID: ${order.id}`);
    lines.push(`Payment Method: ${order.paymentMethod}`);
    lines.push(`Payment Status: ${order.paymentStatus}`);
    lines.push(`Order Status: ${order.status}`);
    lines.push(`Order Date: ${order.createdAt}`);
    lines.push('');
    lines.push('Billing / Shipping Address:');
    lines.push(`${order.shippingAddress.name}`);
    lines.push(`${order.shippingAddress.addressLine1}`);
    if (order.shippingAddress.addressLine2) {
      lines.push(`${order.shippingAddress.addressLine2}`);
    }
    lines.push(
      `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`
    );
    lines.push(`${order.shippingAddress.country}`);
    lines.push(`Phone: ${order.shippingAddress.phone}`);
    lines.push('');
    lines.push('Items:');

    order.items.forEach((item, index) => {
      const name = item.product?.name || item.name || item.productId || `Item ${index + 1}`;
      const unitPrice = Number(item.product?.price || item.price || 0);
      const quantity = Number(item.quantity || 1);
      const total = unitPrice * quantity;
      lines.push(`- ${name} x ${quantity} = ₹${total.toLocaleString('en-IN')}`);
    });

    lines.push('');
    lines.push(`Subtotal: ₹${Number(order.subtotal || 0).toLocaleString('en-IN')}`);
    lines.push(`Shipping: ₹${Number(order.shipping || 0).toLocaleString('en-IN')}`);
    lines.push(`Installation: ₹${Number(order.installationFee || 0).toLocaleString('en-IN')}`);
    lines.push(`Insurance: ₹${Number(order.insurance || 0).toLocaleString('en-IN')}`);
    lines.push(`Discount: -₹${Number(order.discount || 0).toLocaleString('en-IN')}`);
    lines.push('');
    lines.push(`Total: ₹${Number(order.total || 0).toLocaleString('en-IN')}`);
    lines.push('');
    lines.push('Thank you for choosing HoneyVision!');

    const filename = `${order.id}-invoice.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    doc.fontSize(24).text('HoneyVision Invoice', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Order ID: ${order.id}`);
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.text(`Payment Status: ${order.paymentStatus}`);
    doc.text(`Order Status: ${order.status}`);
    doc.text(`Order Date: ${order.createdAt}`);
    doc.moveDown();

    doc.fontSize(14).text('Shipping Address', { underline: true });
    doc.fontSize(12).text(`${order.shippingAddress.name}`);
    doc.text(`${order.shippingAddress.addressLine1}`);
    if (order.shippingAddress.addressLine2) {
      doc.text(`${order.shippingAddress.addressLine2}`);
    }
    doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`);
    doc.text(`${order.shippingAddress.country}`);
    doc.text(`Phone: ${order.shippingAddress.phone}`);
    doc.moveDown();

    doc.fontSize(14).text('Items', { underline: true });
    doc.moveDown(0.5);

    order.items.forEach((item, index) => {
      const name = item.product?.name || item.name || item.productId || `Item ${index + 1}`;
      const unitPrice = Number(item.product?.price || item.price || 0);
      const quantity = Number(item.quantity || 1);
      const total = unitPrice * quantity;
      doc.fontSize(12).text(`${index + 1}. ${name}`, { continued: true }).font('Helvetica-Bold').text(` x${quantity} = ₹${total.toLocaleString('en-IN')}`, { align: 'right' }).font('Helvetica');
    });

    doc.moveDown();
    doc.fontSize(12).text(`Subtotal: ₹${Number(order.subtotal || 0).toLocaleString('en-IN')}`);
    doc.text(`Shipping: ₹${Number(order.shipping || 0).toLocaleString('en-IN')}`);
    doc.text(`Installation: ₹${Number(order.installationFee || 0).toLocaleString('en-IN')}`);
    doc.text(`Insurance: ₹${Number(order.insurance || 0).toLocaleString('en-IN')}`);
    doc.text(`Discount: -₹${Number(order.discount || 0).toLocaleString('en-IN')}`);
    doc.moveDown();
    doc.fontSize(14).text(`Total: ₹${Number(order.total || 0).toLocaleString('en-IN')}`, { underline: true });
    doc.moveDown(2);
    doc.fontSize(10).text('Thank you for choosing HoneyVision!', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('downloadOrderInvoice error', error);
    res.status(500).json({ error: error.message || 'Unable to download invoice' });
  }
};

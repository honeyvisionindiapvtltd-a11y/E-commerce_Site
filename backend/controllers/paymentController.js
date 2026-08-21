import Stripe from 'stripe';
import { getDB } from '../db.js';
import Razorpay from 'razorpay';
import PDFDocument from 'pdfkit';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

const razorInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export const createCheckoutSession = async (req, res) => {
  try {
    const { amount, currency = 'INR', orderId, items } = req.body || {};

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe secret key not configured on server' });
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
          const orders = getDB().collection('orders');
          await orders.updateOne(
            { id: String(orderId) },
            {
              $set: {
                paymentStatus: 'Paid',
                status: 'Order placed',
                paymentProvider: 'stripe',
                paymentIntent: session.payment_intent || null,
                paidAt: new Date().toISOString(),
              },
            }
          );
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
    const { amount, currency = 'INR', orderId, items } = req.body || {};

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Razorpay keys not configured on server' });
    }

    const numericAmount = Number(amount || 0);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Order amount must be greater than zero.' });
    }

    if (numericAmount < 10000) {
      return res.status(400).json({ error: 'Razorpay minimum order amount is ₹100. Please add more items or choose another payment method.' });
    }

    const options = {
      amount: numericAmount,
      currency: (currency || 'INR').toUpperCase(),
      receipt: orderId || `rcpt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorInstance.orders.create(options);

    res.json({ order, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('createRazorpayOrder error', error);
    res.status(500).json({ error: error.message || 'Unable to create razorpay order' });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Missing payment verification fields' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('Razorpay signature mismatch', { expectedSignature, razorpay_signature });
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    // Mark order as paid in DB if orderId provided
    if (orderId) {
      try {
        const orders = getDB().collection('orders');
        await orders.updateOne(
          { id: String(orderId) },
          {
            $set: {
              paymentStatus: 'Paid',
              status: 'Order placed',
              paymentProvider: 'razorpay',
              paymentIntent: razorpay_payment_id,
              paidAt: new Date().toISOString(),
            },
          }
        );
      } catch (err) {
        console.error('Failed to update order after razorpay verification', err);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('verifyRazorpayPayment error', error);
    res.status(500).json({ success: false, error: error.message || 'Verification failed' });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params || {};

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const orders = getDB().collection('orders');
    const order = await orders.findOne({ id: String(orderId) });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
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

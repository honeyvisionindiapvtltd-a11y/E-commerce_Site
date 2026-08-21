/**
 * Payment Controller with Validation & Invoice Generation
 * This is an example implementation showing how to use the new validation
 * and invoice services in your payment routes
 */

import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { getDB } from '../db.js';
import {
  validatePaymentData,
  validateRazorpayPayment,
  formatValidationErrors,
} from '../middleware/paymentValidation.js';
import * as paymentService from '../services/paymentService.js';
import * as invoiceService from '../services/invoiceService.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });
const razorInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// ============================================================
// PAYMENT CREATION & VALIDATION
// ============================================================

/**
 * Create and validate payment
 * POST /api/payment/create
 */
export const createValidatedPayment = async (req, res) => {
  try {
    const { orderId, userId, amount, currency = 'INR', paymentMethod } = req.body;

    // Validate payment data
    const validation = validatePaymentData({
      orderId,
      userId,
      amount,
      currency,
      paymentMethod,
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    // Create payment record
    const payment = await paymentService.createPayment({
      orderId,
      userId,
      amount,
      currency,
      paymentMethod,
      status: 'pending',
    });

    res.json({
      success: true,
      payment: {
        paymentId: payment.paymentId,
        amount: payment.amount,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error('createValidatedPayment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment',
    });
  }
};

// ============================================================
// RAZORPAY PAYMENT HANDLING
// ============================================================

/**
 * Create Razorpay order
 * POST /api/payment/razorpay/create-order
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', orderId, userId } = req.body;

    // Validate payment data
    const validation = validatePaymentData({
      orderId,
      userId,
      amount,
      currency,
      paymentMethod: 'razorpay',
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    // Create Razorpay order
    const razorpayOrder = await razorInstance.orders.create({
      amount: Number(amount) * 100, // Convert to paise
      currency: currency.toUpperCase(),
      receipt: orderId || `rcpt_${Date.now()}`,
      payment_capture: 1,
    });

    res.json({
      success: true,
      order: razorpayOrder,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('createRazorpayOrder error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create Razorpay order',
    });
  }
};

/**
 * Verify and record Razorpay payment with invoice generation
 * POST /api/payment/razorpay/verify
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, userId } = req.body;

    // Validate Razorpay data
    const validation = validateRazorpayPayment({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    // Verify signature
    const crypto = await import('crypto');
    const expectedSignature = crypto.default
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature',
      });
    }

    // Get order details for invoice
    const orders = getDB().collection('orders');
    const order = await orders.findOne({ id: String(orderId) });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Record payment
    const payment = await paymentService.recordRazorpayPayment({
      orderId,
      userId,
      amount: order.total,
      currency: 'INR',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    // Update order payment status
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

    // Auto-generate invoice and send email
    try {
      const invoice = await invoiceService.processPaymentAndGenerateInvoice(payment, {
        customerName: order.shippingAddress?.name,
        customerEmail: order.customerEmail || order.shippingAddress?.email,
        customerPhone: order.shippingAddress?.phone,
        shippingAddress: order.shippingAddress,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        taxPercentage: 18,
        shipping: order.shipping,
      });

      console.log(`Invoice ${invoice.invoiceNumber} generated for order ${orderId}`);
    } catch (invoiceError) {
      console.error('Failed to generate invoice:', invoiceError.message);
      // Don't fail the payment if invoice generation fails
    }

    res.json({
      success: true,
      payment: {
        paymentId: payment.paymentId,
        status: payment.status,
        transactionId: payment.transactionId,
      },
      message: 'Payment verified and invoice sent',
    });
  } catch (error) {
    console.error('verifyRazorpayPayment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Payment verification failed',
    });
  }
};

// ============================================================
// STRIPE PAYMENT HANDLING
// ============================================================

/**
 * Create Stripe checkout session
 * POST /api/payment/stripe/create-session
 */
export const createStripeCheckoutSession = async (req, res) => {
  try {
    const { amount, currency = 'INR', orderId, userId, items } = req.body;

    // Validate payment data
    const validation = validatePaymentData({
      orderId,
      userId,
      amount,
      currency,
      paymentMethod: 'stripe',
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    const line_items = Array.isArray(items) && items.length
      ? items.map((item) => ({
          price_data: {
            currency: (currency || 'INR').toLowerCase(),
            product_data: { name: item.name || `Item ${item.id}` },
            unit_amount: Number(item.unit_amount || item.amount || 0),
          },
          quantity: Number(item.quantity || 1),
        }))
      : [
          {
            price_data: {
              currency: (currency || 'INR').toLowerCase(),
              product_data: { name: `Order ${orderId}` },
              unit_amount: Number(amount || 0),
            },
            quantity: 1,
          },
        ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&orderId=${orderId}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
      metadata: { orderId, userId },
    });

    res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('createStripeCheckoutSession error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create checkout session',
    });
  }
};

/**
 * Handle Stripe webhook
 * POST /api/payment/stripe/webhook
 */
export const handleStripeWebhook = async (req, res) => {
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
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        const userId = session.metadata?.userId;

        if (orderId && userId) {
          // Get order details
          const orders = getDB().collection('orders');
          const order = await orders.findOne({ id: String(orderId) });

          if (order) {
            // Record payment
            const payment = await paymentService.recordStripePayment({
              orderId,
              userId,
              amount: session.amount_total / 100, // Convert from cents
              currency: session.currency.toUpperCase(),
              paymentIntentId: session.payment_intent,
              sessionId: session.id,
            });

            // Update order
            await orders.updateOne(
              { id: String(orderId) },
              {
                $set: {
                  paymentStatus: 'Paid',
                  status: 'Order placed',
                  paymentProvider: 'stripe',
                  paymentIntent: session.payment_intent,
                  paidAt: new Date().toISOString(),
                },
              }
            );

            // Auto-generate invoice
            try {
              const invoice = await invoiceService.processPaymentAndGenerateInvoice(payment, {
                customerName: order.shippingAddress?.name,
                customerEmail: order.customerEmail,
                customerPhone: order.shippingAddress?.phone,
                shippingAddress: order.shippingAddress,
                items: order.items,
                subtotal: order.subtotal,
                discount: order.discount,
                tax: order.tax,
                shipping: order.shipping,
              });

              console.log(`Invoice ${invoice.invoiceNumber} generated for Stripe payment`);
            } catch (invoiceError) {
              console.error('Failed to generate invoice:', invoiceError.message);
            }
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        // Handle refund
        console.log('Charge refunded:', charge.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// ============================================================
// INVOICE OPERATIONS
// ============================================================

/**
 * Get user invoices
 * GET /api/invoice/user/:userId
 */
export const getUserInvoices = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, paymentStatus, startDate, endDate, limit = 50 } = req.query;

    const invoices = await invoiceService.getUserInvoices(userId, {
      status,
      paymentStatus,
      startDate,
      endDate,
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      invoices,
      count: invoices.length,
    });
  } catch (error) {
    console.error('getUserInvoices error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Download invoice PDF
 * GET /api/invoice/:invoiceNumber/download
 */
export const downloadInvoice = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;

    const invoice = await invoiceService.getInvoice(invoiceNumber);

    if (!invoice.pdfUrl) {
      return res.status(404).json({
        success: false,
        error: 'Invoice PDF not found',
      });
    }

    // Return PDF file or URL
    res.json({
      success: true,
      pdfUrl: invoice.pdfUrl,
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (error) {
    console.error('downloadInvoice error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Send invoice email
 * POST /api/invoice/:invoiceNumber/send-email
 */
export const resendInvoiceEmail = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;

    const invoice = await invoiceService.getInvoice(invoiceNumber);

    if (!invoice.pdfUrl) {
      return res.status(400).json({
        success: false,
        error: 'Invoice PDF not available',
      });
    }

    await invoiceService.sendInvoiceEmail(invoice, invoice.pdfUrl);

    res.json({
      success: true,
      message: 'Invoice email sent successfully',
    });
  } catch (error) {
    console.error('resendInvoiceEmail error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ============================================================
// PAYMENT STATISTICS & REPORTING
// ============================================================

/**
 * Get payment statistics
 * GET /api/payment/stats/:userId
 */
export const getPaymentStatistics = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await paymentService.getPaymentStats(userId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('getPaymentStatistics error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

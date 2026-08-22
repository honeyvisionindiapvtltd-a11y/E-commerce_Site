import { getDB } from '../db.js';
import Payment from '../models/Payment.js';
import {
  validatePaymentData,
  validateRefund,
  validateRazorpayPayment,
} from '../middleware/paymentValidation.js';

/**
 * Create payment record
 */
export async function createPayment(paymentData) {
  try {
    // Validate payment data
    const validation = validatePaymentData(paymentData);
    if (!validation.valid) {
      const error = new Error('Payment validation failed');
      error.errors = validation.errors;
      throw error;
    }

    const payment = new Payment({
      paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...paymentData,
      initiatedAt: new Date(),
      status: 'pending',
    });

    await payment.save();
    return payment;
  } catch (error) {
    throw new Error(`Failed to create payment: ${error.message}`);
  }
}

/**
 * Get payment by ID
 */
export async function getPayment(paymentId) {
  try {
    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      throw new Error('Payment not found');
    }

    return payment;
  } catch (error) {
    throw new Error(`Failed to get payment: ${error.message}`);
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(paymentId, status, additionalData = {}) {
  try {
    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      throw new Error('Payment not found');
    }

    payment.status = status;

    if (status === 'completed') {
      payment.completedAt = new Date();
    } else if (status === 'failed') {
      payment.failedAt = new Date();
    }

    // Merge additional data
    Object.assign(payment, additionalData);

    await payment.save();
    return payment;
  } catch (error) {
    throw new Error(`Failed to update payment status: ${error.message}`);
  }
}

/**
 * Record Razorpay payment
 */
export async function recordRazorpayPayment(razorpayData) {
  try {
    // Validate Razorpay data
    const validation = validateRazorpayPayment(razorpayData);
    if (!validation.valid) {
      const error = new Error('Razorpay validation failed');
      error.errors = validation.errors;
      throw error;
    }

    const payment = new Payment({
      paymentId: `rpay_${razorpayData.razorpayPaymentId}`,
      ...razorpayData,
      paymentProvider: 'razorpay',
      paymentMethod: 'razorpay',
      initiatedAt: new Date(),
      status: 'completed',
      completedAt: new Date(),
      transactionId: razorpayData.razorpayPaymentId,
    });

    await payment.save();
    return payment;
  } catch (error) {
    throw new Error(`Failed to record Razorpay payment: ${error.message}`);
  }
}

/**
 * Record Stripe payment
 */
export async function recordStripePayment(stripeData) {
  try {
    const payment = new Payment({
      paymentId: `stripe_${stripeData.paymentIntentId}`,
      stripePaymentIntentId: stripeData.paymentIntentId,
      stripeSessionId: stripeData.sessionId,
      paymentProvider: 'stripe',
      paymentMethod: 'card',
      status: 'completed',
      completedAt: new Date(),
      transactionId: stripeData.paymentIntentId,
      initiatedAt: new Date(),
      ...stripeData,
    });

    await payment.save();
    return payment;
  } catch (error) {
    throw new Error(`Failed to record Stripe payment: ${error.message}`);
  }
}

/**
 * Process refund
 */
export async function processRefund(paymentId, refundData) {
  try {
    // Validate refund data
    const validation = validateRefund(refundData);
    if (!validation.valid) {
      const error = new Error('Refund validation failed');
      error.errors = validation.errors;
      throw error;
    }

    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new Error('Only completed payments can be refunded');
    }

    if (refundData.refundAmount > payment.amount) {
      throw new Error('Refund amount cannot exceed payment amount');
    }

    // Calculate refund status
    let refundStatus = 'none';
    if (refundData.refundAmount > 0) {
      if (refundData.refundAmount === payment.amount) {
        refundStatus = 'full';
      } else {
        refundStatus = 'partial';
      }
    }

    payment.refundAmount = refundData.refundAmount;
    payment.refundStatus = refundStatus;
    payment.refundReason = refundData.refundReason;
    payment.refundedAt = new Date();
    payment.status = 'refunded';

    await payment.save();
    return payment;
  } catch (error) {
    throw new Error(`Failed to process refund: ${error.message}`);
  }
}

/**
 * Get payments for an order
 */
export async function getOrderPayments(orderId) {
  try {
    const payments = await Payment.find({ orderId }).sort({ createdAt: -1 });
    return payments;
  } catch (error) {
    throw new Error(`Failed to get order payments: ${error.message}`);
  }
}

/**
 * Get payments for a user
 */
export async function getUserPayments(userId, filter = {}) {
  try {
    const query = { userId };

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.paymentMethod) {
      query.paymentMethod = filter.paymentMethod;
    }

    if (filter.paymentProvider) {
      query.paymentProvider = filter.paymentProvider;
    }

    if (filter.startDate || filter.endDate) {
      query.createdAt = {};
      if (filter.startDate) {
        query.createdAt.$gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        query.createdAt.$lte = new Date(filter.endDate);
      }
    }

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(filter.limit || 100);

    return payments;
  } catch (error) {
    throw new Error(`Failed to get user payments: ${error.message}`);
  }
}

/**
 * Calculate payment statistics
 */
export async function getPaymentStats(userId) {
  try {
    const payments = await Payment.find({ userId, status: 'completed' });

    const stats = {
      totalPayments: payments.length,
      totalAmount: 0,
      totalRefunded: 0,
      averagePayment: 0,
      lastPaymentDate: null,
      paymentsByMethod: {},
      paymentsByProvider: {},
    };

    payments.forEach((payment) => {
      stats.totalAmount += payment.amount;
      stats.totalRefunded += payment.refundAmount || 0;

      // Count by method
      const method = payment.paymentMethod;
      stats.paymentsByMethod[method] = (stats.paymentsByMethod[method] || 0) + 1;

      // Count by provider
      const provider = payment.paymentProvider;
      stats.paymentsByProvider[provider] = (stats.paymentsByProvider[provider] || 0) + 1;

      // Track latest payment
      if (!stats.lastPaymentDate || payment.completedAt > stats.lastPaymentDate) {
        stats.lastPaymentDate = payment.completedAt;
      }
    });

    if (stats.totalPayments > 0) {
      stats.averagePayment = stats.totalAmount / stats.totalPayments;
    }

    return stats;
  } catch (error) {
    throw new Error(`Failed to calculate payment stats: ${error.message}`);
  }
}

/**
 * Retry failed payment
 */
export async function retryPayment(paymentId) {
  try {
    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'failed') {
      throw new Error('Only failed payments can be retried');
    }

    // Create new payment attempt
    const newPayment = new Payment({
      paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: payment.orderId,
      userId: payment.userId,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      paymentProvider: payment.paymentProvider,
      description: `Retry of payment ${payment.paymentId}`,
      initiatedAt: new Date(),
      status: 'pending',
    });

    await newPayment.save();

    // Mark original payment as cancelled
    payment.status = 'cancelled';
    await payment.save();

    return newPayment;
  } catch (error) {
    throw new Error(`Failed to retry payment: ${error.message}`);
  }
}

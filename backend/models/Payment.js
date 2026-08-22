import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR', enum: ['INR', 'USD', 'EUR'] },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['card', 'razorpay', 'stripe', 'wallet', 'cod'],
    },
    paymentProvider: { type: String, enum: ['stripe', 'razorpay', 'internal', 'manual'] },
    paymentIntent: { type: String },
    transactionId: { type: String },
    
    // Card/Payment details
    last4Digits: { type: String },
    cardBrand: { type: String },
    
    // Razorpay specific
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    
    // Stripe specific
    stripePaymentIntentId: { type: String },
    stripeSessionId: { type: String },
    
    // Metadata
    description: { type: String },
    notes: { type: String },
    
    // Timestamps
    initiatedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    failedAt: { type: Date },
    refundedAt: { type: Date },
    
    // Refund tracking
    refundAmount: { type: Number, default: 0 },
    refundStatus: { type: String, enum: ['none', 'partial', 'full'], default: 'none' },
    refundReason: { type: String },
    
    // Error tracking
    errorCode: { type: String },
    errorMessage: { type: String },
    
    // Receipt/Invoice
    receiptNumber: { type: String },
    invoiceId: { type: String },
    
    // Additional metadata
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Index for common queries
paymentSchema.index({ orderId: 1, userId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ paymentProvider: 1, completedAt: -1 });

export default mongoose.model('Payment', paymentSchema, 'payments');

import mongoose from 'mongoose';

const amcContractSchema = new mongoose.Schema({
  contractNumber: { type: String, required: true, unique: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'AMCPlan', required: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  productSnapshot: {
    name: { type: String, required: true },
    sku: { type: String, default: '' },
    image: { type: String, default: '' },
  },
  planSnapshot: {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    durationMonths: { type: Number, required: true },
    price: { type: Number, required: true },
    serviceVisits: { type: Number, default: 0 },
    coveredServices: [{ type: String }],
    exclusions: [{ type: String }],
    responseTime: { type: String, default: '' },
    supportHours: { type: String, default: '' },
    features: [{ type: String }],
    termsAndConditions: { type: String, default: '' },
  },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], default: 'PAID', index: true },
  paymentMethod: { type: String, default: 'RAZORPAY' },
  paymentId: { type: String, default: '' },
  paymentOrderId: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'], default: 'ACTIVE', index: true },
  renewalStatus: { type: String, enum: ['NOT_DUE', 'DUE', 'RENEWED'], default: 'NOT_DUE' },
  serviceVisitsUsed: { type: Number, default: 0, min: 0 },
  serviceVisitsRemaining: { type: Number, default: 0, min: 0 },
}, { timestamps: true, strict: true });

amcContractSchema.index({ customer: 1, status: 1, endDate: 1 });

export default mongoose.model('AMCContract', amcContractSchema, 'amcContracts');

import mongoose from 'mongoose';

const amcPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, default: '' },
  durationMonths: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR', enum: ['INR'] },
  serviceVisits: { type: Number, default: 0, min: 0 },
  responseTime: { type: String, default: '' },
  supportHours: { type: String, default: '' },
  coveredServices: [{ type: String, trim: true }],
  exclusions: [{ type: String, trim: true }],
  eligibleCategories: [{ type: String, trim: true }],
  eligibleProductTypes: [{ type: String, trim: true }],
  features: [{ type: String, trim: true }],
  termsAndConditions: { type: String, default: '' },
  isFeatured: { type: Boolean, default: false, index: true },
  isActive: { type: Boolean, default: true, index: true },
  displayOrder: { type: Number, default: 0, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true, strict: true });

export default mongoose.model('AMCPlan', amcPlanSchema, 'amcPlans');

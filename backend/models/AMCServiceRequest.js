import mongoose from 'mongoose';

const requestHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  previousStatus: { type: String, default: '' },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedByRole: { type: String, default: '' },
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const amcServiceRequestSchema = new mongoose.Schema({
  requestNumber: { type: String, required: true, unique: true, index: true },
  clientRequestId: { type: String, default: '', index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  contract: { type: mongoose.Schema.Types.ObjectId, ref: 'AMCContract', required: true, index: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  serviceType: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  preferredDate: { type: String, required: true },
  preferredTime: { type: String, required: true },
  address: { type: String, required: true, trim: true },
  status: { type: String, enum: ['REQUESTED', 'ASSIGNED', 'SCHEDULED', 'AGENT_ACCEPTED', 'TRAVELLING', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED'], default: 'REQUESTED', index: true },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  assignedAt: { type: Date, default: null },
  scheduledDate: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  resolution: { type: String, default: '' },
  agentNotes: { type: String, default: '' },
  statusHistory: { type: [requestHistorySchema], default: [] },
  visitConsumedAt: { type: Date, default: null },
}, { timestamps: true, strict: true });

amcServiceRequestSchema.index({ customer: 1, createdAt: -1 });
amcServiceRequestSchema.index({ assignedAgent: 1, status: 1 });

export default mongoose.model('AMCServiceRequest', amcServiceRequestSchema, 'amcServiceRequests');

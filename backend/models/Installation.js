import mongoose from 'mongoose';
import { INSTALLATION_STATUSES } from '../constants/installationStatuses.js';

const installationSchema = new mongoose.Schema(
  {
    // Booking identification
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bookingNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    // Customer information (reference + denormalized)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerName: String,
    customerPhone: String,
    customerEmail: String,

    // Linked order (if applicable)
    orderId: {
      type: String,
      sparse: true,
      index: true,
    },
    orderNumber: {
      type: String,
      sparse: true,
    },

    // Installation service details
    service: {
      type: String,
      required: true,
      index: true,
    },
    serviceId: String,
    additionalServices: [String],

    // Customer address information
    customer: {
      name: String,
      phone: String,
      email: String,
      address: String,
      city: String,
      state: String,
      pinCode: String,
      country: { type: String, default: 'India' },
      latitude: Number,
      longitude: Number,
      addressType: { type: String, default: 'Home' },
      landmark: String,
      installationInstructions: String,
      locationResolved: { type: Boolean, default: false },
    },

    // Installation scheduling
    preferredDate: String,
    preferredSlot: String,
    scheduledDate: Date,
    scheduledSlot: String,
    completedDate: Date,

    // Pricing
    installationPrice: { type: Number, default: 0 },
    additionalTotal: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    // Agent assignment
    assignedAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
      index: true,
    },
    assignedAgentName: String,
    assignedAgentPhone: String,
    assignmentDate: Date,
    agentAcceptanceDate: Date,

    // Status tracking
    status: {
      type: String,
      enum: Object.values(INSTALLATION_STATUSES),
      default: INSTALLATION_STATUSES.BOOKED,
      index: true,
    },

    // Real-time location tracking
    currentLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      heading: Number,
      speed: Number,
      timestamp: Date,
    },

    // Status history/timeline
    statusHistory: [
      {
        status: String,
        previousStatus: String,
        changedBy: mongoose.Schema.Types.ObjectId,
        changedByRole: String, // 'admin', 'delivery_agent', 'customer'
        changedByName: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],

    // Installation completion/failure details
    completionDetails: {
      completedAt: Date,
      completedBy: mongoose.Schema.Types.ObjectId,
      completedByRole: String,
      notes: String,
      photosUrl: [String],
      workDuration: Number, // minutes
      partsUsed: [String],
    },

    // Failure information
    failureDetails: {
      failedAt: Date,
      failedBy: mongoose.Schema.Types.ObjectId,
      failedByRole: String,
      reason: { type: String, required: false },
      adminNotes: String,
      agentNotes: String,
      retryEligible: { type: Boolean, default: true },
    },

    // Cancellation information
    cancellationDetails: {
      cancelledAt: Date,
      cancelledBy: mongoose.Schema.Types.ObjectId,
      cancelledByRole: String,
      reason: String,
      refundAmount: Number,
    },

    // Notes
    adminNotes: String,
    agentNotes: String,
    customerNotes: String,
    internalNotes: String,

    // Metadata
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['ONLINE', 'COD'],
      default: 'ONLINE',
    },
    paymentProvider: {
      type: String,
      default: '',
    },
    paymentTransactionId: {
      type: String,
      default: '',
    },
    paymentOrderId: {
      type: String,
      default: '',
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    paymentCurrency: {
      type: String,
      default: 'INR',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Indexes for common queries
installationSchema.index({ userId: 1, createdAt: -1 });
installationSchema.index({ assignedAgentId: 1, status: 1 });
installationSchema.index({ status: 1, createdAt: -1 });
installationSchema.index({ city: 1, state: 1 });
installationSchema.index({ preferredDate: 1, status: 1 });

export default mongoose.model('Installation', installationSchema, 'installations');

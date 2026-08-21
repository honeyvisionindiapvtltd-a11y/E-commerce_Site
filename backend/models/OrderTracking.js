import mongoose from 'mongoose';

const orderTrackingSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    
    // Order status stages
    orderStatus: {
      type: String,
      enum: [
        'order_placed',
        'confirmed',
        'processing',
        'ready_for_pickup',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'return_initiated',
        'returned',
      ],
      default: 'order_placed',
      index: true,
    },
    
    // Payment status
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    
    // Timeline of status changes
    timeline: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        description: String,
        location: String,
        notes: String,
      },
    ],
    
    // Delivery information
    delivery: {
      expectedDeliveryDate: Date,
      estimatedDeliveryTime: String, // e.g., "10:00 AM - 1:00 PM"
      actualDeliveryDate: Date,
      deliveryAgent: {
        name: String,
        phone: String,
        rating: Number,
      },
      trackingNumber: String,
      carrier: String, // e.g., "DHL", "FedEx", "Local"
      lastLocation: String,
      latitude: Number,
      longitude: Number,
    },
    
    // Installation information
    installation: {
      isRequired: Boolean,
      status: {
        type: String,
        enum: ['not_scheduled', 'scheduled', 'in_progress', 'completed', 'cancelled'],
      },
      scheduledDate: Date,
      scheduledTime: String,
      completedDate: Date,
      technician: {
        name: String,
        phone: String,
        rating: Number,
      },
      notes: String,
    },
    
    // Items in order
    items: [
      {
        productId: String,
        productName: String,
        quantity: Number,
        price: Number,
        status: {
          type: String,
          enum: ['pending', 'processed', 'shipped', 'delivered', 'cancelled'],
          default: 'pending',
        },
      },
    ],
    
    // Returns and refunds
    return: {
      initiated: Boolean,
      initiatedDate: Date,
      reason: String,
      status: {
        type: String,
        enum: ['none', 'initiated', 'approved', 'shipped', 'received', 'refunded'],
        default: 'none',
      },
      refundAmount: Number,
      refundDate: Date,
    },
    
    // Notifications sent
    notifications: [
      {
        type: {
          type: String,
          enum: ['sms', 'email', 'push', 'whatsapp'],
        },
        status: {
          type: String,
          enum: ['pending', 'sent', 'failed'],
          default: 'pending',
        },
        message: String,
        sentAt: Date,
        failureReason: String,
      },
    ],
    
    // Rating and review
    review: {
      rating: Number,
      comment: String,
      submittedAt: Date,
    },
    
    // Additional metadata
    address: {
      name: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pinCode: String,
      country: String,
    },
    
    totalAmount: Number,
    paymentMethod: String,
    
    // Timestamps
    orderDate: { type: Date, default: Date.now },
    confirmedDate: Date,
    shippedDate: Date,
    deliveredDate: Date,
    cancelledDate: Date,
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Index for common queries
orderTrackingSchema.index({ orderId: 1, userId: 1 });
orderTrackingSchema.index({ userId: 1, orderDate: -1 });
orderTrackingSchema.index({ orderStatus: 1, deliveredDate: -1 });

export default mongoose.model('OrderTracking', orderTrackingSchema, 'order_tracking');

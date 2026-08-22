import mongoose from 'mongoose';

/**
 * Real-time Inventory Schema
 * Tracks stock levels, updates, alerts
 */

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    totalStock: {
      type: Number,
      required: true,
      default: 0,
    },
    availableStock: {
      type: Number,
      required: true,
      default: 0,
    },
    reservedStock: {
      type: Number,
      default: 0,
    },
    soldStock: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'],
      default: 'in_stock',
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    reorderPoint: {
      type: Number,
      default: 20,
    },
    warehouse: {
      type: String,
      default: 'Primary',
    },
    // Price tracking
    currentPrice: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
    },
    discount: {
      percentage: Number,
      amount: Number,
    },
    priceHistory: [
      {
        price: Number,
        changedAt: { type: Date, default: Date.now },
        reason: String,
      },
    ],
    // Stock movement history
    movements: [
      {
        type: {
          type: String,
          enum: ['in', 'out', 'return', 'adjustment', 'damage'],
        },
        quantity: Number,
        orderId: String,
        reason: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    // Alerts
    alerts: [
      {
        type: {
          type: String,
          enum: ['low_stock', 'out_of_stock', 'price_change', 'overstock'],
        },
        triggered: { type: Date, default: Date.now },
        resolved: Date,
        message: String,
      },
    ],
    lastRestockDate: Date,
    nextRestockDate: Date,
    restockQuantity: Number,
    supplier: String,
    leadTime: Number, // days
  },
  { timestamps: true }
);

// Index for frequent queries
inventorySchema.index({ status: 1, availableStock: 1 });
inventorySchema.index({ productId: 1, 'movements.timestamp': -1 });
inventorySchema.index({ 'alerts.triggered': -1 });

export default mongoose.model('Inventory', inventorySchema);

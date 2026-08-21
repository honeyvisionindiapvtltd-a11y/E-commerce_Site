import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    description: { type: String },
  },
  { _id: false }
);

const invoiceAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    
    // Status tracking
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled'],
      default: 'draft',
      index: true,
    },
    
    // Invoice dates
    invoiceDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    sentDate: { type: Date },
    paidDate: { type: Date },
    cancelledDate: { type: Date },
    
    // Billing information
    billFrom: {
      companyName: { type: String, default: 'HoneyVision' },
      email: { type: String },
      phone: { type: String },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      pinCode: { type: String },
      country: { type: String, default: 'India' },
      taxId: { type: String },
      gstNumber: { type: String },
    },
    
    billTo: { type: invoiceAddressSchema, required: true },
    shippingTo: { type: invoiceAddressSchema },
    
    // Line items
    items: [invoiceItemSchema],
    
    // Totals
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0, min: 0 },
    taxPercentage: { type: Number, default: 0, min: 0, max: 100 },
    shippingCost: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    
    // Payment tracking
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid', 'refunded', 'overdue'],
      default: 'unpaid',
    },
    amountPaid: { type: Number, default: 0, min: 0 },
    amountRemaining: { type: Number, required: true, min: 0 },
    paymentDueDate: { type: Date },
    
    // Payment references
    paymentIds: [{ type: String }],
    lastPaymentDate: { type: Date },
    
    // Additional information
    notes: { type: String },
    termsAndConditions: { type: String },
    logo: { type: String },
    customFields: { type: mongoose.Schema.Types.Mixed },
    
    // File references
    pdfUrl: { type: String },
    pdfGeneratedAt: { type: Date },
    
    // Email tracking
    emailSentAt: { type: Date },
    emailSentTo: [{ type: String }],
    emailReadAt: { type: Date },
    
    // Metadata
    metadata: { type: mongoose.Schema.Types.Mixed },
    
    // Currency
    currency: { type: String, default: 'INR' },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Indexes for common queries
invoiceSchema.index({ orderId: 1, userId: 1 });
invoiceSchema.index({ status: 1, invoiceDate: -1 });
invoiceSchema.index({ paymentStatus: 1, paymentDueDate: -1 });
invoiceSchema.index({ invoiceNumber: 1 });

// Pre-save validation hook
invoiceSchema.pre('save', function (next) {
  // Calculate amountRemaining
  this.amountRemaining = Math.max(0, this.total - (this.amountPaid || 0));

  // Update payment status based on amountPaid
  if (this.amountPaid >= this.total) {
    this.paymentStatus = 'paid';
  } else if (this.amountPaid > 0) {
    this.paymentStatus = 'partial';
  } else {
    this.paymentStatus = 'unpaid';
  }

  next();
});

export default mongoose.model('Invoice', invoiceSchema, 'invoices');

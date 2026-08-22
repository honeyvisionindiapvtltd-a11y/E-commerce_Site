# Payment and Invoice Validation Guide

This guide covers the comprehensive payment and invoice validation system for the HoneyVision e-commerce backend with MongoDB integration.

## Overview

The system includes:
- **Payment Model**: MongoDB schema for storing payment records
- **Invoice Model**: MongoDB schema for storing invoice data
- **Validation Middleware**: Comprehensive validation functions for payment and invoice data
- **Payment Service**: Business logic for payment operations
- **Invoice Service**: Business logic for invoice generation, PDF export, and email delivery

## Database Models

### Payment Model

Located in: `backend/models/Payment.js`

Fields:
- `paymentId` (String, unique): Unique payment identifier
- `orderId` (String): Associated order ID
- `userId` (String): User who made the payment
- `amount` (Number): Payment amount in decimal format
- `currency` (String): Currency code (INR, USD, EUR)
- `status` (String): Payment status (pending, processing, completed, failed, cancelled, refunded)
- `paymentMethod` (String): Method used (card, razorpay, stripe, wallet, cod)
- `paymentProvider` (String): Provider (stripe, razorpay, internal, manual)
- `transactionId` (String): Transaction reference ID
- `refundStatus` (String): Refund status (none, partial, full)
- `refundAmount` (Number): Amount refunded
- Timestamps: `createdAt`, `updatedAt`, `initiatedAt`, `completedAt`, `failedAt`, `refundedAt`

### Invoice Model

Located in: `backend/models/Invoice.js`

Fields:
- `invoiceNumber` (String, unique): Invoice number (e.g., INV-202408-12345)
- `orderId` (String): Associated order ID
- `userId` (String): Customer ID
- `status` (String): Invoice status (draft, sent, viewed, paid, partially_paid, overdue, cancelled)
- `paymentStatus` (String): Payment status (unpaid, partial, paid, refunded, overdue)
- `items` (Array): Line items with product details
- `billTo` (Object): Billing address
- `shippingTo` (Object): Shipping address
- `subtotal`, `discount`, `taxAmount`, `shippingCost`, `total` (Numbers)
- `amountPaid`, `amountRemaining` (Numbers): Payment tracking
- `pdfUrl` (String): Generated PDF invoice URL
- `emailSentAt` (Date): Email delivery timestamp
- Timestamps: `createdAt`, `updatedAt`, `invoiceDate`, `dueDate`, `sentDate`, `paidDate`

## Validation Functions

### Payment Validation

```javascript
import {
  validatePaymentAmount,
  validateCurrency,
  validatePaymentMethod,
  validatePaymentStatus,
  validatePaymentData,
  validateRefund,
  validateRazorpayPayment,
} from 'backend/middleware/paymentValidation.js';

// Validate payment amount
const amountValidation = validatePaymentAmount(1000);
if (!amountValidation.valid) {
  console.error(amountValidation.error);
}

// Validate entire payment data
const paymentValidation = validatePaymentData({
  orderId: 'ORD123',
  userId: 'USR456',
  amount: 1000,
  currency: 'INR',
  paymentMethod: 'card',
});

if (!paymentValidation.valid) {
  paymentValidation.errors.forEach(err => console.error(err));
}

// Validate refund
const refundValidation = validateRefund({
  refundAmount: 500,
  refundReason: 'customer_request'
});
```

### Invoice Validation

```javascript
import {
  validateInvoiceItem,
  validateInvoiceAddress,
  validateInvoiceTotals,
  validateInvoiceData,
} from 'backend/middleware/paymentValidation.js';

// Validate invoice item
const itemValidation = validateInvoiceItem({
  productId: 'PROD123',
  productName: 'AI Camera',
  quantity: 2,
  unitPrice: 5000,
  discount: 500,
  tax: 900,
  totalPrice: 9900,
});

// Validate address
const addressValidation = validateInvoiceAddress({
  fullName: 'John Doe',
  email: 'john@example.com',
  phone: '9876543210',
  address: '123 Street',
  city: 'Bhubaneswar',
  state: 'Odisha',
  pinCode: '751001',
});

// Validate entire invoice
const invoiceValidation = validateInvoiceData({
  orderId: 'ORD123',
  userId: 'USR456',
  invoiceNumber: 'INV-202408-12345',
  items: [...],
  billTo: {...},
  subtotal: 10000,
  discount: 0,
  taxAmount: 1800,
  total: 11800,
});
```

## Payment Service

Located in: `backend/services/paymentService.js`

### Create Payment

```javascript
import { createPayment } from 'backend/services/paymentService.js';

const payment = await createPayment({
  orderId: 'ORD123',
  userId: 'USR456',
  amount: 10000,
  currency: 'INR',
  paymentMethod: 'card',
  paymentProvider: 'stripe',
});
```

### Record Razorpay Payment

```javascript
import { recordRazorpayPayment } from 'backend/services/paymentService.js';

const payment = await recordRazorpayPayment({
  orderId: 'ORD123',
  userId: 'USR456',
  amount: 10000,
  currency: 'INR',
  razorpayOrderId: 'order_123',
  razorpayPaymentId: 'pay_123',
  razorpaySignature: 'signature_hash',
});
```

### Update Payment Status

```javascript
import { updatePaymentStatus } from 'backend/services/paymentService.js';

const updated = await updatePaymentStatus('pay_123', 'completed', {
  transactionId: 'txn_123',
  last4Digits: '4242',
  cardBrand: 'Visa',
});
```

### Process Refund

```javascript
import { processRefund } from 'backend/services/paymentService.js';

const refunded = await processRefund('pay_123', {
  refundAmount: 5000,
  refundReason: 'customer_request',
});
```

### Get Payment Statistics

```javascript
import { getPaymentStats } from 'backend/services/paymentService.js';

const stats = await getPaymentStats('USR456');
// Returns: totalPayments, totalAmount, averagePayment, paymentsByMethod, etc.
```

## Invoice Service

Located in: `backend/services/invoiceService.js`

### Create Invoice

```javascript
import { createInvoice } from 'backend/services/invoiceService.js';

const invoice = await createInvoice({
  orderId: 'ORD123',
  userId: 'USR456',
  invoiceNumber: 'INV-202408-12345',
  billTo: {...},
  items: [...],
  subtotal: 10000,
  discount: 0,
  taxAmount: 1800,
  total: 11800,
});
```

### Generate PDF Invoice

```javascript
import { generateInvoicePDF } from 'backend/services/invoiceService.js';

const pdfPath = await generateInvoicePDF(invoiceData, '/path/to/invoice.pdf');
```

### Send Invoice via Email

```javascript
import { sendInvoiceEmail } from 'backend/services/invoiceService.js';

const result = await sendInvoiceEmail(invoiceData, pdfPath);
```

### Auto-Generate Invoice After Payment

```javascript
import { processPaymentAndGenerateInvoice } from 'backend/services/invoiceService.js';

const invoice = await processPaymentAndGenerateInvoice(paymentData, orderData);
// This automatically:
// 1. Creates invoice
// 2. Generates PDF
// 3. Sends email to customer
// 4. Tracks email delivery
```

### Update Invoice Payment

```javascript
import { updateInvoicePaymentStatus } from 'backend/services/invoiceService.js';

const updated = await updateInvoicePaymentStatus(
  invoiceId,
  5000, // amount paid
  'pay_123' // payment ID
);
```

### Get User Invoices

```javascript
import { getUserInvoices } from 'backend/services/invoiceService.js';

const invoices = await getUserInvoices('USR456', {
  status: 'paid',
  paymentStatus: 'partial',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
});
```

## API Routes

### Payment Routes

```javascript
// Create payment
POST /api/payment/create
Body: {
  orderId: 'ORD123',
  userId: 'USR456',
  amount: 10000,
  currency: 'INR',
  paymentMethod: 'card'
}

// Get payment
GET /api/payment/:paymentId

// Update payment status
PUT /api/payment/:paymentId/status
Body: {
  status: 'completed',
  transactionId: 'txn_123'
}

// Process refund
POST /api/payment/:paymentId/refund
Body: {
  refundAmount: 5000,
  refundReason: 'customer_request'
}

// Get order payments
GET /api/payment/order/:orderId

// Get user payments
GET /api/payment/user/:userId?status=completed&limit=50

// Get payment stats
GET /api/payment/stats/:userId
```

### Invoice Routes

```javascript
// Create invoice
POST /api/invoice/create
Body: {
  orderId: 'ORD123',
  userId: 'USR456',
  invoiceNumber: 'INV-202408-12345',
  billTo: {...},
  items: [...],
  total: 11800
}

// Get invoice
GET /api/invoice/:invoiceNumber

// Get user invoices
GET /api/invoice/user/:userId?status=paid&paymentStatus=unpaid

// Download PDF
GET /api/invoice/:invoiceId/download

// Send email
POST /api/invoice/:invoiceId/send-email

// Update payment
PUT /api/invoice/:invoiceId/payment
Body: {
  amountPaid: 5000,
  paymentId: 'pay_123'
}

// Cancel invoice
POST /api/invoice/:invoiceId/cancel
Body: {
  reason: 'Order cancelled by customer'
}
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Email configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@honeyvision.in
EMAIL_CC=support@honeyvision.in

# Payment providers
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Other settings
FRONTEND_URL=http://localhost:5173
```

## Examples

### Complete Payment Flow

```javascript
import { createPayment, updatePaymentStatus } from 'backend/services/paymentService.js';
import { processPaymentAndGenerateInvoice } from 'backend/services/invoiceService.js';

// 1. Create payment record
const payment = await createPayment({
  orderId: 'ORD123',
  userId: 'USR456',
  amount: 10000,
  currency: 'INR',
  paymentMethod: 'razorpay',
  paymentProvider: 'razorpay',
});

// 2. Process with Razorpay (your payment gateway)
const razorpayResponse = await razorpay.orders.create({
  amount: 10000 * 100, // in paise
  currency: 'INR',
  receipt: payment.paymentId,
});

// 3. Update payment after successful verification
await updatePaymentStatus(payment.paymentId, 'completed', {
  razorpayOrderId: razorpayResponse.id,
  razorpayPaymentId: req.body.razorpay_payment_id,
  transactionId: req.body.razorpay_payment_id,
});

// 4. Auto-generate invoice and send email
const invoice = await processPaymentAndGenerateInvoice(payment, orderData);
// Invoice is now created, PDF generated, and email sent!
```

### Partial Payment Tracking

```javascript
import { updateInvoicePaymentStatus } from 'backend/services/invoiceService.js';

// Customer makes first payment
await updateInvoicePaymentStatus(invoiceId, 5000, 'pay_001');
// Invoice status: 'partial', amountRemaining: 6800

// Customer makes second payment
await updateInvoicePaymentStatus(invoiceId, 6800, 'pay_002');
// Invoice status: 'paid', amountRemaining: 0
```

## Error Handling

All validation functions return an object with:
- `valid` (Boolean): Whether validation passed
- `errors` (Array): List of error messages (if validation failed)

Example:
```javascript
const validation = validatePaymentData(paymentData);

if (!validation.valid) {
  return res.status(400).json({
    success: false,
    errors: validation.errors
  });
}
```

## Testing

```bash
# Run tests
npm test

# Test payment validation
npm test -- paymentValidation.test.js

# Test invoice service
npm test -- invoiceService.test.js
```

## Best Practices

1. **Always validate** payment and invoice data before saving
2. **Use transactions** for multi-step operations (create invoice → generate PDF → send email)
3. **Log all payment** operations for audit trails
4. **Encrypt sensitive** data like card numbers and payment tokens
5. **Implement retry logic** for failed email deliveries
6. **Track payment status** changes for reconciliation
7. **Generate PDFs asynchronously** for large batches
8. **Validate amounts** at every step to prevent financial discrepancies
9. **Use idempotency keys** for payment operations to prevent duplicates
10. **Regularly reconcile** payments with payment provider statements

## Troubleshooting

### Issue: "Payment validation failed"
- Check all required fields are present
- Verify amount is a positive number with max 2 decimal places
- Ensure currency is one of: INR, USD, EUR

### Issue: "Invoice totals mismatch"
- Calculate totals as: subtotal - discount + tax + shipping
- Verify each item's totalPrice = (unitPrice × quantity) - discount + tax
- Check for floating-point precision issues

### Issue: "Email not sent"
- Verify EMAIL_USER and EMAIL_PASSWORD in .env
- Check SMTP settings for email service
- Enable "Less secure app access" for Gmail
- Check email logs for bounce reasons

### Issue: "PDF generation timeout"
- Generate PDFs asynchronously with queues
- Use streaming for large documents
- Implement progress tracking for bulk invoices

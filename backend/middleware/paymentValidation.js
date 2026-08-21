/**
 * Payment and Invoice Validation Middleware
 * Comprehensive validation for payment and invoice data
 */

// ============================================================
// PAYMENT VALIDATION
// ============================================================

export function validatePaymentAmount(amount) {
  if (typeof amount !== 'number' || amount <= 0) {
    return { valid: false, error: 'Amount must be a positive number' };
  }
  if (amount > 99999999) {
    return { valid: false, error: 'Amount exceeds maximum limit (99999999)' };
  }
  // Check for reasonable decimal places (max 2 for currency)
  if (!Number.isInteger(amount * 100)) {
    return { valid: false, error: 'Amount must have maximum 2 decimal places' };
  }
  return { valid: true };
}

export function validateCurrency(currency) {
  const validCurrencies = ['INR', 'USD', 'EUR'];
  if (!validCurrencies.includes(currency?.toUpperCase())) {
    return { valid: false, error: `Currency must be one of: ${validCurrencies.join(', ')}` };
  }
  return { valid: true };
}

export function validatePaymentMethod(method) {
  const validMethods = ['card', 'razorpay', 'stripe', 'wallet', 'cod'];
  if (!validMethods.includes(method?.toLowerCase())) {
    return { valid: false, error: `Payment method must be one of: ${validMethods.join(', ')}` };
  }
  return { valid: true };
}

export function validatePaymentStatus(status) {
  const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'];
  if (!validStatuses.includes(status?.toLowerCase())) {
    return { valid: false, error: `Payment status must be one of: ${validStatuses.join(', ')}` };
  }
  return { valid: true };
}

export function validatePaymentProvider(provider) {
  const validProviders = ['stripe', 'razorpay', 'internal', 'manual'];
  if (!validProviders.includes(provider?.toLowerCase())) {
    return { valid: false, error: `Provider must be one of: ${validProviders.join(', ')}` };
  }
  return { valid: true };
}

export function validateCardDetails(cardData) {
  const errors = [];

  if (!cardData.last4Digits || !/^\d{4}$/.test(cardData.last4Digits)) {
    errors.push('Last 4 digits must be exactly 4 numbers');
  }

  if (!cardData.cardBrand || !['Visa', 'Mastercard', 'Amex', 'Discover'].includes(cardData.cardBrand)) {
    errors.push('Card brand must be Visa, Mastercard, Amex, or Discover');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateRazorpayPayment(razorpayData) {
  const errors = [];

  if (!razorpayData.razorpayOrderId || typeof razorpayData.razorpayOrderId !== 'string') {
    errors.push('Razorpay Order ID is required and must be a string');
  }

  if (!razorpayData.razorpayPaymentId || typeof razorpayData.razorpayPaymentId !== 'string') {
    errors.push('Razorpay Payment ID is required and must be a string');
  }

  if (!razorpayData.razorpaySignature || typeof razorpayData.razorpaySignature !== 'string') {
    errors.push('Razorpay Signature is required and must be a string');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateRefund(refundData) {
  const errors = [];

  if (!refundData.refundAmount || typeof refundData.refundAmount !== 'number' || refundData.refundAmount <= 0) {
    errors.push('Refund amount must be a positive number');
  }

  if (!refundData.refundReason || typeof refundData.refundReason !== 'string') {
    errors.push('Refund reason is required');
  }

  const validRefundReasons = [
    'customer_request',
    'duplicate_charge',
    'fraud',
    'payment_failed',
    'cancellation',
    'product_returned',
    'other'
  ];

  if (!validRefundReasons.includes(refundData.refundReason?.toLowerCase())) {
    errors.push(`Refund reason must be one of: ${validRefundReasons.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validatePaymentData(paymentData) {
  const errors = [];

  // Required fields
  if (!paymentData.orderId || typeof paymentData.orderId !== 'string') {
    errors.push('Order ID is required and must be a string');
  }

  if (!paymentData.userId || typeof paymentData.userId !== 'string') {
    errors.push('User ID is required and must be a string');
  }

  // Amount validation
  const amountValidation = validatePaymentAmount(paymentData.amount);
  if (!amountValidation.valid) {
    errors.push(amountValidation.error);
  }

  // Currency validation
  const currencyValidation = validateCurrency(paymentData.currency || 'INR');
  if (!currencyValidation.valid) {
    errors.push(currencyValidation.error);
  }

  // Payment method validation
  const methodValidation = validatePaymentMethod(paymentData.paymentMethod);
  if (!methodValidation.valid) {
    errors.push(methodValidation.error);
  }

  // Status validation (if provided)
  if (paymentData.status) {
    const statusValidation = validatePaymentStatus(paymentData.status);
    if (!statusValidation.valid) {
      errors.push(statusValidation.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================
// INVOICE VALIDATION
// ============================================================

export function validateInvoiceItem(item) {
  const errors = [];

  if (!item.productId || typeof item.productId !== 'string') {
    errors.push('Product ID is required and must be a string');
  }

  if (!item.productName || typeof item.productName !== 'string') {
    errors.push('Product name is required and must be a string');
  }

  if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
    errors.push('Quantity must be a positive integer');
  }

  if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
    errors.push('Unit price must be a non-negative number');
  }

  if (typeof item.discount !== 'number' || item.discount < 0) {
    errors.push('Discount must be a non-negative number');
  }

  if (typeof item.tax !== 'number' || item.tax < 0) {
    errors.push('Tax must be a non-negative number');
  }

  // Validate totalPrice = (unitPrice * quantity) - discount + tax (with small tolerance for floating point)
  const expectedTotal = (item.unitPrice * item.quantity) - item.discount + item.tax;
  if (Math.abs(item.totalPrice - expectedTotal) > 0.01) {
    errors.push(`Total price mismatch. Expected ${expectedTotal}, got ${item.totalPrice}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateInvoiceAddress(address, fieldName = 'Address') {
  const errors = [];

  if (!address.fullName || typeof address.fullName !== 'string' || address.fullName.trim().length === 0) {
    errors.push(`${fieldName} - Full name is required`);
  }

  if (!address.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
    errors.push(`${fieldName} - Valid email is required`);
  }

  if (!address.phone || !/^\d{10}$/.test(address.phone.replace(/\D/g, ''))) {
    errors.push(`${fieldName} - Valid 10-digit phone number is required`);
  }

  if (!address.address || typeof address.address !== 'string' || address.address.trim().length === 0) {
    errors.push(`${fieldName} - Address is required`);
  }

  if (!address.city || typeof address.city !== 'string' || address.city.trim().length === 0) {
    errors.push(`${fieldName} - City is required`);
  }

  if (!address.state || typeof address.state !== 'string' || address.state.trim().length === 0) {
    errors.push(`${fieldName} - State is required`);
  }

  if (!address.pinCode || !/^[1-9][0-9]{5}$/.test(address.pinCode.replace(/\D/g, ''))) {
    errors.push(`${fieldName} - Valid 6-digit pin code is required`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateInvoiceTotals(invoiceData) {
  const errors = [];

  // Calculate expected subtotal
  const items = invoiceData.items || [];
  const expectedSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  if (Math.abs(invoiceData.subtotal - expectedSubtotal) > 0.01) {
    errors.push(`Subtotal mismatch. Expected ${expectedSubtotal}, got ${invoiceData.subtotal}`);
  }

  // Calculate expected total
  const expectedTotal =
    invoiceData.subtotal -
    invoiceData.discount +
    invoiceData.taxAmount +
    (invoiceData.shippingCost || 0);

  if (Math.abs(invoiceData.total - expectedTotal) > 0.01) {
    errors.push(`Total mismatch. Expected ${expectedTotal}, got ${invoiceData.total}`);
  }

  // Discount validation
  if (invoiceData.discount < 0) {
    errors.push('Discount cannot be negative');
  }

  if (invoiceData.discount > invoiceData.subtotal) {
    errors.push('Discount cannot exceed subtotal');
  }

  // Tax validation
  if (invoiceData.taxAmount < 0) {
    errors.push('Tax amount cannot be negative');
  }

  if (invoiceData.taxPercentage < 0 || invoiceData.taxPercentage > 100) {
    errors.push('Tax percentage must be between 0 and 100');
  }

  // Shipping cost validation
  if ((invoiceData.shippingCost || 0) < 0) {
    errors.push('Shipping cost cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateInvoiceData(invoiceData) {
  const errors = [];

  // Required fields
  if (!invoiceData.orderId || typeof invoiceData.orderId !== 'string') {
    errors.push('Order ID is required and must be a string');
  }

  if (!invoiceData.userId || typeof invoiceData.userId !== 'string') {
    errors.push('User ID is required and must be a string');
  }

  // Invoice number
  if (!invoiceData.invoiceNumber || typeof invoiceData.invoiceNumber !== 'string') {
    errors.push('Invoice number is required and must be a string');
  }

  // Items validation
  if (!Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
    errors.push('Invoice must have at least one item');
  } else {
    invoiceData.items.forEach((item, index) => {
      const itemValidation = validateInvoiceItem(item);
      if (!itemValidation.valid) {
        errors.push(...itemValidation.errors.map((err) => `Item ${index + 1}: ${err}`));
      }
    });
  }

  // Address validation
  if (!invoiceData.billTo) {
    errors.push('Bill to address is required');
  } else {
    const billToValidation = validateInvoiceAddress(invoiceData.billTo, 'Bill To');
    if (!billToValidation.valid) {
      errors.push(...billToValidation.errors);
    }
  }

  if (invoiceData.shippingTo) {
    const shippingValidation = validateInvoiceAddress(invoiceData.shippingTo, 'Shipping To');
    if (!shippingValidation.valid) {
      errors.push(...shippingValidation.errors);
    }
  }

  // Totals validation
  const totalsValidation = validateInvoiceTotals(invoiceData);
  if (!totalsValidation.valid) {
    errors.push(...totalsValidation.errors);
  }

  // Status validation
  const validStatuses = ['draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled'];
  if (invoiceData.status && !validStatuses.includes(invoiceData.status.toLowerCase())) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  // Payment status validation
  const validPaymentStatuses = ['unpaid', 'partial', 'paid', 'refunded', 'overdue'];
  if (invoiceData.paymentStatus && !validPaymentStatuses.includes(invoiceData.paymentStatus.toLowerCase())) {
    errors.push(`Payment status must be one of: ${validPaymentStatuses.join(', ')}`);
  }

  // Amount paid validation
  if (typeof invoiceData.amountPaid !== 'number' || invoiceData.amountPaid < 0) {
    errors.push('Amount paid must be a non-negative number');
  }

  if (invoiceData.amountPaid > invoiceData.total) {
    errors.push('Amount paid cannot exceed total');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================
// HELPER VALIDATION FUNCTIONS
// ============================================================

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
}

export function validatePinCode(pinCode) {
  const digits = pinCode.replace(/\D/g, '');
  return /^[1-9][0-9]{5}$/.test(digits);
}

export function validateDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

export function formatValidationErrors(errors) {
  return errors.map((error) => ({ message: error }));
}

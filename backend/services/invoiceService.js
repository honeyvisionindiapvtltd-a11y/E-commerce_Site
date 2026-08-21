import { getDB } from '../db.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

/**
 * Initialize Nodemailer transporter for email
 */
const getEmailTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Generate unique invoice number
 */
export async function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(5, '0');
  return `INV-${year}${month}-${randomNum}`;
}

/**
 * Create invoice from order and payment data
 */
export async function createInvoice(invoiceData) {
  try {
    const invoiceNumber = invoiceData.invoiceNumber || (await generateInvoiceNumber());

    const newInvoice = new Invoice({
      ...invoiceData,
      invoiceNumber,
      invoiceDate: new Date(),
    });

    await newInvoice.save();
    return newInvoice;
  } catch (error) {
    throw new Error(`Failed to create invoice: ${error.message}`);
  }
}

/**
 * Generate PDF invoice
 */
export async function generateInvoicePDF(invoiceData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 40,
          bottom: 40,
          left: 40,
          right: 40,
        },
      });

      // Create write stream
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // ===== HEADER =====
      doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
      doc.moveDown(0.2);

      // Company info
      if (invoiceData.billFrom?.companyName) {
        doc.fontSize(12).font('Helvetica-Bold').text(invoiceData.billFrom.companyName);
      }
      doc.fontSize(10).font('Helvetica').text(invoiceData.billFrom?.address || '');
      doc.text(`${invoiceData.billFrom?.city}, ${invoiceData.billFrom?.state} ${invoiceData.billFrom?.pinCode}`);
      if (invoiceData.billFrom?.phone) doc.text(`Phone: ${invoiceData.billFrom.phone}`);
      if (invoiceData.billFrom?.email) doc.text(`Email: ${invoiceData.billFrom.email}`);
      if (invoiceData.billFrom?.gstNumber) doc.text(`GST: ${invoiceData.billFrom.gstNumber}`);

      doc.moveDown(0.5);

      // Invoice details
      doc.fontSize(10).font('Helvetica');
      doc.text(`Invoice #: ${invoiceData.invoiceNumber}`);
      doc.text(`Invoice Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString()}`);
      if (invoiceData.dueDate) {
        doc.text(`Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString()}`);
      }

      doc.moveDown(0.5);

      // ===== BILLING ADDRESS =====
      doc.fontSize(10).font('Helvetica-Bold').text('Bill To:', { underline: true });
      doc.font('Helvetica');
      doc.text(invoiceData.billTo?.fullName || '');
      doc.text(invoiceData.billTo?.address || '');
      doc.text(`${invoiceData.billTo?.city}, ${invoiceData.billTo?.state} ${invoiceData.billTo?.pinCode}`);
      doc.text(`Phone: ${invoiceData.billTo?.phone}`);
      doc.text(`Email: ${invoiceData.billTo?.email}`);

      doc.moveDown(0.5);

      // ===== SHIPPING ADDRESS =====
      if (invoiceData.shippingTo && invoiceData.shippingTo !== invoiceData.billTo) {
        doc.fontSize(10).font('Helvetica-Bold').text('Ship To:', { underline: true });
        doc.font('Helvetica');
        doc.text(invoiceData.shippingTo?.fullName || '');
        doc.text(invoiceData.shippingTo?.address || '');
        doc.text(`${invoiceData.shippingTo?.city}, ${invoiceData.shippingTo?.state} ${invoiceData.shippingTo?.pinCode}`);
        doc.text(`Phone: ${invoiceData.shippingTo?.phone}`);

        doc.moveDown(0.5);
      }

      // ===== ITEMS TABLE =====
      doc.fontSize(10);
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 200;
      const col3 = 310;
      const col4 = 380;
      const col5 = 480;

      // Table header
      doc.font('Helvetica-Bold');
      doc.text('Item', col1, tableTop);
      doc.text('Description', col2, tableTop);
      doc.text('Qty', col3, tableTop);
      doc.text('Unit Price', col4, tableTop);
      doc.text('Amount', col5, tableTop, { align: 'right' });

      // Horizontal line
      doc.moveTo(40, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Items
      doc.font('Helvetica');
      let tableRowTop = tableTop + 25;

      invoiceData.items?.forEach((item) => {
        const itemText = item.productName;
        doc.text(item.sku || '', col1, tableRowTop, { width: 140 });
        doc.text(itemText, col2, tableRowTop, { width: 100 });
        doc.text(item.quantity.toString(), col3, tableRowTop);
        doc.text(`₹${item.unitPrice.toFixed(2)}`, col4, tableRowTop);
        doc.text(`₹${item.totalPrice.toFixed(2)}`, col5, tableRowTop, { align: 'right' });
        tableRowTop += 25;
      });

      // Bottom line
      doc.moveTo(40, tableRowTop).lineTo(550, tableRowTop).stroke();

      tableRowTop += 10;

      // ===== TOTALS =====
      const totalsLeft = 400;
      doc.fontSize(10).font('Helvetica');
      doc.text('Subtotal:', totalsLeft, tableRowTop);
      doc.text(`₹${invoiceData.subtotal?.toFixed(2) || '0.00'}`, 480, tableRowTop, { align: 'right' });

      tableRowTop += 20;
      if (invoiceData.discount > 0) {
        doc.text('Discount:', totalsLeft, tableRowTop);
        doc.text(`-₹${invoiceData.discount?.toFixed(2) || '0.00'}`, 480, tableRowTop, { align: 'right' });
        tableRowTop += 20;
      }

      if (invoiceData.taxAmount > 0) {
        doc.text(`Tax (${invoiceData.taxPercentage || 0}%):`, totalsLeft, tableRowTop);
        doc.text(`₹${invoiceData.taxAmount?.toFixed(2) || '0.00'}`, 480, tableRowTop, { align: 'right' });
        tableRowTop += 20;
      }

      if (invoiceData.shippingCost > 0) {
        doc.text('Shipping:', totalsLeft, tableRowTop);
        doc.text(`₹${invoiceData.shippingCost?.toFixed(2) || '0.00'}`, 480, tableRowTop, { align: 'right' });
        tableRowTop += 20;
      }

      // Total
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Total:', totalsLeft, tableRowTop);
      doc.text(`₹${invoiceData.total?.toFixed(2) || '0.00'}`, 480, tableRowTop, { align: 'right' });

      tableRowTop += 30;

      // Payment status
      doc.fontSize(10).font('Helvetica');
      doc.text(`Payment Status: ${invoiceData.paymentStatus?.toUpperCase() || 'UNPAID'}`);

      if (invoiceData.paymentStatus === 'paid' && invoiceData.paidDate) {
        doc.text(`Paid on: ${new Date(invoiceData.paidDate).toLocaleDateString()}`);
      } else if (invoiceData.amountPaid > 0) {
        doc.text(`Amount Paid: ₹${invoiceData.amountPaid?.toFixed(2) || '0.00'}`);
        doc.text(`Amount Due: ₹${invoiceData.amountRemaining?.toFixed(2) || '0.00'}`);
      }

      // Notes
      if (invoiceData.notes) {
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica-Bold').text('Notes:');
        doc.font('Helvetica').text(invoiceData.notes, { width: 500 });
      }

      // Footer
      doc.moveDown(1);
      doc.fontSize(8).font('Helvetica').text('Thank you for your business!', { align: 'center' });

      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    } catch (error) {
      reject(new Error(`Failed to generate PDF: ${error.message}`));
    }
  });
}

/**
 * Send invoice via email
 */
export async function sendInvoiceEmail(invoiceData, pdfPath) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email credentials not configured');
    }

    const transporter = getEmailTransporter();

    const attachmentBuffer = fs.readFileSync(pdfPath);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: invoiceData.billTo?.email,
      cc: process.env.EMAIL_CC || '',
      subject: `Invoice ${invoiceData.invoiceNumber} - HoneyVision`,
      html: `
        <h2>Invoice ${invoiceData.invoiceNumber}</h2>
        <p>Dear ${invoiceData.billTo?.fullName},</p>
        <p>Please find attached your invoice for Order #${invoiceData.orderId}.</p>
        <p><strong>Invoice Details:</strong></p>
        <ul>
          <li>Invoice Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString()}</li>
          <li>Total Amount: ₹${invoiceData.total?.toFixed(2)}</li>
          <li>Payment Status: ${invoiceData.paymentStatus?.toUpperCase()}</li>
        </ul>
        <p>Thank you for your business!</p>
        <p>Best regards,<br/>HoneyVision Team</p>
      `,
      attachments: [
        {
          filename: `${invoiceData.invoiceNumber}.pdf`,
          content: attachmentBuffer,
        },
      ],
    };

    const result = await transporter.sendMail(mailOptions);

    // Update invoice with email tracking
    await Invoice.updateOne(
      { _id: invoiceData._id },
      {
        emailSentAt: new Date(),
        emailSentTo: [invoiceData.billTo?.email],
      }
    );

    return result;
  } catch (error) {
    throw new Error(`Failed to send invoice email: ${error.message}`);
  }
}

/**
 * Auto-generate and send invoice after payment
 */
export async function processPaymentAndGenerateInvoice(paymentData, orderData) {
  try {
    // Create invoice data
    const invoiceData = {
      orderId: paymentData.orderId,
      userId: paymentData.userId,
      billTo: {
        fullName: orderData.customerName || '',
        email: orderData.customerEmail || '',
        phone: orderData.customerPhone || '',
        address: orderData.shippingAddress?.address || '',
        city: orderData.shippingAddress?.city || '',
        state: orderData.shippingAddress?.state || '',
        pinCode: orderData.shippingAddress?.pinCode || '',
      },
      items: orderData.items || [],
      subtotal: orderData.subtotal || 0,
      discount: orderData.discount || 0,
      discountPercentage: orderData.discountPercentage || 0,
      taxAmount: orderData.tax || 0,
      taxPercentage: orderData.taxPercentage || 0,
      shippingCost: orderData.shipping || 0,
      total: paymentData.amount,
      paymentStatus: paymentData.status === 'completed' ? 'paid' : 'unpaid',
      amountPaid: paymentData.status === 'completed' ? paymentData.amount : 0,
      paymentIds: [paymentData.paymentId],
      paidDate: paymentData.status === 'completed' ? new Date() : null,
      status: 'draft',
    };

    // Create invoice
    const invoice = await createInvoice(invoiceData);

    // Generate PDF
    const pdfDir = path.join(process.cwd(), 'invoices');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const pdfPath = path.join(pdfDir, `${invoice.invoiceNumber}.pdf`);
    await generateInvoicePDF(invoiceData, pdfPath);

    // Update invoice with PDF URL
    invoice.pdfUrl = `/invoices/${invoice.invoiceNumber}.pdf`;
    invoice.pdfGeneratedAt = new Date();
    await invoice.save();

    // Send email
    if (invoiceData.billTo?.email) {
      try {
        await sendInvoiceEmail(invoice, pdfPath);
        invoice.status = 'sent';
        await invoice.save();
      } catch (emailError) {
        console.error('Failed to send invoice email:', emailError.message);
      }
    }

    return invoice;
  } catch (error) {
    throw new Error(`Failed to process payment and generate invoice: ${error.message}`);
  }
}

/**
 * Update invoice payment status
 */
export async function updateInvoicePaymentStatus(invoiceId, amountPaid, paymentId) {
  try {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const previousAmountPaid = invoice.amountPaid || 0;
    invoice.amountPaid = previousAmountPaid + amountPaid;
    invoice.amountRemaining = Math.max(0, invoice.total - invoice.amountPaid);

    // Update payment status
    if (invoice.amountPaid >= invoice.total) {
      invoice.paymentStatus = 'paid';
      invoice.paidDate = new Date();
    } else if (invoice.amountPaid > 0) {
      invoice.paymentStatus = 'partial';
    }

    // Add payment reference
    if (paymentId && !invoice.paymentIds.includes(paymentId)) {
      invoice.paymentIds.push(paymentId);
    }

    invoice.lastPaymentDate = new Date();

    await invoice.save();
    return invoice;
  } catch (error) {
    throw new Error(`Failed to update invoice payment status: ${error.message}`);
  }
}

/**
 * Get invoice by invoice number or ID
 */
export async function getInvoice(identifier) {
  try {
    let invoice;

    if (identifier.startsWith('INV-')) {
      invoice = await Invoice.findOne({ invoiceNumber: identifier });
    } else {
      invoice = await Invoice.findById(identifier);
    }

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return invoice;
  } catch (error) {
    throw new Error(`Failed to get invoice: ${error.message}`);
  }
}

/**
 * Get invoices for a user
 */
export async function getUserInvoices(userId, filter = {}) {
  try {
    const query = { userId };

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.paymentStatus) {
      query.paymentStatus = filter.paymentStatus;
    }

    if (filter.startDate || filter.endDate) {
      query.invoiceDate = {};
      if (filter.startDate) {
        query.invoiceDate.$gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        query.invoiceDate.$lte = new Date(filter.endDate);
      }
    }

    const invoices = await Invoice.find(query).sort({ invoiceDate: -1 });

    return invoices;
  } catch (error) {
    throw new Error(`Failed to get user invoices: ${error.message}`);
  }
}

/**
 * Cancel invoice
 */
export async function cancelInvoice(invoiceId, reason) {
  try {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.paymentStatus === 'paid') {
      throw new Error('Cannot cancel a paid invoice');
    }

    invoice.status = 'cancelled';
    invoice.cancelledDate = new Date();
    invoice.notes = `${invoice.notes || ''}\nCancellation Reason: ${reason}`.trim();

    await invoice.save();
    return invoice;
  } catch (error) {
    throw new Error(`Failed to cancel invoice: ${error.message}`);
  }
}

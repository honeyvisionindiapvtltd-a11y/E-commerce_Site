import Installation from '../models/Installation.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import {
  createInstallationBooking,
  calculateInstallationPricing,
  getInstallationBooking,
  getAdminInstallationBookings,
  getCustomerInstallationBookings,
  getAgentInstallationBookings,
  updateInstallationStatus,
  assignInstallationAgent,
  updateInstallationLocation,
  addInstallationNotes,
  getInstallationStatistics,
  getRecentInstallationBookings,
} from '../services/installationService.js';
import { INSTALLATION_STATUSES, isValidStatusTransition } from '../constants/installationStatuses.js';
import Payment from '../models/Payment.js';
import Razorpay from 'razorpay';
import { verifyRazorpaySignature } from './paymentController.js';
import { emitInstallationStatusUpdate } from '../services/realtimeService.js';

const razorInstance = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

const INSTALLATION_SLOTS = [
  'Morning (9:00 AM - 12:00 PM)',
  'Afternoon (12:00 PM - 3:00 PM)',
  'Evening (3:00 PM - 6:00 PM)',
];

const isValidInstallationDate = (value) => {
  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) && !Number.isNaN(date.getTime()) && date >= today;
};

/**
 * Installation Controller
 * Handles HTTP requests for installation bookings
 */

// ==========================================
// ADMIN OPERATIONS
// ==========================================

/**
 * GET /admin/installations
 * List all installation bookings with filters
 */
export const adminListInstallations = async (req, res) => {
  try {
    const { status, agentId, customerId, city, state, startDate, endDate, search, page = 0, pageSize = 10 } = req.query;

    const filters = {
      status,
      agentId,
      customerId,
      city,
      state,
      startDate,
      endDate,
      search,
      page: Number(page),
      pageSize: Number(pageSize),
    };

    const result = await getAdminInstallationBookings(filters);

    res.json({
      success: true,
      data: result.bookings,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / result.pageSize),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch installations',
    });
  }
};

/**
 * GET /admin/installations/:bookingId
 * Get single installation booking details
 */
export const adminGetInstallation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await getInstallationBooking(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Installation booking not found',
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch installation',
    });
  }
};

/**
 * PUT /admin/installations/:bookingId/status
 * Update installation booking status
 */
export const adminUpdateInstallationStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, note, failureReason, adminNotes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    if (!Object.values(INSTALLATION_STATUSES).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const booking = await getInstallationBooking(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Installation booking not found',
      });
    }

    if (status === INSTALLATION_STATUSES.CONFIRMED && booking.paymentStatus !== 'PAID' && booking.paymentMethod !== 'COD') {
      return res.status(400).json({ success: false, message: 'Installation payment must be paid before confirmation.' });
    }

    if (!isValidStatusTransition(booking.status, status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${booking.status} to ${status}`,
      });
    }

    const updated = await updateInstallationStatus(bookingId, status, {
      changedBy: req.user._id,
      changedByRole: 'admin',
      changedByName: req.user.name || 'Admin',
      note: note || adminNotes,
      failureReason,
      adminNotes,
    });

    res.json({
      success: true,
      data: updated,
      message: `Installation status updated to ${status}`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update installation status',
    });
  }
};

/**
 * PUT /admin/installations/:bookingId/assign-agent
 * Assign delivery agent to installation
 */
export const adminAssignAgent = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: 'Agent ID is required',
      });
    }

    const booking = await assignInstallationAgent(bookingId, agentId, req.user._id);

    res.json({
      success: true,
      data: booking,
      message: `Agent assigned successfully`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to assign agent',
    });
  }
};

/**
 * PUT /admin/installations/:bookingId/notes
 * Add admin notes to installation
 */
export const adminAddNotes = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({
        success: false,
        message: 'Notes are required',
      });
    }

    const booking = await addInstallationNotes(bookingId, notes, 'admin');

    res.json({
      success: true,
      data: booking,
      message: 'Notes added successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add notes',
    });
  }
};

/**
 * GET /admin/installations/statistics
 * Get installation statistics
 */
export const adminGetInstallationStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await getInstallationStatistics({
      startDate,
      endDate,
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch statistics',
    });
  }
};

export const adminGetRecentInstallations = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const bookings = await getRecentInstallationBookings(limit);

    res.json({
      success: true,
      data: bookings,
      count: bookings.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch recent installations',
    });
  }
};

// ==========================================
// DELIVERY AGENT OPERATIONS
// ==========================================

/**
 * GET /agent/installations
 * Get installations assigned to delivery agent
 */
export const agentListInstallations = async (req, res) => {
  try {
    const agentId = req.user._id;
    const bookings = await getAgentInstallationBookings(agentId);

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch assignments',
    });
  }
};

/**
 * GET /agent/installations/:bookingId
 * Get single installation details (agent)
 */
export const agentGetInstallation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const agentId = req.user._id;

    const booking = await getInstallationBooking(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Installation booking not found',
      });
    }

    // Verify this booking is assigned to the agent
    if (String(booking.assignedAgentId) !== String(agentId)) {
      return res.status(403).json({
        success: false,
        message: 'This installation is not assigned to you',
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch installation',
    });
  }
};

/**
 * PUT /agent/installations/:bookingId/accept
 * Agent accepts installation booking
 */
export const agentAcceptInstallation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const agentId = req.user._id;

    const booking = await getInstallationBooking(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Installation booking not found',
      });
    }

    if (String(booking.assignedAgentId) !== String(agentId)) {
      return res.status(403).json({
        success: false,
        message: 'This installation is not assigned to you',
      });
    }

    if (booking.status !== INSTALLATION_STATUSES.ASSIGNED) {
      return res.status(400).json({
        success: false,
        message: `Cannot accept from status: ${booking.status}`,
      });
    }

    const updated = await updateInstallationStatus(bookingId, INSTALLATION_STATUSES.AGENT_ACCEPTED, {
      changedBy: agentId,
      changedByRole: 'delivery_agent',
      changedByName: req.user.name,
      note: 'Agent accepted the installation',
    });

    res.json({
      success: true,
      data: updated,
      message: 'Installation accepted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to accept installation',
    });
  }
};

/**
 * PUT /agent/installations/:bookingId/decline
 * Agent declines installation booking
 */
export const agentDeclineInstallation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const agentId = req.user._id;

    const booking = await getInstallationBooking(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Installation booking not found',
      });
    }

    if (String(booking.assignedAgentId) !== String(agentId)) {
      return res.status(403).json({
        success: false,
        message: 'This installation is not assigned to you',
      });
    }

    if (booking.status !== INSTALLATION_STATUSES.ASSIGNED) {
      return res.status(400).json({
        success: false,
        message: `Cannot decline from status: ${booking.status}`,
      });
    }

    const updated = await updateInstallationStatus(bookingId, INSTALLATION_STATUSES.AGENT_DECLINED, {
      changedBy: agentId,
      changedByRole: 'delivery_agent',
      changedByName: req.user.name,
      note: reason || 'Agent declined the installation',
    });

    res.json({
      success: true,
      data: updated,
      message: 'Installation declined successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to decline installation',
    });
  }
};

/**
 * PUT /agent/installations/:bookingId/update-status
 * Agent updates installation status
 */
export const agentUpdateInstallationStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, note, failureReason, completionDetails } = req.body;
    const agentId = req.user._id;

    const booking = await getInstallationBooking(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Installation booking not found',
      });
    }

    if (String(booking.assignedAgentId) !== String(agentId)) {
      return res.status(403).json({
        success: false,
        message: 'This installation is not assigned to you',
      });
    }

    // Allowed agent status updates
    const allowedStatuses = [
      INSTALLATION_STATUSES.ON_THE_WAY,
      INSTALLATION_STATUSES.ARRIVED,
      INSTALLATION_STATUSES.INSTALLATION_IN_PROGRESS,
      INSTALLATION_STATUSES.INSTALLATION_COMPLETED,
      INSTALLATION_STATUSES.FAILED,
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status update',
      });
    }

    if (!isValidStatusTransition(booking.status, status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${booking.status} to ${status}`,
      });
    }

    const updated = await updateInstallationStatus(bookingId, status, {
      changedBy: agentId,
      changedByRole: 'delivery_agent',
      changedByName: req.user.name,
      note: note || '',
      failureReason: status === INSTALLATION_STATUSES.FAILED ? failureReason : undefined,
      agentNotes: status === INSTALLATION_STATUSES.FAILED ? note : undefined,
      completionDetails: status === INSTALLATION_STATUSES.INSTALLATION_COMPLETED ? completionDetails : undefined,
    });

    res.json({
      success: true,
      data: updated,
      message: `Installation status updated to ${status}`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update installation status',
    });
  }
};

/**
 * PUT /agent/installations/:bookingId/location
 * Update agent location for installation
 */
export const agentUpdateLocation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { latitude, longitude, accuracy, heading, speed } = req.body;
    const agentId = req.user._id;

    const booking = await getInstallationBooking(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Installation booking not found',
      });
    }

    if (String(booking.assignedAgentId) !== String(agentId)) {
      return res.status(403).json({
        success: false,
        message: 'This installation is not assigned to you',
      });
    }

    const updated = await updateInstallationLocation(bookingId, {
      latitude,
      longitude,
      accuracy,
      heading,
      speed,
    });

    res.json({
      success: true,
      data: updated,
      message: 'Location updated successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update location',
    });
  }
};

/**
 * PUT /agent/installations/:bookingId/notes
 * Add agent notes to installation
 */
export const agentAddNotes = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { notes } = req.body;
    const agentId = req.user._id;

    const booking = await getInstallationBooking(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Installation booking not found',
      });
    }

    if (String(booking.assignedAgentId) !== String(agentId)) {
      return res.status(403).json({
        success: false,
        message: 'This installation is not assigned to you',
      });
    }

    const updated = await addInstallationNotes(bookingId, notes, 'agent');

    res.json({
      success: true,
      data: updated,
      message: 'Notes added successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add notes',
    });
  }
};

// ==========================================
// CUSTOMER OPERATIONS
// ==========================================

/**
 * POST /installations
 * Create a new installation booking for the authenticated customer
 */
export const customerCreateInstallation = async (req, res) => {
  try {
    const { service, serviceId, orderId, orderNumber, customer = {}, preferredDate, preferredSlot, notes = '', additionalServices = [] } = req.body || {};
    const userId = req.user._id;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Please select the order for which installation is required.' });
    }

    const orderFilters = [{ orderNumber: String(orderId) }, { id: String(orderId) }];
    if (/^[a-fA-F0-9]{24}$/.test(String(orderId))) orderFilters.push({ _id: orderId });
    const selectedOrder = await Order.findOne({
      $or: orderFilters,
      user: userId,
    }).populate('items.product', 'installationAvailable');

    if (!selectedOrder) {
      return res.status(403).json({ success: false, message: 'The selected order does not belong to this customer.' });
    }

    if (['CANCELLED', 'RETURNED', 'REFUNDED'].includes(String(selectedOrder.status || '').toUpperCase())) {
      return res.status(400).json({ success: false, message: 'This order cannot be used for a new installation booking.' });
    }

    if (selectedOrder.paymentStatus !== 'PAID') {
      return res.status(400).json({ success: false, message: 'The product order must be paid before installation can be booked.' });
    }

    if (!selectedOrder.items?.some((item) => item.product?.installationAvailable === true)) {
      return res.status(400).json({ success: false, message: 'None of the products in this order support installation.' });
    }

    const chosenServiceId = String(serviceId || service || '').trim();
    if (!chosenServiceId) {
      return res.status(400).json({ success: false, message: 'Please select an installation service.' });
    }

    const hasLatitude = customer.latitude !== null && customer.latitude !== undefined && customer.latitude !== '';
    const hasLongitude = customer.longitude !== null && customer.longitude !== undefined && customer.longitude !== '';
    const latitude = hasLatitude ? Number(customer.latitude) : null;
    const longitude = hasLongitude ? Number(customer.longitude) : null;
    if ((hasLatitude || hasLongitude) && (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude === 0 || longitude === 0 || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid installation GPS location.' });
    }

    if (!isValidInstallationDate(preferredDate) || !INSTALLATION_SLOTS.includes(preferredSlot)) {
      return res.status(400).json({ success: false, message: 'Please choose a valid date and time slot.' });
    }

    const duplicateBooking = await Installation.findOne({
      userId,
      $or: [{ orderId: String(selectedOrder._id) }, { orderId: selectedOrder.orderNumber }],
      status: { $nin: ['CANCELLED', 'INSTALLATION_COMPLETED', 'FAILED'] },
    }).lean();

    if (duplicateBooking) {
      return res.status(409).json({
        success: false,
        message: 'An active installation booking already exists for this order.',
        data: duplicateBooking,
      });
    }

    const booking = await createInstallationBooking({
      userId,
      service: service || chosenServiceId,
      serviceId: chosenServiceId,
      orderId: selectedOrder._id,
      orderNumber: selectedOrder.orderNumber || orderNumber,
      customer: {
        ...customer,
        name: customer.name || req.user.name || '',
        phone: customer.phone || req.user.phone || '',
        email: customer.email || req.user.email || '',
        latitude,
        longitude,
      },
      preferredDate,
      preferredSlot,
      notes,
      additionalServices: Array.isArray(additionalServices) ? additionalServices : [],
    });

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Installation booking created successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create installation',
    });
  }
};

const findInstallationDocument = (bookingId) => {
  const filters = [{ id: String(bookingId) }, { bookingNumber: String(bookingId) }];
  if (/^[a-fA-F0-9]{24}$/.test(String(bookingId))) filters.push({ _id: bookingId });
  return Installation.findOne({ $or: filters });
};

export const createInstallationPaymentOrder = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_ENABLED || !razorInstance) {
      return res.status(503).json({ success: false, message: 'Razorpay is not enabled on this server.' });
    }

    const booking = await findInstallationDocument(req.params.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Installation booking not found.' });
    if (String(booking.userId) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'This booking does not belong to you.' });
    if (booking.paymentStatus === 'PAID') return res.status(409).json({ success: false, message: 'Installation has already been paid.' });
    if (booking.paymentStatus === 'REFUNDED' || booking.status === INSTALLATION_STATUSES.CANCELLED) return res.status(400).json({ success: false, message: 'This installation is not payable.' });

    const razorpayOrder = await razorInstance.orders.create({
      amount: Math.round(Number(booking.total) * 100),
      currency: booking.paymentCurrency || 'INR',
      receipt: booking.bookingNumber,
      payment_capture: 1,
    });
    booking.paymentOrderId = razorpayOrder.id;
    booking.paymentAmount = Number(booking.total);
    booking.paymentProvider = 'razorpay';
    await booking.save();

    return res.json({ success: true, data: { installation: booking, razorpayOrder, keyId: process.env.RAZORPAY_KEY_ID } });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || 'Unable to create installation payment order.' });
  }
};

export const verifyInstallationPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields.' });
    }

    const booking = await findInstallationDocument(req.params.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Installation booking not found.' });
    if (String(booking.userId) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'This booking does not belong to you.' });
    if (booking.paymentOrderId !== razorpay_order_id) return res.status(400).json({ success: false, message: 'Payment order does not match this installation.' });

    const valid = verifyRazorpaySignature(process.env.RAZORPAY_KEY_SECRET, razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!valid) return res.status(400).json({ success: false, message: 'Invalid payment signature.' });

    const existingPayment = await Payment.findOne({ paymentId: `installation:${razorpay_payment_id}` });
    if (existingPayment) {
      return res.json({ success: true, data: { installation: booking, payment: existingPayment }, message: 'Installation payment already verified.' });
    }

    if (razorInstance) {
      const razorpayPayment = await razorInstance.payments.fetch(razorpay_payment_id);
      if (razorpayPayment.order_id !== razorpay_order_id || Number(razorpayPayment.amount) !== Math.round(Number(booking.total) * 100)) {
        return res.status(400).json({ success: false, message: 'Payment amount does not match the installation total.' });
      }
    }

    const payment = await Payment.create({
      paymentId: `installation:${razorpay_payment_id}`,
      orderId: booking.bookingNumber,
      userId: String(req.user._id),
      amount: booking.total,
      currency: booking.paymentCurrency || 'INR',
      status: 'completed',
      paymentMethod: 'razorpay',
      paymentProvider: 'razorpay',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      completedAt: new Date(),
      description: `Installation payment for ${booking.bookingNumber}`,
      metadata: { installationId: String(booking._id) },
    });

    booking.paymentStatus = 'PAID';
    booking.paymentProvider = 'razorpay';
    booking.paymentTransactionId = razorpay_payment_id;
    booking.paymentAmount = booking.total;
    booking.paidAt = new Date();
    booking.paymentRecordId = payment._id;
    booking.statusHistory.push({ status: booking.status, previousStatus: booking.status, changedBy: req.user._id, changedByRole: 'customer', changedByName: req.user.name, timestamp: new Date(), note: 'Installation payment confirmed' });
    await booking.save();

    emitInstallationStatusUpdate(String(booking._id), String(booking.userId), '', booking.status, { paymentStatus: booking.paymentStatus, paymentAmount: booking.paymentAmount });
    return res.json({ success: true, data: { installation: booking, payment }, message: 'Installation payment verified successfully' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || 'Installation payment verification failed.' });
  }
};

/**
 * GET /customer/installations
 * Get customer's installation bookings
 */
export const customerListInstallations = async (req, res) => {
  try {
    const userId = req.user._id;
    const bookings = await getCustomerInstallationBookings(userId);

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch installations',
    });
  }
};

/**
 * GET /customer/installations/:bookingId
 * Get customer's installation details
 */
export const customerGetInstallation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await getInstallationBooking(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Installation booking not found',
      });
    }

    if (String(booking.userId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'This booking does not belong to you',
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch installation',
    });
  }
};

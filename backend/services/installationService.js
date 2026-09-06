import Installation from '../models/Installation.js';
import User from '../models/User.js';
import {
  INSTALLATION_STATUSES,
  isValidStatusTransition,
  normalizeInstallationStatus,
  STATUS_LABELS,
  STATUS_DESCRIPTIONS,
} from '../constants/installationStatuses.js';
import {
  emitInstallationAssigned,
  emitInstallationCancelled,
  emitInstallationCompleted,
  emitInstallationFailed,
  emitInstallationLocationUpdate,
  emitInstallationStatusUpdate,
} from './realtimeService.js';

/**
 * Installation Service
 * Handles installation booking business logic
 */

/**
 * Validate coordinates
 */
const isValidCoordinate = (latitude, longitude) => {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return false;
  }
  const lat = Number(latitude);
  const lng = Number(longitude);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
};

const servicePriceMap = {
  cctv: 1499,
  ai: 2499,
  access: 1999,
  doorphone: 1299,
  alarm: 999,
  security: 4999,
};

const additionalServicePriceMap = {
  cable: 499,
  drilling: 349,
  wifi: 299,
  demo: 199,
};

export const calculateInstallationPricing = ({ serviceId, additionalServiceIds = [], order } = {}) => {
  const normalizedServiceId = String(serviceId || '').trim().toLowerCase();
  const installationPrice = servicePriceMap[normalizedServiceId] ?? 1499;

  const additionalTotal = Array.isArray(additionalServiceIds)
    ? additionalServiceIds.reduce((total, item) => {
        const key = String(item || '').trim().toLowerCase();
        return total + (additionalServicePriceMap[key] || 0);
      }, 0)
    : 0;

  const subtotal = installationPrice + additionalTotal;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  return {
    installationPrice,
    additionalTotal,
    subtotal,
    gst,
    total,
  };
};

/**
 * Generate booking number
 */
export const generateInstallationBookingNumber = () => {
  return `INS${Date.now().toString().slice(-8)}`;
};

/**
 * Create new installation booking
 */
export const createInstallationBooking = async (bookingData) => {
  const {
    userId,
    service,
    serviceId,
    orderId,
    orderNumber,
    customer = {},
    preferredDate,
    preferredSlot,
    notes = '',
    additionalServices = [],
  } = bookingData;

  if (!userId) {
    throw new Error('Customer ID is required');
  }

  const chosenServiceId = String(serviceId || service || '').trim();
  if (!service || !chosenServiceId) {
    throw new Error('Installation service is required');
  }

  if (!customer.name || !customer.phone || !customer.address || !customer.city || !customer.state || !customer.pinCode) {
    throw new Error('Complete customer and address details are required');
  }

  if (!preferredDate || !preferredSlot) {
    throw new Error('Preferred date and slot are required');
  }

  const hasCoordinates = isValidCoordinate(customer.latitude, customer.longitude);

  const computedPricing = calculateInstallationPricing({
    serviceId: chosenServiceId,
    additionalServiceIds: Array.isArray(additionalServices) ? additionalServices : [],
  });

  const booking = new Installation({
    id: `INSTALL-${Date.now().toString().slice(-6)}`,
    bookingNumber: generateInstallationBookingNumber(),
    userId,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.email,
    orderId: orderId ? String(orderId) : null,
    orderNumber: orderNumber ? String(orderNumber) : null,
    service,
    serviceId: chosenServiceId,
    additionalServices: Array.isArray(additionalServices) ? additionalServices : [],
    customer: {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      pinCode: customer.pinCode,
      country: customer.country || 'India',
      latitude: hasCoordinates ? Number(customer.latitude) : undefined,
      longitude: hasCoordinates ? Number(customer.longitude) : undefined,
      addressType: customer.addressType || 'Home',
      landmark: customer.landmark || '',
      installationInstructions: customer.installationInstructions || notes || '',
      locationResolved: hasCoordinates,
    },
    preferredDate,
    preferredSlot,
    installationPrice: computedPricing.installationPrice,
    additionalTotal: computedPricing.additionalTotal,
    subtotal: computedPricing.subtotal,
    gst: computedPricing.gst,
    total: computedPricing.total,
    adminNotes: '',
    customerNotes: notes,
    paymentStatus: 'PENDING',
    paymentAmount: computedPricing.total,
    status: INSTALLATION_STATUSES.BOOKED,
    statusHistory: [
      {
        status: INSTALLATION_STATUSES.BOOKED,
        changedBy: userId,
        changedByRole: 'customer',
        changedByName: customer.name,
        timestamp: new Date(),
        note: 'Installation booking created',
      },
    ],
  });

  await booking.save();
  return booking;
};

/**
 * Get booking by ID
 */
const safeResolveCustomerUser = async (installation) => {
  if (!installation || installation.userId) return installation;

  const payload = installation.customer || {};
  const email = String(payload.email || '').trim().toLowerCase();
  const phone = String(payload.phone || '').replace(/\D/g, '');

  const candidateFilters = [];
  if (email) candidateFilters.push({ email: email });
  if (phone) candidateFilters.push({ phone: phone });
  if (payload.name) candidateFilters.push({ name: new RegExp(`^${payload.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });

  if (!candidateFilters.length) return installation;

  const user = await User.findOne({ $or: candidateFilters }).select('_id name email phone role').lean();

  if (!user) {
    return installation;
  }

  installation.userId = user._id;
  await Installation.updateOne({ _id: installation._id }, { $set: { userId: user._id } });

  return installation;
};

export const getInstallationBooking = async (bookingId) => {
  const safeBookingId = String(bookingId ?? '').trim();
  const candidateFilters = [{ id: safeBookingId }, { bookingNumber: safeBookingId }];

  if (safeBookingId && /^[a-fA-F0-9]{24}$/.test(safeBookingId)) {
    candidateFilters.push({ _id: safeBookingId });
  }

  const booking = await Installation.findOne({
    $or: candidateFilters,
  })
    .populate('userId', 'name phone email')
    .populate('assignedAgentId', 'name phone role');

  if (!booking) return null;

  const normalizedBooking = booking.toObject ? booking.toObject() : booking;
  normalizedBooking.status = normalizeInstallationStatus(normalizedBooking.status);

  return safeResolveCustomerUser(normalizedBooking);
};

/**
 * Get all bookings for admin
 */
export const getAdminInstallationBookings = async (filters = {}) => {
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.agentId) {
    query.assignedAgentId = filters.agentId;
  }

  if (filters.customerId) {
    query.userId = filters.customerId;
  }

  if (filters.city) {
    query['customer.city'] = filters.city;
  }

  if (filters.state) {
    query['customer.state'] = filters.state;
  }

  if (filters.startDate && filters.endDate) {
    query.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate),
    };
  }

  if (filters.search) {
    query.$or = [
      { id: { $regex: filters.search, $options: 'i' } },
      { 'customer.name': { $regex: filters.search, $options: 'i' } },
      { 'customer.phone': { $regex: filters.search, $options: 'i' } },
      { 'customer.email': { $regex: filters.search, $options: 'i' } },
      { bookingNumber: { $regex: filters.search, $options: 'i' } },
    ];
  }

  const skip = (filters.page || 0) * (filters.pageSize || 10);
  const limit = filters.pageSize || 10;

  const rawBookings = await Installation.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const bookings = await Promise.all(
    rawBookings.map(async (booking) => {
      const repaired = await safeResolveCustomerUser(booking);
      return await Installation.findById(repaired._id)
        .populate('userId', 'name phone email')
        .populate('assignedAgentId', 'name phone role');
    })
  );

  const total = await Installation.countDocuments(query);

  return { bookings, total, page: filters.page || 0, pageSize: limit };
};

/**
 * Get bookings for customer
 */
export const getCustomerInstallationBookings = async (userId) => {
  const bookings = await Installation.find({ userId })
    .populate('assignedAgentId', 'name phone')
    .sort({ createdAt: -1 });

  return bookings;
};

/**
 * Get bookings assigned to agent
 */
export const getAgentInstallationBookings = async (agentId) => {
  const bookings = await Installation.find({
    assignedAgentId: agentId,
    status: {
      $nin: [INSTALLATION_STATUSES.CANCELLED, INSTALLATION_STATUSES.INSTALLATION_COMPLETED],
    },
  })
    .populate('userId', 'name phone email')
    .sort({ preferredDate: 1 });

  return bookings;
};

/**
 * Update installation status with validation
 */
export const updateInstallationStatus = async (bookingId, newStatus, updateData = {}) => {
  const booking = await getInstallationBooking(bookingId);

  if (!booking) {
    throw new Error('Installation booking not found');
  }

  const currentStatus = normalizeInstallationStatus(booking.status);
  const canonicalNewStatus = normalizeInstallationStatus(newStatus);

  if (!isValidStatusTransition(currentStatus, canonicalNewStatus)) {
    throw new Error(`Cannot transition from ${currentStatus} to ${canonicalNewStatus}`);
  }

  const previousStatus = currentStatus;
  booking.status = newStatus;

  booking.statusHistory.push({
    status: newStatus,
    previousStatus,
    changedBy: updateData.changedBy,
    changedByRole: updateData.changedByRole,
    changedByName: updateData.changedByName,
    timestamp: new Date(),
    note: updateData.note || STATUS_DESCRIPTIONS[newStatus],
  });

  if (newStatus === INSTALLATION_STATUSES.AGENT_ACCEPTED) {
    booking.agentAcceptanceDate = new Date();
  } else if (newStatus === INSTALLATION_STATUSES.INSTALLATION_COMPLETED) {
    booking.completedDate = new Date();
    if (updateData.completionDetails) {
      booking.completionDetails = {
        ...updateData.completionDetails,
        completedAt: new Date(),
      };
    }
  } else if (newStatus === INSTALLATION_STATUSES.FAILED) {
    booking.failureDetails = {
      failedAt: new Date(),
      failedBy: updateData.changedBy,
      failedByRole: updateData.changedByRole,
      reason: updateData.failureReason || 'Installation could not be completed',
      agentNotes: updateData.agentNotes || '',
      adminNotes: updateData.adminNotes || '',
      retryEligible: true,
    };
  } else if (newStatus === INSTALLATION_STATUSES.CANCELLED) {
    booking.cancellationDetails = {
      cancelledAt: new Date(),
      cancelledBy: updateData.changedBy,
      cancelledByRole: updateData.changedByRole,
      reason: updateData.cancellationReason || 'Booking cancelled',
      refundAmount: updateData.refundAmount ?? booking.total,
    };
  }

  booking.updatedAt = new Date();
  await booking.save();

  const customerId = booking.userId?._id ? String(booking.userId._id) : String(booking.userId || '');
  const assignedAgentId = booking.assignedAgentId?._id ? String(booking.assignedAgentId._id) : String(booking.assignedAgentId || '');

  emitInstallationStatusUpdate(String(booking._id), customerId, assignedAgentId, newStatus, {
    previousStatus,
    statusLabel: STATUS_LABELS[newStatus],
    note: updateData.note || STATUS_DESCRIPTIONS[newStatus],
  });

  if (newStatus === INSTALLATION_STATUSES.INSTALLATION_COMPLETED) {
    emitInstallationCompleted(String(booking._id), customerId, assignedAgentId, {
      agentNotes: updateData.agentNotes || updateData.note || '',
      workDuration: updateData.completionDetails?.workDuration,
      photosUrl: updateData.completionDetails?.photosUrl || [],
    });
  }

  if (newStatus === INSTALLATION_STATUSES.FAILED) {
    emitInstallationFailed(String(booking._id), customerId, assignedAgentId, updateData.failureReason || 'Installation could not be completed', updateData.agentNotes || updateData.note || '');
  }

  if (newStatus === INSTALLATION_STATUSES.CANCELLED) {
    emitInstallationCancelled(String(booking._id), customerId, updateData.cancellationReason || 'Booking cancelled');
  }

  return booking;
};

/**
 * Assign agent to installation booking
 */
export const assignInstallationAgent = async (bookingId, agentId, assignedBy = null) => {
  const booking = await getInstallationBooking(bookingId);

  if (!booking) {
    throw new Error('Installation booking not found');
  }

  const agent = await User.findById(agentId).select('name phone role');

  if (!agent) {
    throw new Error('Delivery agent not found');
  }

  if (agent.role !== 'delivery_agent') {
    throw new Error('User does not have delivery agent role');
  }

  const previousStatus = normalizeInstallationStatus(booking.status);
  if (![INSTALLATION_STATUSES.BOOKED, INSTALLATION_STATUSES.CONFIRMED, INSTALLATION_STATUSES.AGENT_DECLINED, INSTALLATION_STATUSES.FAILED].includes(previousStatus)) {
    throw new Error(`Cannot assign agent from status: ${previousStatus}`);
  }

  booking.status = normalizeInstallationStatus(booking.status);
  booking.assignedAgentId = agentId;
  booking.assignedAgentName = agent.name;
  booking.assignedAgentPhone = agent.phone;
  booking.assignmentDate = new Date();
  booking.status = INSTALLATION_STATUSES.ASSIGNED;

  booking.statusHistory.push({
    status: INSTALLATION_STATUSES.ASSIGNED,
    previousStatus,
    changedBy: assignedBy,
    changedByRole: 'admin',
    changedByName: 'Admin',
    timestamp: new Date(),
    note: `Agent ${agent.name} assigned`,
  });

  booking.updatedAt = new Date();
  await booking.save();

  const customerId = booking.userId?._id ? String(booking.userId._id) : String(booking.userId || '');
  emitInstallationAssigned(String(booking._id), customerId, String(agentId), agent.name);
  emitInstallationStatusUpdate(String(booking._id), customerId, String(agentId), INSTALLATION_STATUSES.ASSIGNED, {
    previousStatus,
    statusLabel: STATUS_LABELS[INSTALLATION_STATUSES.ASSIGNED],
    note: `Agent ${agent.name} assigned`,
  });

  return booking;
};

/**
 * Update installation location (agent tracking)
 */
export const updateInstallationLocation = async (bookingId, locationData) => {
  const { latitude, longitude, accuracy, heading, speed } = locationData;

  if (!isValidCoordinate(latitude, longitude)) {
    throw new Error('Invalid coordinates');
  }

  const booking = await getInstallationBooking(bookingId);

  if (!booking) {
    throw new Error('Installation booking not found');
  }

  booking.currentLocation = {
    latitude: Number(latitude),
    longitude: Number(longitude),
    accuracy: accuracy ? Number(accuracy) : undefined,
    heading: heading ? Number(heading) : undefined,
    speed: speed ? Number(speed) : undefined,
    timestamp: new Date(),
  };

  booking.updatedAt = new Date();
  await booking.save();

  const customerId = booking.userId?._id ? String(booking.userId._id) : String(booking.userId || '');
  const agentId = booking.assignedAgentId?._id ? String(booking.assignedAgentId._id) : String(booking.assignedAgentId || '');
  emitInstallationLocationUpdate(String(booking._id), customerId, agentId, {
    latitude: Number(latitude),
    longitude: Number(longitude),
    accuracy,
    heading,
    speed,
  });

  return booking;
};

/**
 * Add notes to booking
 */
export const addInstallationNotes = async (bookingId, notes, noteType = 'admin') => {
  const booking = await getInstallationBooking(bookingId);

  if (!booking) {
    throw new Error('Installation booking not found');
  }

  if (noteType === 'admin') {
    booking.adminNotes = notes;
  } else if (noteType === 'agent') {
    booking.agentNotes = notes;
  } else if (noteType === 'customer') {
    booking.customerNotes = notes;
  }

  booking.updatedAt = new Date();
  await booking.save();

  return booking;
};

/**
 * Get installation statistics
 */
export const getInstallationStatistics = async (filters = {}) => {
  const query = {};

  if (filters.startDate && filters.endDate) {
    query.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate),
    };
  }

  const statuses = Object.values(INSTALLATION_STATUSES);
  const stats = {};

  for (const status of statuses) {
    const count = await Installation.countDocuments({ ...query, status });
    stats[status] = count;
  }

  stats.total = await Installation.countDocuments(query);

  return stats;
};

export const getRecentInstallationBookings = async (limit = 10) => {
  const bookings = await Installation.find({})
    .populate('userId', 'name phone email')
    .populate('assignedAgentId', 'name phone email role')
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(Math.max(1, Number(limit) || 10));

  return bookings;
};

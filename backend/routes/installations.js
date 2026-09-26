import { Router } from 'express';
import { protect, requireAdmin, requireDeliveryAgent, requireCustomer } from '../middleware/authMiddleware.js';
import {
  adminListInstallations,
  adminGetInstallation,
  adminUpdateInstallationStatus,
  adminAssignAgent,
  adminAddNotes,
  adminGetInstallationStatistics,
  adminGetRecentInstallations,
  agentListInstallations,
  agentGetInstallation,
  agentAcceptInstallation,
  agentDeclineInstallation,
  agentUpdateInstallationStatus,
  agentUpdateLocation,
  agentAddNotes,
  customerListInstallations,
  customerGetInstallation,
  customerCreateInstallation,
  createInstallationPaymentOrder,
  verifyInstallationPayment,
  markInstallationPaymentFailed,
  markInstallationPaymentCancelled,
  markInstallationPaymentCollected,
} from '../controllers/installationController.js';

const router = Router();

// ==========================================
// ADMIN ROUTES
// ==========================================

// List all installations with filters, search, pagination
router.get('/admin/installations', protect, requireAdmin, adminListInstallations);

// Get installation statistics
router.get('/admin/installations/statistics', protect, requireAdmin, adminGetInstallationStatistics);
router.get('/admin/installations/stats', protect, requireAdmin, adminGetInstallationStatistics);
router.get('/admin/installations/recent', protect, requireAdmin, adminGetRecentInstallations);

// Get installation details
router.get('/admin/installations/:bookingId', protect, requireAdmin, adminGetInstallation);

// Update installation status
router.put('/admin/installations/:bookingId/status', protect, requireAdmin, adminUpdateInstallationStatus);

// Assign delivery agent to installation
router.put('/admin/installations/:bookingId/assign-agent', protect, requireAdmin, adminAssignAgent);

// Add admin notes
router.put('/admin/installations/:bookingId/notes', protect, requireAdmin, adminAddNotes);

// ==========================================
// DELIVERY AGENT ROUTES
// ==========================================

// List installations assigned to agent
router.get('/agent/installations', protect, requireDeliveryAgent, agentListInstallations);

// Get single installation details
router.get('/agent/installations/:bookingId', protect, requireDeliveryAgent, agentGetInstallation);

// Accept installation booking
router.put('/agent/installations/:bookingId/accept', protect, requireDeliveryAgent, agentAcceptInstallation);

// Decline installation booking
router.put('/agent/installations/:bookingId/decline', protect, requireDeliveryAgent, agentDeclineInstallation);

// Update installation status (on the way, arrived, completed, etc.)
router.put('/agent/installations/:bookingId/update-status', protect, requireDeliveryAgent, agentUpdateInstallationStatus);

// Update agent location
router.put('/agent/installations/:bookingId/location', protect, requireDeliveryAgent, agentUpdateLocation);

// Add agent notes
router.put('/agent/installations/:bookingId/notes', protect, requireDeliveryAgent, agentAddNotes);
router.put('/agent/installations/:bookingId/payment/collect', protect, requireDeliveryAgent, markInstallationPaymentCollected);

// ==========================================
// CUSTOMER ROUTES
// ==========================================

// Create a customer installation booking
router.post('/installations', protect, requireCustomer, customerCreateInstallation);
router.post('/installations/:bookingId/payment/create-order', protect, requireCustomer, createInstallationPaymentOrder);
router.post('/installations/:bookingId/payment/verify', protect, requireCustomer, verifyInstallationPayment);
router.post('/installations/:bookingId/payment/failed', protect, requireCustomer, markInstallationPaymentFailed);
router.post('/installations/:bookingId/payment/cancelled', protect, requireCustomer, markInstallationPaymentCancelled);
router.put('/admin/installations/:bookingId/payment/collect', protect, requireAdmin, markInstallationPaymentCollected);

// List customer's installations
router.get('/customer/installations', protect, requireCustomer, customerListInstallations);

// Get customer's installation details
router.get('/customer/installations/:bookingId', protect, requireCustomer, customerGetInstallation);

// Alternative customer endpoint (alias for compatibility)
router.get('/installations', protect, customerListInstallations);

export default router;

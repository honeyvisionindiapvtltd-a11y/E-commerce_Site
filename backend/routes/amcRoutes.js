import express from 'express';
import { protect, requireAdmin, requireCustomer, requireDeliveryAgent } from '../middleware/authMiddleware.js';
import {
  listPublicPlans, createPaymentOrder, verifyPayment, listMyContracts, getMyContract,
  adminListPlans, adminCreatePlan, adminUpdatePlan, adminListContracts,
  createMyServiceRequest, listMyServiceRequests, getMyServiceRequest,
  adminListServiceRequests, agentListServiceRequests, adminAssignServiceRequest, updateServiceRequestStatus,
} from '../controllers/amcController.js';

const router = express.Router();
router.get('/plans', listPublicPlans);
router.post('/payment/create', protect, requireCustomer, createPaymentOrder);
router.post('/payment/verify', protect, requireCustomer, verifyPayment);
router.get('/my-contracts', protect, requireCustomer, listMyContracts);
router.get('/my-contracts/:id', protect, requireCustomer, getMyContract);
router.post('/my-contracts/:id/service-requests', protect, requireCustomer, createMyServiceRequest);
router.get('/my-service-requests', protect, requireCustomer, listMyServiceRequests);
router.get('/my-service-requests/:id', protect, requireCustomer, getMyServiceRequest);
router.get('/admin/plans', protect, requireAdmin, adminListPlans);
router.post('/admin/plans', protect, requireAdmin, adminCreatePlan);
router.put('/admin/plans/:id', protect, requireAdmin, adminUpdatePlan);
router.get('/admin/contracts', protect, requireAdmin, adminListContracts);
router.get('/admin/service-requests', protect, requireAdmin, adminListServiceRequests);
router.put('/admin/service-requests/:id/assign-agent', protect, requireAdmin, adminAssignServiceRequest);
router.put('/admin/service-requests/:id/status', protect, requireAdmin, updateServiceRequestStatus);
router.get('/agent/service-requests', protect, requireDeliveryAgent, agentListServiceRequests);
router.put('/agent/service-requests/:id/status', protect, requireDeliveryAgent, updateServiceRequestStatus);
export default router;

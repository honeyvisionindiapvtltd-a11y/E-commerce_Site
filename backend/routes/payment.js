import express from 'express';
import { createCheckoutSession } from '../controllers/paymentController.js';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getOrderDetails,
  downloadOrderInvoice,
  markRazorpayPaymentFailed,
  markRazorpayPaymentCancelled,
} from '../controllers/paymentController.js';
import { protect, requireCustomer } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, requireCustomer);
router.post('/create-checkout-session', createCheckoutSession);
router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);
router.post('/razorpay/failed', markRazorpayPaymentFailed);
router.post('/razorpay/cancelled', markRazorpayPaymentCancelled);
router.get('/order/:orderId', getOrderDetails);
router.get('/order/:orderId/invoice', downloadOrderInvoice);

export default router;

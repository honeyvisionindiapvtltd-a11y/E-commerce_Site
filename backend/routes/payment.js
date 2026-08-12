import express from 'express';
import { createCheckoutSession } from '../controllers/paymentController.js';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getOrderDetails,
  downloadOrderInvoice,
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-checkout-session', createCheckoutSession);
router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);
router.get('/order/:orderId', getOrderDetails);
router.get('/order/:orderId/invoice', downloadOrderInvoice);

export default router;

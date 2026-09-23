import Razorpay from 'razorpay';
import AMCPlan from '../models/AMCPlan.js';
import AMCContract from '../models/AMCContract.js';
import AMCServiceRequest from '../models/AMCServiceRequest.js';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { verifyRazorpaySignature } from './paymentController.js';
import { notifyAdmins, notifyCustomer } from '../services/notificationService.js';
import { createServiceRequest, transitionServiceRequest, assignServiceRequest, publicRequest } from '../services/amcServiceRequestService.js';

const razorInstance = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET }) : null;

const contractQuery = (value) => ({ $or: [{ contractNumber: String(value) }, ...(/^[a-f\d]{24}$/i.test(String(value)) ? [{ _id: value }] : [])] });
const nextContractNumber = async () => {
  const count = await AMCContract.countDocuments();
  return `HV-AMC-${String(count + 1).padStart(6, '0')}`;
};
const dateRange = (months) => {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + Number(months));
  endDate.setDate(endDate.getDate() - 1);
  return { startDate, endDate };
};
const populateContract = (query) => query.populate('plan', 'name description durationMonths price serviceVisits coveredServices exclusions responseTime supportHours features termsAndConditions').populate('order', 'orderNumber').populate('product', 'name sku thumbnail');
const planFields = ['name', 'slug', 'description', 'durationMonths', 'price', 'currency', 'serviceVisits', 'responseTime', 'supportHours', 'coveredServices', 'exclusions', 'eligibleCategories', 'eligibleProductTypes', 'features', 'termsAndConditions', 'isFeatured', 'isActive', 'displayOrder'];
const normalizePlanInput = (body = {}) => {
  const input = Object.fromEntries(planFields.filter((field) => Object.prototype.hasOwnProperty.call(body, field)).map((field) => [field, body[field]]));
  if (input.name !== undefined) input.name = String(input.name).trim();
  if (input.slug !== undefined) input.slug = String(input.slug).trim().toLowerCase();
  for (const field of ['price', 'durationMonths', 'serviceVisits', 'displayOrder']) if (input[field] !== undefined) input[field] = Number(input[field]);
  if (!input.name || (input.price !== undefined && (!Number.isFinite(input.price) || input.price < 0)) || (input.durationMonths !== undefined && (!Number.isInteger(input.durationMonths) || input.durationMonths < 1)) || (input.serviceVisits !== undefined && (!Number.isInteger(input.serviceVisits) || input.serviceVisits < 0)) || (input.isActive !== undefined && typeof input.isActive !== 'boolean') || (input.isFeatured !== undefined && typeof input.isFeatured !== 'boolean')) throw new Error('Invalid AMC plan values.');
  return input;
};

export const listPublicPlans = async (req, res) => {
  const plans = await AMCPlan.find({ isActive: true }).sort({ isFeatured: -1, displayOrder: 1, price: 1 }).lean();
  res.json({ success: true, plans });
};

export const createPaymentOrder = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_ENABLED || !razorInstance) return res.status(503).json({ success: false, message: 'Razorpay is not enabled on this server.' });
    const { planId, orderId, productId, clientRequestId } = req.body || {};
    const plan = await AMCPlan.findOne({ _id: planId, isActive: true }).lean();
    if (!plan) return res.status(404).json({ success: false, message: 'AMC plan is not available.' });
    const order = await Order.findOne({ $or: [{ orderNumber: String(orderId || '') }, { _id: orderId }], user: req.user._id, paymentStatus: 'PAID' }).lean();
    if (!order) return res.status(400).json({ success: false, message: 'A paid customer order is required for AMC.' });
    const item = order.items.find((entry) => String(entry.product) === String(productId));
    if (!item) return res.status(400).json({ success: false, message: 'Selected product is not part of your order.' });
    const product = await Product.findOne({ _id: productId, installationAvailable: true }).select('name sku thumbnail productType category').populate('category', 'slug name').lean();
    if (!product) return res.status(400).json({ success: false, message: 'This product is not eligible for AMC.' });
    if (plan.eligibleProductTypes?.length && !plan.eligibleProductTypes.includes(product.productType)) return res.status(400).json({ success: false, message: 'This product type is not eligible for the selected AMC plan.' });
    if (plan.eligibleCategories?.length && !plan.eligibleCategories.includes(String(product.category?.slug || product.category?.name || ''))) return res.status(400).json({ success: false, message: 'This product category is not eligible for the selected AMC plan.' });
    const existing = await AMCContract.findOne({ customer: req.user._id, order: order._id, product: product._id, status: { $in: ['PENDING', 'ACTIVE'] } });
    if (existing) return res.status(409).json({ success: false, message: 'This product already has an active AMC contract.' });
    const razorpayOrder = await razorInstance.orders.create({ amount: Math.round(Number(plan.price) * 100), currency: plan.currency, receipt: `AMC-${clientRequestId || Date.now()}`, payment_capture: 1, notes: { planId: String(plan._id), orderId: String(order._id), productId: String(product._id), userId: String(req.user._id) } });
    res.json({ success: true, data: { razorpayOrder, keyId: process.env.RAZORPAY_KEY_ID, plan, product, orderNumber: order.orderNumber } });
  } catch (error) { res.status(400).json({ success: false, message: 'Unable to start AMC payment.' }); }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, orderId, productId } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ success: false, message: 'Missing payment verification fields.' });
    const plan = await AMCPlan.findOne({ _id: planId, isActive: true }).lean();
    const order = await Order.findOne({ $or: [{ orderNumber: String(orderId || '') }, { _id: orderId }], user: req.user._id, paymentStatus: 'PAID' }).lean();
    const product = await Product.findOne({ _id: productId, installationAvailable: true }).select('name sku thumbnail productType category').populate('category', 'slug name').lean();
    if (!plan || !order || !product || !order.items.some((entry) => String(entry.product) === String(product._id))) return res.status(400).json({ success: false, message: 'AMC eligibility could not be verified.' });
    if (plan.eligibleProductTypes?.length && !plan.eligibleProductTypes.includes(product.productType)) return res.status(400).json({ success: false, message: 'Product type is not eligible for this AMC plan.' });
    if (plan.eligibleCategories?.length && !plan.eligibleCategories.includes(String(product.category?.slug || product.category?.name || ''))) return res.status(400).json({ success: false, message: 'Product category is not eligible for this AMC plan.' });
    if (!verifyRazorpaySignature(process.env.RAZORPAY_KEY_SECRET, razorpay_order_id, razorpay_payment_id, razorpay_signature)) return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    if (razorInstance) {
      const payment = await razorInstance.payments.fetch(razorpay_payment_id);
      if (String(payment.order_id) !== String(razorpay_order_id) || Number(payment.amount) !== Math.round(plan.price * 100) || String(payment.currency).toUpperCase() !== 'INR' || String(payment.status).toLowerCase() !== 'captured') return res.status(400).json({ success: false, message: 'Payment does not match the AMC plan.' });
    }
    const existingPayment = await Payment.findOne({ paymentId: `amc:${razorpay_payment_id}` });
    if (existingPayment) {
      const existingContract = await AMCContract.findOne({ paymentId: razorpay_payment_id });
      return res.json({ success: true, data: { contract: existingContract, payment: existingPayment }, message: 'AMC payment already verified.' });
    }
    const { startDate, endDate } = dateRange(plan.durationMonths);
    const contract = await AMCContract.create({ contractNumber: await nextContractNumber(), customer: req.user._id, plan: plan._id, order: order._id, product: product._id, productSnapshot: { name: product.name, sku: product.sku, image: product.thumbnail }, planSnapshot: { name: plan.name, description: plan.description, durationMonths: plan.durationMonths, price: plan.price, serviceVisits: plan.serviceVisits, coveredServices: plan.coveredServices, exclusions: plan.exclusions, responseTime: plan.responseTime, supportHours: plan.supportHours, features: plan.features, termsAndConditions: plan.termsAndConditions }, amount: plan.price, currency: plan.currency, paymentStatus: 'PAID', paymentMethod: 'RAZORPAY', paymentId: razorpay_payment_id, paymentOrderId: razorpay_order_id, startDate, endDate, status: 'ACTIVE', serviceVisitsRemaining: plan.serviceVisits });
    const payment = await Payment.create({ paymentId: `amc:${razorpay_payment_id}`, orderId: contract.contractNumber, userId: String(req.user._id), amount: plan.price, currency: 'INR', status: 'completed', paymentMethod: 'razorpay', paymentProvider: 'razorpay', razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, completedAt: new Date(), metadata: { resourceType: 'AMCContract', resourceId: String(contract._id) } });
    void notifyCustomer({ recipient: req.user._id, type: 'AMC_PURCHASED', category: 'INSTALLATION', title: 'AMC activated', message: `AMC ${contract.contractNumber} is now active.`, relatedId: contract._id, relatedType: 'AMCContract', eventKey: `amc:${contract._id}:activated`, actionUrl: `/my-amc/${encodeURIComponent(contract.contractNumber)}` });
    void notifyAdmins({ type: 'AMC_PURCHASED', category: 'INSTALLATION', title: 'AMC purchased', message: `AMC ${contract.contractNumber} was purchased.`, relatedId: contract._id, relatedType: 'AMCContract', eventKey: `amc:${contract._id}:purchased` });
    res.json({ success: true, data: { contract, payment } });
  } catch (error) { res.status(400).json({ success: false, message: 'AMC payment verification failed.' }); }
};

export const listMyContracts = async (req, res) => { const contracts = await populateContract(AMCContract.find({ customer: req.user._id }).sort({ createdAt: -1 })).lean(); res.json({ success: true, contracts }); };
export const getMyContract = async (req, res) => { const contract = await populateContract(AMCContract.findOne({ ...contractQuery(req.params.id), customer: req.user._id })).lean(); if (!contract) return res.status(404).json({ success: false, message: 'AMC contract not found.' }); res.json({ success: true, contract }); };
export const adminListPlans = async (req, res) => res.json({ success: true, plans: await AMCPlan.find().sort({ displayOrder: 1, createdAt: -1 }).lean() });
export const adminCreatePlan = async (req, res) => { try { const plan = await AMCPlan.create({ ...normalizePlanInput(req.body), createdBy: req.user._id, updatedBy: req.user._id }); res.status(201).json({ success: true, plan }); } catch (error) { res.status(400).json({ success: false, message: error.code === 11000 ? 'Plan slug already exists.' : error.message }); } };
export const adminUpdatePlan = async (req, res) => { try { const plan = await AMCPlan.findByIdAndUpdate(req.params.id, { ...normalizePlanInput(req.body), updatedBy: req.user._id }, { new: true, runValidators: true }); if (!plan) return res.status(404).json({ success: false, message: 'AMC plan not found.' }); res.json({ success: true, plan }); } catch (error) { res.status(400).json({ success: false, message: error.code === 11000 ? 'Plan slug already exists.' : error.message }); } };
export const adminListContracts = async (req, res) => res.json({ success: true, contracts: await populateContract(AMCContract.find().sort({ createdAt: -1 })).lean() });

export const createMyServiceRequest = async (req, res) => {
  try { const request = await createServiceRequest({ userId: req.user._id, ...req.body, clientRequestId: String(req.body?.clientRequestId || '').trim().slice(0, 120) }); res.status(201).json({ success: true, request }); }
  catch (error) { res.status(400).json({ success: false, message: error.message || 'Unable to create AMC service request.' }); }
};
export const listMyServiceRequests = async (req, res) => res.json({ success: true, requests: await publicRequest(AMCServiceRequest.find({ customer: req.user._id }).sort({ createdAt: -1 })).lean() });
export const getMyServiceRequest = async (req, res) => { const request = await publicRequest(AMCServiceRequest.findOne({ $or: [{ requestNumber: String(req.params.id) }, { _id: req.params.id }], customer: req.user._id })).lean(); if (!request) return res.status(404).json({ success: false, message: 'AMC service request not found.' }); res.json({ success: true, request }); };
export const adminListServiceRequests = async (req, res) => res.json({ success: true, requests: await publicRequest(AMCServiceRequest.find().sort({ createdAt: -1 })).lean() });
export const agentListServiceRequests = async (req, res) => res.json({ success: true, requests: await publicRequest(AMCServiceRequest.find({ assignedAgent: req.user._id }).sort({ createdAt: -1 })).lean() });
export const adminAssignServiceRequest = async (req, res) => { try { const request = await assignServiceRequest(req.params.id, req.body.agentId, req.user); res.json({ success: true, request }); } catch (error) { res.status(400).json({ success: false, message: error.message }); } };
export const updateServiceRequestStatus = async (req, res) => { try { const request = await transitionServiceRequest(req.params.id, req.body.status, req.user, req.body); res.json({ success: true, request }); } catch (error) { res.status(400).json({ success: false, message: error.message }); } };

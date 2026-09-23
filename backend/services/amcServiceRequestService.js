import AMCContract from '../models/AMCContract.js';
import AMCServiceRequest from '../models/AMCServiceRequest.js';
import User from '../models/User.js';
import { notifyAdmins, notifyCustomer, notifyDeliveryAgent } from './notificationService.js';

const validTransitions = {
  REQUESTED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['AGENT_ACCEPTED', 'CANCELLED'],
  AGENT_ACCEPTED: ['TRAVELLING', 'CANCELLED'],
  TRAVELLING: ['ARRIVED', 'FAILED'],
  ARRIVED: ['IN_PROGRESS', 'FAILED'],
  IN_PROGRESS: ['COMPLETED', 'FAILED'],
  SCHEDULED: ['ASSIGNED', 'CANCELLED'],
  COMPLETED: [], CANCELLED: [], FAILED: ['ASSIGNED'],
};

const nextRequestNumber = async () => `HV-AMC-SR-${String((await AMCServiceRequest.countDocuments()) + 1).padStart(6, '0')}`;
const ownedContract = (id, customer) => AMCContract.findOne({ $or: [{ contractNumber: String(id) }, { _id: id }], customer });
const publicRequest = (query) => query.populate('contract', 'contractNumber planSnapshot status serviceVisitsRemaining').populate('product', 'name sku thumbnail').populate('order', 'orderNumber').populate('assignedAgent', 'name phone');

export const createServiceRequest = async ({ userId, contractId, serviceType, description, preferredDate, preferredTime, address, clientRequestId }) => {
  if (clientRequestId) {
    const existing = await AMCServiceRequest.findOne({ customer: userId, clientRequestId }).lean();
    if (existing) return existing;
  }
  const contract = await ownedContract(contractId, userId);
  if (!contract) throw new Error('AMC contract not found.');
  if (contract.status !== 'ACTIVE' || new Date(contract.endDate) < new Date()) throw new Error('AMC contract is not active.');
  if (contract.serviceVisitsRemaining < 1) throw new Error('No AMC service visits remain.');
  const request = await AMCServiceRequest.create({ requestNumber: await nextRequestNumber(), clientRequestId: clientRequestId || '', customer: userId, contract: contract._id, product: contract.product, order: contract.order, serviceType, description, preferredDate, preferredTime, address, status: 'REQUESTED', statusHistory: [{ status: 'REQUESTED', changedBy: userId, changedByRole: 'customer', note: 'AMC service requested' }] });
  void notifyCustomer({ recipient: userId, type: 'AMC_SERVICE_REQUESTED', category: 'INSTALLATION', title: 'AMC service requested', message: `Request ${request.requestNumber} was submitted.`, relatedId: request._id, relatedType: 'AMCServiceRequest', eventKey: `amc-request:${request._id}:requested` });
  void notifyAdmins({ type: 'AMC_SERVICE_REQUESTED', category: 'INSTALLATION', title: 'New AMC service request', message: `Request ${request.requestNumber} needs attention.`, relatedId: request._id, relatedType: 'AMCServiceRequest', eventKey: `amc-request:${request._id}:admin` });
  return request;
};

export const transitionServiceRequest = async (requestId, nextStatus, actor, data = {}) => {
  const request = await AMCServiceRequest.findOne({ $or: [{ requestNumber: String(requestId) }, { _id: requestId }] });
  if (!request) throw new Error('AMC service request not found.');
  if (actor.role === 'delivery_agent' && String(request.assignedAgent) !== String(actor._id)) throw new Error('This request is not assigned to you.');
  if (!validTransitions[request.status]?.includes(nextStatus)) throw new Error(`Cannot transition from ${request.status} to ${nextStatus}.`);
  if (nextStatus === 'COMPLETED' && !String(data.resolution || '').trim()) throw new Error('Resolution is required to complete service.');
  if (nextStatus === 'COMPLETED') {
    const contract = await AMCContract.findOneAndUpdate({ _id: request.contract, customer: request.customer, status: 'ACTIVE', serviceVisitsRemaining: { $gt: 0 } }, { $inc: { serviceVisitsUsed: 1, serviceVisitsRemaining: -1 } }, { new: true });
    if (!contract) throw new Error('AMC is no longer active or has no visits remaining.');
    request.visitConsumedAt = new Date(); request.completedAt = new Date(); request.resolution = data.resolution.trim();
  }
  const previous = request.status; request.status = nextStatus;
  request.statusHistory.push({ status: nextStatus, previousStatus: previous, changedBy: actor._id, changedByRole: actor.role, note: data.note || data.resolution || '' });
  await request.save();
  if (request.customer) void notifyCustomer({ recipient: request.customer, type: `AMC_SERVICE_${nextStatus}`, category: 'INSTALLATION', title: `AMC service ${nextStatus.toLowerCase()}`, message: `Request ${request.requestNumber} is now ${nextStatus.toLowerCase()}.`, relatedId: request._id, relatedType: 'AMCServiceRequest', eventKey: `amc-request:${request._id}:status:${nextStatus}` });
  return request;
};

export const assignServiceRequest = async (requestId, agentId, admin) => {
  const agent = await User.findOne({ _id: agentId, role: 'delivery_agent', status: { $in: ['Active', 'active'] } }).select('name phone');
  if (!agent) throw new Error('Active delivery agent not found.');
  const request = await AMCServiceRequest.findOneAndUpdate({ $or: [{ requestNumber: String(requestId) }, { _id: requestId }], status: { $in: ['REQUESTED', 'SCHEDULED', 'FAILED'] } }, { $set: { assignedAgent: agent._id, assignedAt: new Date(), status: 'ASSIGNED' }, $push: { statusHistory: { status: 'ASSIGNED', previousStatus: 'REQUESTED', changedBy: admin._id, changedByRole: 'admin', note: `Assigned to ${agent.name}` } } }, { new: true });
  if (!request) throw new Error('Request is not available for assignment.');
  void notifyDeliveryAgent({ recipient: agent._id, type: 'AMC_SERVICE_ASSIGNED', category: 'INSTALLATION', title: 'AMC service assigned', message: `Request ${request.requestNumber} was assigned to you.`, relatedId: request._id, relatedType: 'AMCServiceRequest', eventKey: `amc-request:${request._id}:assigned:${agent._id}` });
  return request;
};

export { publicRequest, ownedContract };

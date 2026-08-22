import express from "express";
import {
  createDeliveryAgent,
  getManagedDeliveryAgent,
  getMyDelivery,
  listDeliveryAgents,
  listManagedDeliveryAgents,
  listMyDeliveries,
  markDelivered,
  failDelivery,
  startDelivery,
  updateDeliveryLocation,
  updateDeliveryAgent,
  updateDeliveryAgentStatus,
  unassignDeliveryAgent,
} from "../controllers/deliveryController.js";
import { protect, requireAdmin, requireDeliveryAgent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/agents", protect, requireAdmin, listDeliveryAgents);
router.get("/management/agents", protect, requireAdmin, listManagedDeliveryAgents);
router.post("/management/agents", protect, requireAdmin, createDeliveryAgent);
router.get("/management/agents/:agentId", protect, requireAdmin, getManagedDeliveryAgent);
router.put("/management/agents/:agentId", protect, requireAdmin, updateDeliveryAgent);
router.patch("/management/agents/:agentId/status", protect, requireAdmin, updateDeliveryAgentStatus);
router.delete("/orders/:orderNumber/agent", protect, requireAdmin, unassignDeliveryAgent);
router.get("/orders", protect, requireDeliveryAgent, listMyDeliveries);
router.get("/orders/:orderNumber", protect, requireDeliveryAgent, getMyDelivery);
router.post("/orders/:orderNumber/start", protect, requireDeliveryAgent, startDelivery);
router.post("/orders/:orderNumber/location", protect, requireDeliveryAgent, updateDeliveryLocation);
router.post("/orders/:orderNumber/deliver", protect, requireDeliveryAgent, markDelivered);
router.post("/orders/:orderNumber/fail", protect, requireDeliveryAgent, failDelivery);

export default router;
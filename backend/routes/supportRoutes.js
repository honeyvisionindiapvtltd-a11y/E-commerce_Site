import express from "express";
import { protect, requireAdmin, requireCustomer } from "../middleware/authMiddleware.js";
import {
  addCustomerMessage,
  createTicket,
  getMyTicket,
  getMyTickets,
  listTickets,
  updateTicket,
} from "../controllers/supportTicketController.js";

const router = express.Router();
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.post("/", protect, requireCustomer, asyncHandler(createTicket));
router.get("/my", protect, requireCustomer, asyncHandler(getMyTickets));
router.get("/my/:ticketNumber", protect, requireCustomer, asyncHandler(getMyTicket));
router.post("/my/:ticketNumber/messages", protect, requireCustomer, asyncHandler(addCustomerMessage));
router.get("/admin", protect, requireAdmin, asyncHandler(listTickets));
router.patch("/admin/:id", protect, requireAdmin, asyncHandler(updateTicket));

export default router;

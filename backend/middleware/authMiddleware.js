import jwt from "jsonwebtoken";
import "dotenv/config";
import User from "../models/User.js";
import { getJwtSecret } from "../config/env.js";

const jwtSecret = getJwtSecret();

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Missing token.",
      });
    }

    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.userId).exec();

    if (!user || (user.status && user.status !== "Active")) {
      throw new Error("User not found");
    }

    if (payload.role && payload.role !== user.role) throw new Error("Role changed; please sign in again");
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Invalid token.",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN AUTHORIZATION MIDDLEWARE
// ==========================================

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Forbidden. Admin access required.",
    });
  }

  next();
};

export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "You are not authenticated" });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "You are not authorized to access this resource" });
  }
  return next();
};

export const requireCustomer = authorizeRoles("customer");

export const requireCustomerOrGuest = (req, res, next) => {
  if (req.user && req.user.role !== "customer") {
    return res.status(403).json({ success: false, message: "You are not authorized to access this resource" });
  }
  return next();
};

// ==========================================
// DELIVERY AGENT AUTHORIZATION MIDDLEWARE
// ==========================================

export const requireDeliveryAgent = (req, res, next) => {
  if (!req.user || req.user.role !== "delivery_agent") {
    return res.status(403).json({
      success: false,
      message: "Forbidden. Delivery agent access required.",
    });
  }

  next();
};

export const requireDeliveryAgentOrAdmin = (req, res, next) => {
  if (!req.user || !["delivery_agent", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden. Delivery agent or admin access required.",
    });
  }

  next();
};

export const requireOwnershipOrAdmin = (resourceUserId, req, res) => {
  if (!req.user) {
    return false;
  }

  const isOwner = resourceUserId && String(resourceUserId) === String(req.user._id);
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    res.status(403).json({
      success: false,
      message: "Access denied",
    });
    return false;
  }

  return true;
};

// ==========================================
// OPTIONAL AUTH - For public endpoints that can be personalized
// ==========================================

export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  try {
    if (token) {
      const payload = jwt.verify(token, jwtSecret);
      const user = await User.findById(payload.userId).exec();
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    if (token) return res.status(401).json({ success: false, message: "Unauthorized. Invalid token." });
    return next();
  }
};

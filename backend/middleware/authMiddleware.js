import jwt from "jsonwebtoken";
import User from "../models/User.js";

const jwtSecret = process.env.JWT_SECRET || "honeyvision_secret_key_2024";

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

    if (!user) {
      throw new Error("User not found");
    }

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

// ==========================================
// DELIVERY AGENT AUTHORIZATION MIDDLEWARE
// ==========================================

export const requireDeliveryAgent = (req, res, next) => {
  if (!req.user || (req.user.role !== "delivery_agent" && req.user.role !== "admin")) {
    return res.status(403).json({
      success: false,
      message: "Forbidden. Delivery agent access required.",
    });
  }

  next();
};

// ==========================================
// OPTIONAL AUTH - For public endpoints that can be personalized
// ==========================================

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (token) {
      const payload = jwt.verify(token, jwtSecret);
      const user = await User.findById(payload.userId).exec();
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // If auth fails, continue without user
    next();
  }
};

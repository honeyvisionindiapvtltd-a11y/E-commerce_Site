import express from "express";
import { checkServiceability } from "../controllers/deliveryServiceabilityController.js";

const router = express.Router();

router.post("/check-serviceability", checkServiceability);

export default router;

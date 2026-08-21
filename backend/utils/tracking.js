import crypto from "crypto";

export const generateOrderNumber = () => {
  const timestamp = Date.now()
    .toString()
    .slice(-8);

  const random = crypto
    .randomBytes(2)
    .toString("hex")
    .toUpperCase();

  return `HV-${timestamp}-${random}`;
};

export const generateTrackingNumber = () => {
  const timestamp = Date.now()
    .toString()
    .slice(-10);

  const random = crypto
    .randomBytes(2)
    .toString("hex")
    .toUpperCase();

  return `HVTRK${timestamp}${random}`;
};
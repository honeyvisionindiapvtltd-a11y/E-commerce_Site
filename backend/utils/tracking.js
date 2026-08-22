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

export const generateHoneyVisionTrackingNumber = () => {
  const date = new Date();
  const datePart = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((value) => String(value).padStart(2, "0"))
    .join("");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const suffix = Array.from({ length: 6 }, () => alphabet[crypto.randomInt(alphabet.length)]).join("");
  return `HV-TRK-${datePart}-${suffix}`;
};

export const generateUniqueHoneyVisionTrackingNumber = async (exists) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateHoneyVisionTrackingNumber();
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error("Unable to generate a unique HoneyVision tracking number");
};
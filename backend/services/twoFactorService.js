const SMS_TIMEOUT_MS = Math.max(1000, Number(process.env.SMS_TIMEOUT_MS) || 10000);
const TWO_FACTOR_BASE_URL = "https://2factor.in/API/V1";
const DEFAULT_TEMPLATE_NAME = "HoneyVision OTP";

const createSmsError = (message, cause = null) => {
  const error = new Error(message);
  error.isSmsError = true;
  if (cause?.code) error.providerCode = String(cause.code);
  if (cause?.status) error.providerStatus = String(cause.status);
  return error;
};

const maskPhone = (phone) => `***${String(phone).slice(-4)}`;

export const normalizePhone = (phone) => {
  const raw = String(phone || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (/^\+91\d{10}$/.test(raw)) return raw;
  if (/^91\d{10}$/.test(digits)) return `+${digits}`;
  if (/^\d{10}$/.test(digits)) return `+91${digits}`;
  return null;
};

export const sendOTP = async ({ phone, otp, templateName } = {}) => {
  const apiKey = String(process.env.TWO_FACTOR_API_KEY || "").trim();
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) throw createSmsError("Customer phone must be a valid Indian number");
  if (!/^\d{6}$/.test(String(otp || ""))) throw createSmsError("OTP must be a 6-digit value");
  if (!apiKey) throw createSmsError("2Factor API key is not configured");

  const template = String(templateName || process.env.TWO_FACTOR_TEMPLATE_NAME || DEFAULT_TEMPLATE_NAME).trim();
  const path = [
    TWO_FACTOR_BASE_URL,
    encodeURIComponent(apiKey),
    "SMS",
    normalizedPhone.slice(1),
    String(otp),
    encodeURIComponent(template),
  ].join("/");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SMS_TIMEOUT_MS);

  try {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[OTP] Sending 2Factor OTP", {
        phone: maskPhone(normalizedPhone),
        template,
      });
    }
    const response = await fetch(path, { signal: controller.signal });
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.Status !== "Success") {
      throw createSmsError("2Factor rejected the OTP request", {
        code: body?.Details || `HTTP_${response.status}`,
        status: response.status,
      });
    }
    return { sent: true, providerSessionId: body.Details || null };
  } catch (error) {
    if (error.isSmsError) throw error;
    throw createSmsError(error.name === "AbortError" ? "2Factor OTP request timed out" : "2Factor OTP request failed");
  } finally {
    clearTimeout(timeoutId);
  }
};

export const verifyOTP = async ({ sessionId, otp } = {}) => {
  const apiKey = String(process.env.TWO_FACTOR_API_KEY || "").trim();
  if (!apiKey || !sessionId || !/^\d{6}$/.test(String(otp || ""))) {
    throw createSmsError("Invalid OTP verification request");
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SMS_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${TWO_FACTOR_BASE_URL}/${encodeURIComponent(apiKey)}/SMS/VERIFY/${encodeURIComponent(sessionId)}/${String(otp)}`,
      { signal: controller.signal },
    );
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.Status !== "Success") {
      throw createSmsError("2Factor OTP verification failed", {
        code: body?.Details || `HTTP_${response.status}`,
        status: response.status,
      });
    }
    return { verified: true };
  } catch (error) {
    if (error.isSmsError) throw error;
    throw createSmsError(error.name === "AbortError" ? "2Factor OTP verification timed out" : "2Factor OTP verification failed");
  } finally {
    clearTimeout(timeoutId);
  }
};

export const resendOTP = sendOTP;
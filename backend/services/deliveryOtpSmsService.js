import twilio from "twilio";

const getClient = () => twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
  { timeout: SMS_TIMEOUT_MS },
);

const isConfigured = () => Boolean(
  (process.env.SMS_PROVIDER || "twilio").toLowerCase() === "twilio"
  && process.env.TWILIO_ACCOUNT_SID
  && process.env.TWILIO_AUTH_TOKEN
  && process.env.TWILIO_FROM_NUMBER,
);
const SMS_TIMEOUT_MS = Math.max(1000, Number(process.env.SMS_TIMEOUT_MS) || 10000);
const getOtpContentSid = () => String(process.env.TWILIO_OTP_CONTENT_SID || "").trim();
const smsDebug = (message, details = {}) => {
  if (process.env.NODE_ENV !== "production") console.debug(`[SMS] ${message}`, details);
};
const createSmsError = (message, cause = null) => {
  const error = new Error(message);
  error.isSmsError = true;
  if (cause?.code) error.providerCode = cause.code;
  if (cause?.status) error.providerStatus = cause.status;
  if (cause?.message) error.providerMessage = cause.message;
  return error;
};

const maskPhone = (phone) => `***${String(phone).slice(-4)}`;

export const normalizePhone = (phone) => {
  const raw = String(phone || "").trim();
  if (/^\+[1-9]\d{7,14}$/.test(raw)) return raw;

  const digits = raw.replace(/\D/g, "");
  const countryCode = String(process.env.SMS_DEFAULT_COUNTRY_CODE || "+91").trim();
  const countryDigits = countryCode.replace(/^\+/, "");
  if (digits.length === 10) {
    return `${countryCode}${digits}`;
  }
  if (digits.length === countryDigits.length + 10 && digits.startsWith(countryDigits)) {
    return `+${digits}`;
  }

  return null;
};

export const sendSms = async ({ to, message, contentVariables }) => {
  smsDebug("Delivery OTP SMS requested");
  const recipient = normalizePhone(to);
  if (!recipient) {
    throw createSmsError("Customer phone must be in E.164 format, for example +919876543210");
  }
  smsDebug(`Customer phone normalized: ${maskPhone(recipient)}`);
  smsDebug(`Provider: ${(process.env.SMS_PROVIDER || "twilio").toLowerCase()}`);
  smsDebug(`Twilio credentials present: ${Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)}`);
  smsDebug(`Twilio sender configured: ${Boolean(process.env.TWILIO_FROM_NUMBER)}`);

  if (!isConfigured()) {
    if ((process.env.SMS_PROVIDER || "twilio").toLowerCase() !== "twilio") {
      throw createSmsError("Unsupported SMS provider");
    }
    throw createSmsError("Twilio SMS credentials are not configured");
  }

  let response;
  try {
    smsDebug("Sending request to Twilio");
    const request = {
      from: process.env.TWILIO_FROM_NUMBER,
      to: recipient,
    };
    const otpContentSid = getOtpContentSid();
    if (otpContentSid) {
      request.contentSid = otpContentSid;
      request.contentVariables = JSON.stringify(contentVariables || {});
    } else {
      request.body = message;
    }
    response = await getClient().messages.create(request);
    smsDebug("Twilio response received");
    smsDebug(`Twilio Message SID: ${response?.sid ? "available" : "not available"}`);
  } catch (error) {
    console.error("[SMS] Twilio error:", {
      code: error.code,
      status: error.status,
      message: error.message,
      recipient: maskPhone(recipient),
    });
    throw createSmsError("Twilio SMS request failed", error);
  }

  return { sent: true, messageSid: response.sid };
};

export const sendDeliveryOtpSms = async ({ phone, customerName, orderNumber, otp, expiresAt }) => sendSms({
  to: phone,
  message: `HoneyVision: Hi ${customerName || "Customer"}, your delivery OTP for order ${orderNumber} is ${otp}. It expires at ${new Date(expiresAt).toLocaleString("en-IN")}. Share it only when the agent is at your door.`,
  contentVariables: { "1": otp },
});

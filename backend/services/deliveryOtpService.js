import nodemailer from "nodemailer";

const getEmailTransporter = () => nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const isConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);

export const sendDeliveryOtpEmail = async ({ email, customerName, orderNumber, otp, expiresAt }) => {
  const recipient = String(email || "").trim();
  if (!recipient) {
    throw new Error("Customer email is missing for delivery OTP");
  }

  if (!isConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Delivery OTP email skipped: EMAIL_USER/EMAIL_PASSWORD are not configured");
      return { sent: false, reason: "email_not_configured" };
    }
    throw new Error("Delivery email credentials are not configured");
  }

  const result = await getEmailTransporter().sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: recipient,
    subject: `Your HoneyVision delivery OTP for order ${orderNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#071426">
        <h2>HoneyVision delivery verification</h2>
        <p>Hello ${customerName || "Customer"},</p>
        <p>Share this one-time password with the HoneyVision delivery agent when your order arrives:</p>
        <div style="display:inline-block;padding:16px 22px;background:#fff7db;border-radius:8px;font-size:28px;font-weight:700;letter-spacing:6px">${otp}</div>
        <p>This OTP expires at ${new Date(expiresAt).toLocaleString("en-IN")} and can be used only once.</p>
        <p>Do not share this code before the delivery agent is present.</p>
        <p>HoneyVision Team</p>
      </div>
    `,
  });

  return { sent: true, messageId: result.messageId };
};

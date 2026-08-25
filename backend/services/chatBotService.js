import Order from "../models/Order.js";
import { getAIResponse } from "./ai/aiService.js";

const intents = {
  HUMAN_AGENT: /\b(want|need|speak|talk|connect|transfer|escalate)\b.{0,30}\b(human|agent|customer care|real person|support)\b/i,
  TRACK_ORDER: /\b(show|track|locate|find|where)\b.{0,30}\b(my|the|latest)?\s*(order|shipment|package)\b|\b(order|shipment|package)\b.{0,20}\b(tracking|status|arrive)\b/i,
  DELIVERY_ISSUE: /\b(delivery|shipment)\b.{0,30}\b(late|delay|problem|issue|missed|not received|not delivered)\b|\b(delayed|missed delivery|not delivered)\b/i,
  PAYMENT_ISSUE: /\b(payment|transaction|charge|refund)\b.{0,30}\b(failed|fail|problem|issue|wrong|missing|not received|pending)\b|\b(payment|transaction)\b\s+(problem|issue|failed)\b/i,
  CANCEL_ORDER: /\b(cancel|cancellation)\b.{0,25}\b(order|purchase|item)\b/i,
  RETURN_REFUND: /\b(return|replace|refund)\b.{0,30}\b(order|item|product|money|payment)\b|\b(product|item)\b.{0,20}\b(damaged|defective|broken)\b/i,
  INSTALLATION_HELP: /\b(show|check|find|where|reschedule|change|missed)\b.{0,35}\b(my\s+)?installation\s+(booking|appointment|history|status)|\bwhere\s+is\s+(my\s+)?technician\b/i,
  WARRANTY: /\b(warranty|amc|guarantee)\b.{0,30}\b(coverage|claim|period|status|include|cover|information|details)\b|\bhow\s+(do|can)\s+i\s+(claim|check)\s+(the\s+)?warranty\b/i,
  PRODUCT_SUPPORT: /\b(product|camera|cctv|nvr|dvr|device)\b.{0,30}\b(not working|problem|issue|troubleshoot|repair)\b|\btechnical\s+support\b/i,
  GREETING: /^(hi|hello|hey|good morning|good afternoon|good evening)\b/i,
};

const detectIntent = (message) => Object.entries(intents).find(([, pattern]) => pattern.test(message))?.[0] || "UNKNOWN";
const orderNumberFromMessage = (message) => message.match(/\bHV-[A-Z0-9-]+\b/i)?.[0];

export async function getBotResponse({ message, user, conversation, recentMessages = [] }) {
  const intent = detectIntent(message);
  console.info(`[AI] Routing intent: ${intent}`);
  if (intent === "HUMAN_AGENT") return { intent, message: "I have sent your request to our support team. Please wait while we connect you with an agent." };
  if (intent === "GREETING") return { intent, message: "Hi! I can help with orders, delivery, payments, installation, products, and warranty support." };

  if (intent === "TRACK_ORDER") {
    if (!user) return { intent, message: "Please sign in to view your order details.", metadata: { action: "SIGN_IN" } };
    const requestedOrder = orderNumberFromMessage(message);
    const order = await Order.findOne({ user: user._id, ...(requestedOrder ? { orderNumber: requestedOrder } : {}) })
      .select("_id orderNumber status deliveryDetails trackingNumber estimatedDeliveryDate")
      .sort({ createdAt: -1 })
      .lean();
    if (!order) return { intent, message: requestedOrder ? "I could not find that order in your account." : "I could not find a recent order in your account." };
    return {
      intent,
      message: `Your order ${order.orderNumber} is currently ${String(order.status || "processing").replaceAll("_", " ")}.`,
      metadata: { orderId: order._id, orderNumber: order.orderNumber, action: "TRACK_ORDER" },
    };
  }

  const responses = {
    DELIVERY_ISSUE: "Please check the tracking timeline first. If the promised window has passed, our support team can investigate the delivery.",
    PAYMENT_ISSUE: "Payment status is available in your order details. Keep the transaction reference ready if the payment still needs investigation.",
    CANCEL_ORDER: "Open the order details and request cancellation while the order is still cancellable. Shipped orders may not be eligible.",
    RETURN_REFUND: "Returns and refunds depend on order status and product eligibility. Open your order details or ask an agent for a case-specific review.",
    INSTALLATION_HELP: "Installation bookings and technician details are available in Installation History. An agent can help with rescheduling or missed visits.",
    WARRANTY: "Warranty coverage varies by product. Keep your model and invoice details ready so support can confirm the applicable terms.",
    PRODUCT_SUPPORT: "Please share the product model and the issue you are seeing. Our support team can guide setup and troubleshooting.",
  };
  if (responses[intent]) {
    console.info(`[AI] Deterministic response used: ${intent}`);
    return { intent, message: responses[intent] };
  }
  console.info("[AI] No high-confidence deterministic intent; attempting provider");
  let aiResponse = null;
  try {
    aiResponse = await getAIResponse({ message, user, conversation, recentMessages });
  } catch (error) {
    console.warn("[AI] Falling back because: response service error");
  }
  return aiResponse ? { intent, ...aiResponse } : { intent, message: "I am sorry, I could not fully understand that. Try asking about an order, delivery, installation, warranty, or payment, or ask for an agent.", actions: [{ type: "REQUEST_AGENT", label: "Talk to an Agent" }] };
}
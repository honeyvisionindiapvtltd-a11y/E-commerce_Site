import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import SupportTicket from "../../models/SupportTicket.js";
import { getDB } from "../../db.js";

const safeOrder = (order) => ({
  orderNumber: order.orderNumber,
  orderDate: order.createdAt,
  status: order.status,
  products: (order.items || []).slice(0, 20).map((item) => ({ name: item.name, quantity: item.quantity })),
  delivery: order.deliveryDetails ? { estimatedDeliveryDays: order.deliveryDetails.estimatedDeliveryDays } : undefined,
});

const safeProduct = (product) => ({
  name: product.name,
  category: product.category?.name || product.category,
  description: String(product.shortDescription || product.description || "").slice(0, 600),
  specifications: Object.fromEntries(Object.entries(product.specifications || {}).slice(0, 20)),
  price: product.price,
  availability: product.stockStatus || (product.stock > 0 ? "in_stock" : "out_of_stock"),
  warranty: product.warranty || undefined,
  installationAvailable: product.installationAvailable,
});

const ownedOrder = async (user, orderNumber) => Order.findOne({ user: user._id, ...(orderNumber ? { orderNumber: String(orderNumber).trim().slice(0, 80) } : {}) })
  .select("orderNumber createdAt status items.name items.quantity deliveryDetails.estimatedDeliveryDays")
  .populate("items.product", "name")
  .sort({ createdAt: -1 })
  .lean();

export const toolDefinitions = [
  { type: "function", function: { name: "get_my_recent_orders", description: "Get the authenticated customer's recent orders.", parameters: { type: "object", properties: { limit: { type: "integer", minimum: 1, maximum: 5 } } } } },
  { type: "function", function: { name: "get_order_status", description: "Get status for an order belonging to the authenticated customer.", parameters: { type: "object", properties: { orderNumber: { type: "string", maxLength: 80 } }, required: ["orderNumber"] } } },
  { type: "function", function: { name: "get_product_information", description: "Search public product information using a product name or category.", parameters: { type: "object", properties: { query: { type: "string", maxLength: 100 } }, required: ["query"] } } },
  { type: "function", function: { name: "get_my_support_tickets", description: "Get support tickets belonging to the authenticated customer.", parameters: { type: "object", properties: { status: { type: "string", enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] } } } } },
  { type: "function", function: { name: "get_installation_information", description: "Get installation bookings belonging to the authenticated customer.", parameters: { type: "object", properties: {} } } },
];

export async function executeTool(name, args = {}, user) {
  if (!user) return { requiresLogin: true, message: "The customer must sign in to access this information." };
  if (name === "get_my_recent_orders") {
    const orders = await Order.find({ user: user._id }).select("orderNumber createdAt status items deliveryDetails.estimatedDeliveryDays").sort({ createdAt: -1 }).limit(Math.min(Number(args.limit) || 3, 5)).lean();
    return { orders: orders.map(safeOrder) };
  }
  if (name === "get_order_status") {
    const order = await ownedOrder(user, args.orderNumber);
    return order ? safeOrder(order) : { found: false, message: "No matching order was found in the customer's account." };
  }
  if (name === "get_product_information") {
    const query = String(args.query || "").trim().slice(0, 100);
    if (!query) return { products: [] };
    const expression = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const products = await Product.find({ isActive: { $ne: false }, $or: [{ name: expression }, { shortDescription: expression }, { description: expression }] })
      .select("name shortDescription description category specifications price stock stockStatus warranty installationAvailable").populate("category", "name").limit(5).lean();
    return { products: products.map(safeProduct) };
  }
  if (name === "get_my_support_tickets") {
    const filter = { user: user._id };
    if (["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(args.status)) filter.status = args.status;
    const tickets = await SupportTicket.find(filter).select("ticketNumber category subject status priority createdAt orderNumber").sort({ createdAt: -1 }).limit(10).lean();
    return { tickets };
  }
  if (name === "get_installation_information") {
    const bookings = await getDB().collection("installations").find({ userId: String(user._id) }).sort({ createdAt: -1 }).limit(10).toArray();
    return { installations: bookings.map((booking) => ({ status: booking.status, scheduledDate: booking.scheduledDate, scheduledTime: booking.scheduledTime, orderNumber: booking.orderNumber })) };
  }
  return { error: "Unsupported tool." };
}
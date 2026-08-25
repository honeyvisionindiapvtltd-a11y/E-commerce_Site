import "dotenv/config";
import OpenAI from "openai";
import { HONEY_VISION_SYSTEM_PROMPT } from "./prompts/systemPrompt.js";
import { executeTool, toolDefinitions } from "./tools.js";

const getAIConfig = () => {
  const provider = String(process.env.AI_PROVIDER || "").trim().toLowerCase().replace(/[^a-z]/g, "");
  const apiKey = String(process.env.AI_API_KEY || "").trim();
  const model = String(process.env.AI_MODEL || "").trim();
  const baseUrl = String(process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const timeoutMs = Math.min(Math.max(Number(process.env.AI_TIMEOUT_MS) || 12000, 3000), 30000);
  return { provider, apiKey, model, baseUrl, timeoutMs };
};

const blockedRequest = /\b(api key|secret|jwt|password|database|mongo|system prompt|all customer|act as an admin|ignore (all|previous) instructions)\b/i;
const cleanOutput = (value) => String(value || "")
  .replace(/[<>]/g, "")
  .replace(/^\s{0,3}#{1,6}\s*/gm, "")
  .replace(/\*\*(.*?)\*\*/g, "$1")
  .replace(/__(.*?)__/g, "$1")
  .replace(/`([^`]+)`/g, "$1")
  .trim()
  .slice(0, 2000);
const approvedActions = new Set(["TRACK_ORDER", "VIEW_ORDER", "VIEW_TICKET", "OPEN_INSTALLATION", "REQUEST_AGENT"]);

const requestProvider = async (input, tools) => {
  const { provider, apiKey, model, baseUrl, timeoutMs } = getAIConfig();
  const supportedProvider = ["openai", "openaicompatible"].includes(provider);
  if (!supportedProvider) {
    console.info(`[AI] Provider enabled: false (unsupported or unset provider: ${provider || "none"})`);
    return null;
  }
  if (!apiKey) {
    console.info("[AI] Provider enabled: false (API key missing)");
    return null;
  }
  if (!model) {
    console.info("[AI] Provider enabled: false (model missing)");
    return null;
  }
  console.info(`[AI] Provider enabled: true`);
  console.info(`[AI] Provider: ${provider === "openaicompatible" ? "openai-compatible" : "openai"}`);
  console.info(`[AI] Model: ${model}`);
  console.info("[AI] Calling provider");
  const responseTools = tools.map((tool) => ({
    type: "function",
    name: tool.function.name,
    description: tool.function.description,
    parameters: tool.function.parameters,
    strict: false,
  }));
  try {
    const openai = new OpenAI({ apiKey, baseURL: baseUrl, timeout: timeoutMs, maxRetries: 0 });
    const response = await openai.responses.create({ model, instructions: HONEY_VISION_SYSTEM_PROMPT, input, tools: responseTools, max_output_tokens: 500 }, { timeout: timeoutMs });
    if (!response?.output) {
      console.warn("[AI] Falling back because: malformed provider response");
      return null;
    }
    console.info("[AI] Provider response received");
    return response;
  } catch (error) {
    const reason = error.name === "APIConnectionTimeoutError" || error.name === "TimeoutError" ? "timeout" : error.status ? `provider returned HTTP ${error.status}` : "provider request failed";
    const detail = error.status && error.message ? ` (${String(error.message).replace(/https?:\/\/\S+|Bearer\s+\S+/gi, "[redacted]").slice(0, 240)})` : "";
    console.warn(`[AI] Falling back because: ${reason}${detail}`);
    return null;
  }
};

export async function getAIResponse({ message, user, conversation, recentMessages = [] }) {
  if (blockedRequest.test(message)) return { message: "I can help with Honey Vision products, orders, delivery, installation, and support, but I cannot provide private system or security information.", actions: [{ type: "REQUEST_AGENT", label: "Talk to an Agent" }] };
  const context = recentMessages.slice(-12).map((item) => ({ role: item.senderType === "customer" ? "user" : item.senderType === "agent" ? "assistant" : "assistant", content: cleanOutput(item.message) }));
  const input = [{ role: "developer", content: `Conversation status: ${conversation.status}. The authenticated customer is identified server-side; do not ask for or accept a customer ID.` }, ...context, { role: "user", content: cleanOutput(message) }];
  let response = await requestProvider(input, toolDefinitions);
  if (!response) return null;
  const toolActions = [];
  if (conversation.status !== "BOT_ACTIVE") return null;
  const toolCalls = response.output.filter((item) => item.type === "function_call");
  if (toolCalls.length) {
    const toolMessages = [...input, ...response.output];
    for (const call of toolCalls.slice(0, 2)) {
      let args = {};
      try { args = JSON.parse(call.arguments || "{}"); } catch { args = {}; }
      const result = await executeTool(call.name, args, user);
      toolMessages.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result).slice(0, 6000) });
      if (call.name === "get_order_status" || call.name === "get_my_recent_orders") toolActions.push({ type: "TRACK_ORDER", label: "Track Live Order" });
      if (call.name === "get_my_support_tickets") toolActions.push({ type: "VIEW_TICKET", label: "View Support Tickets" });
      if (call.name === "get_installation_information") toolActions.push({ type: "OPEN_INSTALLATION", label: "Open Installation History" });
    }
    response = await requestProvider(toolMessages, toolDefinitions);
  }
  const output = cleanOutput(response?.output_text);
  if (!output || /api[_ -]?key|jwt secret|system prompt|mongodb uri/i.test(output)) {
    console.warn("[AI] Falling back because: invalid or unsafe response");
    return null;
  }
  const actions = [...toolActions, ...(Array.isArray(response?.actions) ? response.actions : [])].filter((action) => approvedActions.has(action?.type)).slice(0, 3);
  return { message: output, actions };
}
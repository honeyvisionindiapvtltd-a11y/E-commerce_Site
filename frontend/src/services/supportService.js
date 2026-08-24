const SUPPORT_EMAIL = "support@honeyvision.in";

export const supportEmail = SUPPORT_EMAIL;

export const createSupportTicket = async (requestJson, payload) => {
  return requestJson("/support", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getMySupportTickets = async (requestJson) => {
  return requestJson("/support/my");
};

export const getSupportTicketById = async (requestJson, ticketNumber) => {
  return requestJson(`/support/my/${encodeURIComponent(ticketNumber)}`);
};

export const addSupportTicketMessage = async (requestJson, ticketNumber, message) => {
  return requestJson(`/support/my/${encodeURIComponent(ticketNumber)}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
};

export const requestSupportCallback = async () => {
  throw new Error("Callback request integration is not configured.");
};

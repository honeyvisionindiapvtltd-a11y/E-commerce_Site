export const getCurrentConversation = (requestJson) => requestJson("/chat/conversations", { method: "POST", body: JSON.stringify({}) });
export const createNewConversation = (requestJson) => requestJson("/chat/conversations/new", { method: "POST", body: JSON.stringify({}) });

export const getChatMessages = (requestJson, conversationId) => requestJson(`/chat/conversations/${encodeURIComponent(conversationId)}/messages`);

export const sendChatMessage = (requestJson, conversationId, message) => requestJson(`/chat/conversations/${encodeURIComponent(conversationId)}/messages`, {
  method: "POST",
  body: JSON.stringify({ message }),
});

export const requestChatAgent = (requestJson, conversationId) => requestJson(`/chat/conversations/${encodeURIComponent(conversationId)}/request-agent`, { method: "POST", body: JSON.stringify({}) });
export const createTicketFromChat = (requestJson, conversationId) => requestJson(`/chat/conversations/${encodeURIComponent(conversationId)}/ticket`, { method: "POST", body: JSON.stringify({}) });
const MAX_HISTORY = 10;
const conversationHistory = [];

export function getConversationHistory() {
  return conversationHistory;
}

export function addHistoryEntry(entry) {
  conversationHistory.push(entry);
  trimHistory();
}

export function addHistoryEntries(entries) {
  entries.forEach(addHistoryEntry);
}

export function addUserContext(content) {
  if (!content) return;
  addHistoryEntry({ role: "user", content });
}

export function addSystemContext(content) {
  if (!content) return;
  addHistoryEntry({ role: "system", content });
}

function trimHistory() {
  if (conversationHistory.length > MAX_HISTORY) {
    conversationHistory.splice(0, conversationHistory.length - MAX_HISTORY);
  }
}

export const leftPlayer = document.getElementById("leftPlayer");
export const rightPlayer = document.getElementById("rightPlayer");
export const leftListEl = document.getElementById("leftList");
export const rightListEl = document.getElementById("rightList");
export const leftForm = document.getElementById("leftForm");
export const rightForm = document.getElementById("rightForm");
export const leftUrlInput = document.getElementById("leftUrl");
export const rightUrlInput = document.getElementById("rightUrl");
export const swapBtn = document.getElementById("swapBtn");
export const clearBtn = document.getElementById("clearBtn");
export const chatEl = document.getElementById("chat");
export const chatForm = document.getElementById("chatForm");
export const chatInput = document.getElementById("chatInput");
export const recommendBtn = document.getElementById("recommendBtn");
export const themeBtn = document.getElementById("themeBtn");
export const settingsBtn = document.getElementById("settingsBtn");
export const settingsModal = document.getElementById("settingsModal");
export const closeSettingsBtn = document.getElementById("closeSettingsBtn");
export const providerSelect = document.getElementById("providerSelect");
export const refreshModelsBtn = document.getElementById("refreshModelsBtn");
export const saveSettingsBtn = document.getElementById("saveSettingsBtn");
export const llmIndicator = document.getElementById("llmIndicator");

export const tokenInputs = {
  github: document.getElementById("githubToken"),
  huggingface: document.getElementById("huggingfaceToken"),
  openai: document.getElementById("openaiToken")
};

export const modelSelects = {
  github: document.getElementById("githubModel"),
  huggingface: document.getElementById("huggingfaceModel"),
  openai: document.getElementById("openaiModel")
};

export function getProviderConfigContainers() {
  return document.querySelectorAll(".provider-config");
}

import {
  llmConfig,
  saveLLMConfig,
  setProvider,
  setToken,
  setSelectedModel,
  setAvailableModels
} from "../state/llmState.js";
import {
  providerSelect,
  tokenInputs,
  modelSelects,
  refreshModelsBtn,
  saveSettingsBtn,
  settingsModal,
  llmIndicator
} from "./domRefs.js";
import { getProviderConfigContainers } from "./domRefs.js";
import { showNotification } from "../utils/notifications.js";
import {
  fetchGitHubModels,
  fetchHuggingFaceModels,
  fetchOpenAIModels,
  validateToken
} from "../services/llmProviders.js";

const PROVIDER_LABELS = {
  websim: "WebSim",
  github: "GitHub Models",
  huggingface: "Hugging Face",
  openai: "OpenAI"
};

export function loadSettingsUI() {
  if (providerSelect) {
    providerSelect.value = llmConfig.provider;
  }

  Object.entries(tokenInputs).forEach(([provider, input]) => {
    if (!input) return;
    input.value = llmConfig.tokens[provider] || "";
    ensureTokenIndicator(input);
  });

  Object.entries(modelSelects).forEach(([provider, select]) => {
    if (!select) return;
    populateModelSelect(select, llmConfig.models[provider], llmConfig.selectedModel[provider]);
  });

  updateProviderUI();
}

export function updateProviderUI() {
  const containers = getProviderConfigContainers();
  containers.forEach((container) => {
    const provider = container.dataset.provider;
    container.style.display = provider === llmConfig.provider ? "block" : "none";
  });
}

export function updateLLMIndicator() {
  if (!llmIndicator) return;

  const provider = llmConfig.provider;
  const selectedModel = provider === "websim" ? null : llmConfig.selectedModel[provider];
  const hasToken = provider === "websim" ? true : Boolean(llmConfig.tokens[provider]);
  const hasModel = provider === "websim" ? true : Boolean(selectedModel);
  const isReady = hasToken && hasModel;

  const modelLabel = selectedModel ? selectedModel.split("/").pop() : "";
  llmIndicator.textContent = modelLabel ? `${getProviderLabel(provider)} • ${modelLabel}` : getProviderLabel(provider);
  llmIndicator.title = isReady
    ? "Provider configurato correttamente"
    : "Completa la configurazione nelle impostazioni";

  llmIndicator.classList.remove("ready", "pending");
  llmIndicator.classList.add(isReady ? "ready" : "pending");
  llmIndicator.dataset.status = isReady ? "ready" : "pending";
}

export function saveSettings() {
  if (providerSelect) {
    setProvider(providerSelect.value);
  }

  Object.entries(tokenInputs).forEach(([provider, input]) => {
    if (!input) return;
    setToken(provider, input.value.trim());
  });

  Object.entries(modelSelects).forEach(([provider, select]) => {
    if (!select) return;
    setSelectedModel(provider, select.value);
  });

  saveLLMConfig();
  updateProviderUI();
  updateLLMIndicator();

  if (settingsModal) {
    settingsModal.style.display = "none";
  }

  showNotification("Impostazioni salvate", "success");
}

export async function refreshModels() {
  const provider = llmConfig.provider;
  if (provider === "websim") return;

  const input = tokenInputs[provider];
  const select = modelSelects[provider];
  const indicator = input?.parentNode?.querySelector(".token-status") || null;

  const token = (input?.value || llmConfig.tokens[provider] || "").trim();
  setToken(provider, token);

  if (!token) {
    if (indicator) {
      indicator.textContent = "❌ Token richiesto";
      indicator.style.color = "#ef4444";
    }
    showNotification("Inserisci prima il token API", "error");
    return;
  }

  const validation = await validateToken(provider, token);
  if (!validation.valid) {
    if (indicator) {
      indicator.textContent = `❌ ${validation.error}`;
      indicator.style.color = "#ef4444";
    }
    showNotification(`Token non valido: ${validation.error}`, "error");
    return;
  }

  if (indicator) {
    indicator.textContent = "✅ Token valido";
    indicator.style.color = "#10b981";
  }

  if (refreshModelsBtn) {
    refreshModelsBtn.disabled = true;
    refreshModelsBtn.textContent = "🔄 Caricamento...";
  }

  try {
    let models = [];
    switch (provider) {
      case "github":
        models = await fetchGitHubModels(token);
        break;
      case "huggingface":
        models = await fetchHuggingFaceModels(token);
        break;
      case "openai":
        models = await fetchOpenAIModels(token);
        break;
      default:
        break;
    }

    if (!models.length) {
      throw new Error("Nessun modello disponibile");
    }

    setAvailableModels(provider, models);
    populateModelSelect(select, models, "");
    showNotification(`${models.length} modelli caricati per ${provider}`, "success");
  } catch (error) {
    console.error("Errore nel caricamento dei modelli:", error);
    if (indicator) {
      indicator.textContent = `❌ ${error.message}`;
      indicator.style.color = "#ef4444";
    }
    showNotification(`Errore nel caricare i modelli: ${error.message}`, "error");
  } finally {
    if (refreshModelsBtn) {
      refreshModelsBtn.disabled = false;
      refreshModelsBtn.textContent = "🔄 Aggiorna Modelli";
    }
  }
}

function ensureTokenIndicator(input) {
  const existing = input.parentNode.querySelector(".token-status");
  if (existing) {
    existing.textContent = "";
    existing.style.marginLeft = "8px";
    existing.style.fontSize = "12px";
    return existing;
  }

  const indicator = document.createElement("span");
  indicator.className = "token-status";
  indicator.style.marginLeft = "8px";
  indicator.style.fontSize = "12px";
  input.parentNode.appendChild(indicator);
  return indicator;
}

function populateModelSelect(select, models = [], selectedId = "") {
  if (!select) return;

  select.innerHTML = '<option value="">Seleziona modello...</option>';
  models.forEach((model) => {
    const option = document.createElement("option");
    option.value = model.id;
    option.textContent = model.name;
    if (model.id === selectedId) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function getProviderLabel(provider) {
  return PROVIDER_LABELS[provider] || provider;
}

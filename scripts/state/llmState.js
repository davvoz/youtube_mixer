const LLM_STORAGE_KEY = "ytmixer_llm_config";

export const llmConfig = {
  provider: "websim",
  tokens: {
    github: "",
    huggingface: "",
    openai: ""
  },
  models: {
    github: [],
    huggingface: [],
    openai: []
  },
  selectedModel: {
    github: "",
    huggingface: "",
    openai: ""
  }
};

export function saveLLMConfig() {
  localStorage.setItem(LLM_STORAGE_KEY, JSON.stringify(llmConfig));
}

export function loadLLMConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(LLM_STORAGE_KEY) || "null");
    if (saved) {
      mergeConfig(llmConfig, saved);
    }
  } catch (error) {
    console.warn("Impossibile caricare la configurazione LLM:", error);
  }
}

export function setProvider(provider) {
  llmConfig.provider = provider;
}

export function setToken(provider, token) {
  if (provider in llmConfig.tokens) {
    llmConfig.tokens[provider] = token;
  }
}

export function setSelectedModel(provider, modelId) {
  if (provider in llmConfig.selectedModel) {
    llmConfig.selectedModel[provider] = modelId;
  }
}

export function setAvailableModels(provider, models) {
  if (provider in llmConfig.models) {
    llmConfig.models[provider] = models;
  }
}

function mergeConfig(target, source) {
  Object.entries(source).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (!target[key]) {
        target[key] = {};
      }
      mergeConfig(target[key], value);
    } else {
      target[key] = value;
    }
  });
}

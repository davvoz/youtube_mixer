import {
  leftState,
  rightState,
  loadPlaylistState,
  savePlaylistState,
  resetPlaylists
} from "./scripts/state/playlistState.js";
import {
  llmConfig,
  loadLLMConfig,
  setProvider
} from "./scripts/state/llmState.js";
import {
  getConversationHistory,
  addHistoryEntry,
  addUserContext,
  addSystemContext
} from "./scripts/state/chatState.js";
import { getVideoId, checkVideoAvailability } from "./scripts/utils/youtube.js";
import { showNotification } from "./scripts/utils/notifications.js";
import { renderPanel } from "./scripts/ui/playlistRenderer.js";
import { pushMessage, renderSuggestions } from "./scripts/ui/chat.js";
import {
  loadSettingsUI,
  updateProviderUI,
  updateLLMIndicator,
  saveSettings,
  refreshModels
} from "./scripts/ui/settings.js";
import { applyTheme, getStoredTheme, toggleTheme } from "./scripts/ui/theme.js";
import {
  leftForm,
  rightForm,
  leftUrlInput,
  rightUrlInput,
  swapBtn,
  clearBtn,
  chatForm,
  chatInput,
  recommendBtn,
  themeBtn,
  settingsBtn,
  settingsModal,
  closeSettingsBtn,
  providerSelect,
  refreshModelsBtn,
  saveSettingsBtn
} from "./scripts/ui/domRefs.js";
import {
  callGitHubModel,
  callHuggingFaceModel,
  callOpenAIModel
} from "./scripts/services/llmProviders.js";
import { validateSuggestions } from "./scripts/services/recommendationService.js";

async function addToPlaylist(side, url, title = "") {
  const id = getVideoId(url);
  if (!id) {
    showNotification("URL non valido. Incolla un link YouTube completo.", "error");
    return;
  }

  const form = side === "left" ? leftForm : rightForm;
  const submitBtn = form?.querySelector('button[type="submit"]');
  const originalLabel = submitBtn?.innerHTML;

  if (submitBtn) {
    submitBtn.innerHTML = "🔄 Verifica...";
    submitBtn.disabled = true;
  }

  try {
    const availability = await checkVideoAvailability(url);
    if (!availability.available) {
      showNotification("Video non disponibile (privato/rimosso).", "error");
      return;
    }

    const state = side === "left" ? leftState : rightState;
    const shouldAutoplay = !state.current;

    state.list.push({
      id,
      url,
      title: title || availability.title || ""
    });

    if (shouldAutoplay) {
      state.current = id;
    }

    renderPanel(side, { autoplay: shouldAutoplay });
    savePlaylistState();

    showNotification(`✓ Aggiunto alla playlist ${side === "left" ? "A" : "B"}`, "success");
    pushChatContext(
      `Aggiunto alla playlist ${side === "left" ? "A" : "B"}: ${title || availability.title || url}`
    );
  } finally {
    if (submitBtn) {
      submitBtn.innerHTML = originalLabel;
      submitBtn.disabled = false;
    }
  }
}

function pushChatContext(text) {
  addUserContext(text);
}

async function getRecommendations(promptText = "") {
  const historySummary = [
    ...leftState.list.map((v) => `A:${v.url}`),
    ...rightState.list.map((v) => `B:${v.url}`)
  ].join("\n");

  const systemPrompt = `Sei un assistente che consiglia video YouTube basandosi sui preferiti scelti in precedenza.
Segui SEMPRE queste regole prima di rispondere:
1. Suggerisci esclusivamente URL completi di video pubblici YouTube già pubblicati (https://www.youtube.com/watch?v=ID).
2. Evita link a live non ancora iniziate, video privati, playlist, canali, short sperimentali o URL accorciati.
3. Preferisci video da canali ufficiali o molto conosciuti, con alta probabilità di essere visibili ovunque.
4. Non inventare ID: proponi solo video di cui sei certo dell'esistenza.
5. Se non puoi garantire almeno 4 video validi, restituisci comunque il JSON con la lista più affidabile possibile (anche vuota).
Rispondi SOLO in JSON nel formato:
{
  "suggestions": [
    { "title": string, "url": string, "reason": string }
  ]
}`;

  const userPrompt = `Storico scelte (playlist A+B):
${historySummary || "(vuoto)"}

Richiesta utente: ${promptText || "Suggerisci 6 video rilevanti da guardare adesso."}`;

  addSystemContext(systemPrompt);
  addUserContext(userPrompt);

  try {
    pushMessage("assistant", "Sto cercando suggerimenti...");

    let result;
    const messages = getConversationHistory();

    if (llmConfig.provider === "websim") {
      const completion = await window.websim.chat.completions.create({
        messages,
        json: true
      });
      result = JSON.parse(completion.content);
      addHistoryEntry(completion);
    } else {
      switch (llmConfig.provider) {
        case "github":
          result = await callGitHubModel({
            token: llmConfig.tokens.github,
            model: llmConfig.selectedModel.github,
            messages
          });
          break;
        case "huggingface":
          result = await callHuggingFaceModel({
            token: llmConfig.tokens.huggingface,
            model: llmConfig.selectedModel.huggingface,
            messages
          });
          break;
        case "openai":
          result = await callOpenAIModel({
            token: llmConfig.tokens.openai,
            model: llmConfig.selectedModel.openai,
            messages
          });
          break;
        default:
          throw new Error("Provider non configurato");
      }
    }

    const { valid, fallbacks, invalid, replacements } = await validateSuggestions(result.suggestions || []);

    if (replacements.length) {
      pushMessage(
        "assistant",
        `✅ ${replacements.length} suggerimenti sono stati corretti automaticamente con link funzionanti.`
      );
    }

    if (invalid.length && !replacements.length) {
      pushMessage(
        "assistant",
        `⚠️ ${invalid.length} suggerimenti non erano disponibili. Ho mantenuto solo i link affidabili e, quando possibile, ho preparato delle ricerche alternative.`
      );
    }

    renderSuggestions({
      suggestions: valid,
      fallbackSuggestions: fallbacks,
      addToPlaylist
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    pushMessage("assistant", `Errore nel generare suggerimenti: ${error.message}`);
  }
}

function registerEventListeners() {
  leftForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const url = leftUrlInput.value.trim();
    if (!url) return;
    await addToPlaylist("left", url);
    leftUrlInput.value = "";
  });

  rightForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const url = rightUrlInput.value.trim();
    if (!url) return;
    await addToPlaylist("right", url);
    rightUrlInput.value = "";
  });

  swapBtn?.addEventListener("click", () => {
    const swapLeft = { ...leftState };
    const swapRight = { ...rightState };
    Object.assign(leftState, swapRight);
    Object.assign(rightState, swapLeft);
    renderPanel("left");
    renderPanel("right");
    savePlaylistState();
  });

  clearBtn?.addEventListener("click", () => {
    if (!confirm("Vuoi svuotare entrambe le playlist?")) return;
    resetPlaylists();
    renderPanel("left");
    renderPanel("right");
    savePlaylistState();
  });

  chatForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    pushMessage("user", text);
    pushChatContext(text);
    chatInput.value = "";
    await getRecommendations(text);
  });

  recommendBtn?.addEventListener("click", () => {
    getRecommendations();
  });

  themeBtn?.addEventListener("click", () => {
    toggleTheme();
  });

  settingsBtn?.addEventListener("click", () => {
    if (settingsModal) {
      settingsModal.style.display = "flex";
      loadSettingsUI();
    }
  });

  closeSettingsBtn?.addEventListener("click", () => {
    if (settingsModal) {
      settingsModal.style.display = "none";
    }
  });

  settingsModal?.addEventListener("click", (event) => {
    if (event.target === settingsModal) {
      settingsModal.style.display = "none";
    }
  });

  providerSelect?.addEventListener("change", (event) => {
    setProvider(event.target.value);
    updateProviderUI();
    updateLLMIndicator();
  });

  refreshModelsBtn?.addEventListener("click", async () => {
    await refreshModels();
  });

  saveSettingsBtn?.addEventListener("click", () => {
    saveSettings();
  });

  [leftUrlInput, rightUrlInput].forEach((input, index) => {
    if (!input) return;
    const side = index === 0 ? "left" : "right";

    input.addEventListener("dragover", (event) => {
      event.preventDefault();
      input.style.borderColor = "var(--accent)";
    });

    input.addEventListener("dragleave", () => {
      input.style.borderColor = "";
    });

    input.addEventListener("drop", async (event) => {
      event.preventDefault();
      input.style.borderColor = "";

      const url = event.dataTransfer.getData("text/plain");
      if (!url) return;

      input.value = url;
      await addToPlaylist(side, url);
      input.value = "";
    });
  });
}

function initializeApp() {
  loadPlaylistState();
  loadLLMConfig();

  renderPanel("left");
  renderPanel("right");

  updateProviderUI();
  updateLLMIndicator();

  applyTheme(getStoredTheme());
  registerEventListeners();

  if (llmConfig.provider !== "websim" && llmConfig.tokens[llmConfig.provider]) {
    refreshModels().catch((error) => console.error("Impossibile aggiornare i modelli:", error));
  }

  pushMessage(
    "assistant",
    "🎬 Benvenuto in YouTube Mixer! Incolla gli URL dei video YouTube nelle playlist o trascina i link. Usa Ctrl+R per suggerimenti rapidi."
  );
}

initializeApp();
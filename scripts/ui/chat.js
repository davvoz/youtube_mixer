import { chatEl } from "./domRefs.js";
import { getVideoId, thumbUrl } from "../utils/youtube.js";

let loadingMessageEl = null;

export function showLoadingStatus(text, container = chatEl) {
  if (!container) return;

  hideLoadingStatus();

  loadingMessageEl = document.createElement("div");
  loadingMessageEl.className = "msg loading";
  loadingMessageEl.setAttribute("role", "status");
  loadingMessageEl.setAttribute("aria-live", "polite");
  loadingMessageEl.innerHTML = `
    <div class="role">assistant</div>
    <div class="loading-status">
      <span class="spinner" aria-hidden="true"></span>
      <div class="status-text">
        ${text}
        <span class="dots" aria-hidden="true">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </span>
      </div>
    </div>
  `.trim();

  container.appendChild(loadingMessageEl);
  container.scrollTop = container.scrollHeight;
}

export function hideLoadingStatus() {
  if (loadingMessageEl?.parentNode) {
    loadingMessageEl.parentNode.removeChild(loadingMessageEl);
  }
  loadingMessageEl = null;
}

export function pushMessage(role, text, container = chatEl) {
  if (!container) return;

  const wrapper = document.createElement("div");
  wrapper.className = "msg";
  wrapper.innerHTML = `<div class="role">${role}</div><div>${text}</div>`;
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
}

export function renderSuggestions({
  suggestions = [],
  fallbackSuggestions = [],
  addToPlaylist,
  container = chatEl
} = {}) {
  if (!container) return;

  const hasSuggestions = suggestions.length > 0;
  const hasFallbacks = fallbackSuggestions.length > 0;

  if (!hasSuggestions && !hasFallbacks) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "msg";
    emptyMessage.innerHTML = `<div class="role">assistant</div><div>Non ho trovato suggerimenti pronti da riprodurre. Prova a descrivere meglio ciò che vuoi guardare.</div>`;
    container.appendChild(emptyMessage);
    container.scrollTop = container.scrollHeight;
    return;
  }

  if (hasSuggestions) {
    appendHeader(container, "Suggerimenti affidabili:");

    suggestions.forEach((suggestion) => {
      const url = suggestion.url || "";
      const id = getVideoId(url);

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img class="thumb" src="${thumbUrl(id)}" alt="">
        <div>
          <h4>${suggestion.title || "Video suggerito"}</h4>
          <div class="link">${url}</div>
          <div class="reason" style="font-size:12px;color:#666;">${suggestion.reason || ""}</div>
        </div>
        <div class="actions">
          <button class="btn mini play" data-side="left">➕ A</button>
          <button class="btn mini play" data-side="right">➕ B</button>
        </div>
      `;

      const addLeft = card.querySelector('[data-side="left"]');
      const addRight = card.querySelector('[data-side="right"]');

      addLeft.onclick = () => addToPlaylist?.("left", url, suggestion.title || "");
      addRight.onclick = () => addToPlaylist?.("right", url, suggestion.title || "");

      container.appendChild(card);
    });
  }

  if (hasFallbacks) {
    appendHeader(container, "Ricerche alternative (si aprono in una nuova scheda):");

    fallbackSuggestions.forEach((suggestion) => {
      const card = document.createElement("div");
      card.className = "card fallback";
      card.innerHTML = `
        <div class="thumb placeholder">🔍</div>
        <div>
          <h4>${suggestion.title || "Ricerca su YouTube"}</h4>
          <div class="link">${suggestion.url}</div>
          <div class="reason">${suggestion.reason || "Apri la ricerca per trovare manualmente un video valido."}</div>
        </div>
        <div class="actions">
          <button class="btn secondary open-search" type="button">🔍 Apri ricerca</button>
        </div>
      `;

      card.querySelector(".open-search").onclick = () => window.open(suggestion.url, "_blank", "noopener");
      container.appendChild(card);
    });
  }

  container.scrollTop = container.scrollHeight;
}

function appendHeader(container, text) {
  const header = document.createElement("div");
  header.className = "msg";
  header.innerHTML = `<div class="role">assistant</div><div>${text}</div>`;
  container.appendChild(header);
}

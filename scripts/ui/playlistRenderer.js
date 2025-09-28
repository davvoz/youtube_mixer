import { leftState, rightState, savePlaylistState } from "../state/playlistState.js";
import { embedUrl, thumbUrl } from "../utils/youtube.js";
import { leftPlayer, rightPlayer, leftListEl, rightListEl } from "./domRefs.js";

export function renderPanel(side, options = {}) {
  const { autoplay = false } = options;
  const state = side === "left" ? leftState : rightState;
  const listEl = side === "left" ? leftListEl : rightListEl;
  const playerEl = side === "left" ? leftPlayer : rightPlayer;

  const currentEmbed = embedUrl(state.current, { autoplay });
  const previousId = playerEl?.dataset?.currentId || "";
  const nextId = state.current || "";

  if (playerEl) {
    if (nextId && (nextId !== previousId || autoplay)) {
      playerEl.src = currentEmbed;
      playerEl.dataset.currentId = nextId;
    } else if (!nextId && previousId) {
      playerEl.removeAttribute("src");
      playerEl.dataset.currentId = "";
    }
  }

  if (!listEl) return;

  listEl.innerHTML = "";
  state.list.forEach((item, idx) => {
    const listItem = document.createElement("li");
    listItem.className = "item";
    if (state.current === item.id) {
      listItem.classList.add("playing");
    }

    listItem.innerHTML = `
      <img class="thumb" src="${thumbUrl(item.id)}" alt="">
      <div class="meta">
        <div class="title">${item.title || "Video"}</div>
        <div class="url">${item.url}</div>
      </div>
      <div class="actions">
        <button class="btn mini play" data-action="play">▶️ Play</button>
        <button class="btn mini move" data-action="up">⬆️</button>
        <button class="btn mini move" data-action="down">⬇️</button>
        <button class="btn mini remove" data-action="remove">🗑️</button>
      </div>
    `;

    const playBtn = listItem.querySelector('[data-action="play"]');
    const removeBtn = listItem.querySelector('[data-action="remove"]');
    const moveUpBtn = listItem.querySelector('[data-action="up"]');
    const moveDownBtn = listItem.querySelector('[data-action="down"]');

    playBtn.onclick = () => {
      state.current = item.id;
      renderPanel(side, { autoplay: true });
      savePlaylistState();
    };

    removeBtn.onclick = () => {
      state.list.splice(idx, 1);
      if (state.current === item.id) {
        state.current = state.list[0]?.id || null;
      }
      renderPanel(side);
      savePlaylistState();
    };

    moveUpBtn.onclick = () => {
      if (idx > 0) {
        const tmp = state.list[idx - 1];
        state.list[idx - 1] = state.list[idx];
        state.list[idx] = tmp;
        renderPanel(side);
        savePlaylistState();
      }
    };

    moveDownBtn.onclick = () => {
      if (idx < state.list.length - 1) {
        const tmp = state.list[idx + 1];
        state.list[idx + 1] = state.list[idx];
        state.list[idx] = tmp;
        renderPanel(side);
        savePlaylistState();
      }
    };

    listEl.appendChild(listItem);
  });
}

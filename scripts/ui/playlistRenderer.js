import { leftState, rightState, savePlaylistState } from "../state/playlistState.js";
import { embedUrl, thumbUrl } from "../utils/youtube.js";
import { leftPlayer, rightPlayer, leftListEl, rightListEl } from "./domRefs.js";

let globalPlayerListenerRegistered = false;

function sendYouTubeCommand(playerEl, command, args = []) {
  if (!playerEl?.contentWindow) return;

  playerEl.contentWindow.postMessage(
    JSON.stringify({ event: "command", func: command, args }),
    "*"
  );
}

function handlePlayerMessage(event) {
  const origin = event.origin || "";
  if (!origin.includes("youtube.com") && !origin.includes("youtube-nocookie.com")) return;

  const payload = typeof event.data === "string" ? event.data : JSON.stringify(event.data ?? "");
  if (!payload?.startsWith("{")) return;

  let data;
  try {
    data = JSON.parse(payload);
  } catch {
    return;
  }

  if (!data?.event || !data?.id) return;

  const playerEl = document.getElementById(data.id);
  if (!playerEl) return;

  if (data.event === "onReady") {
    playerEl.dataset.ytReady = "1";

    if (playerEl.dataset.pendingLoadId) {
      const pendingId = playerEl.dataset.pendingLoadId;
      const shouldAutoplay = playerEl.dataset.pendingAutoplay === "1";
      const command = shouldAutoplay ? "loadVideoById" : "cueVideoById";
      sendYouTubeCommand(playerEl, command, [{ videoId: pendingId }]);

      if (shouldAutoplay) {
        sendYouTubeCommand(playerEl, "playVideo");
      }

      playerEl.dataset.pendingLoadId = "";
      playerEl.dataset.pendingAutoplay = "";
      playerEl.dataset.pendingAction = "";
    } else if (playerEl.dataset.pendingAction === "play") {
      sendYouTubeCommand(playerEl, "playVideo");
      playerEl.dataset.pendingAction = "";
    }
  } else if (data.event === "onStateChange") {
    playerEl.dataset.ytState = String(data.info ?? "");
  }
}

function registerGlobalPlayerListener() {
  if (globalPlayerListenerRegistered) return;
  window.addEventListener("message", handlePlayerMessage);
  globalPlayerListenerRegistered = true;
}

function ensurePlayerListeners(playerEl) {
  if (!playerEl || playerEl.dataset.listenersAttached) return;

  registerGlobalPlayerListener();

  playerEl.addEventListener("load", () => {
    playerEl.dataset.ytReady = "";

    setTimeout(() => {
      if (!playerEl.contentWindow) return;
      const message = JSON.stringify({ event: "listening", id: playerEl.id });
      playerEl.contentWindow.postMessage(message, "*");
    }, 0);
  });

  playerEl.dataset.listenersAttached = "1";
}

export function renderPanel(side, options = {}) {
  const { autoplay = false } = options;
  const state = side === "left" ? leftState : rightState;
  const listEl = side === "left" ? leftListEl : rightListEl;
  const playerEl = side === "left" ? leftPlayer : rightPlayer;

  ensurePlayerListeners(playerEl);

  const currentEmbed = embedUrl(state.current, { autoplay: false });
  const previousId = playerEl?.dataset?.currentId || "";
  const nextId = state.current || "";
  const isPlayerReady = playerEl?.dataset?.ytReady === "1";

  if (playerEl) {
    if (nextId && nextId !== previousId) {
      playerEl.dataset.currentId = nextId;

      if (isPlayerReady && previousId) {
        playerEl.dataset.pendingLoadId = "";
        playerEl.dataset.pendingAutoplay = "";
        if (autoplay) {
          sendYouTubeCommand(playerEl, "loadVideoById", [{ videoId: nextId }]);
          sendYouTubeCommand(playerEl, "playVideo");
          playerEl.dataset.pendingAction = "";
        } else {
          sendYouTubeCommand(playerEl, "cueVideoById", [{ videoId: nextId }]);
          playerEl.dataset.pendingAction = "";
        }
      } else {
        playerEl.dataset.pendingAction = autoplay ? "play" : "";
        playerEl.dataset.pendingLoadId = "";
        playerEl.dataset.pendingAutoplay = "";

        if (!isPlayerReady) {
          playerEl.dataset.pendingLoadId = nextId;
          playerEl.dataset.pendingAutoplay = autoplay ? "1" : "";
        }

        playerEl.src = currentEmbed;
      }
    } else if (nextId && autoplay) {
      if (isPlayerReady) {
        sendYouTubeCommand(playerEl, "playVideo");
        playerEl.dataset.pendingAction = "";
      } else {
        playerEl.dataset.pendingAction = "play";
      }
    } else if (!nextId && previousId) {
      playerEl.removeAttribute("src");
      playerEl.dataset.currentId = "";
      playerEl.dataset.pendingAction = "";
    }

    if (!nextId) {
      playerEl.dataset.pendingAction = "";
      playerEl.dataset.pendingLoadId = "";
      playerEl.dataset.pendingAutoplay = "";
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

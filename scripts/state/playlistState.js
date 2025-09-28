const LEFT_STORAGE_KEY = "ytmixer_left";
const RIGHT_STORAGE_KEY = "ytmixer_right";

export const leftState = { list: [], current: null };
export const rightState = { list: [], current: null };

export function savePlaylistState() {
  localStorage.setItem(LEFT_STORAGE_KEY, JSON.stringify(leftState));
  localStorage.setItem(RIGHT_STORAGE_KEY, JSON.stringify(rightState));
}

export function loadPlaylistState() {
  try {
    const savedLeft = JSON.parse(localStorage.getItem(LEFT_STORAGE_KEY) || "null");
    const savedRight = JSON.parse(localStorage.getItem(RIGHT_STORAGE_KEY) || "null");

    if (savedLeft) Object.assign(leftState, savedLeft);
    if (savedRight) Object.assign(rightState, savedRight);
  } catch (error) {
    console.warn("Impossibile caricare lo stato delle playlist:", error);
  }
}

export function resetPlaylists() {
  leftState.list = [];
  rightState.list = [];
  leftState.current = null;
  rightState.current = null;
}

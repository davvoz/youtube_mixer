import { themeBtn } from "./domRefs.js";

const THEME_STORAGE_KEY = "ytmixer_theme";

export function applyTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode);
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  if (themeBtn) {
    themeBtn.innerHTML = mode === "dark" ? "☀️ Light" : "🌙 Dark";
  }
}

export function getStoredTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || "light";
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current === "light" ? "dark" : "light");
}

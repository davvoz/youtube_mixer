import { getVideoId, checkVideoAvailability } from "../utils/youtube.js";

const PIPED_ENDPOINTS = [
  "https://piped.video/api/v1/search",
  "https://pipedapi.kavin.rocks/api/v1/search"
];

export function deriveQueryFromSuggestion(suggestion) {
  if (!suggestion) return "";

  if (suggestion.url && suggestion.url.includes("youtube.com/results?search_query=")) {
    try {
      const searchParams = new URL(suggestion.url).searchParams;
      const query = searchParams.get("search_query");
      if (query) return decodeURIComponent(query);
    } catch {
      // Ignora errori di parsing
    }
  }

  if (suggestion.title) return suggestion.title;
  if (suggestion.reason) return suggestion.reason.replace(/https?:\/\/\S+/g, "").trim();
  if (suggestion.url) {
    return suggestion.url.replace(/^https?:\/\//, "").replace(/[-_/]/g, " ");
  }

  return "";
}

export async function findReplacementVideo(suggestion) {
  const query = deriveQueryFromSuggestion(suggestion);
  if (!query) return null;

  for (const endpoint of PIPED_ENDPOINTS) {
    const candidate = await lookupViaPiped(endpoint, query);
    if (candidate) {
      const availability = await checkVideoAvailability(candidate.url);
      if (availability.available) {
        return {
          title: suggestion.title || candidate.title || availability.title || "Video suggerito",
          url: candidate.url,
          reason: suggestion.reason || `Trovato automaticamente per "${query}"`
        };
      }
    }
  }

  const scrapedIds = await scrapeYouTubeForIds(query);
  for (const candidateId of scrapedIds) {
    const candidateUrl = `https://www.youtube.com/watch?v=${candidateId}`;
    const availability = await checkVideoAvailability(candidateUrl);
    if (availability.available) {
      return {
        title: suggestion.title || availability.title || "Video suggerito",
        url: candidateUrl,
        reason: suggestion.reason || `Trovato tramite ricerca YouTube per "${query}"`
      };
    }
  }

  return null;
}

export async function validateSuggestions(suggestions = []) {
  if (!Array.isArray(suggestions)) {
    return { valid: [], fallbacks: [], invalid: [], replacements: [] };
  }

  const valid = [];
  const fallbacks = [];
  const invalid = [];
  const replacements = [];
  const seenFallbacks = new Set();

  for (const rawSuggestion of suggestions) {
    const suggestion = normaliseSuggestion(rawSuggestion);
    const hasUrl = Boolean(suggestion.url);
    const id = hasUrl ? getVideoId(suggestion.url) : null;
    const isSearchUrl = hasUrl && suggestion.url.includes("youtube.com/results?search_query=");

    let needsReplacement = false;
    let fallbackReason = "";

    if (hasUrl && id) {
      try {
        const availability = await checkVideoAvailability(suggestion.url);
        if (availability.available) {
          valid.push({
            ...suggestion,
            title: suggestion.title || availability.title || "Video suggerito"
          });
          continue;
        }
        fallbackReason = "Video non disponibile";
        needsReplacement = true;
      } catch (error) {
        fallbackReason = "Errore nel verificare il video";
        needsReplacement = true;
      }
    } else {
      needsReplacement = true;
      fallbackReason = hasUrl
        ? (isSearchUrl ? "Link di ricerca fornito dal modello" : "Link non riconosciuto come video YouTube")
        : "URL assente";
    }

    const replacement = needsReplacement ? await findReplacementVideo(suggestion) : null;

    if (replacement) {
      valid.push(replacement);
      replacements.push({ original: suggestion, replacement });
      continue;
    }

    invalid.push(suggestion);

    const queryBase = deriveQueryFromSuggestion(suggestion) || "musica";
    const fallbackUrl = isSearchUrl
      ? suggestion.url
      : `https://www.youtube.com/results?search_query=${encodeURIComponent(queryBase)}`;

    if (!seenFallbacks.has(fallbackUrl)) {
      seenFallbacks.add(fallbackUrl);
      fallbacks.push({
        title: suggestion.title || queryBase,
        url: fallbackUrl,
        reason: `${fallbackReason}. Apri la ricerca per scegliere manualmente un video affidabile.`
      });
    }
  }

  return { valid, fallbacks, invalid, replacements };
}

async function lookupViaPiped(endpoint, query) {
  try {
    const response = await fetch(`${endpoint}?q=${encodeURIComponent(query)}&region=IT`, {
      method: "GET",
      headers: { Accept: "application/json" }
    });

    if (!response.ok) return null;

    const data = await response.json();
    const items = Array.isArray(data) ? data : data.items || [];
    const video = items.find((item) => item?.type === "video" && (item.id || item.url));
    if (!video) return null;

    const candidateUrl = video.url?.startsWith("http")
      ? video.url
      : `https://www.youtube.com${video.url || `/watch?v=${video.id}`}`;

    const candidateId = getVideoId(candidateUrl) || video.id;
    if (!candidateId) return null;

    return {
      id: candidateId,
      url: `https://www.youtube.com/watch?v=${candidateId}`,
      title: video.title
    };
  } catch (error) {
    console.warn("Errore ricerca Piped:", error.message);
    return null;
  }
}

async function scrapeYouTubeForIds(query) {
  try {
    const endpoint = `https://r.jina.ai/https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=en`;
    const response = await fetch(endpoint, { method: "GET", headers: { Accept: "text/plain" } });
    if (!response.ok) {
      throw new Error(`Ricerca YouTube fallita (${response.status})`);
    }

    const html = await response.text();
    const regex = /\/(?:watch\?v=|shorts\/)([a-zA-Z0-9_-]{11})/g;
    const seen = new Set();
    const ids = [];
    let match;

    while ((match = regex.exec(html)) !== null && ids.length < 10) {
      const id = match[1];
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }

    return ids;
  } catch (error) {
    console.warn("Errore durante lo scraping di YouTube:", error.message);
    return [];
  }
}

function normaliseSuggestion(raw) {
  return {
    title: typeof raw?.title === "string" ? raw.title.trim() : "",
    url: typeof raw?.url === "string" ? raw.url.trim() : "",
    reason: typeof raw?.reason === "string" ? raw.reason : ""
  };
}

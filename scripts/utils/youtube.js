export function getVideoId(url) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtube.com")) {
      if (parsedUrl.pathname === "/watch") {
        return parsedUrl.searchParams.get("v");
      }
      if (parsedUrl.pathname.startsWith("/shorts/")) {
        return parsedUrl.pathname.split("/")[2];
      }
      const parts = parsedUrl.pathname.split("/");
      if (parts[1] === "embed") {
        return parts[2];
      }
    }

    if (parsedUrl.hostname === "youtu.be") {
      return parsedUrl.pathname.slice(1);
    }
  } catch {
    // Ignora errori di parsing
  }

  return null;
}

export function embedUrl(id, { autoplay = false, mute = false } = {}) {
  if (!id) return "";

  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: mute ? "1" : "0",
    controls: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1"
  });

  if (typeof window !== "undefined") {
    const { origin, protocol } = window.location || {};
    if (origin && (protocol === "http:" || protocol === "https:")) {
      params.set("origin", origin);
    }
  }

  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

export function thumbUrl(id) {
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

export async function checkVideoAvailability(url) {
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

  try {
    const response = await fetch(endpoint, { mode: "cors" });
    if (!response.ok) {
      return { available: false };
    }

    const data = await response.json();
    return { available: true, title: data.title };
  } catch {
    return { available: false };
  }
}

const GITHUB_MODELS_ENDPOINT = "https://models.inference.ai.azure.com/models";
const GITHUB_COMPLETIONS_ENDPOINT = "https://models.github.ai/inference/chat/completions";
const HUGGING_FACE_WHOAMI = "https://huggingface.co/api/whoami-v2";
const HUGGING_FACE_MODEL_INFO = "https://huggingface.co/api/models";
const OPENAI_MODELS_ENDPOINT = "https://api.openai.com/v1/models";
const OPENAI_CHAT_COMPLETIONS_ENDPOINT = "https://api.openai.com/v1/chat/completions";

const POPULAR_HUGGINGFACE_MODELS = [
  "microsoft/DialoGPT-large",
  "facebook/blenderbot-400M-distill",
  "microsoft/DialoGPT-medium",
  "facebook/blenderbot-1B-distill",
  "microsoft/phi-2",
  "mistralai/Mistral-7B-Instruct-v0.1"
];

export async function fetchGitHubModels(token) {
  const response = await fetch(GITHUB_MODELS_ENDPOINT, {
    method: "GET",
    headers: buildAuthHeaders(token)
  });

  await ensureResponseOk(response, {
    401: "Token non valido o scaduto",
    403: "Accesso negato - verifica il token"
  });

  const payload = await response.json();
  const models = payload.data || payload.models || payload;

  if (!Array.isArray(models)) {
    throw new Error("Formato risposta non valido");
  }

  return models
    .filter((model) =>
      model.id && (model.id.includes("gpt") || model.id.includes("llama") || model.id.includes("mistral"))
    )
    .map((model) => ({
      id: model.id,
      name: model.friendly_name || model.display_name || model.id
    }));
}

export async function fetchHuggingFaceModels(token) {
  const availableModels = [];
  let checked = 0;

  for (const model of POPULAR_HUGGINGFACE_MODELS) {
    try {
      const response = await fetch(`${HUGGING_FACE_MODEL_INFO}/${model}`, {
        method: "GET",
        headers: token
          ? { Authorization: `Bearer ${token}`, "User-Agent": "YouTube-Mixer/1.0" }
          : { "User-Agent": "YouTube-Mixer/1.0" }
      });

      checked++;
      if (!response.ok) continue;

      const data = await response.json();
      const label = model.split("/")[1] || model;
      availableModels.push({
        id: model,
        name: data.pipeline_tag ? `${label} (${data.pipeline_tag})` : label
      });
    } catch (error) {
      console.warn(`Impossibile verificare il modello ${model}:`, error.message);
    }
  }

  if (availableModels.length === 0 && checked > 0) {
    throw new Error("Nessun modello disponibile o token non valido");
  }

  return availableModels;
}

export async function fetchOpenAIModels(token) {
  const response = await fetch(OPENAI_MODELS_ENDPOINT, {
    method: "GET",
    headers: buildAuthHeaders(token)
  });

  await ensureResponseOk(response, {
    401: "Token OpenAI non valido",
    429: "Limite rate raggiunto"
  });

  const data = await response.json();
  return (data.data || [])
    .filter((model) => model.id.includes("gpt") && !model.id.includes("instruct"))
    .map((model) => ({ id: model.id, name: model.id }))
    .sort((a, b) => b.id.localeCompare(a.id));
}

export async function callGitHubModel({ token, model, messages }) {
  if (!token) {
    throw new Error("Token GitHub mancante");
  }

  const payload = JSON.stringify({
    model: model || "openai/gpt-4o-mini",
    messages,
    temperature: 0.7,
    max_tokens: 1024,
    response_format: { type: "json_object" }
  });

  return new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", GITHUB_COMPLETIONS_ENDPOINT, true);
    xhr.setRequestHeader("Accept", "application/vnd.github+json");
    xhr.setRequestHeader("Authorization", `Bearer ${token.trim()}`);
    xhr.setRequestHeader("X-GitHub-Api-Version", "2022-11-28");
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const content = data.choices?.[0]?.message?.content;
          if (!content) {
            reject(new Error("Risposta GitHub priva di contenuto"));
            return;
          }
          resolve(JSON.parse(content));
        } catch (error) {
          reject(new Error(`Errore parsing risposta GitHub: ${error.message}`));
        }
        return;
      }

      if (xhr.status === 401) {
        reject(new Error("Autenticazione GitHub fallita. Verifica il token."));
        return;
      }

      if (xhr.status === 404) {
        reject(
          new Error(
            `Modello GitHub non trovato: "${model || "openai/gpt-4o-mini"}". Verifica il nome del modello.`
          )
        );
        return;
      }

      reject(new Error(`Errore API GitHub: ${xhr.status} ${xhr.statusText || ""}`.trim()));
    };

    xhr.onerror = function () {
      reject(new Error("Errore di connessione all'API GitHub."));
    };

    xhr.send(payload);
  });
}

export async function callHuggingFaceModel({ token, model, messages }) {
  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: messages.map((m) => `${m.role}: ${m.content}`).join("\n\n"),
      parameters: {
        max_new_tokens: 512,
        temperature: 0.7
      }
    })
  });

  await ensureResponseOk(response);
  const data = await response.json();
  const text = data[0]?.generated_text || "";

  try {
    const jsonMatch = text.match(/\{[^}]+\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Ignora parsing fallito
  }

  return {
    suggestions: [
      {
        title: "Cerca manualmente",
        url: "https://www.youtube.com/results?search_query=music",
        reason: "Risposta del modello non in formato JSON"
      }
    ]
  };
}

export async function callOpenAIModel({ token, model, messages }) {
  const response = await fetch(OPENAI_CHAT_COMPLETIONS_ENDPOINT, {
    method: "POST",
    headers: buildAuthHeaders(token),
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" }
    })
  });

  await ensureResponseOk(response);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

export async function validateToken(provider, token) {
  if (!token) {
    return { valid: false, error: "Token vuoto" };
  }

  try {
    switch (provider) {
      case "github": {
        const response = await fetch(GITHUB_MODELS_ENDPOINT, {
          method: "GET",
          headers: buildAuthHeaders(token)
        });
        return formatValidation(response.ok, response);
      }

      case "huggingface": {
        const response = await fetch(HUGGING_FACE_WHOAMI, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` }
        });
        return formatValidation(response.ok, response, "Token non valido o scaduto");
      }

      case "openai": {
        const response = await fetch(OPENAI_MODELS_ENDPOINT, {
          method: "GET",
          headers: buildAuthHeaders(token)
        });
        return formatValidation(response.ok, response, `Token non valido (${response.status})`);
      }

      default:
        return { valid: false, error: "Provider non supportato" };
    }
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

function buildAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "YouTube-Mixer/1.0"
  };
}

async function ensureResponseOk(response, customMessages = {}) {
  if (response.ok) return;

  const message =
    customMessages[response.status] ||
    customMessages.default ||
    `${response.status} ${response.statusText}`;

  throw new Error(message);
}

function formatValidation(isValid, response, defaultError) {
  return {
    valid: isValid,
    error: isValid ? null : defaultError || `Errore ${response.status}: ${response.statusText}`
  };
}

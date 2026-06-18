const parseEnvNumber = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://api.vidriobras.com").replace(/\/$/, "");
export const AI_CHAT_TIMEOUT_MS = parseEnvNumber(import.meta.env.VITE_AI_CHAT_TIMEOUT, 45000);
export const AI_HEALTH_TIMEOUT_MS = parseEnvNumber(import.meta.env.VITE_AI_HEALTH_TIMEOUT, 6000);
export const AI_SESSION_TIMEOUT_MS = parseEnvNumber(import.meta.env.VITE_AI_SESSION_TIMEOUT, 8000);
export const AI_HEALTH_POLL_MS = parseEnvNumber(import.meta.env.VITE_AI_HEALTH_POLL_MS, 5000);
export const AI_SESSION_KEEP_ALIVE = import.meta.env.VITE_AI_KEEP_ALIVE || "30m";

export const buildApiUrl = (path = "") => {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${safePath}`;
};

export const apiFetch = async (resource, init) => {
  let url = resource;

  if (typeof resource === "string") {
    if (resource.startsWith("/api")) {
      url = `${API_BASE_URL}${resource}`;
    }
  } else if (resource instanceof Request) {
    const path = new URL(resource.url, window.location.href).pathname;
    if (path.startsWith("/api")) {
      const reqUrl = `${API_BASE_URL}${path}${resource.url.includes("?") ? new URL(resource.url).search : ""}`;
      url = new Request(reqUrl, resource);
    }
  }

  const res = await fetch(url, init);

  const contentType = res.headers.get("content-type") || "";
  if (res.status >= 400) {
    // show detail when calling API incorrectly
    const text = await res.text();
    throw new Error(`API error (${res.status}) ${res.statusText}: ${text}`);
  }
  if (contentType.includes("text/html")) {
    const text = await res.text();
    throw new Error(`API returned HTML for JSON request: ${text.slice(0, 300)}...`);
  }

  return res;
};

export const consultarDocumentoApi = async (tipo, numero) => {
  const body = JSON.stringify({ tipo, numero });
  try {
    const response = await fetch(`${API_BASE_URL}/api/consulta_documento`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    return await response.json().catch(() => ({}));
  } catch (error) {
    return { success: false, error: error?.message || "Error consultando documento." };
  }
};

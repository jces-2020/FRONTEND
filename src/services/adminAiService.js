import { API_BASE_URL } from '../config';

const readNumberEnv = (value, fallback, { min = Number.NEGATIVE_INFINITY } = {}) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min ? parsed : fallback;
};

const DEFAULT_KEEP_ALIVE = import.meta.env.VITE_AI_KEEP_ALIVE || '30m';
const DEFAULT_CHAT_TIMEOUT_MS = readNumberEnv(import.meta.env.VITE_AI_CHAT_TIMEOUT_MS, 300000, { min: 1 });
const DEFAULT_SESSION_TIMEOUT_MS = readNumberEnv(import.meta.env.VITE_AI_SESSION_TIMEOUT_MS, 15000, { min: 1 });
const DEFAULT_STOP_TIMEOUT_MS = readNumberEnv(import.meta.env.VITE_AI_STOP_TIMEOUT_MS, 10000, { min: 1 });
const DEFAULT_MODEL = (import.meta.env.VITE_AI_MODEL || '').trim();
const DEFAULT_TEMPERATURE = readNumberEnv(import.meta.env.VITE_AI_TEMPERATURE, 0.2, { min: 0 });

export const API_IA_BASE_URL = (import.meta.env.VITE_AI_API_URL || API_BASE_URL).replace(/\/$/, '');
export { DEFAULT_KEEP_ALIVE, DEFAULT_MODEL, DEFAULT_TEMPERATURE };

async function fetchWithTimeout(url, init = {}, timeoutMs = DEFAULT_SESSION_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`La solicitud a la IA superó el tiempo de espera (${Math.ceil(timeoutMs / 1000)}s).`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) {
    const errorMessage = data?.error || `Error HTTP ${response.status}`;
    throw new Error(errorMessage);
  }
  return data;
}

export async function getAiHealth() {
  const response = await fetchWithTimeout(`${API_IA_BASE_URL}/api/ia/health`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  }, DEFAULT_SESSION_TIMEOUT_MS);

  const data = await parseJsonResponse(response);
  return data.data;
}

export async function sendAiChat({
  message,
  messages,
  systemPrompt,
  model = DEFAULT_MODEL,
  temperature = DEFAULT_TEMPERATURE,
  keepAlive = DEFAULT_KEEP_ALIVE,
}) {
  const payload = {
    temperature,
    system_prompt: systemPrompt,
    keep_alive: keepAlive,
  };

  if (message) payload.message = message;
  if (Array.isArray(messages) && messages.length > 0) payload.messages = messages;
  if (model) payload.model = model;

  const response = await fetchWithTimeout(`${API_IA_BASE_URL}/api/ia/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  }, DEFAULT_CHAT_TIMEOUT_MS);

  const data = await parseJsonResponse(response);
  return data.data;
}

export async function startAiSession(keepAlive = DEFAULT_KEEP_ALIVE) {
  const response = await fetchWithTimeout(`${API_IA_BASE_URL}/api/ia/session/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      keep_alive: keepAlive,
    }),
  }, DEFAULT_SESSION_TIMEOUT_MS);

  const data = await parseJsonResponse(response);
  return data.data;
}

export async function stopAiSession() {
  const response = await fetchWithTimeout(`${API_IA_BASE_URL}/api/ia/session/stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({}),
  }, DEFAULT_STOP_TIMEOUT_MS);

  const data = await parseJsonResponse(response);
  return data.data;
}

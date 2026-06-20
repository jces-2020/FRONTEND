import {
  AI_CHAT_TIMEOUT_MS,
  AI_HEALTH_TIMEOUT_MS,
  AI_SESSION_KEEP_ALIVE,
  AI_SESSION_TIMEOUT_MS,
  API_BASE_URL,
} from '../config';

export const API_IA_BASE_URL = API_BASE_URL;

async function fetchWithTimeout(url, init = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error(`La solicitud superó el tiempo de espera (${Math.ceil(timeoutMs / 1000)}s).`);
      timeoutError.name = 'TimeoutError';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function shouldRetry(error) {
  return error?.name === 'TimeoutError' || error instanceof TypeError;
}

async function withRetry(operation, retries = 1) {
  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !shouldRetry(error)) {
        throw error;
      }
      await sleep(250 * (attempt + 1));
      attempt += 1;
    }
  }

  throw lastError;
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
  const response = await withRetry(() => fetchWithTimeout(`${API_IA_BASE_URL}/api/ia/health`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  }, AI_HEALTH_TIMEOUT_MS));

  const data = await parseJsonResponse(response);
  return data.data;
}

export async function sendAiChat({ message, messages, systemPrompt, model, temperature = 0.2 }) {
  const response = await withRetry(() => fetchWithTimeout(`${API_IA_BASE_URL}/api/ia/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      message,
      messages,
      model,
      temperature,
      system_prompt: systemPrompt,
      keep_alive: AI_SESSION_KEEP_ALIVE,
    }),
  }, AI_CHAT_TIMEOUT_MS));

  const data = await parseJsonResponse(response);
  return data.data;
}

export async function startAiSession(keepAlive = AI_SESSION_KEEP_ALIVE) {
  const response = await fetchWithTimeout(`${API_IA_BASE_URL}/api/ia/session/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      keep_alive: keepAlive,
    }),
  }, AI_SESSION_TIMEOUT_MS);

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
  }, AI_SESSION_TIMEOUT_MS);

  const data = await parseJsonResponse(response);
  return data.data;
}

import { API_BASE_URL } from '../config';

export const API_IA_BASE_URL = API_BASE_URL;

async function fetchWithTimeout(url, init = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
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
  const response = await fetch(`${API_IA_BASE_URL}/api/ia/health`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const data = await parseJsonResponse(response);
  return data.data;
}

export async function sendAiChat({ message, messages, systemPrompt, model, temperature = 0.2 }) {
  const response = await fetch(`${API_IA_BASE_URL}/api/ia/chat`, {
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
      keep_alive: '30m',
    }),
  });

  const data = await parseJsonResponse(response);
  return data.data;
}

export async function startAiSession(keepAlive = '30m') {
  const response = await fetchWithTimeout(`${API_IA_BASE_URL}/api/ia/session/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      keep_alive: keepAlive,
    }),
  }, 8000);

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
  }, 6000);

  const data = await parseJsonResponse(response);
  return data.data;
}

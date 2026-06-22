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
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado y fue cancelada por timeout.');
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
  // Health check: 40s timeout (ejecuta solo UNA vez al abrir)
  // Si falla, devuelve null silenciosamente
  try {
    const response = await fetchWithTimeout(`${API_IA_BASE_URL}/api/ia/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }, 40000);

    if (!response.ok) {
      console.warn(`Health check failed with status ${response.status}`);
      return null; // Sin lanzar error
    }

    const data = await response.json().catch(() => null);
    if (data?.success === false) {
      console.warn('Health check returned success=false:', data?.error);
      return null; // Sin lanzar error
    }

    return data?.data || null;
  } catch (error) {
    // Timeout o error de red: devuelve null silenciosamente
    console.warn('Health check error (silenced):', error.message);
    return null;
  }
}

export async function sendAiChat({
  message,
  messages,
  systemPrompt,
  model,
  temperature,
  numPredict,
  numCtx,
  topP,
  repeatPenalty,
  keepAlive = '45m',
  timeoutMs = 180000,
}) {
  const response = await fetchWithTimeout(`${API_IA_BASE_URL}/api/ia/chat`, {
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
      num_predict: numPredict,
      num_ctx: numCtx,
      top_p: topP,
      repeat_penalty: repeatPenalty,
      system_prompt: systemPrompt,
      keep_alive: keepAlive,
    }),
  }, timeoutMs);

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
  }, 40000);

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

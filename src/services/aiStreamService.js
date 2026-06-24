// frontend/Reac/mi-proyecto/src/services/aiStreamService.js
// Servicio para chat con streaming en tiempo real

import { API_BASE_URL } from '../config';

export const API_IA_BASE_URL = API_BASE_URL;

/**
 * Chat con Streaming - Respuesta en tiempo real, palabra por palabra
 * @param {string} message - Mensaje del usuario
 * @param {Array} messages - Historial de mensajes
 * @param {Function} onToken - Callback cada token recibido: (token) => {}
 * @param {Function} onDone - Callback al finalizar: (fullResponse) => {}
 * @param {Function} onError - Callback en error: (error) => {}
 */
export async function streamAiChat({
  message,
  messages = [],
  model = 'tinyllama:1.1b',
  temperature = 0.1,
  system_prompt = 'Eres un asistente útil',
  keep_alive = '10m',
  onToken = () => {},
  onDone = () => {},
  onError = () => {},
}) {
  try {
    const response = await fetch(`${API_IA_BASE_URL}/api/ia/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        message,
        messages: messages.length > 0 ? messages : [{ role: 'user', content: message }],
        model,
        temperature,
        system_prompt,
        keep_alive,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.error) {
              onError(data.error);
              break;
            }

            if (data.token) {
              fullResponse += data.token;
              onToken(data.token);
            }

            if (data.done) {
              onDone(fullResponse || data.full_response);
              return fullResponse || data.full_response;
            }
          } catch (e) {
            console.error('Error parsing SSE:', e);
          }
        }
      }
    }
  } catch (error) {
    onError(error.message);
    throw error;
  }
}

/**
 * Chat sin Streaming (compatibilidad con API antigua)
 * @param {Object} params - Parámetros del chat
 */
export async function sendAiChat(params) {
  const { message, messages = [] } = params;

  if (!message && (!messages || messages.length === 0)) {
    throw new Error('Se requiere message o messages');
  }

  const response = await fetch(`${API_IA_BASE_URL}/api/ia/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Error desconocido');
  }

  return data.data;
}

/**
 * Health check
 */
export async function getAiHealth() {
  try {
    const response = await fetch(`${API_IA_BASE_URL}/api/ia/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.data || null;
  } catch {
    return null;
  }
}

/**
 * Session management
 */
export async function startAiSession(keepAlive = '10m') {
  const response = await fetch(`${API_IA_BASE_URL}/api/ia/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keep_alive: keepAlive }),
  });

  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function stopAiSession() {
  const response = await fetch(`${API_IA_BASE_URL}/api/ia/session/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}


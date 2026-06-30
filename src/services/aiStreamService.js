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
        keep_alive,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('La respuesta no contiene body de streaming.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() || '';

      for (const chunk of chunks) {
        const line = chunk.trim();
        if (!line.startsWith('data:')) continue;

        const raw = line.replace(/^data:\s*/, '');

        try {
          const data = JSON.parse(raw);

          if (data.error) {
            onError(data.error);
            return;
          }

          if (data.token) {
            fullResponse += data.token;
            onToken(data.token);
          }

          if (data.full_response && !fullResponse) {
            fullResponse = data.full_response;
          }

          if (data.done) {
            onDone(fullResponse || data.full_response || '');
            return fullResponse || data.full_response || '';
          }
        } catch (error) {
          console.error('Error parsing SSE:', error);
        }
      }
    }

    onDone(fullResponse);
    return fullResponse;
  } catch (error) {
    onError(error.message || 'Error en el streaming.');
    throw error;
  }
}

/**
 * Chat sin Streaming (compatibilidad con API antigua)
 * @param {Object} params - Parámetros del chat
 */
export async function sendAiChat(params) {
  const { message, messages = [], system_prompt, ...rest } = params || {};

  if (!message && (!messages || messages.length === 0)) {
    throw new Error('Se requiere message o messages');
  }

  const payload = {
    ...rest,
    message,
    messages,
  };

  const response = await fetch(`${API_IA_BASE_URL}/api/ia/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
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
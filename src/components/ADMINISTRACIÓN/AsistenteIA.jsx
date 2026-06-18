import React, { useEffect, useMemo, useRef, useState } from 'react';
import BrandButton from '../UI/BrandButton';
import { COLORS, FONTS } from '../../colors';
import { getAiHealth, sendAiChat, startAiSession, stopAiSession } from '../../services/adminAiService';
import {
  AI_HEALTH_POLL_MS,
  AI_MAX_CONTEXT_CHARS,
  AI_MAX_CONTEXT_MESSAGES,
  AI_SESSION_KEEP_ALIVE,
  API_BASE_URL,
} from '../../config';

const API_IA_BASE_URL = API_BASE_URL;

const DEFAULT_SYSTEM_PROMPT = 'Eres el asistente interno de VidrioBras. Responde en español, de forma clara, breve y útil para el equipo administrativo.';
const ELLIPSIS = '…';

function compactMessageContent(content) {
  const normalized = String(content || '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (normalized.length <= AI_MAX_CONTEXT_CHARS) {
    return normalized;
  }

  const availableChars = Math.max(1, AI_MAX_CONTEXT_CHARS - ELLIPSIS.length);
  const headLength = Math.max(1, Math.ceil(availableChars / 2));
  const tailLength = Math.max(0, Math.floor(availableChars / 2));
  if (tailLength === 0) {
    return normalized.slice(0, AI_MAX_CONTEXT_CHARS);
  }

  return `${normalized.slice(0, headLength)}${ELLIPSIS}${normalized.slice(-tailLength)}`;
}

function buildContextMessages(chatMessages) {
  return chatMessages
    .map((message) => ({
      role: message.role,
      content: compactMessageContent(message.content),
    }))
    .filter((message) => message.content.trim())
    .slice(-AI_MAX_CONTEXT_MESSAGES);
}

const statusBadge = (online) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 10px',
  borderRadius: '999px',
  fontSize: '0.74rem',
  fontWeight: 700,
  color: online ? '#0f766e' : '#991b1b',
  background: online ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
  border: `1px solid ${online ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.22)'}`,
});

const messageBubble = (role) => ({
  maxWidth: '82%',
  alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
  background: role === 'user'
    ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`
    : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(223,242,250,0.88) 100%)',
  color: role === 'user' ? COLORS.white : '#16425b',
  border: role === 'user' ? 'none' : '1px solid rgba(70,165,220,0.22)',
  borderRadius: role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
  padding: '12px 14px',
  boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)',
  whiteSpace: 'pre-wrap',
  lineHeight: 1.5,
  fontSize: '0.95rem',
});

function AsistenteIA({ onToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Asistente IA listo. Puedes consultarme sobre operaciones, reportes y tareas administrativas.',
    },
  ]);
  const scrollRef = useRef(null);

  const modelNames = useMemo(() => health?.models?.join(', ') || 'Sin modelos detectados', [health?.models]);

  useEffect(() => {
    if (!isOpen) {
      setHealthLoading(false);
      return undefined;
    }

    let active = true;

    async function loadHealth(notifyOnError = true) {
      setHealthLoading(true);
      try {
        const data = await getAiHealth();
        if (!active) return;
        setHealth(data);
      } catch (error) {
        if (!active) return;
        setHealth(null);
        if (notifyOnError) {
          onToast?.(error.message || 'No se pudo conectar con la API de IA.', 'error');
        } else {
          console.warn('[AsistenteIA] Falló la verificación de salud de la IA:', error);
        }
      } finally {
        if (active) setHealthLoading(false);
      }
    }

    async function openSession() {
      startAiSession(AI_SESSION_KEEP_ALIVE).catch((error) => {
        onToast?.(error.message || 'No se pudo iniciar sesión de IA.', 'error');
      });
      await loadHealth(true);
    }

    openSession();
    const intervalId = setInterval(() => {
      loadHealth(false).catch(() => null);
    }, AI_HEALTH_POLL_MS);

    return () => {
      active = false;
      clearInterval(intervalId);
      stopAiSession().catch(() => null);
    };
  }, [isOpen, onToast]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || sending) return;

    const nextMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setDraft('');
    setSending(true);

    try {
      const contextMessages = buildContextMessages(nextMessages);
      const result = await sendAiChat({
        messages: contextMessages,
        systemPrompt,
      });

      setMessages((current) => [...current, {
        role: 'assistant',
        content: result.response,
      }]);
    } catch (error) {
      onToast?.(error.message || 'No se pudo obtener respuesta de la IA.', 'error');
      setMessages((current) => [...current, {
        role: 'assistant',
        content: 'No pude responder en este momento. Revisa la conexión con api-ia e inténtalo otra vez.',
      }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Abrir chat de IA"
        style={{
          position: 'fixed',
          right: '18px',
          bottom: '18px',
          width: '62px',
          height: '62px',
          borderRadius: '999px',
          border: 'none',
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`,
          color: COLORS.white,
          fontSize: '1.6rem',
          boxShadow: '0 12px 28px rgba(148, 25, 24, 0.35)',
          cursor: 'pointer',
          zIndex: 1600,
        }}
      >
        {isOpen ? '×' : '🤖'}
      </button>

      {isOpen && (
        <section
          style={{
            position: 'fixed',
            right: '18px',
            bottom: '92px',
            width: 'min(410px, calc(100vw - 24px))',
            maxHeight: '78vh',
            background: 'linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(228,245,252,0.95) 100%)',
            border: '1px solid rgba(70,165,220,0.24)',
            borderRadius: '18px',
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.25)',
            overflow: 'hidden',
            zIndex: 1600,
            display: 'grid',
            gridTemplateRows: 'auto auto 1fr auto',
          }}
        >
          <header style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(70,165,220,0.16)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
              <div style={{ fontFamily: FONTS.heading, color: '#0c4f7a', fontSize: '1rem' }}>Asistente IA</div>
              <div style={statusBadge(Boolean(health?.available))}>
                <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: health?.available ? COLORS.success : COLORS.error }} />
                {healthLoading ? 'Verificando...' : health?.available ? 'Conectado' : 'Sin conexión'}
              </div>
            </div>
            <div style={{ color: '#527d99', fontSize: '0.74rem', marginTop: '6px' }}>
              {API_IA_BASE_URL} · {healthLoading ? 'Cargando modelo...' : modelNames}
            </div>
          </header>

          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(70,165,220,0.14)' }}>
            <textarea
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              rows={2}
              placeholder="Instrucción del sistema"
              style={{
                width: '100%',
                borderRadius: '10px',
                border: '1px solid rgba(70,165,220,0.2)',
                background: 'rgba(255,255,255,0.95)',
                padding: '8px 10px',
                color: '#12344d',
                fontFamily: FONTS.body,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                fontSize: '0.84rem',
              }}
            />
          </div>

          <div
            ref={scrollRef}
            style={{
              minHeight: '220px',
              maxHeight: '44vh',
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: 'radial-gradient(circle at top, rgba(208,237,250,0.45), rgba(255,255,255,0.94) 45%)',
            }}
          >
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} style={messageBubble(message.role)}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase', opacity: 0.8, marginBottom: '4px' }}>
                  {message.role === 'user' ? 'Tú' : 'IA'}
                </div>
                {message.content}
              </div>
            ))}
            {sending && (
              <div style={messageBubble('assistant')}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase', opacity: 0.8, marginBottom: '4px' }}>
                  IA
                </div>
                Pensando...
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '10px 12px 12px', borderTop: '1px solid rgba(70,165,220,0.14)', display: 'grid', gap: '8px' }}>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escribe tu consulta..."
              rows={3}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
              style={{
                width: '100%',
                borderRadius: '12px',
                border: '1px solid rgba(70,165,220,0.22)',
                background: 'rgba(255,255,255,0.98)',
                padding: '10px 12px',
                color: '#12344d',
                fontFamily: FONTS.body,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                fontSize: '0.9rem',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
              <div style={{ color: '#5a7f97', fontSize: '0.74rem' }}>Enter envía · Shift+Enter salto</div>
              <BrandButton type="submit" variant="primary" size="sm" disabled={sending || !draft.trim()}>
                {sending ? 'Consultando...' : 'Enviar'}
              </BrandButton>
            </div>
          </form>
        </section>
      )}
    </>
  );
}

export default AsistenteIA;

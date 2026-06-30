import React, { useEffect, useMemo, useRef, useState } from 'react';
import BrandButton from '../UI/BrandButton';
import { COLORS, FONTS } from '../../colors';
import { getAiHealth, streamAiChat } from '../../services/aiStreamService';
import { API_BASE_URL } from '../../config';

const API_IA_BASE_URL = API_BASE_URL;
const MAX_CONTEXT_MESSAGES = 8;

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
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu Asistente IA de VidrioBras. ¿En qué puedo ayudarte?',
    },
  ]);
  const [streamingMessage, setStreamingMessage] = useState('');
  const scrollRef = useRef(null);

  const modelName = useMemo(
    () => health?.default_model || 'Sin modelo detectado',
    [health?.default_model],
  );

  useEffect(() => {
    if (!isOpen) {
      setHealthLoading(false);
      return undefined;
    }

    let active = true;

    async function checkHealth() {
      setHealthLoading(true);
      try {
        const data = await getAiHealth();
        if (active) {
          setHealth(data);
        }
      } catch (error) {
        if (active) {
          setHealth(null);
        }
      } finally {
        if (active) setHealthLoading(false);
      }
    }

    checkHealth();

    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending, streamingMessage]);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || sending) return;

    const nextMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setDraft('');
    setStreamingMessage('');
    setSending(true);

    try {
      const contextMessages = [nextMessages[nextMessages.length - 1]];

      await streamAiChat({
        message: trimmed,
        messages: contextMessages,
        model: 'tinyllama:1.1b',
        temperature: 0.05,
        keep_alive: '10m',
        onToken: (token) => {
          setStreamingMessage((prev) => prev + token);
        },
        onDone: (fullResponse) => {
          setMessages((current) => [
            ...current,
            {
              role: 'assistant',
              content: fullResponse,
            },
          ]);
          setStreamingMessage('');
        },
        onError: (error) => {
          onToast?.(error || 'Error en streaming de IA.', 'error');
          setMessages((current) => [
            ...current,
            {
              role: 'assistant',
              content: 'Error en la conexión. Intenta nuevamente.',
            },
          ]);
          setStreamingMessage('');
        },
      });
    } catch (error) {
      onToast?.(error.message || 'No se pudo obtener respuesta de la IA.', 'error');
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'No pude responder en este momento. Revisa la conexión con api-ia e inténtalo otra vez.',
        },
      ]);
      setStreamingMessage('');
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
            gridTemplateRows: 'auto 1fr auto',
          }}
        >
          <header style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(70,165,220,0.16)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
              <div style={{ fontFamily: FONTS.heading, color: '#0c4f7a', fontSize: '1rem' }}>Asistente IA</div>
              <div style={statusBadge(Boolean(health?.available))}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '999px',
                    background: health?.available !== false ? COLORS.success : COLORS.error,
                  }}
                />
                {healthLoading ? 'Verificando...' : (!health || health.available) ? 'Conectado' : 'Sin conexión'}
              </div>
            </div>
            <div style={{ color: '#527d99', fontSize: '0.74rem', marginTop: '6px' }}>
              {API_IA_BASE_URL} · {healthLoading ? 'Cargando modelo...' : modelName}
            </div>
          </header>

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
            {streamingMessage && (
              <div style={messageBubble('assistant')}>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                    opacity: 0.8,
                    marginBottom: '4px',
                  }}
                >
                  IA
                </div>
                {streamingMessage}
                <span style={{ animation: 'blink 1s infinite', marginLeft: '2px' }}>|</span>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} style={messageBubble(message.role)}>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                    opacity: 0.8,
                    marginBottom: '4px',
                  }}
                >
                  {message.role === 'user' ? 'Tú' : 'IA'}
                </div>
                {message.content}
              </div>
            ))}

            {sending && (
              <div style={messageBubble('assistant')}>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                    opacity: 0.8,
                    marginBottom: '4px',
                  }}
                >
                  IA
                </div>
                Pensando...
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              padding: '10px 12px 12px',
              borderTop: '1px solid rgba(70,165,220,0.14)',
              display: 'grid',
              gap: '8px',
            }}
          >
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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import BrandButton from '../UI/BrandButton';
import { COLORS, FONTS } from '../../colors';
import { getAiHealth, sendAiChat } from '../../services/adminAiService';
import { API_BASE_URL } from '../../config';

const API_IA_BASE_URL = API_BASE_URL;

const DEFAULT_SYSTEM_PROMPT = 'Eres el asistente interno de VidrioBras. Responde en español, de forma clara, breve y útil para el equipo administrativo.';

const panelStyles = {
  display: 'grid',
  gap: '18px',
};

const topGridStyles = {
  display: 'grid',
  gap: '14px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
};

const cardStyles = {
  background: 'linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(226,244,252,0.78) 100%)',
  border: '1px solid rgba(70,165,220,0.22)',
  borderRadius: '18px',
  boxShadow: '0 10px 24px rgba(70,155,210,0.10)',
  padding: '18px',
};

const statusBadge = (online) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  borderRadius: '999px',
  fontSize: '0.82rem',
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
    let active = true;

    async function loadHealth() {
      setHealthLoading(true);
      try {
        const data = await getAiHealth();
        if (!active) return;
        setHealth(data);
      } catch (error) {
        if (!active) return;
        setHealth(null);
        onToast?.(error.message || 'No se pudo conectar con la API de IA.', 'error');
      } finally {
        if (active) {
          setHealthLoading(false);
        }
      }
    }

    loadHealth();
    return () => {
      active = false;
    };
  }, [onToast]);

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
      const result = await sendAiChat({
        messages: nextMessages,
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
    <section style={panelStyles}>
      <div style={topGridStyles}>
        <article style={cardStyles}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: FONTS.heading, fontSize: '1.2rem', color: '#0c4f7a', marginBottom: '8px' }}>
                Asistente administrativo
              </div>
              <div style={{ color: '#50748f', fontSize: '0.92rem', lineHeight: 1.5 }}>
                Este panel consume la API de IA desplegada en el VPS y usa Ollama como motor local.
              </div>
            </div>
            <div style={statusBadge(Boolean(health?.available))}>
              <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: health?.available ? COLORS.success : COLORS.error }} />
              {healthLoading ? 'Verificando...' : health?.available ? 'Conectado' : 'Sin conexión'}
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'grid', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.4px', color: '#5b8aa8', marginBottom: '4px' }}>
                Endpoint
              </div>
              <div style={{ color: '#12344d', fontWeight: 700 }}>{API_IA_BASE_URL}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.4px', color: '#5b8aa8', marginBottom: '4px' }}>
                Modelo disponible
              </div>
              <div style={{ color: '#12344d' }}>{healthLoading ? 'Cargando...' : modelNames}</div>
            </div>
          </div>
        </article>

        <article style={cardStyles}>
          <div style={{ fontFamily: FONTS.heading, fontSize: '1rem', color: '#0c4f7a', marginBottom: '10px' }}>
            Instrucción del sistema
          </div>
          <textarea
            value={systemPrompt}
            onChange={(event) => setSystemPrompt(event.target.value)}
            rows={7}
            style={{
              width: '100%',
              borderRadius: '14px',
              border: '1px solid rgba(70,165,220,0.24)',
              background: 'rgba(255,255,255,0.94)',
              padding: '12px 14px',
              color: '#12344d',
              fontFamily: FONTS.body,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </article>
      </div>

      <article style={{ ...cardStyles, padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(70,165,220,0.16)' }}>
          <div style={{ fontFamily: FONTS.heading, fontSize: '1.05rem', color: '#0c4f7a' }}>
            Chat del administrador
          </div>
          <div style={{ marginTop: '6px', color: '#5a7f97', fontSize: '0.9rem' }}>
            Haz preguntas operativas, pide resúmenes o define luego tareas específicas para el asistente.
          </div>
        </div>

        <div
          ref={scrollRef}
          style={{
            minHeight: '360px',
            maxHeight: '58vh',
            overflowY: 'auto',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'radial-gradient(circle at top, rgba(208,237,250,0.45), rgba(255,255,255,0.94) 45%)',
          }}
        >
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} style={messageBubble(message.role)}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase', opacity: 0.8, marginBottom: '6px' }}>
                {message.role === 'user' ? 'Tú' : 'IA'}
              </div>
              {message.content}
            </div>
          ))}
          {sending && (
            <div style={messageBubble('assistant')}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase', opacity: 0.8, marginBottom: '6px' }}>
                IA
              </div>
              Pensando...
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px 18px 18px', borderTop: '1px solid rgba(70,165,220,0.16)', display: 'grid', gap: '12px' }}>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Escribe una consulta para el asistente..."
            rows={4}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
            style={{
              width: '100%',
              borderRadius: '16px',
              border: '1px solid rgba(70,165,220,0.24)',
              background: 'rgba(255,255,255,0.98)',
              padding: '14px 16px',
              color: '#12344d',
              fontFamily: FONTS.body,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ color: '#5a7f97', fontSize: '0.84rem' }}>
              Enter envía. Shift + Enter agrega salto de línea.
            </div>
            <BrandButton type="submit" variant="primary" disabled={sending || !draft.trim()}>
              {sending ? 'Consultando...' : 'Enviar al asistente'}
            </BrandButton>
          </div>
        </form>
      </article>
    </section>
  );
}

export default AsistenteIA;

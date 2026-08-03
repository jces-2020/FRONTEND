import React, { useEffect, useState } from 'react';
import { COLORS } from './colors';

function Footer() {
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Verifica si el usuario está al final de la página
      const atBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 2;
      setShowFooter(atBottom);
    };

    window.addEventListener('scroll', handleScroll);
  // No mostrar el footer al cargar, solo cuando el usuario hace scroll

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!showFooter) return null;
  return null; // Footer deshabilitado temporalmente

  return (
    <footer
      className="w-full fixed left-0 bottom-0"
      style={{
        width: '100vw',
        zIndex: 100,
        color: COLORS.light,
        background: `linear-gradient(110deg, rgba(20,24,42,0.96) 0%, ${COLORS.primary} 42%, ${COLORS.secondaryDark} 100%)`,
        borderTop: '1px solid rgba(255,255,255,0.16)',
        boxShadow: '0 -12px 28px rgba(2,6,23,0.35)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="w-full px-3 sm:px-5 py-2"
        style={{
          display: 'grid',
          gap: 6,
          alignItems: 'center',
          gridTemplateColumns: '1fr',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '999px',
                background: '#7dd3fc',
                boxShadow: '0 0 12px rgba(125,211,252,0.85)',
              }}
            />
            <span className="font-heading" style={{ fontWeight: 700, letterSpacing: '0.05em', fontSize: '0.82rem' }}>
              VIDRIOBRAS
            </span>
            <span style={{ opacity: 0.78, fontSize: '0.74rem' }}>Instalaciones en vidrio y aluminio</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '3px 8px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.22)',
                background: 'rgba(255,255,255,0.08)',
              }}
            >
              Atención personalizada
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '3px 8px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.22)',
                background: 'rgba(255,255,255,0.08)',
              }}
            >
              Garantía de instalación
            </span>
          </div>
        </div>

        <div style={{ height: 1, width: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.32), transparent)' }} />

        <span className="font-body text-[11px] sm:text-xs text-center" style={{ opacity: 0.9 }}>
          © 2026 VIDRIOBRAS. Todos los derechos reservados.
        </span>
      </div>
    </footer>
  );
}

export default Footer;

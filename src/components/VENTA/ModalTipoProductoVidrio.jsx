import React from 'react';
import { FONTS } from '../../colors';
import { IconTable, IconCards } from '@tabler/icons-react';
import BrandCard from '../UI/BrandCard';
import BrandCtaButton from '../UI/BrandCtaButton';

const ModalTipoProductoVidrio = ({
  producto,
  tipoProducto,
  onPlancha,
  onVara,
  onCortes,
  onCancel
}) => {
  const esAluminio = tipoProducto === 'ALUMINIOS';
  const esVidrio   = tipoProducto === 'VIDRIOS';

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(4, 10, 22, .55)',
        backdropFilter: 'blur(10px) saturate(150%)',
        WebkitBackdropFilter: 'blur(10px) saturate(150%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1200, padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      <div style={{ width: 'min(460px, 100%)' }}>
        <BrandCard title={`${esAluminio ? 'Aluminio' : esVidrio ? 'Vidrio' : '?'} — ¿Cómo lo agregas?`}>
          <div style={{ padding: '22px 22px 24px' }}>
            <p style={{
              textAlign: 'center',
              color: '#5a7a90',
              fontFamily: FONTS.body,
              marginTop: 0,
              marginBottom: 20,
              fontSize: 14,
            }}>
              {producto?.nombre || 'Producto seleccionado'}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 14,
            }}>
              {esVidrio && (
                <BrandCtaButton variant="primary" onClick={() => onPlancha?.(producto)}>
                  <IconTable stroke={1.25} size={18} /> PLANCHA
                </BrandCtaButton>
              )}

              {esAluminio && (
                <BrandCtaButton variant="primary" onClick={() => onVara?.(producto)}>
                  <IconTable stroke={1.25} size={18} /> VARILLA
                </BrandCtaButton>
              )}

              <BrandCtaButton variant="secondary" onClick={() => onCortes?.(producto)}>
                <IconCards stroke={1.25} size={18} /> CORTES
              </BrandCtaButton>
            </div>

            <button
              onClick={onCancel}
              style={{
                width: '100%', padding: '12px',
                borderRadius: 12,
                border: '1.5px solid rgba(128,194,220,.35)',
                background: '#ffffff',
                color: '#5a7a90',
                fontWeight: 700,
                fontFamily: FONTS.heading,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        </BrandCard>
      </div>
    </div>
  );
};

export default ModalTipoProductoVidrio;

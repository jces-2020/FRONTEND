import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ComprobantePagoExito() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 140px)',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(180deg, #f3f8fb 0%, #e9f1f7 100%)',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          background: '#ffffff',
          border: '1px solid #dbe7f0',
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(15, 76, 129, 0.12)',
          padding: '28px 24px',
        }}
      >
        <h1 style={{ margin: 0, color: '#0f4c81', fontSize: 28, lineHeight: 1.1 }}>
          Pago confirmado con éxito
        </h1>
        <p style={{ margin: '14px 0 8px', color: '#334155', fontSize: 17, lineHeight: 1.5 }}>
          Gracias por tu aporte como trabajador. Tu pago fue registrado correctamente.
        </p>
        <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14 }}>
          Puedes cerrar esta ventana o volver al inicio del sistema.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              border: 'none',
              borderRadius: 10,
              padding: '10px 16px',
              background: '#0f4c81',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Ir al inicio
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              border: '1px solid #c9d9e7',
              borderRadius: 10,
              padding: '10px 16px',
              background: '#ffffff',
              color: '#0f4c81',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Ir a login
          </button>
        </div>
      </div>
    </div>
  );
}

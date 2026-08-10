import { useState } from 'react';
import ModalFacturacion from './VENTA/ModalFacturacion';

const PRODUCTOS_EJEMPLO = [
  { codigo: 'VID-001', descripcion: 'Vidrio templado 6mm', cantidad: 2, precio_unitario: 45.5 },
  { codigo: 'ALU-002', descripcion: 'Perfil de aluminio 3m', cantidad: 3, precio_unitario: 22.0 },
  { codigo: 'VID-010', descripcion: 'Espejo 4mm', cantidad: 1, precio_unitario: 60 },
];

export default function PreviewComprobante() {
  const [show, setShow] = useState(true);

  if (!show) {
    return (
      <div style={{ padding: 60, textAlign: 'center', fontFamily: 'sans-serif' }}>
        <p>Modal cerrado.</p>
        <button
          type="button"
          onClick={() => setShow(true)}
          style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #0d9488', background: '#0f766e', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
        >
          Volver a abrir comprobante
        </button>
      </div>
    );
  }

  return (
    <ModalFacturacion
      productos={PRODUCTOS_EJEMPLO}
      autoCloseOnComprobante={false}
      onClose={() => setShow(false)}
      onComprobanteGenerado={(data) => {
        console.log('[PREVIEW comprobante] generado:', data);
      }}
    />
  );
}

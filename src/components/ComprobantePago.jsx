import { useEffect, useState } from 'react';
import { FONTS } from '../colors';
import ModalFacturacion from './VENTA/ModalFacturacion';

const FACTURACION_PENDIENTE_KEY = 'facturacion_pendiente';

export const construirProductosFacturacion = (items) => {
  return (Array.isArray(items) ? items : []).map((p) => ({
    codigo: p.codigo || p.codigo_producto || p.id_producto,
    descripcion: p.descripcion || p.nombre,
    cantidad: Number(p.cantidad) || 1,
    precio_unitario: Number(p.precio_unitario) || 0,
  }));
};

export function useComprobantePago({ clearCart, setCarritoId }) {
  const [showFacturacionModal, setShowFacturacionModal] = useState(false);
  const [facturacionProductos, setFacturacionProductos] = useState([]);
  const [registroPagoPendienteId, setRegistroPagoPendienteId] = useState(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(FACTURACION_PENDIENTE_KEY);
      if (!saved) return;
      const productos = JSON.parse(saved);
      if (Array.isArray(productos) && productos.length > 0) {
        setFacturacionProductos(productos);
        setShowFacturacionModal(true);
      }
    } catch {}
  }, []);

  const guardarFacturacionPendiente = (productos) => {
    const payload = Array.isArray(productos) ? productos : [];
    setFacturacionProductos(payload);
    setShowFacturacionModal(true);
    try { sessionStorage.setItem(FACTURACION_PENDIENTE_KEY, JSON.stringify(payload)); } catch {}
  };

  const limpiarFacturacionPendiente = () => {
    setFacturacionProductos([]);
    setRegistroPagoPendienteId(null);
    setShowFacturacionModal(false);
    try { sessionStorage.removeItem(FACTURACION_PENDIENTE_KEY); } catch {}
  };

  const marcarFacturacionCompletada = () => {
    try { sessionStorage.removeItem(FACTURACION_PENDIENTE_KEY); } catch {}
    localStorage.removeItem('carrito_id');
    clearCart();
    setCarritoId(null);
    setFacturacionProductos([]);
    setRegistroPagoPendienteId(null);
  };

  return {
    showFacturacionModal,
    setShowFacturacionModal,
    facturacionProductos,
    registroPagoPendienteId,
    setRegistroPagoPendienteId,
    guardarFacturacionPendiente,
    limpiarFacturacionPendiente,
    marcarFacturacionCompletada,
  };
}

export default function ComprobantePago({
  carritoLocal,
  showFacturacionModal,
  setShowFacturacionModal,
  facturacionProductos,
  registroPagoPendienteId,
  registrarCompraParaSeguimiento,
  marcarFacturacionCompletada,
  limpiarFacturacionPendiente,
  showToast,
  setMensaje,
  clearCart,
  setCarritoId,
  navigate,
}) {
  return (
    <>
      {facturacionProductos.length > 0 && !showFacturacionModal && (
        <button
          type="button"
          onClick={() => setShowFacturacionModal(true)}
          style={{ marginTop: 8, padding: '10px 20px', borderRadius: 10, border: '1px solid #0d9488', background: '#0f766e', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: FONTS.heading }}
        >
          Generar comprobante
        </button>
      )}

      {showFacturacionModal && (
        <ModalFacturacion
          productos={facturacionProductos.length > 0 ? facturacionProductos : construirProductosFacturacion(carritoLocal)}
          registroPagoId={registroPagoPendienteId}
          onComprobanteGenerado={async () => {
            const okSeguimiento = await registrarCompraParaSeguimiento();
            if (!okSeguimiento) { showToast('Se generó el comprobante, pero no se pudo registrar el seguimiento.', 'payment-info'); return; }
            marcarFacturacionCompletada();
            showToast('Compra registrada y carrito limpiado correctamente.', 'update');
          }}
          onClose={() => {
            limpiarFacturacionPendiente();
            localStorage.removeItem('carrito_id');
            clearCart();
            setCarritoId(null);
            setMensaje('');
            setTimeout(() => navigate('/panelcliente', { replace: true }), 300);
          }}
        />
      )}
    </>
  );
}

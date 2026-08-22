import { useEffect, useRef, useState } from 'react';
import { IconRoute, IconMapPin } from '@tabler/icons-react';
import { FONTS } from '../../colors';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Origen fijo: local de VidrioBras (Jr. Los Comuneros 1286, Huancayo).
// Coordenadas aproximadas por geocodificación de la dirección (no hay lat/lng
// exacta configurada aún) — ajustar aquí si se consigue el punto exacto
// (clic derecho sobre el local en Google Maps > copiar coordenadas).
const ORIGEN_TIENDA = { lat: -12.0690931, lng: -75.1996710 };

const MONTO_MINIMO_RUTA_AUTOMATICA = 1000;

let googleMapsPromise = null;
function loadGoogleMaps(apiKey) {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = '__vbInitGoogleMapsRuta';
    window[callbackName] = () => { resolve(window.google.maps); delete window[callbackName]; };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('No se pudo cargar Google Maps'));
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

const authHeaders = () => {
  try {
    const t = localStorage.getItem('personalToken');
    if (t) return { Authorization: `Bearer ${t}` };
  } catch {}
  return {};
};

/**
 * Ruta de entrega desde la tienda hasta la ubicación guardada del cliente.
 * - Si el pedido supera S/ 1000, la ruta se muestra automáticamente.
 * - Si no, se muestra un botón "Mostrar ruta" para revelarla bajo demanda.
 * Reutilizable desde Entrega (OBRAS) y Servicio (OBRAS); solo necesita el
 * carrito_id del pedido/trabajo en curso.
 */
const RutaEntrega = ({ carritoId }) => {
  const mapElRef = useRef(null);
  const [totalPedido, setTotalPedido] = useState(null);
  const [ubicacion, setUbicacion] = useState(null);
  const [mostrarRuta, setMostrarRuta] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setTotalPedido(null);
    setUbicacion(null);
    setMostrarRuta(false);
    setError('');
    if (!carritoId) return;

    let cancelado = false;
    const headers = authHeaders();

    Promise.all([
      fetch(`/api/admin/pedidos/${carritoId}/detalle`, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`/api/ubicacion/ruta/${carritoId}`, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([detalle, ubi]) => {
      if (cancelado) return;
      const total = Number(detalle?.total_precio || 0);
      setTotalPedido(total);
      if (ubi?.success && ubi.latitud != null && ubi.longitud != null) {
        setUbicacion(ubi);
      }
      setMostrarRuta(total > MONTO_MINIMO_RUTA_AUTOMATICA);
    });

    return () => { cancelado = true; };
  }, [carritoId]);

  useEffect(() => {
    if (!mostrarRuta || !ubicacion || !mapElRef.current) return;
    if (!GOOGLE_MAPS_API_KEY) { setError('Falta configurar VITE_GOOGLE_MAPS_API_KEY.'); return; }

    let cancelado = false;
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then((maps) => {
        if (cancelado || !mapElRef.current) return;
        const destino = { lat: Number(ubicacion.latitud), lng: Number(ubicacion.longitud) };
        const map = new maps.Map(mapElRef.current, {
          center: destino,
          zoom: 13,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        const directionsService = new maps.DirectionsService();
        const directionsRenderer = new maps.DirectionsRenderer({ map });
        directionsService.route(
          { origin: ORIGEN_TIENDA, destination: destino, travelMode: maps.TravelMode.DRIVING },
          (result, status) => {
            if (cancelado) return;
            if (status === 'OK') {
              directionsRenderer.setDirections(result);
            } else {
              setError(`No se pudo calcular la ruta (${status}).`);
            }
          }
        );
      })
      .catch(() => { if (!cancelado) setError('No se pudo cargar Google Maps.'); });

    return () => { cancelado = true; };
  }, [mostrarRuta, ubicacion]);

  if (!carritoId || totalPedido === null) return null;

  if (!ubicacion) {
    return (
      <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: FONTS.body }}>
        Este cliente no tiene una ubicación guardada para trazar la ruta.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {!mostrarRuta ? (
        <button
          type="button"
          onClick={() => setMostrarRuta(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'start',
            padding: '6px 12px', borderRadius: 8, border: '1px solid #bed0de',
            background: '#f5fafd', color: '#1e4d6b', fontFamily: FONTS.heading,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          <IconRoute size={14} stroke={1.75} /> Mostrar ruta de entrega
        </button>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconMapPin size={14} stroke={1.75} color="#557488" />
            <span style={{ fontFamily: FONTS.heading, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#557488' }}>
              Ruta de entrega{ubicacion.direccion ? ` — ${ubicacion.direccion}` : ''}
            </span>
          </div>
          <div ref={mapElRef} style={{ width: '100%', height: 260, borderRadius: 8, border: '1px solid #b8c9d6', background: '#eef4f8' }} />
        </>
      )}
      {error && <div style={{ fontSize: 11, color: '#b45309' }}>{error}</div>}
    </div>
  );
};

export default RutaEntrega;

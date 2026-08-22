import { useEffect, useRef, useState } from 'react';
import { IconRoute, IconMapPin, IconNavigation, IconPlayerStop, IconCircleCheck } from '@tabler/icons-react';
import { FONTS } from '../../colors';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Origen fijo: local de VidrioBras (Jr. Los Comuneros 292, Huancayo).
// Coordenadas aproximadas por geocodificación de la calle (Nominatim no
// resuelve a nivel de número exacto para esta dirección) — reemplazar por
// las coordenadas exactas si se consiguen (clic derecho sobre el local en
// Google Maps > copiar coordenadas).
const ORIGEN_TIENDA = { lat: -12.0690931, lng: -75.1996710 };

const MONTO_MINIMO_RUTA_AUTOMATICA = 1000;
const RADIO_LLEGADA_METROS = 60;

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

// Distancia en línea recta entre dos coordenadas (fórmula de Haversine).
function distanciaMetros(a, b) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatDistancia(m) {
  if (m == null) return '';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

/**
 * Ruta de entrega desde la tienda hasta la ubicación guardada del cliente,
 * con seguimiento GPS en vivo opcional (marca la posición actual sobre el
 * mapa y avisa en verde al llegar al destino).
 * - Si el pedido supera S/ 1000, la ruta se muestra automáticamente.
 * - Si no, se muestra un botón "Mostrar ruta" para revelarla bajo demanda.
 * Reutilizable desde Entrega (OBRAS) y Servicio/Remetro (OBRAS):
 * - `carritoId`: pedido de producto ya con carrito_compras real (Entrega,
 *   Instalación). El monto se resuelve solo si no se pasa `monto`.
 * - `presupuestoId`: servicio recien cotizado, todavia sin carrito (Remetro).
 *   En este caso `monto` es obligatorio (el precio ya se conoce en pantalla).
 */
const RutaEntrega = ({ carritoId, presupuestoId, monto }) => {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const currentMarkerRef = useRef(null);
  const watchIdRef = useRef(null);

  const claveJob = carritoId || presupuestoId || null;

  const [totalPedido, setTotalPedido] = useState(null);
  const [ubicacion, setUbicacion] = useState(null);
  const [mostrarRuta, setMostrarRuta] = useState(false);
  const [mapaListo, setMapaListo] = useState(false);
  const [siguiendo, setSiguiendo] = useState(false);
  const [llegado, setLlegado] = useState(false);
  const [distanciaM, setDistanciaM] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setTotalPedido(null);
    setUbicacion(null);
    setMostrarRuta(false);
    setError('');
    if (!claveJob) return;

    let cancelado = false;
    const headers = authHeaders();

    const ubicacionUrl = presupuestoId
      ? `/api/ubicacion/ruta/presupuesto/${presupuestoId}`
      : `/api/ubicacion/ruta/${carritoId}`;
    const totalPromise = monto != null
      ? Promise.resolve({ total_precio: monto })
      : fetch(`/api/admin/pedidos/${carritoId}/detalle`, { headers })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

    Promise.all([
      totalPromise,
      fetch(ubicacionUrl, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([detalle, ubi]) => {
      if (cancelado) return;
      const total = Number(detalle?.total_precio ?? monto ?? 0);
      setTotalPedido(total);
      if (ubi?.success && ubi.latitud != null && ubi.longitud != null) {
        setUbicacion(ubi);
      }
      setMostrarRuta(total > MONTO_MINIMO_RUTA_AUTOMATICA);
    });

    return () => { cancelado = true; };
  }, [claveJob, carritoId, presupuestoId, monto]);

  // Dibuja el mapa y la ruta estática tienda -> cliente (una sola vez por pedido).
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
        mapRef.current = map;

        const directionsService = new maps.DirectionsService();
        const directionsRenderer = new maps.DirectionsRenderer({ map, suppressMarkers: false });
        directionsService.route(
          {
            origin: ORIGEN_TIENDA,
            destination: destino,
            travelMode: maps.TravelMode.DRIVING,
            drivingOptions: { departureTime: new Date(), trafficModel: 'bestguess' },
          },
          (result, status) => {
            if (cancelado) return;
            if (status === 'OK') {
              directionsRenderer.setDirections(result);
              setMapaListo(true);
            } else {
              setError(`No se pudo calcular la ruta (${status}).`);
            }
          }
        );
      })
      .catch(() => { if (!cancelado) setError('No se pudo cargar Google Maps.'); });

    return () => { cancelado = true; };
  }, [mostrarRuta, ubicacion]);

  const detenerSeguimiento = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSiguiendo(false);
  };

  const iniciarSeguimiento = () => {
    if (!navigator.geolocation) { setError('Este dispositivo no soporta GPS.'); return; }
    if (!mapRef.current || !window.google?.maps) return;
    setError('');
    setLlegado(false);
    setSiguiendo(true);

    const destino = { lat: Number(ubicacion.latitud), lng: Number(ubicacion.longitud) };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const actual = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const maps = window.google.maps;

        if (!currentMarkerRef.current) {
          currentMarkerRef.current = new maps.Marker({
            position: actual,
            map: mapRef.current,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
            title: 'Tu ubicación actual',
            zIndex: 999,
          });
        } else {
          currentMarkerRef.current.setPosition(actual);
        }
        mapRef.current.panTo(actual);

        const dist = distanciaMetros(actual, destino);
        setDistanciaM(dist);

        if (dist <= RADIO_LLEGADA_METROS) {
          setLlegado(true);
          currentMarkerRef.current.setIcon({
            path: maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: '#22c55e',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          });
          detenerSeguimiento();
        }
      },
      () => {
        setError('No se pudo obtener tu ubicación GPS. Verifica los permisos del navegador.');
        detenerSeguimiento();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
  };

  // Corta el GPS si se cambia de pedido o se desmonta el componente.
  useEffect(() => () => {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
  }, [claveJob]);

  if (!claveJob || totalPedido === null) return null;

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconMapPin size={14} stroke={1.75} color="#557488" />
              <span style={{ fontFamily: FONTS.heading, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#557488' }}>
                Ruta de entrega{ubicacion.direccion ? ` — ${ubicacion.direccion}` : ''}
              </span>
            </div>

            {mapaListo && !llegado && (
              <button
                type="button"
                onClick={siguiendo ? detenerSeguimiento : iniciarSeguimiento}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 11px', borderRadius: 8,
                  border: `1px solid ${siguiendo ? '#fecaca' : '#bed0de'}`,
                  background: siguiendo ? '#fef2f2' : '#f5fafd',
                  color: siguiendo ? '#b91c1c' : '#1e4d6b',
                  fontFamily: FONTS.heading, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {siguiendo ? <IconPlayerStop size={13} stroke={1.75} /> : <IconNavigation size={13} stroke={1.75} />}
                {siguiendo ? 'Detener seguimiento' : 'Iniciar seguimiento GPS'}
              </button>
            )}
          </div>

          <div ref={mapElRef} style={{ width: '100%', height: 260, borderRadius: 8, border: '1px solid #b8c9d6', background: '#eef4f8' }} />

          {llegado ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8,
              background: '#dcfce7', border: '1px solid #86efac', color: '#166534',
              fontFamily: FONTS.heading, fontSize: 12, fontWeight: 700,
            }}>
              <IconCircleCheck size={16} stroke={1.75} /> Has llegado al destino
            </div>
          ) : siguiendo && distanciaM != null ? (
            <div style={{ fontSize: 11, color: '#5a7a90', fontFamily: FONTS.body }}>
              En camino — faltan {formatDistancia(distanciaM)} para llegar
            </div>
          ) : null}
        </>
      )}
      {error && <div style={{ fontSize: 11, color: '#b45309' }}>{error}</div>}
    </div>
  );
};

export default RutaEntrega;

import { useEffect, useRef, useState } from 'react';
import { IconCurrentLocation, IconMapPin } from '@tabler/icons-react';
import { FONTS } from '../../colors';

const DEFAULT_CENTER = { lat: -12.0686, lng: -75.2103 }; // Huancayo

let googleMapsPromise = null;

function loadGoogleMapsScript(apiKey) {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = '__vbInitGoogleMaps';
    window[callbackName] = () => {
      resolve(window.google.maps);
      delete window[callbackName];
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('No se pudo cargar Google Maps'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

const MapaUbicacion = ({ direccion, referencia, latitud, longitud, onChange, apiKey }) => {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const skipForwardGeocodeRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [mapsReady, setMapsReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [locating, setLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState('');

  useEffect(() => {
    if (!apiKey) {
      setLoadError('Falta configurar VITE_GOOGLE_MAPS_API_KEY.');
      return;
    }
    let cancelado = false;
    loadGoogleMapsScript(apiKey)
      .then(() => { if (!cancelado) setMapsReady(true); })
      .catch(() => { if (!cancelado) setLoadError('No se pudo cargar Google Maps.'); });
    return () => { cancelado = true; };
  }, [apiKey]);

  const moveMarkerTo = (lat, lng) => {
    if (!mapRef.current || !markerRef.current) return;
    const pos = { lat, lng };
    markerRef.current.setPosition(pos);
    mapRef.current.panTo(pos);
    if (mapRef.current.getZoom() < 16) mapRef.current.setZoom(16);
  };

  const handleCoordsPicked = async (lat, lng) => {
    setGeoNotice('');
    try {
      const res = await fetch('/api/reverse-geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });
      const data = await res.json();
      const direccionResuelta = data?.success ? data.direccion : direccion;
      skipForwardGeocodeRef.current = true;
      onChangeRef.current({ direccion: direccionResuelta || direccion || '', referencia, latitud: lat, longitud: lng });
    } catch {
      skipForwardGeocodeRef.current = true;
      onChangeRef.current({ direccion: direccion || '', referencia, latitud: lat, longitud: lng });
    }
  };

  useEffect(() => {
    if (!mapsReady || mapRef.current || !mapElRef.current) return;

    const center = (latitud && longitud) ? { lat: Number(latitud), lng: Number(longitud) } : DEFAULT_CENTER;
    const map = new window.google.maps.Map(mapElRef.current, {
      center,
      zoom: (latitud && longitud) ? 16 : 13,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });
    const marker = new window.google.maps.Marker({ position: center, map, draggable: true });

    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      handleCoordsPicked(pos.lat(), pos.lng());
    });
    map.addListener('click', (e) => {
      marker.setPosition(e.latLng);
      handleCoordsPicked(e.latLng.lat(), e.latLng.lng());
    });

    mapRef.current = map;
    markerRef.current = marker;
    geocoderRef.current = new window.google.maps.Geocoder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsReady]);

  // Geocodifica hacia adelante cuando el usuario escribe la direccion manualmente
  useEffect(() => {
    if (!mapsReady || !geocoderRef.current) return;
    if (skipForwardGeocodeRef.current) { skipForwardGeocodeRef.current = false; return; }
    const texto = String(direccion || '').trim();
    if (texto.length < 6) return;

    const timer = setTimeout(() => {
      geocoderRef.current.geocode({ address: texto, region: 'pe' }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const loc = results[0].geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();
          moveMarkerTo(lat, lng);
          onChangeRef.current({ direccion, referencia, latitud: lat, longitud: lng });
        }
      });
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direccion, mapsReady]);

  const usarUbicacionActual = () => {
    if (!navigator.geolocation) {
      setGeoNotice('Tu navegador no soporta geolocalización.');
      return;
    }
    setLocating(true);
    setGeoNotice('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        moveMarkerTo(lat, lng);
        await handleCoordsPicked(lat, lng);
        setLocating(false);
      },
      () => {
        setGeoNotice('No se pudo obtener tu ubicación. Verifica los permisos del navegador.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: FONTS.heading, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#557488' }}>
          Ubicación en el mapa
        </span>
        <button
          type="button"
          onClick={usarUbicacionActual}
          disabled={locating || !mapsReady}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid #bed0de',
            background: locating ? '#eaf2f7' : '#f5fafd',
            color: '#1e4d6b',
            fontFamily: FONTS.body,
            fontSize: 12,
            fontWeight: 700,
            cursor: (locating || !mapsReady) ? 'not-allowed' : 'pointer',
          }}
        >
          <IconCurrentLocation size={14} stroke={1.75} />
          {locating ? 'Ubicando...' : 'Usar mi ubicación actual (GPS)'}
        </button>
      </div>

      {loadError ? (
        <div style={{ padding: 12, borderRadius: 8, border: '1px dashed #d5dfe7', color: '#8a5a00', background: '#fff8ea', fontSize: 12 }}>
          {loadError}
        </div>
      ) : (
        <div
          ref={mapElRef}
          style={{ width: '100%', height: 260, borderRadius: 8, border: '1px solid #b8c9d6', background: '#eef4f8' }}
        />
      )}

      {geoNotice && <div style={{ fontSize: 11, color: '#b45309' }}>{geoNotice}</div>}

      <div>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontFamily: FONTS.heading, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1f4968' }}>
          Referencia (opcional)
        </label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5b7f98' }}>
            <IconMapPin size={14} stroke={1} />
          </span>
          <input
            value={referencia || ''}
            onChange={(e) => onChangeRef.current({ direccion, referencia: e.target.value, latitud, longitud })}
            placeholder="Ej: Frente al parque, casa color verde"
            style={{
              width: '100%',
              padding: '11px 12px 11px 38px',
              border: '1px solid #b8c9d6',
              borderRadius: 8,
              fontFamily: FONTS.body,
              fontSize: 14,
              background: '#fbfdff',
              color: '#223447',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {(latitud && longitud) && (
        <div style={{ fontSize: 10, color: '#7a93a3' }}>
          Lat: {Number(latitud).toFixed(6)} · Lng: {Number(longitud).toFixed(6)}
        </div>
      )}
    </div>
  );
};

export default MapaUbicacion;

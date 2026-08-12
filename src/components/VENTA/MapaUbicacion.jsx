etj-rgko-cnp

JHOSEP CARLOS ELESCANO SOLIS
18:02
import { useEffect, useRef, useState } from 'react';
import { IconCurrentLocation, IconMapPin } from '@tabler/icons-react';
import { FONTS } from '../../colors';

const DEFAULT_CENTER = { lat: -12.0686, lng: -75.2103 }; // Huancayo
const HUANCAYO_BOUNDS = { south: -12.30, west: -75.35, north: -11.85, east: -74.95 };

function estaDentroDeHuancayo(lat, lng) {
  return (
    lat >= HUANCAYO_BOUNDS.south && lat <= HUANCAYO_BOUNDS.north &&
    lng >= HUANCAYO_BOUNDS.west && lng <= HUANCAYO_BOUNDS.east
  );
}

// Google suele taggear distritos como Chilca/El Tambo bajo "sublocality" en vez de
// "locality" (que muchas veces devuelve el nombre genérico "Huancayo"). Probamos
// varias fuentes en orden de especificidad y dejamos que el llamador elija la que matchee.
function extractDistritoCandidatos(components) {
  if (!Array.isArray(components)) return [];
  const tiposPrioridad = ['sublocality_level_1', 'sublocality', 'locality', 'administrative_area_level_3'];
  const candidatos = [];
  tiposPrioridad.forEach((tipo) => {
    const comp = components.find((c) => c.types?.includes(tipo));
    if (comp?.long_name && !candidatos.includes(comp.long_name)) candidatos.push(comp.long_name);
  });
  return candidatos;
}

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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('No se pudo cargar Google Maps'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

const MapaUbicacion = ({ direccion, referencia, latitud, longitud, onChange, apiKey, inputRef }) => {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const autocompleteRef = useRef(null);
  const boundsRef = useRef(null);
  const skipForwardGeocodeRef = useRef(false);
  const lastValidPosRef = useRef(
    (latitud && longitud) ? { lat: Number(latitud), lng: Number(longitud) } : DEFAULT_CENTER
  );
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

  const reverseGeocodeClient = (lat, lng) => new Promise((resolve) => {
    if (!geocoderRef.current) { resolve(null); return; }
    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        resolve({ direccion: results[0].formatted_address, distritos: extractDistritoCandidatos(results[0].address_components) });
      } else {
        resolve(null);
      }
    });
  });

  const handleCoord
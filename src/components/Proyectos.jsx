import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { COLORS, FONTS } from '../colors';
import { buildApiUrl } from '../config';
import PresupuestoServicio from './PresupuestoServicio';

const PH = 'https://via.placeholder.com/1200x700?text=Servicio';
const imgSrc = s => s?.imagen_public_url || PH;
const servicioId = (s) => String(s?.id_servicio || s?.id || s?.idServicio || '');
const servicioNombre = (s) => String(s?.nombre || s?.nombre_servicio || s?.titulo || 'Servicio');
const normalizeServicio = (row = {}) => ({
  ...row,
  id_servicio: row?.id_servicio || row?.id || row?.idServicio,
  nombre: servicioNombre(row),
  descripcion: row?.descripcion || row?.detalle || '',
});

// Detecta qué imágenes son anchas (horizontales) precargándolas, y devuelve
// solo esas — el carrusel inmersivo necesita fotos horizontales para lucir bien.
const useWideOnly = (items, limit) => {
  const [wideIds, setWideIds] = useState(() => new Set());
  const pool = items.slice(0, 24);
  const poolKey = pool.map(servicioId).join(',');

  useEffect(() => {
    let cancelled = false;
    pool.forEach((it) => {
      const im = new Image();
      im.onload = () => {
        if (cancelled || im.naturalWidth <= im.naturalHeight * 1.05) return;
        const id = servicioId(it);
        setWideIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
      };
      im.src = imgSrc(it);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolKey]);

  return useMemo(
    () => pool.filter((it) => wideIds.has(servicioId(it))).slice(0, limit),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [poolKey, wideIds, limit]
  );
};

/* ══════════════════════════════════════════════════════════════════
   SERVICIO PANEL — desliza desde la IZQUIERDA, debajo del navbar
   Animación spring entrada/salida con anime.js-style CSS
══════════════════════════════════════════════════════════════════ */
const ServicioPanel = ({ servicio, servicios, onClose, onSelect }) => {
  const panelRef = useRef(null);
  const overlayRef = useRef(null);
  const [navH, setNavH] = useState(64);

  /* detectar -- navbar height */
  useEffect(() => {
    const nav = document.querySelector('nav');
    if (nav) setNavH(nav.getBoundingClientRect().height);
  }, []);

  /* entrada con CSS animation */
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.style.transform = 'translateX(-100%)';
      panelRef.current.style.opacity = '0';
      requestAnimationFrame(() => {
        panelRef.current.style.transition = 'transform 0.42s cubic-bezier(0.22,1,0.36,1), opacity 0.28s ease';
        panelRef.current.style.transform = 'translateX(0)';
        panelRef.current.style.opacity = '1';
      });
    }
    if (overlayRef.current) {
      overlayRef.current.style.opacity = '0';
      requestAnimationFrame(() => {
        overlayRef.current.style.transition = 'opacity 0.3s ease';
        overlayRef.current.style.opacity = '1';
      });
    }
  }, [servicio?.id_servicio]);

  /* salida animada */
  const closeAnim = () => {
    if (panelRef.current) {
      panelRef.current.style.transition = 'transform 0.32s cubic-bezier(0.55,0,1,0.45), opacity 0.28s ease';
      panelRef.current.style.transform = 'translateX(-105%)';
      panelRef.current.style.opacity = '0';
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = 'opacity 0.3s ease';
      overlayRef.current.style.opacity = '0';
    }
    setTimeout(onClose, 340);
  };

  if (!servicio) return null;

  /* similares por palabras en común en el nombre */
  const palabras = servicio.nombre.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const similares = servicios
    .filter(s => s.id_servicio !== servicio.id_servicio)
    .map(s => {
      const nombreS = s.nombre.toLowerCase();
      const coincidencias = palabras.filter(w => nombreS.includes(w)).length;
      return { ...s, _score: coincidencias };
    })
    .filter(s => s._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 6);

  /* si no hay similares por nombre, mostrar los primeros */
  const fallback = similares.length === 0
    ? servicios.filter(s => s.id_servicio !== servicio.id_servicio).slice(0, 4)
    : similares;

  return (
    <>
      {/* Overlay */}
      <div ref={overlayRef}
        style={{ position: 'fixed', inset: 0, background: 'rgba(10,18,36,.44)', zIndex: 900, opacity: 0, cursor: 'pointer' }}
        onClick={closeAnim} />

      {/* Panel izquierdo */}
      <div ref={panelRef} style={{
        position: 'fixed',
        top: navH,
        left: 0,
        bottom: 0,
        width: 'min(480px, 100vw)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: `linear-gradient(180deg,#fff 0%,${COLORS.surface} 100%)`,
        boxShadow: '8px 0 48px rgba(10,18,54,.22)',
        borderRight: `4px solid ${COLORS.primary}`,
        transform: 'translateX(-100%)',
        opacity: 0,
      }}>

        {/* ── IMAGEN HERO ── */}
        <div style={{ position: 'relative', flexShrink: 0, height: 'clamp(200px,34vw,280px)', overflow: 'hidden', background: '#1a1a2e' }}>
          <img src={imgSrc(servicio)} alt={servicio.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: 'brightness(.88)' }}
            onError={e => { e.target.onerror = null; e.target.src = PH; }} />

          {/* Gradiente oscuro inferior */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,.72) 0%,rgba(0,0,0,.08) 55%,transparent 100%)' }} />

          {/* Barra rojo→celeste→amarillo en top */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg,${COLORS.primary},${COLORS.secondary},${COLORS.accent})` }} />

          {/* Badge categoría flotante */}
          {servicio.categoria && (
            <div style={{
              position: 'absolute', top: 16, left: 16,
              background: 'rgba(255,255,255,.14)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,.32)',
              padding: '4px 12px', borderRadius: 999,
              fontSize: 9, fontWeight: 700, letterSpacing: '.18em',
              textTransform: 'uppercase', color: '#fff',
              fontFamily: FONTS.body,
            }}>{servicio.categoria}</div>
          )}

          {/* Nombre flotante sobre imagen */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 20px' }}>
            <h2 style={{
              fontFamily: FONTS.heading,
              fontSize: 'clamp(20px,4vw,30px)', fontWeight: 700,
              color: '#fff', margin: 0, lineHeight: 1.05,
              textTransform: 'uppercase', letterSpacing: '.02em',
              textShadow: '0 2px 12px rgba(0,0,0,.5)',
            }}>{servicio.nombre}</h2>
          </div>

          {/* Botón ✕ */}
          <button onClick={closeAnim} style={{
            position: 'absolute', top: 12, right: 12,
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(0,0,0,.42)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,.3)',
            color: '#fff', fontSize: 15, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.primary}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,.42)'}>
            ✕
          </button>
        </div>

        {/* ── CONTENIDO scrollable ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', padding: '20px 22px 48px', display: 'flex', flexDirection: 'column', gap: 18, minHeight: 0, scrollbarWidth: 'thin', scrollbarColor: `${COLORS.primary}44 transparent` }}>

          {/* Eyebrow */}
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: COLORS.primary, fontFamily: FONTS.body }}>
            Detalle del Servicio
          </div>

          {/* Descripción */}
          {servicio.descripcion && (
            <p style={{ fontSize: 14, color: COLORS.textLight, lineHeight: 1.72, margin: 0, fontFamily: FONTS.body }}>
              {servicio.descripcion}
            </p>
          )}

          {/* Divisor */}
          <div style={{ height: 1, background: `linear-gradient(90deg,${COLORS.primary}44,${COLORS.secondary}22,transparent)` }} />

          {/* Atributos en grid */}
          {(servicio.grosor || servicio.categoria) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {servicio.categoria && (
                <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: COLORS.steel, marginBottom: 3, fontFamily: FONTS.body }}>Categoría</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, fontFamily: FONTS.body }}>{servicio.categoria}</div>
                </div>
              )}
              {servicio.grosor && (
                <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: COLORS.steel, marginBottom: 3, fontFamily: FONTS.body }}>Grosor</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, fontFamily: FONTS.body }}>{servicio.grosor}</div>
                </div>
              )}
            </div>
          )}

          {/* CTA eliminado */}

          {/* Servicios similares — masonry columns desordenado */}
          {fallback.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <div style={{ flex: 1, height: 1, background: COLORS.border }} />
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: COLORS.steel, fontFamily: FONTS.body, whiteSpace: 'nowrap' }}>
                  {similares.length > 0 ? 'Servicios Similares' : 'Otros Servicios'}
                </span>
                <div style={{ flex: 1, height: 1, background: COLORS.border }} />
              </div>

              {/* Masonry: columnCount + aspect ratios variables = efecto desordenado */}
              <div style={{ columnCount: 2, columnGap: 10 }}>
                {fallback.map((s, i) => {
                  const aspects = ['3/4', '4/3', '1/1', '3/2', '2/3', '16/9'];
                  const aspect = aspects[i % aspects.length];
                  const ac = [COLORS.primary, COLORS.secondary, COLORS.accent][i % 3];
                  return (
                    <div key={s.id_servicio}
                      onClick={() => onSelect(s)}
                      style={{ breakInside: 'avoid', marginBottom: 10, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: `1px solid ${COLORS.border}`, transition: 'transform .22s,box-shadow .22s', display: 'block' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.15)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                      <div style={{ position: 'relative', aspectRatio: aspect, overflow: 'hidden', background: '#f1f5f9' }}>
                        <img src={imgSrc(s)} alt={s.nombre}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .4s ease' }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                          onMouseLeave={e => e.currentTarget.style.transform = ''}
                          onError={e => { e.target.onerror = null; e.target.src = PH; }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,.58) 0%,transparent 55%)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', top: 8, left: 8, width: 7, height: 7, borderRadius: '50%', background: ac, boxShadow: `0 0 8px ${ac}88` }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: FONTS.heading, textTransform: 'uppercase', letterSpacing: '.04em', lineHeight: 1.2 }}>
                            {s.nombre}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

/* ══════════════════════════════════════════════════════════════════
   IMMERSIVE CAROUSEL HERO
══════════════════════════════════════════════════════════════════ */
const ImmersiveCarousel = ({ servicios, onClick }) => {
  const [active, setActive] = useState(0);
  const [textKey, setTextKey] = useState(0);
  const autoRef = useRef(null);
  const total = servicios.length;

  const go = useCallback((nextIdx) => {
    if (nextIdx === active) return;
    setActive(nextIdx);
    setTextKey(k => k + 1);
  }, [active]);

  const goNext = useCallback(() => go((active + 1) % total), [active, total, go]);
  const goPrev = useCallback(() => go((active - 1 + total) % total), [active, total, go]);

  useEffect(() => {
    autoRef.current = setInterval(goNext, 5500);
    return () => clearInterval(autoRef.current);
  }, [goNext]);

  const s = servicios[active];
  if (!s) return null;

  return (
    <div className="ic-root">
      <div className="ic-stage">
        <div className="ic-stage-accent" />
        {servicios.map((sv, i) => (
          <div key={sv.id_servicio || i}
            className={`ic-bg-layer ${i === active ? 'ic-bg-active' : ''}`}
            style={{ backgroundImage: `url(${imgSrc(sv)})`, opacity: i === active ? 1 : 0, zIndex: i === active ? 2 : 1 }} />
        ))}

        <div className="ic-panel" key={textKey}>
          <div className="ic-eyebrow">
            <div className="ic-ey-line" />
            <span>{s.categoria || 'Vidriobras · Servicios'}</span>
          </div>
          <h1 className="ic-title">{s.nombre.toUpperCase()}</h1>
          {s.descripcion && <p className="ic-desc">{s.descripcion.substring(0, 130)}{s.descripcion.length > 130 ? '…' : ''}</p>}
          <div className="ic-actions">
            <button className="ic-discover-btn" onClick={() => onClick(s)}>
              <span className="ic-disc-icon">▶</span>
              <span>DESCUBRIR SERVICIO</span>
            </button>
          </div>
        </div>
      </div>

      {/* Franja inferior: progreso + miniaturas + contador */}
      <div className="ic-progress-wrap">
        {servicios.map((_, i) => (
          <div key={i} className="ic-prog-seg">
            <div className="ic-prog-fill"
              style={{ background: i === active ? COLORS.primary : COLORS.border, width: i === active ? '100%' : (i < active ? '100%' : '0%'), transition: i === active ? 'width 5.5s linear' : 'none' }} />
          </div>
        ))}
      </div>

      <div className="ic-thumbs-row">
        <div className="ic-thumbs-outer">
          <div className="ic-thumbs-track"
            style={{ transform: `translateX(${-Math.max(0, active - 2) * (130 + 10)}px)` }}>
            {servicios.map((sv, i) => {
              const isActive = i === active;
              return (
                <div key={sv.id_servicio || i}
                  className={`ic-thumb ${isActive ? 'ic-thumb-active' : ''}`}
                  onClick={() => { clearInterval(autoRef.current); go(i); }}>
                  <img src={imgSrc(sv)} alt={sv.nombre} className="ic-thumb-img"
                    onError={e => { e.target.onerror = null; e.target.src = PH; }} />
                  <div className="ic-thumb-ov" />
                  <div className="ic-thumb-info">
                    <div className="ic-thumb-name">{sv.nombre.toUpperCase()}</div>
                  </div>
                  <div className="ic-thumb-bar" style={{ opacity: isActive ? 1 : 0 }} />
                </div>
              );
            })}
          </div>
        </div>
        <div className="ic-counter">
          <span className="ic-counter-cur">{String(active + 1).padStart(2, '0')}</span>
          <span className="ic-counter-sep" />
          <span className="ic-counter-tot">{String(total).padStart(2, '0')}</span>
        </div>
        <div className="ic-arrows">
          <button className="ic-arrow" onClick={() => { clearInterval(autoRef.current); goPrev(); }}>&#8249;</button>
          <button className="ic-arrow" onClick={() => { clearInterval(autoRef.current); goNext(); }}>&#8250;</button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   PROJECT CARD — la única tarjeta usada para todo el catálogo.
   Prioridad a la imagen (sin oscurecerla), sombra en la tarjeta (no en
   la foto), texto en su propia zona sólida debajo.
══════════════════════════════════════════════════════════════════ */
const ProjectCard = ({ s, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <div className="pc-card"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => onClick(s)}>
      <div className="pc-img-wrap">
        <img src={imgSrc(s)} alt={servicioNombre(s)} className="pc-img"
          style={{ transform: hov ? 'scale(1.045)' : 'scale(1)' }}
          onError={e => { e.target.onerror = null; e.target.src = PH; }} />
      </div>
      <div className="pc-body">
        {s.categoria && <div className="pc-cat">{s.categoria}</div>}
        <div className="pc-name">{servicioNombre(s)}</div>
        {s.descripcion && <p className="pc-desc">{s.descripcion.substring(0, 90)}{s.descripcion.length > 90 ? '…' : ''}</p>}
      </div>
      <div className="pc-bar" style={{ transform: hov ? 'scaleX(1)' : 'scaleX(0)' }} />
    </div>
  );
};

/* ══ DIVIDER ═════════════════════════════════════════════════════ */
const SD = ({ label, color = COLORS.primary }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '52px clamp(20px,5vw,60px) 40px' }}>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(to right,${color}55,${color}18,transparent)` }} />
    <span style={{ background: color, color: color === COLORS.accent ? COLORS.primaryDark : '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', padding: '5px 16px', fontFamily: FONTS.body }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(to left,${color}55,${color}18,transparent)` }} />
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════ */
const Proyectos = () => {
  const [servicios, setServicios] = useState([]);
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [presupuestoOpen, setPresupuestoOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [areaUsuario, setAreaUsuario] = useState('');
  const [loading, setLoading] = useState(true);
  const [realtimeNuevoServicio, setRealtimeNuevoServicio] = useState(null);
  const [servicioResaltadoId, setServicioResaltadoId] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState('TODAS');

  const cargarServicios = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const r = await fetch('/api/servicios');
      const d = await r.json();
      if (d?.ok && Array.isArray(d.data)) {
        setServicios(d.data.map(normalizeServicio));
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const verificar = async () => {
      try {
        const token = localStorage.getItem('personalToken');
        if (!token) { setAreaUsuario(''); return; }
        const res = await fetch('/api/personal/me', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success && data.personal)
          setAreaUsuario((data.personal.area || '').toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''));
        else setAreaUsuario('');
      } catch { setAreaUsuario(''); }
    };
    verificar();
  }, []);

  useEffect(() => {
    cargarServicios();
  }, [cargarServicios]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') return undefined;

    const es = new EventSource(buildApiUrl('/api/realtime/servicios'));

    const onServiciosChanged = (evt) => {
      try {
        const payload = JSON.parse(evt.data || '{}');
        const changes = Array.isArray(payload?.changes) ? payload.changes : [];
        if (!changes.length) return;

        const isInitial = Boolean(payload?.initial);

        setServicios((prev) => {
          let next = [...prev];

          if (isInitial) {
            const snap = changes
              .filter((ch) => ch?.op === 'snapshot' && ch?.record)
              .map((ch) => normalizeServicio(ch.record));
            if (snap.length) next = snap;
            return next;
          }

          for (const ch of changes) {
            const op = ch?.op;
            const rec = ch?.record ? normalizeServicio(ch.record) : null;
            const id = String(ch?.id || servicioId(rec || {}));
            if (!id) continue;

            if (op === 'insert' && rec) {
              const existe = next.some((s) => servicioId(s) === id);
              if (!existe) {
                next = [rec, ...next];
                setRealtimeNuevoServicio(rec?.nombre || 'Nuevo servicio');
                setServicioResaltadoId(id);
                setTimeout(() => setRealtimeNuevoServicio(null), 3200);
                setTimeout(() => setServicioResaltadoId(null), 4200);
              }
              continue;
            }

            if (op === 'update' && rec) {
              const idx = next.findIndex((s) => servicioId(s) === id);
              if (idx >= 0) next[idx] = { ...next[idx], ...rec };
              continue;
            }

            if (op === 'delete') {
              next = next.filter((s) => servicioId(s) !== id);
            }
          }

          return next;
        });
      } catch (e) {
        console.error('[Proyectos SSE] error parseando evento', e);
      }
    };

    es.addEventListener('servicios_changed', onServiciosChanged);

    es.onerror = () => {
      // EventSource reintenta solo; mantenemos la conexion viva.
    };

    return () => {
      es.removeEventListener('servicios_changed', onServiciosChanged);
      es.close();
    };
  }, []);

  const handleClick = s => {
    setSelectedServicio(s);
    if (areaUsuario === 'VENTAS') setPresupuestoOpen(true);
    else setDetalleOpen(true);
  };

  const handleClose = () => { setSelectedServicio(null); setPresupuestoOpen(false); setDetalleOpen(false); };

  const categorias = useMemo(() => {
    const set = new Set();
    servicios.forEach((s) => { if (s.categoria) set.add(s.categoria); });
    return Array.from(set);
  }, [servicios]);

  const filtrados = categoriaActiva === 'TODAS'
    ? servicios
    : servicios.filter((s) => s.categoria === categoriaActiva);
  const carousel = useWideOnly(filtrados, 8);

  return (
    <div style={{ fontFamily: FONTS.body, background: COLORS.backgroundLight, minHeight: '100vh', overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Open+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        :root{
          --r:${COLORS.primary};--r2:${COLORS.primaryLight};
          --c:${COLORS.secondary};--y:${COLORS.accent};
          --dk:${COLORS.text};--w:${COLORS.white};
          --steel:${COLORS.steel};
        }
        @keyframes icTextIn{0%{opacity:0;transform:translateY(32px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes icZoom{from{transform:scale(1.04)}to{transform:scale(1)}}
        @keyframes shimmer{0%{opacity:.4}50%{opacity:.72}100%{opacity:.4}}
        @keyframes srvRtIn{from{opacity:0;transform:translateY(-8px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes srvGlow{0%{box-shadow:0 0 0 0 rgba(128,194,220,.48)}70%{box-shadow:0 0 0 10px rgba(128,194,220,0)}100%{box-shadow:0 0 0 0 rgba(128,194,220,0)}}

        /* ══ CAROUSEL ════ */
        .ic-root{position:relative;width:100%;padding:24px clamp(16px,4vw,48px) 8px}
        .ic-stage{position:relative;width:100%;height:clamp(320px,44vw,520px);border-radius:20px;overflow:hidden;background:${COLORS.surface};box-shadow:0 24px 56px rgba(15,23,42,.16),0 2px 10px rgba(15,23,42,.08)}
        .ic-stage-accent{position:absolute;top:0;left:0;right:0;height:4px;z-index:5;background:linear-gradient(90deg,var(--r),var(--c),var(--y))}
        .ic-bg-layer{position:absolute;inset:0;background-size:contain;background-repeat:no-repeat;background-position:center;transition:opacity .9s ease}
        .ic-bg-active{animation:icZoom 6s ease-out forwards}
        .ic-panel{position:absolute;left:clamp(14px,3vw,28px);bottom:clamp(14px,3vw,28px);z-index:6;max-width:min(420px,86%);background:linear-gradient(120deg,var(--r),var(--r2));border-radius:16px;padding:18px 22px;box-shadow:0 18px 38px rgba(148,25,24,.32)}
        .ic-eyebrow{display:flex;align-items:center;gap:10px;font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--y);margin-bottom:10px;font-family:'Open Sans',sans-serif;animation:icTextIn .55s .05s ease-out both}
        .ic-ey-line{width:20px;height:1.5px;background:var(--y);flex-shrink:0}
        .ic-title{font-family:'Oswald',sans-serif;font-size:clamp(20px,2.8vw,32px);font-weight:700;color:var(--w);line-height:1.08;letter-spacing:.01em;text-transform:uppercase;margin:0 0 10px;animation:icTextIn .55s .1s ease-out both}
        .ic-desc{font-size:12.5px;color:rgba(255,255,255,.82);line-height:1.6;margin:0 0 16px;font-family:'Open Sans',sans-serif;animation:icTextIn .55s .16s ease-out both}
        .ic-actions{animation:icTextIn .55s .22s ease-out both}
        .ic-discover-btn{display:inline-flex;align-items:center;gap:9px;background:var(--w);color:var(--r);border:none;padding:10px 20px;font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;font-family:'Open Sans',sans-serif;border-radius:999px;transition:transform .18s,box-shadow .18s}
        .ic-discover-btn:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(0,0,0,.22)}
        .ic-disc-icon{width:20px;height:20px;border-radius:50%;background:var(--r);color:var(--w);display:inline-flex;align-items:center;justify-content:center;font-size:8px;flex-shrink:0}
        .ic-progress-wrap{display:flex;gap:4px;margin-top:12px}
        .ic-prog-seg{flex:1;height:2.5px;border-radius:2px;overflow:hidden;background:${COLORS.border}}
        .ic-prog-fill{height:100%}
        .ic-thumbs-row{display:flex;align-items:center;gap:14px;margin-top:12px}
        .ic-thumbs-outer{overflow:hidden;flex:1}
        .ic-thumbs-track{display:flex;gap:10px;transition:transform .55s cubic-bezier(.22,1,.36,1);will-change:transform}
        .ic-thumb{flex-shrink:0;width:clamp(84px,9vw,130px);border-radius:8px;overflow:hidden;cursor:pointer;position:relative;aspect-ratio:16/10;transition:opacity .35s,border-color .35s,transform .45s cubic-bezier(.22,1,.36,1),box-shadow .35s;opacity:.55;border:2px solid transparent}
        .ic-thumb:hover{opacity:.85}
        .ic-thumb-active{opacity:1;border-color:var(--r);transform:translateY(-3px);box-shadow:0 8px 18px rgba(15,23,42,.2)}
        .ic-thumb-img{width:100%;height:100%;object-fit:cover;display:block}
        .ic-thumb-ov{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.58) 0%,transparent 65%)}
        .ic-thumb-info{position:absolute;bottom:0;left:0;right:0;padding:6px 8px}
        .ic-thumb-name{font-family:'Oswald',sans-serif;font-size:10px;font-weight:600;color:var(--w);line-height:1.1;text-transform:uppercase}
        .ic-thumb-bar{position:absolute;top:0;left:0;right:0;height:2.5px;background:var(--r);transition:opacity .25s}
        .ic-counter{display:flex;align-items:center;gap:7px;flex-shrink:0}
        .ic-counter-cur{font-family:'Oswald',sans-serif;font-size:15px;font-weight:600;color:${COLORS.text};line-height:1}
        .ic-counter-sep{width:16px;height:1px;background:${COLORS.border};flex-shrink:0}
        .ic-counter-tot{font-family:'Oswald',sans-serif;font-size:12px;font-weight:400;color:${COLORS.textLight}}
        .ic-arrows{display:flex;gap:7px;flex-shrink:0}
        .ic-arrow{width:32px;height:32px;border-radius:50%;border:1px solid ${COLORS.border};background:${COLORS.white};color:${COLORS.text};display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;transition:background .2s,border-color .2s,color .2s;line-height:1}
        .ic-arrow:hover{background:var(--r);border-color:var(--r);color:#fff}
        @media(max-width:640px){.ic-panel{left:10px;right:10px;bottom:10px;max-width:none}.ic-thumbs-row{flex-wrap:wrap}.ic-counter{order:2}.ic-arrows{order:3}.ic-thumbs-outer{order:1;flex-basis:100%}}

        /* ══ PROJECT CARD (única tarjeta para todo el catálogo) ════ */
        .pc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:26px;padding:8px clamp(20px,5vw,60px) 0}
        .pc-card{background:${COLORS.white};border-radius:18px;overflow:hidden;cursor:pointer;display:flex;flex-direction:column;box-shadow:0 10px 26px rgba(15,23,42,.10);transition:transform .25s ease,box-shadow .25s ease}
        .pc-card:hover{transform:translateY(-5px);box-shadow:0 20px 42px rgba(15,23,42,.16)}
        .pc-img-wrap{position:relative;aspect-ratio:4/3;overflow:hidden;background:${COLORS.surface}}
        .pc-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s ease}
        .pc-body{padding:16px 18px 18px;flex:1;display:flex;flex-direction:column}
        .pc-cat{font-size:9.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--r);margin-bottom:6px;font-family:'Open Sans',sans-serif}
        .pc-name{font-family:'Oswald',sans-serif;font-size:16px;font-weight:700;color:${COLORS.text};text-transform:uppercase;line-height:1.22;margin-bottom:6px}
        .pc-desc{font-size:12px;color:${COLORS.textLight};line-height:1.55;margin:0}
        .pc-bar{height:3px;background:linear-gradient(90deg,var(--r),var(--c),var(--y));transform-origin:left;transition:transform .3s ease}
        .pz-sk{animation:shimmer 1.6s ease-in-out infinite}

        /* ══ RESPONSIVE GLOBAL ══════════════════════════════════════════ */

        /* ── Tablet (≤768px) ── */
        @media(max-width:768px){
          /* carousel */
          .ic-stage{height:clamp(300px,64vw,420px)}
          .ic-panel{left:16px;right:16px;bottom:16px;max-width:none}
          .ic-title{font-size:clamp(22px,6vw,34px)}
          .ic-desc{display:none}
          .ic-thumb{width:clamp(80px,10vw,120px)}

          /* project card grid */
          .pc-grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px}
        }

        /* ── Mobile (≤480px) ── */
        @media(max-width:480px){
          /* carousel */
          .ic-stage{height:clamp(240px,80vw,340px)}
          .ic-title{font-size:clamp(19px,6.5vw,26px)}
          .ic-thumbs-outer{display:none}
          .ic-eyebrow{margin-bottom:8px}
          .ic-discover-btn{padding:9px 18px;font-size:10px}

          /* project card grid */
          .pc-grid{grid-template-columns:1fr;gap:16px}

          /* divider */
          .sdiv{margin:32px 16px 24px}

          /* panel detalle */
          .pz-drawer{padding:16px}
        }`}</style>

      {/* ── LOADING ── */}
      {realtimeNuevoServicio && (
        <div style={{
          position: 'fixed',
          top: 84,
          right: 18,
          zIndex: 1200,
          background: 'linear-gradient(135deg, rgba(255,255,255,.92), rgba(199,236,255,.9))',
          border: `1px solid ${COLORS.secondary}`,
          borderRadius: 12,
          padding: '10px 14px',
          color: COLORS.text,
          fontFamily: FONTS.body,
          fontWeight: 700,
          fontSize: 12,
          boxShadow: '0 10px 24px rgba(15,23,42,.18)',
          animation: 'srvRtIn .32s ease, srvGlow 1.7s ease-out 1'
        }}>
          Nuevo servicio en tiempo real: {realtimeNuevoServicio}
        </div>
      )}

      {!loading && categorias.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '18px clamp(20px,5vw,60px) 0' }}>
          {['TODAS', ...categorias].map((cat) => {
            const active = categoriaActiva === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                style={{
                  border: `1.5px solid ${active ? COLORS.primary : COLORS.border}`,
                  background: active ? COLORS.primary : 'transparent',
                  color: active ? '#fff' : COLORS.text,
                  padding: '7px 16px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  fontFamily: FONTS.body,
                  cursor: 'pointer',
                  transition: 'background .2s,border-color .2s,color .2s',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {loading && (
        <div style={{ paddingTop: 80, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 3 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="pz-sk" style={{ height: 260, background: `linear-gradient(135deg,${COLORS.gray[100]},${COLORS.gray[50]},${COLORS.gray[100]})`, animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      )}

      {!loading && filtrados.length === 0 && (
        <div style={{ textAlign: 'center', padding: '120px 0 80px', color: COLORS.textLight }}>
          <div style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, textTransform: 'uppercase', color: COLORS.steel, marginBottom: 8 }}>Sin servicios</div>
          <div style={{ fontSize: 14, fontFamily: FONTS.body }}>No hay servicios disponibles.</div>
        </div>
      )}

      {!loading && filtrados.length > 0 && (<>
        {carousel.length > 0 && (
          <div style={{ animation: carousel.some(s => String(s?.id_servicio || s?.id || '') === String(servicioResaltadoId || '')) ? 'srvRtIn .35s ease' : 'none' }}>
            <ImmersiveCarousel servicios={carousel} onClick={handleClick} />
          </div>
        )}
        <SD label="Nuestros Servicios" color={COLORS.primary} />
        <div className="pc-grid">
          {filtrados.map((s) => (
            <ProjectCard key={servicioId(s)} s={s} onClick={handleClick} />
          ))}
        </div>
        <div style={{ paddingBottom: 80 }} />
      </>)}

      {/* PRESUPUESTO */}
      {presupuestoOpen && (
        <PresupuestoServicio selectedServicio={selectedServicio} handleCloseSelected={handleClose} />
      )}

      {/* PANEL IZQUIERDO CON ANIMACIÓN */}
      {detalleOpen && selectedServicio && (
        <ServicioPanel
          servicio={selectedServicio}
          servicios={servicios}
          onClose={handleClose}
          onSelect={s => setSelectedServicio(s)}
        />
      )}
    </div>
  );
};

export default Proyectos;
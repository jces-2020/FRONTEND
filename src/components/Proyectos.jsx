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
   SERVICIO DETALLE — página de producto: imagen grande a la izquierda,
   info a la derecha, selector de categoría + más proyectos debajo.
══════════════════════════════════════════════════════════════════ */
const ServicioPanel = ({ servicio, servicios, onClose, onSelect, onCotizar }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [servicio?.id_servicio]);

  const categoriasDisponibles = useMemo(() => {
    const set = new Set();
    servicios.forEach((s) => { if (s.categoria) set.add(s.categoria); });
    return Array.from(set);
  }, [servicios]);

  const [categoriaSel, setCategoriaSel] = useState(servicio?.categoria || 'TODAS');
  useEffect(() => {
    setCategoriaSel(servicio?.categoria || 'TODAS');
  }, [servicio?.id_servicio]);

  if (!servicio) return null;

  const relacionados = servicios
    .filter((s) => servicioId(s) !== servicioId(servicio))
    .filter((s) => categoriaSel === 'TODAS' || s.categoria === categoriaSel)
    .slice(0, 8);

  return (
    <div className="sd-overlay" onClick={onClose}>
      <div className="sd-panel" ref={scrollRef} onClick={e => e.stopPropagation()}>
        <div className="sd-topbar">
          <div className="sd-breadcrumb">Proyectos{servicio.categoria ? ` / ${servicio.categoria}` : ''}</div>
          <button className="sd-close" onClick={onClose}>✕</button>
        </div>

        <div className="sd-hero">
          <div className="sd-hero-img-wrap">
            <img src={imgSrc(servicio)} alt={servicio.nombre} className="sd-hero-img"
              onError={e => { e.target.onerror = null; e.target.src = PH; }} />
          </div>
          <div className="sd-hero-info">
            {servicio.categoria && <div className="sd-cat-pill">{servicio.categoria}</div>}
            <h1 className="sd-title">{servicio.nombre}</h1>
            {servicio.descripcion && <p className="sd-desc">{servicio.descripcion}</p>}
            {servicio.grosor && (
              <div className="sd-attr"><span>Grosor</span><b>{servicio.grosor}</b></div>
            )}
            {typeof onCotizar === 'function' && (
              <button className="sd-cta" onClick={() => onCotizar(servicio)}>Solicitar cotización</button>
            )}
          </div>
        </div>

        <div className="sd-related-header">
          <h2 className="sd-related-title">Más proyectos</h2>
          {categoriasDisponibles.length > 0 && (
            <select
              className="sd-select"
              value={categoriaSel}
              onChange={e => setCategoriaSel(e.target.value)}
            >
              <option value="TODAS">Todas las categorías</option>
              {categoriasDisponibles.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>

        {relacionados.length > 0 ? (
          <div className="pc-grid sd-related-grid">
            {relacionados.map(s => (
              <ProjectCard key={servicioId(s)} s={s} onClick={onSelect} />
            ))}
          </div>
        ) : (
          <div className="sd-empty">No hay más proyectos en esta categoría.</div>
        )}
      </div>
    </div>
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

  const handleCotizar = s => {
    setSelectedServicio(s);
    setDetalleOpen(false);
    setPresupuestoOpen(true);
  };

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

        /* ══ SERVICIO DETALLE (página de producto) ════ */
        @keyframes sdIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .sd-overlay{position:fixed;inset:0;z-index:1000;background:rgba(15,23,42,.5);display:flex;justify-content:center;padding:clamp(12px,3vw,32px);overflow-y:auto}
        .sd-panel{background:${COLORS.backgroundLight};border-radius:20px;max-width:1180px;width:100%;padding:18px clamp(16px,3vw,40px) 56px;box-shadow:0 30px 80px rgba(0,0,0,.35);animation:sdIn .3s ease both;height:fit-content}
        .sd-topbar{display:flex;align-items:center;justify-content:space-between;padding:4px 2px 18px}
        .sd-breadcrumb{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${COLORS.textLight};font-family:'Open Sans',sans-serif}
        .sd-close{width:36px;height:36px;border-radius:50%;border:1px solid ${COLORS.border};background:${COLORS.white};color:${COLORS.text};font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s,color .2s,border-color .2s;flex-shrink:0}
        .sd-close:hover{background:var(--r);border-color:var(--r);color:#fff}
        .sd-hero{display:grid;grid-template-columns:1.2fr 1fr;gap:36px;align-items:start}
        .sd-hero-img-wrap{border-radius:20px;overflow:hidden;background:${COLORS.surface};box-shadow:0 20px 50px rgba(15,23,42,.16);aspect-ratio:4/3}
        .sd-hero-img{width:100%;height:100%;object-fit:cover;display:block}
        .sd-hero-info{display:flex;flex-direction:column;gap:14px;padding-top:6px}
        .sd-cat-pill{align-self:flex-start;background:${COLORS.primary}14;color:var(--r);font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;padding:6px 14px;border-radius:999px;font-family:'Open Sans',sans-serif}
        .sd-title{font-family:'Oswald',sans-serif;font-size:clamp(24px,3.4vw,38px);font-weight:700;color:${COLORS.text};text-transform:uppercase;line-height:1.12;margin:0}
        .sd-desc{font-size:14.5px;color:${COLORS.textLight};line-height:1.75;margin:0}
        .sd-attr{display:flex;gap:8px;align-items:baseline;font-size:13px;color:${COLORS.textLight}}
        .sd-attr span{font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-size:10.5px;color:${COLORS.steel}}
        .sd-attr b{color:${COLORS.text}}
        .sd-cta{align-self:flex-start;margin-top:8px;background:var(--r);color:#fff;border:none;padding:13px 28px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;font-family:'Open Sans',sans-serif;transition:transform .18s,box-shadow .18s;box-shadow:0 12px 26px rgba(148,25,24,.28)}
        .sd-cta:hover{transform:translateY(-2px)}
        .sd-related-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin:44px 0 18px}
        .sd-related-title{font-family:'Oswald',sans-serif;font-size:19px;font-weight:700;color:${COLORS.text};text-transform:uppercase;margin:0}
        .sd-select{border:1.5px solid ${COLORS.border};border-radius:10px;padding:8px 14px;font-size:12.5px;font-family:'Open Sans',sans-serif;color:${COLORS.text};background:${COLORS.white};cursor:pointer}
        .sd-related-grid{padding:0}
        .sd-empty{color:${COLORS.textLight};font-size:13px;padding:20px 4px}
        @media(max-width:768px){.sd-hero{grid-template-columns:1fr}.sd-panel{border-radius:16px}}

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

      {/* DETALLE DEL PROYECTO */}
      {detalleOpen && selectedServicio && (
        <ServicioPanel
          servicio={selectedServicio}
          servicios={servicios}
          onClose={handleClose}
          onSelect={s => setSelectedServicio(s)}
          onCotizar={handleCotizar}
        />
      )}
    </div>
  );
};

export default Proyectos;
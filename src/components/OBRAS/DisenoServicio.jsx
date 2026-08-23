import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IconRuler2, IconBox, IconArrowRight, IconLoader2, IconTrash } from '@tabler/icons-react';
import { FONTS } from '../../colors';
import ServicioRender from './ServicioRender';
import Workspace2D from '../editor/Workspace2D';
import { listAllPanels, listAllProfileBars } from '../../engine/geometry/ContainerGraph';

// ─── CSS ─────────────────────────────────────────────────────────────────────
const DS_STYLE_ID = 'diseno-servicio-css';
const DS_FONT = FONTS?.heading || "'Oswald',sans-serif";
const DS_MONO = FONTS?.mono   || "'IBM Plex Mono',monospace";
const DS_BODY = FONTS?.body   || "'Open Sans',sans-serif";

const CSS = `
@keyframes ds-spin{to{transform:rotate(360deg)}}
.ds-wrap{display:flex;flex-direction:column;gap:18px;font-family:${DS_BODY}}
.ds-header{display:flex;align-items:center;gap:10px;margin-bottom:2px;flex-wrap:wrap}
.ds-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;background:rgba(90,139,168,.12);border:1px solid rgba(90,139,168,.3);font-family:${DS_MONO};font-size:11px;font-weight:600;color:#2d4a62;letter-spacing:.05em}
.ds-title{font-family:${DS_FONT};font-size:17px;font-weight:700;color:#1a2a3a}
.ds-section{max-width:980px;margin:0 auto;width:100%;display:flex;flex-direction:column;gap:14px}
.ds-card{background:rgba(255,255,255,.65);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(128,194,220,.25);border-radius:14px;padding:16px}
.ds-view-toggle{display:flex;border-radius:10px;overflow:hidden;border:1px solid rgba(128,194,220,.35);width:fit-content}
.ds-vbtn{padding:6px 16px;font-family:${DS_FONT};font-size:12px;font-weight:600;border:none;cursor:pointer;transition:all .15s;color:#5a7a90;background:transparent}
.ds-vbtn.active{background:#127fc3;color:#fff}
.ds-svg-wrap{background:rgba(240,248,255,.6);border-radius:12px;border:1px solid rgba(128,194,220,.25);overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:280px;padding:16px;position:relative}
.ds-section-lbl{font-family:${DS_MONO};font-size:9px;font-weight:700;letter-spacing:1.8px;color:#8aa8bc;text-transform:uppercase;margin-bottom:8px}
.ds-mat-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.ds-mat-name{font-family:${DS_FONT};font-size:13px;font-weight:600;color:#2d4a62}
.ds-mat-val{font-family:${DS_MONO};font-size:13px;font-weight:700;color:#127fc3}
.ds-bar-bg{height:6px;border-radius:999px;background:rgba(128,194,220,.2);overflow:hidden;margin-bottom:10px}
.ds-bar-fill{height:100%;border-radius:999px;transition:width .4s ease}
.ds-cortes-list{display:flex;flex-direction:column;gap:3px;margin-bottom:10px;max-height:140px;overflow-y:auto}
.ds-corte-item{display:flex;align-items:center;gap:6px;font-family:${DS_MONO};font-size:11px;color:#475569}
.ds-corte-dot{width:6px;height:6px;border-radius:2px;flex-shrink:0}
.ds-stat-row{font-family:${DS_MONO};font-size:11px;color:#8aa8bc;display:flex;justify-content:space-between;margin-top:3px}
.ds-stat-val{font-weight:700;color:#2d4a62}
.ds-cost-row{display:flex;align-items:baseline;gap:6px}
.ds-cost-val{font-family:${DS_FONT};font-size:20px;font-weight:700;color:#1a2a3a}
.ds-cost-sub{font-family:${DS_MONO};font-size:10px;color:#8aa8bc}
.ds-btn-continuar{width:100%;padding:12px;border-radius:11px;background:linear-gradient(135deg,#24a2df,#127fc3);border:none;cursor:pointer;font-family:${DS_FONT};font-size:15px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .18s;box-shadow:0 4px 16px rgba(18,127,195,.28)}
.ds-btn-continuar:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(18,127,195,.38)}
.ds-btn-continuar:active{transform:translateY(0) scale(.98)}
.ds-btn-continuar:disabled{opacity:.5;cursor:not-allowed;transform:none}
.ds-editor-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:9px;border:1px solid rgba(128,194,220,.4);background:rgba(255,255,255,.85);font-family:${DS_FONT};font-size:12px;font-weight:700;color:#2d4a62;cursor:pointer;transition:all .15s}
.ds-editor-btn:hover{border-color:#127fc3;color:#127fc3}
.ds-loading{display:flex;align-items:center;justify-content:center;min-height:120px;color:#8aa8bc;font-family:${DS_MONO};font-size:13px;gap:8px}
.ds-svc-tabs{display:flex;gap:6px;margin-bottom:4px;flex-wrap:wrap}
.ds-svc-tab{padding:4px 10px;border-radius:999px;border:1px solid rgba(128,194,220,.35);background:transparent;font-family:${DS_MONO};font-size:10px;font-weight:600;color:#5a7a90;cursor:pointer;transition:all .14s}
.ds-svc-tab.active{background:#127fc3;border-color:#127fc3;color:#fff}
.ds-error{padding:10px 14px;border-radius:10px;background:rgba(220,38,38,.07);border:1px solid rgba(220,38,38,.2);color:#991b1b;font-family:${DS_MONO};font-size:12px}
`;

function injectCSS() {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(DS_STYLE_ID);
  if (!el) { el = document.createElement('style'); el.id = DS_STYLE_ID; document.head.appendChild(el); }
  if (el.textContent !== CSS) el.textContent = CSS;
}

function agruparPorMedida(lista, keyFn, buildFn) {
  const mapa = new Map();
  lista.forEach((item) => {
    const key = keyFn(item);
    if (mapa.has(key)) mapa.get(key).cantidad += 1;
    else mapa.set(key, { ...buildFn(item), cantidad: 1 });
  });
  return Array.from(mapa.values());
}

// ─── Barra de progreso ───────────────────────────────────────────────────────
function BarPct({ pct, color = '#127fc3' }) {
  return (
    <div className="ds-bar-bg">
      <div className="ds-bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: `linear-gradient(90deg,${color},${color}cc)` }} />
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
const PERFIL_DEFECTO_CM = 4.5;

export default function DisenoServicio({ notificacion, onToast, onGuardarSuccess }) {
  injectCSS();

  const notifId = useMemo(
    () => String(notificacion?.id || notificacion?.id_notificacion || '').trim(),
    [notificacion]
  );

  const [servicios,   setServicios]   = useState([]);
  const [servicioIdx, setServicioIdx] = useState(0);
  const [ancho,       setAncho]       = useState(100);
  const [alto,        setAlto]        = useState(100);
  const [cargando,    setCargando]    = useState(true);
  const [vista3D,     setVista3D]     = useState(false);

  const [graph, setGraph] = useState(null);

  const [optimizando, setOptimizando] = useState(false);
  const [resultado,   setResultado]   = useState(null);
  const [errorOpt,    setErrorOpt]    = useState(null);

  // ── Fetch presupuestos del pedido ────────────────────────────────────────
  useEffect(() => {
    if (!notifId) { setCargando(false); return; }
    setCargando(true);
    fetch(`/api/presupuestos/notificacion/${notifId}/servicios`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const lista = Array.isArray(data) ? data : (data?.data || data?.servicios || []);
        setServicios(lista);
        if (lista.length > 0) {
          const w = Number(lista[0].ancho) || 100;
          const h = Number(lista[0].alto) || 100;
          setAncho(w); setAlto(h);
        }
      })
      .catch(() => onToast?.('No se pudo cargar la información del servicio', 'error'))
      .finally(() => setCargando(false));
  }, [notifId]);

  // Al cambiar de servicio (tab), recarga dimensiones y reinicia el diseño
  // (el editor se remonta via key={servicioIdx}).
  useEffect(() => {
    const s = servicios[servicioIdx];
    if (!s) return;
    const w = Number(s.ancho) || ancho;
    const h = Number(s.alto)  || alto;
    setAncho(w); setAlto(h);
    setGraph(null);
    setResultado(null);
    setErrorOpt(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicioIdx, servicios]);

  const servicio      = servicios[servicioIdx] || null;
  const nombreDisplay = servicio?.nombre_servicio || notificacion?.nombre_servicio || 'Servicio';
  const precioDisplay = servicio?.total ? `S/. ${Number(servicio.total).toFixed(2)}` : null;

  const paneles  = useMemo(() => (graph ? listAllPanels(graph) : []), [graph]);
  const vidrioN  = paneles.filter((p) => p.material === 'vidrio').length;
  const solidoN  = paneles.filter((p) => p.material === 'solido').length;

  // ── Optimizar: reutiliza el motor de cortes existente (guillotina + FFD) ──
  const handleOptimizar = useCallback(async () => {
    if (!graph) return;
    const panelesVidrio = listAllPanels(graph).filter((p) => p.material === 'vidrio');
    if (panelesVidrio.length === 0) {
      onToast?.('El diseño no tiene ningún panel de vidrio.', 'warn');
      return;
    }

    const productosVidrio = agruparPorMedida(
      panelesVidrio,
      (p) => `${Math.round(p.width * 10)}x${Math.round(p.height * 10)}`,
      (p) => ({ id: `panel-${Math.round(p.width * 10)}x${Math.round(p.height * 10)}`, ancho: Number(p.width.toFixed(2)), alto: Number(p.height.toFixed(2)) })
    );

    // Todos los perfiles reales del diseño (marco exterior + divisores + cada
    // sistema insertado), ya con sus largos de corte calculados por el motor.
    const barras = listAllProfileBars(graph);
    const productosAluminio = agruparPorMedida(
      barras,
      (b) => Math.round(b.length * 10),
      (b) => ({ id: `barra-${Math.round(b.length * 10)}`, largo: Number(b.length.toFixed(2)) })
    );

    setOptimizando(true);
    setErrorOpt(null);
    try {
      const [resVidrio, resAluminio] = await Promise.all([
        fetch('/api/optimizacion-cortes/calcular', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productos: productosVidrio, tipo_material: 'vidrio' }),
        }).then((r) => r.json()),
        fetch('/api/optimizacion-cortes/calcular', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productos: productosAluminio, tipo_material: 'aluminio' }),
        }).then((r) => r.json()),
      ]);

      if (!resVidrio.success || !resAluminio.success) {
        setErrorOpt(resVidrio.error || resAluminio.error || resVidrio.message || resAluminio.message || 'Error al optimizar');
        return;
      }

      setResultado({ vidrio: resVidrio, aluminio: resAluminio });
    } catch {
      setErrorOpt('No se pudo conectar con el optimizador.');
    } finally {
      setOptimizando(false);
    }
  }, [graph, onToast]);

  const handleContinuar = useCallback(() => {
    onGuardarSuccess?.({
      ancho,
      alto,
      nombreServicio: nombreDisplay,
      diseno: graph,
      aluminio: resultado?.aluminio || null,
      vidrio: resultado?.vidrio || null,
    });
  }, [ancho, alto, nombreDisplay, graph, resultado, onGuardarSuccess]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="ds-loading">
        <IconLoader2 size={16} style={{ animation: 'ds-spin 1s linear infinite' }} />
        Cargando servicio…
      </div>
    );
  }

  return (
    <div className="ds-wrap">
      {/* Header */}
      <div className="ds-header">
        <span className="ds-chip"><IconRuler2 size={12} /> DISEÑO</span>
        <span className="ds-title">{nombreDisplay}</span>
        {precioDisplay && (
          <span style={{ marginLeft: 'auto', fontFamily: DS_MONO, fontSize: 13, fontWeight: 700, color: '#127fc3' }}>
            {precioDisplay}
          </span>
        )}
      </div>

      {/* Selector de servicios si hay más de uno */}
      {servicios.length > 1 && (
        <div className="ds-svc-tabs">
          {servicios.map((s, i) => (
            <button key={i} className={`ds-svc-tab${servicioIdx === i ? ' active' : ''}`} onClick={() => setServicioIdx(i)}>
              {s.nombre_servicio || `Servicio ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className="ds-view-toggle">
        <button className={`ds-vbtn${!vista3D ? ' active' : ''}`} onClick={() => setVista3D(false)}>2D</button>
        <button className={`ds-vbtn${vista3D ? ' active' : ''}`} onClick={() => setVista3D(true)}>
          <IconBox size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />3D
        </button>
      </div>

      {vista3D ? (
        <div className="ds-section">
          <div className="ds-svg-wrap">
            <ServicioRender servicio={{ nombre: nombreDisplay }} ancho={ancho} alto={alto} configuracion={{ hojas: 2 }} />
          </div>
        </div>
      ) : (
        <Workspace2D
          key={servicioIdx}
          initialWidth={ancho}
          initialHeight={alto}
          initialProfileWidth={PERFIL_DEFECTO_CM}
          title={`${nombreDisplay} — ${ancho}×${alto} cm`}
          onChange={setGraph}
        />
      )}

      {/* Optimización de cortes */}
      <div className="ds-section">
        {errorOpt && <div className="ds-error">{errorOpt}</div>}

        {!resultado ? (
          <div className="ds-card">
            <div className="ds-section-lbl">Resumen del diseño</div>
            <div className="ds-stat-row"><span>Paneles de vidrio</span><span className="ds-stat-val">{vidrioN}</span></div>
            <div className="ds-stat-row"><span>Paneles sólidos</span><span className="ds-stat-val">{solidoN}</span></div>
            <button className="ds-btn-continuar" style={{ marginTop: 14 }} onClick={handleOptimizar} disabled={optimizando || vidrioN === 0}>
              {optimizando ? <IconLoader2 size={16} style={{ animation: 'ds-spin 1s linear infinite' }} /> : null}
              {optimizando ? 'Optimizando…' : 'Optimizar cortes'}
            </button>
          </div>
        ) : (
          <>
            {/* Aluminio */}
            <div className="ds-card">
              <div className="ds-section-lbl">Aluminio</div>
              <div className="ds-mat-row">
                <span className="ds-mat-name">Barras necesarias</span>
                <span className="ds-mat-val">{resultado.aluminio.total_barras} barra{resultado.aluminio.total_barras === 1 ? '' : 's'}</span>
              </div>
              <BarPct pct={resultado.aluminio.eficiencia_global} />
              <div className="ds-cortes-list">
                {(resultado.aluminio.barras || []).map((b) => (
                  <div key={b.id} className="ds-corte-item">
                    <span className="ds-corte-dot" style={{ background: '#127fc3' }} />
                    Barra {b.id} — usado {b.usado} cm · retazo {b.retazo} cm
                  </div>
                ))}
              </div>
              <div className="ds-stat-row">
                <span>Eficiencia global</span>
                <span className="ds-stat-val">{resultado.aluminio.eficiencia_global}%</span>
              </div>
            </div>

            {/* Vidrio */}
            <div className="ds-card">
              <div className="ds-section-lbl">Vidrio</div>
              <div className="ds-mat-row">
                <span className="ds-mat-name">Planchas necesarias</span>
                <span className="ds-mat-val">{resultado.vidrio.total_planchas} × {resultado.vidrio.plancha_ancho_usado}×{resultado.vidrio.plancha_alto_usado}</span>
              </div>
              <BarPct pct={resultado.vidrio.eficiencia_global} color="#22c55e" />
              <div className="ds-cortes-list">
                {(resultado.vidrio.planchas || []).map((p) => (
                  <div key={p.id} className="ds-corte-item">
                    <span className="ds-corte-dot" style={{ background: '#22c55e' }} />
                    Plancha {p.id} — {(p.cortes || []).length} panel{(p.cortes || []).length === 1 ? '' : 'es'} · {p.eficiencia}% uso
                  </div>
                ))}
              </div>
              <div className="ds-stat-row">
                <span>Eficiencia global</span>
                <span className="ds-stat-val">{resultado.vidrio.eficiencia_global}%</span>
              </div>
            </div>

            {/* Precio del servicio */}
            {precioDisplay && (
              <div className="ds-card">
                <div className="ds-section-lbl">Precio del servicio</div>
                <div className="ds-cost-row">
                  <span className="ds-cost-val">{precioDisplay}</span>
                  <span className="ds-cost-sub">incluye materiales e instalación</span>
                </div>
              </div>
            )}

            <button className="ds-editor-btn" onClick={() => setResultado(null)}>
              <IconTrash size={14} /> Volver a editar el diseño
            </button>

            <button className="ds-btn-continuar" onClick={handleContinuar}>
              Continuar <IconArrowRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

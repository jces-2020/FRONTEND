import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { IconRuler2, IconBox, IconArrowRight, IconLoader2, IconTrash, IconArrowBackUp, IconSquare, IconSquareCheck } from '@tabler/icons-react';
import { FONTS } from '../../colors';
import ServicioRender from './ServicioRender';

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
.ds-cols{display:grid;grid-template-columns:1fr 340px;gap:18px;align-items:start}
.ds-left{display:flex;flex-direction:column;gap:14px}
.ds-right{display:flex;flex-direction:column;gap:12px}
.ds-card{background:rgba(255,255,255,.65);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(128,194,220,.25);border-radius:14px;padding:16px}
.ds-view-toggle{display:flex;border-radius:10px;overflow:hidden;border:1px solid rgba(128,194,220,.35);width:fit-content}
.ds-vbtn{padding:6px 16px;font-family:${DS_FONT};font-size:12px;font-weight:600;border:none;cursor:pointer;transition:all .15s;color:#5a7a90;background:transparent}
.ds-vbtn.active{background:#127fc3;color:#fff}
.ds-svg-wrap{background:rgba(240,248,255,.6);border-radius:12px;border:1px solid rgba(128,194,220,.25);overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:280px;padding:16px;position:relative}
.ds-calc-overlay{position:absolute;inset:0;background:rgba(240,248,255,.7);display:flex;align-items:center;justify-content:center;border-radius:12px;backdrop-filter:blur(4px)}
.ds-dims{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap}
.ds-dim-group{display:flex;flex-direction:column;gap:4px}
.ds-dim-label{font-family:${DS_MONO};font-size:9px;font-weight:700;letter-spacing:1.5px;color:#8aa8bc;text-transform:uppercase}
.ds-dim-input{width:86px;padding:7px 10px;border-radius:8px;border:1.5px solid rgba(128,194,220,.45);background:rgba(255,255,255,.8);font-family:${DS_MONO};font-size:14px;font-weight:600;color:#1a2a3a;outline:none;transition:border-color .15s;text-align:center}
.ds-dim-input:focus{border-color:#127fc3}
.ds-dim-unit{font-family:${DS_MONO};font-size:11px;color:#8aa8bc;align-self:center;margin-bottom:9px}
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
.ds-loading{display:flex;align-items:center;justify-content:center;min-height:120px;color:#8aa8bc;font-family:${DS_MONO};font-size:13px;gap:8px}
.ds-svc-tabs{display:flex;gap:6px;margin-bottom:4px;flex-wrap:wrap}
.ds-svc-tab{padding:4px 10px;border-radius:999px;border:1px solid rgba(128,194,220,.35);background:transparent;font-family:${DS_MONO};font-size:10px;font-weight:600;color:#5a7a90;cursor:pointer;transition:all .14s}
.ds-svc-tab.active{background:#127fc3;border-color:#127fc3;color:#fff}
.ds-error{padding:10px 14px;border-radius:10px;background:rgba(220,38,38,.07);border:1px solid rgba(220,38,38,.2);color:#991b1b;font-family:${DS_MONO};font-size:12px}
.ds-editor-row{display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap;margin-top:10px}
.ds-editor-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:9px;border:1px solid rgba(128,194,220,.4);background:rgba(255,255,255,.85);font-family:${DS_FONT};font-size:12px;font-weight:700;color:#2d4a62;cursor:pointer;transition:all .15s}
.ds-editor-btn:hover{border-color:#127fc3;color:#127fc3}
.ds-editor-btn:disabled{opacity:.4;cursor:not-allowed}
.ds-editor-btn.danger{color:#991b1b;border-color:rgba(220,38,38,.3)}
.ds-editor-btn.danger:hover{border-color:#dc2626;background:rgba(220,38,38,.06)}
.ds-tipo-toggle{display:flex;border-radius:9px;overflow:hidden;border:1px solid rgba(128,194,220,.4)}
.ds-tipo-btn{padding:7px 12px;font-family:${DS_FONT};font-size:11.5px;font-weight:700;border:none;cursor:pointer;color:#5a7a90;background:transparent;display:inline-flex;align-items:center;gap:5px}
.ds-tipo-btn.active-vidrio{background:#4a9eff;color:#fff}
.ds-tipo-btn.active-solido{background:#7a9ab5;color:#fff}
.ds-sel-info{font-family:${DS_MONO};font-size:11.5px;color:#2d4a62;background:rgba(74,158,255,.08);border:1px solid rgba(74,158,255,.25);border-radius:9px;padding:8px 12px}
@media(max-width:900px){.ds-cols{grid-template-columns:1fr}.ds-right{order:-1}}
`;

function injectCSS() {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(DS_STYLE_ID);
  if (!el) { el = document.createElement('style'); el.id = DS_STYLE_ID; document.head.appendChild(el); }
  if (el.textContent !== CSS) el.textContent = CSS;
}

// ─── Modelo del diseño: árbol de paneles ──────────────────────────────────────
// Cada nodo es {id, x, y, w, h, tipo:'vidrio'|'solido', hijos:null|[a,b], direccion:null|'v'|'h'}
// x,y,w,h en cm, relativos al marco (y crece hacia abajo).

let _idSeq = 1;
const nuevoId = () => `p${_idSeq++}`;

const crearRaiz = (ancho, alto) => ({
  id: 'root', x: 0, y: 0, w: ancho, h: alto, tipo: 'vidrio', hijos: null, direccion: null,
});

function buscarNodo(nodo, id) {
  if (nodo.id === id) return nodo;
  if (!nodo.hijos) return null;
  for (const h of nodo.hijos) {
    const r = buscarNodo(h, id);
    if (r) return r;
  }
  return null;
}

function reemplazarNodo(nodo, id, fabricante) {
  if (nodo.id === id) return fabricante(nodo);
  if (!nodo.hijos) return nodo;
  return { ...nodo, hijos: nodo.hijos.map((h) => reemplazarNodo(h, id, fabricante)) };
}

function listarHojas(nodo, acc = []) {
  if (!nodo.hijos) { acc.push(nodo); return acc; }
  nodo.hijos.forEach((h) => listarHojas(h, acc));
  return acc;
}

// Rectángulos visuales de cada división (el hueco entre hijoA e hijoB).
function listarDivisoresVisuales(nodo, acc = []) {
  if (nodo.hijos) {
    const [a, b] = nodo.hijos;
    if (nodo.direccion === 'v') {
      acc.push({ x: a.x + a.w, y: nodo.y, w: b.x - (a.x + a.w), h: nodo.h });
    } else {
      acc.push({ x: nodo.x, y: a.y + a.h, w: nodo.w, h: b.y - (a.y + a.h) });
    }
    nodo.hijos.forEach((h) => listarDivisoresVisuales(h, acc));
  }
  return acc;
}

// Largo real de cada divisor (para el consumo de aluminio), sin duplicar el marco exterior.
function listarLargosDivisores(nodo, acc = []) {
  if (nodo.hijos) {
    acc.push(nodo.direccion === 'v' ? nodo.h : nodo.w);
    nodo.hijos.forEach((h) => listarLargosDivisores(h, acc));
  }
  return acc;
}

function dividirNodo(nodo, id, direccion, posicionCm, perfil) {
  return reemplazarNodo(nodo, id, (n) => {
    if (direccion === 'v') {
      const hijoA = { id: nuevoId(), x: n.x, y: n.y, w: posicionCm, h: n.h, tipo: n.tipo, hijos: null, direccion: null };
      const hijoB = { id: nuevoId(), x: n.x + posicionCm + perfil, y: n.y, w: n.w - posicionCm - perfil, h: n.h, tipo: n.tipo, hijos: null, direccion: null };
      return { ...n, hijos: [hijoA, hijoB], direccion: 'v' };
    }
    const hijoA = { id: nuevoId(), x: n.x, y: n.y, w: n.w, h: posicionCm, tipo: n.tipo, hijos: null, direccion: null };
    const hijoB = { id: nuevoId(), x: n.x, y: n.y + posicionCm + perfil, w: n.w, h: n.h - posicionCm - perfil, tipo: n.tipo, hijos: null, direccion: null };
    return { ...n, hijos: [hijoA, hijoB], direccion: 'h' };
  });
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

// ─── SVG del editor: dibuja el árbol y permite seleccionar hojas ──────────────
const CANVAS_W = 360;
const CANVAS_H = 320;
const PAD      = 56;
const ALUM_COLOR    = '#7a9ab5';
const SOLIDO_COLOR  = '#9aa9b8';
const VIDRIO_FILL   = 'rgba(180,220,255,0.28)';
const VIDRIO_STROKE = '#4a9eff';
const SEL_STROKE    = '#f59e0b';

function EditorSVG({ ancho, alto, arbol, perfil, seleccionId, onSelect }) {
  const drawW  = CANVAS_W - 2 * PAD;
  const drawH  = CANVAS_H - 2 * PAD;
  const scale  = Math.min(drawW / ancho, drawH / alto);
  const rW     = ancho * scale;
  const rH     = alto  * scale;
  const rX     = PAD + (drawW - rW) / 2;
  const rY     = PAD + (drawH - rH) / 2;
  const pf     = perfil * scale;

  const GRID_ID  = 'ds-grid';
  const ARROW_ID = 'ds-arrow';
  const arrowOff = 22;
  const dimAnchoY = rY - arrowOff;
  const dimAltoX  = rX + rW + arrowOff;

  const toSvgX = (cmX) => rX + cmX * scale;
  const toSvgY = (cmY) => rY + cmY * scale;
  const toSvgW = (cmW) => cmW * scale;
  const toSvgH = (cmH) => cmH * scale;

  const hojas = useMemo(() => listarHojas(arbol), [arbol]);
  const divisores = useMemo(() => listarDivisoresVisuales(arbol), [arbol]);

  return (
    <svg viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} width={CANVAS_W} height={CANVAS_H} style={{ display: 'block', maxWidth: '100%' }}>
      <defs>
        <pattern id={GRID_ID} width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(128,194,220,.15)" strokeWidth="0.5"/>
        </pattern>
        <marker id={ARROW_ID} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 Z" fill="#5a8ba8" />
        </marker>
        <marker id={`${ARROW_ID}-r`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
          <path d="M0,0 L0,6 L6,3 Z" fill="#5a8ba8" />
        </marker>
      </defs>

      <rect x={rX} y={rY} width={rW} height={rH} fill={`url(#${GRID_ID})`} />

      {/* Marco exterior (aluminio) */}
      <rect x={rX} y={rY} width={rW} height={rH} fill={ALUM_COLOR} opacity={0.18} rx={2} />
      <rect x={rX} y={rY} width={rW} height={rH} fill="none" stroke={ALUM_COLOR} strokeWidth={pf} rx={2} />

      {/* Divisores internos */}
      {divisores.map((d, i) => (
        <rect key={`div-${i}`} x={toSvgX(d.x)} y={toSvgY(d.y)} width={toSvgW(d.w)} height={toSvgH(d.h)} fill={ALUM_COLOR} opacity={0.85} />
      ))}

      {/* Paneles (hojas), clicables */}
      {hojas.map((p) => {
        const sx = toSvgX(p.x), sy = toSvgY(p.y), sw = toSvgW(p.w), sh = toSvgH(p.h);
        const esSel = p.id === seleccionId;
        if (p.tipo === 'solido') {
          return (
            <g key={p.id} onClick={() => onSelect(p.id)} style={{ cursor: 'pointer' }}>
              <rect x={sx} y={sy} width={sw} height={sh} fill={SOLIDO_COLOR} opacity={0.5} stroke={esSel ? SEL_STROKE : 'transparent'} strokeWidth={esSel ? 2.5 : 0} rx={1} />
            </g>
          );
        }
        return (
          <g key={p.id} onClick={() => onSelect(p.id)} style={{ cursor: 'pointer' }}>
            <rect x={sx} y={sy} width={sw} height={sh} fill={VIDRIO_FILL} stroke={esSel ? SEL_STROKE : VIDRIO_STROKE} strokeWidth={esSel ? 2.5 : 0.8} rx={1} />
            <line x1={sx+2} y1={sy+2} x2={sx+sw-2} y2={sy+sh-2} stroke={VIDRIO_STROKE} strokeWidth={0.8} strokeDasharray="5,4" opacity={0.5} />
            <line x1={sx+sw-2} y1={sy+2} x2={sx+2} y2={sy+sh-2} stroke={VIDRIO_STROKE} strokeWidth={0.8} strokeDasharray="5,4" opacity={0.5} />
          </g>
        );
      })}

      {/* Flecha ANCHO */}
      <line x1={rX} y1={dimAnchoY} x2={rX+rW} y2={dimAnchoY} stroke="#5a8ba8" strokeWidth={1} markerStart={`url(#${ARROW_ID}-r)`} markerEnd={`url(#${ARROW_ID})`} />
      <line x1={rX} y1={rY-6} x2={rX} y2={dimAnchoY+2} stroke="#5a8ba8" strokeWidth={0.8} strokeDasharray="3,2" opacity={0.6} />
      <line x1={rX+rW} y1={rY-6} x2={rX+rW} y2={dimAnchoY+2} stroke="#5a8ba8" strokeWidth={0.8} strokeDasharray="3,2" opacity={0.6} />
      <text x={(2*rX+rW)/2} y={dimAnchoY-6} textAnchor="middle" fill="#1a2a3a" fontSize={11} fontFamily={DS_MONO} fontWeight="700">
        ANCHO {ancho} cm
      </text>

      {/* Flecha ALTO */}
      <line x1={dimAltoX} y1={rY} x2={dimAltoX} y2={rY+rH} stroke="#5a8ba8" strokeWidth={1} markerStart={`url(#${ARROW_ID}-r)`} markerEnd={`url(#${ARROW_ID})`} />
      <line x1={rX+rW+6} y1={rY} x2={dimAltoX-2} y2={rY} stroke="#5a8ba8" strokeWidth={0.8} strokeDasharray="3,2" opacity={0.6} />
      <line x1={rX+rW+6} y1={rY+rH} x2={dimAltoX-2} y2={rY+rH} stroke="#5a8ba8" strokeWidth={0.8} strokeDasharray="3,2" opacity={0.6} />
      <text x={dimAltoX+7} y={(2*rY+rH)/2} textAnchor="middle" fill="#1a2a3a" fontSize={11} fontFamily={DS_MONO} fontWeight="700" transform={`rotate(90, ${dimAltoX+7}, ${(2*rY+rH)/2})`}>
        ALTO {alto} cm
      </text>
    </svg>
  );
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
const MIN_PANEL_CM = 10;
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
  const [perfil,      setPerfil]      = useState(PERFIL_DEFECTO_CM);
  const [vista3D,     setVista3D]     = useState(false);

  const [arbol,        setArbol]        = useState(() => crearRaiz(100, 100));
  const [historial,    setHistorial]    = useState([]);
  const [seleccionId,  setSeleccionId]  = useState('root');
  const [posV,         setPosV]         = useState('');
  const [posH,         setPosH]         = useState('');

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
          setArbol(crearRaiz(w, h));
        }
      })
      .catch(() => onToast?.('No se pudo cargar la información del servicio', 'error'))
      .finally(() => setCargando(false));
  }, [notifId]);

  // Al cambiar de servicio (tab), recarga dimensiones y reinicia el diseño.
  useEffect(() => {
    const s = servicios[servicioIdx];
    if (!s) return;
    const w = Number(s.ancho) || ancho;
    const h = Number(s.alto)  || alto;
    setAncho(w); setAlto(h);
    setArbol(crearRaiz(w, h));
    setHistorial([]);
    setSeleccionId('root');
    setResultado(null);
    setErrorOpt(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicioIdx, servicios]);

  const servicio      = servicios[servicioIdx] || null;
  const nombreDisplay = servicio?.nombre_servicio || notificacion?.nombre_servicio || 'Servicio';
  const precioDisplay = servicio?.total ? `S/. ${Number(servicio.total).toFixed(2)}` : null;

  // Cambiar ancho/alto manualmente reinicia el diseño (no se puede reescalar
  // un árbol de divisiones arbitrario sin romper las medidas exactas).
  const aplicarNuevaMedida = (nuevoAncho, nuevoAlto) => {
    setAncho(nuevoAncho);
    setAlto(nuevoAlto);
    setArbol(crearRaiz(nuevoAncho, nuevoAlto));
    setHistorial([]);
    setSeleccionId('root');
    setResultado(null);
    setErrorOpt(null);
  };

  const nodoSel = useMemo(() => buscarNodo(arbol, seleccionId), [arbol, seleccionId]);

  const empujarHistorial = (arbolActual) => {
    setHistorial((h) => [...h, arbolActual].slice(-20));
  };

  const handleDividir = (direccion) => {
    if (!nodoSel) return;
    const dimension = direccion === 'v' ? nodoSel.w : nodoSel.h;
    const posStr = direccion === 'v' ? posV : posH;
    const pos = Number(posStr);
    if (!pos || Number.isNaN(pos)) {
      onToast?.('Ingresa la posición en cm para la división.', 'warn');
      return;
    }
    if (pos < MIN_PANEL_CM || pos > dimension - perfil - MIN_PANEL_CM) {
      onToast?.(`La posición debe dejar al menos ${MIN_PANEL_CM} cm a cada lado.`, 'warn');
      return;
    }
    empujarHistorial(arbol);
    const nuevo = dividirNodo(arbol, nodoSel.id, direccion, pos, perfil);
    setArbol(nuevo);
    setSeleccionId(nodoSel.id === seleccionId ? nuevo.id : seleccionId);
    setPosV(''); setPosH('');
    setResultado(null);
  };

  const handleDeshacer = () => {
    if (!historial.length) return;
    const previo = historial[historial.length - 1];
    setHistorial((h) => h.slice(0, -1));
    setArbol(previo);
    setSeleccionId('root');
    setResultado(null);
  };

  const handleCambiarTipo = (tipo) => {
    if (!nodoSel) return;
    setArbol((a) => reemplazarNodo(a, nodoSel.id, (n) => ({ ...n, tipo })));
    setResultado(null);
  };

  // ── Optimizar: reutiliza el motor de cortes existente (guillotina + FFD) ──
  const handleOptimizar = useCallback(async () => {
    const hojas = listarHojas(arbol);
    const panelesVidrio = hojas.filter((h) => h.tipo === 'vidrio');
    if (panelesVidrio.length === 0) {
      onToast?.('El diseño no tiene ningún panel de vidrio.', 'warn');
      return;
    }

    const productosVidrio = agruparPorMedida(
      panelesVidrio,
      (p) => `${Math.round(p.w * 10)}x${Math.round(p.h * 10)}`,
      (p) => ({ id: `panel-${Math.round(p.w * 10)}x${Math.round(p.h * 10)}`, ancho: Number(p.w.toFixed(2)), alto: Number(p.h.toFixed(2)) })
    );

    const largosDivisores = listarLargosDivisores(arbol);
    const largosMarco = [ancho, ancho, alto, alto];
    const productosAluminio = agruparPorMedida(
      [...largosMarco, ...largosDivisores],
      (largo) => Math.round(largo * 10),
      (largo) => ({ id: `barra-${Math.round(largo * 10)}`, largo: Number(largo.toFixed(2)) })
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

      setResultado({
        vidrio: resVidrio,
        aluminio: resAluminio,
        panelesSolidos: hojas.filter((h) => h.tipo === 'solido'),
      });
    } catch {
      setErrorOpt('No se pudo conectar con el optimizador.');
    } finally {
      setOptimizando(false);
    }
  }, [arbol, ancho, alto, onToast]);

  const handleContinuar = useCallback(() => {
    onGuardarSuccess?.({
      ancho,
      alto,
      nombreServicio: nombreDisplay,
      arbolDiseno: arbol,
      perfil,
      aluminio: resultado?.aluminio || null,
      vidrio: resultado?.vidrio || null,
    });
  }, [ancho, alto, nombreDisplay, arbol, perfil, resultado, onGuardarSuccess]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="ds-loading">
        <IconLoader2 size={16} style={{ animation: 'ds-spin 1s linear infinite' }} />
        Cargando servicio…
      </div>
    );
  }

  const puedeDividirV = nodoSel && nodoSel.w > (2 * MIN_PANEL_CM + perfil);
  const puedeDividirH = nodoSel && nodoSel.h > (2 * MIN_PANEL_CM + perfil);

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

      <div className="ds-cols">
        {/* ── Columna izquierda: editor ─────────────────────────────── */}
        <div className="ds-left">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="ds-view-toggle">
              <button className={`ds-vbtn${!vista3D ? ' active' : ''}`} onClick={() => setVista3D(false)}>2D</button>
              <button className={`ds-vbtn${vista3D ? ' active' : ''}`} onClick={() => setVista3D(true)}>
                <IconBox size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />3D
              </button>
            </div>
            <span style={{ fontFamily: DS_MONO, fontSize: 11, color: '#8aa8bc' }}>{ancho}×{alto} cm</span>
          </div>

          <div className="ds-svg-wrap">
            {vista3D ? (
              <ServicioRender servicio={{ nombre: nombreDisplay }} ancho={ancho} alto={alto} configuracion={{ hojas: 2 }} />
            ) : (
              <EditorSVG ancho={ancho} alto={alto} arbol={arbol} perfil={perfil} seleccionId={seleccionId} onSelect={setSeleccionId} />
            )}
          </div>

          {/* Inputs de dimensiones del marco */}
          <div className="ds-card" style={{ padding: '12px 16px' }}>
            <div className="ds-dims">
              <div className="ds-dim-group">
                <span className="ds-dim-label">Ancho</span>
                <input className="ds-dim-input" type="number" min={10} max={1000} value={ancho}
                  onChange={e => aplicarNuevaMedida(Math.max(1, Number(e.target.value)), alto)} />
              </div>
              <span className="ds-dim-unit">×</span>
              <div className="ds-dim-group">
                <span className="ds-dim-label">Alto</span>
                <input className="ds-dim-input" type="number" min={10} max={1000} value={alto}
                  onChange={e => aplicarNuevaMedida(ancho, Math.max(1, Number(e.target.value)))} />
              </div>
              <span className="ds-dim-unit">cm</span>
              <div className="ds-dim-group">
                <span className="ds-dim-label">Perfil aluminio</span>
                <input className="ds-dim-input" style={{ width: 70 }} type="number" min={1} max={15} step={0.5} value={perfil}
                  onChange={e => setPerfil(Math.max(1, Number(e.target.value)))} />
              </div>
              <span className="ds-dim-unit">cm</span>
            </div>
            <div style={{ fontFamily: DS_MONO, fontSize: 10, color: '#8aa8bc', marginTop: 6 }}>
              Cambiar ancho/alto reinicia el diseño.
            </div>
          </div>

          {/* Editor de divisiones sobre el panel seleccionado */}
          <div className="ds-card">
            <div className="ds-section-lbl">Panel seleccionado</div>
            {nodoSel ? (
              <>
                <div className="ds-sel-info">{nodoSel.w.toFixed(1)} × {nodoSel.h.toFixed(1)} cm — {nodoSel.tipo === 'vidrio' ? 'Vidrio' : 'Sólido'}</div>

                <div className="ds-editor-row">
                  <div className="ds-tipo-toggle">
                    <button
                      className={`ds-tipo-btn${nodoSel.tipo === 'vidrio' ? ' active-vidrio' : ''}`}
                      onClick={() => handleCambiarTipo('vidrio')}
                    >
                      {nodoSel.tipo === 'vidrio' ? <IconSquareCheck size={13} /> : <IconSquare size={13} />} Vidrio
                    </button>
                    <button
                      className={`ds-tipo-btn${nodoSel.tipo === 'solido' ? ' active-solido' : ''}`}
                      onClick={() => handleCambiarTipo('solido')}
                    >
                      {nodoSel.tipo === 'solido' ? <IconSquareCheck size={13} /> : <IconSquare size={13} />} Sólido
                    </button>
                  </div>
                </div>

                <div className="ds-editor-row">
                  <div className="ds-dim-group">
                    <span className="ds-dim-label">Vertical a (cm)</span>
                    <input className="ds-dim-input" type="number" min={MIN_PANEL_CM} value={posV}
                      onChange={e => setPosV(e.target.value)} placeholder={String(Math.round(nodoSel.w / 2))} disabled={!puedeDividirV} />
                  </div>
                  <button className="ds-editor-btn" onClick={() => handleDividir('v')} disabled={!puedeDividirV}>
                    + División vertical
                  </button>
                </div>

                <div className="ds-editor-row">
                  <div className="ds-dim-group">
                    <span className="ds-dim-label">Horizontal a (cm)</span>
                    <input className="ds-dim-input" type="number" min={MIN_PANEL_CM} value={posH}
                      onChange={e => setPosH(e.target.value)} placeholder={String(Math.round(nodoSel.h / 2))} disabled={!puedeDividirH} />
                  </div>
                  <button className="ds-editor-btn" onClick={() => handleDividir('h')} disabled={!puedeDividirH}>
                    + División horizontal
                  </button>
                </div>

                <div className="ds-editor-row">
                  <button className="ds-editor-btn danger" onClick={handleDeshacer} disabled={!historial.length}>
                    <IconArrowBackUp size={14} /> Deshacer última división
                  </button>
                </div>
              </>
            ) : (
              <div style={{ fontFamily: DS_MONO, fontSize: 12, color: '#8aa8bc' }}>Haz click en un panel del plano para seleccionarlo.</div>
            )}
          </div>
        </div>

        {/* ── Columna derecha: resultados del optimizador ─────────────── */}
        <div className="ds-right">
          {errorOpt && <div className="ds-error">{errorOpt}</div>}

          {!resultado ? (
            <div className="ds-card">
              <div className="ds-section-lbl">Resumen del diseño</div>
              {(() => {
                const hojas = listarHojas(arbol);
                const vidrioN = hojas.filter(h => h.tipo === 'vidrio').length;
                const solidoN = hojas.filter(h => h.tipo === 'solido').length;
                return (
                  <>
                    <div className="ds-stat-row"><span>Paneles de vidrio</span><span className="ds-stat-val">{vidrioN}</span></div>
                    <div className="ds-stat-row"><span>Paneles sólidos</span><span className="ds-stat-val">{solidoN}</span></div>
                  </>
                );
              })()}
              <button className="ds-btn-continuar" style={{ marginTop: 14 }} onClick={handleOptimizar} disabled={optimizando}>
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
    </div>
  );
}

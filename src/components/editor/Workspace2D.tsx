import { useState, useMemo, useCallback, useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  createFrame, splitZone, insertSystem, resetZone, getNode, summarizeGraph,
} from '../../engine/geometry/ContainerGraph';
import type { ContainerGraph, SplitDirection, SystemType } from '../../engine/geometry/ContainerGraph';
import type { SystemConfig } from '../../engine/geometry/DeductionEngine';
import Toolbox from './Toolbox';
import PropertiesPanel from './PropertiesPanel';

const CANVAS_W = 420;
const CANVAS_H = 380;
const PAD = 56;
const ARROW_OFFSET = 22;
const ALUM_COLOR = '#7a9ab5';
const VIDRIO_FILL = 'rgba(180,220,255,0.28)';
const VIDRIO_STROKE = '#4a9eff';
const SOLIDO_FILL = 'rgba(154,169,184,.5)';
const SEL_STROKE = '#f59e0b';
const DIM_COLOR = '#5a8ba8';
const MONO = "'IBM Plex Mono',monospace";

const SYSTEM_LABEL: Record<SystemType, string> = {
  glass: 'VIDRIO',
  fixed: 'FIJO',
  sliding: 'CORREDIZA',
  hinged: 'BATIENTE',
};

const INPUT_STYLE: CSSProperties = {
  width: 86, padding: '7px 10px', borderRadius: 8, border: '1.5px solid rgba(128,194,220,.45)',
  fontFamily: "'IBM Plex Mono',monospace", fontSize: 14, fontWeight: 600, textAlign: 'center', outline: 'none',
};
const CARD: CSSProperties = { background: 'rgba(255,255,255,.65)', borderRadius: 14, border: '1px solid rgba(128,194,220,.25)', padding: 16 };

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: 1.2, color: '#8aa8bc', textTransform: 'uppercase' }}>{label}</span>
      {children}
    </div>
  );
}

interface Workspace2DProps {
  initialWidth?: number;
  initialHeight?: number;
  initialProfileWidth?: number;
  title?: string;
  onChange?: (graph: ContainerGraph) => void;
}

export default function Workspace2D({
  initialWidth = 150,
  initialHeight = 120,
  initialProfileWidth = 4.5,
  title = 'Editor CAD 2D — Fase 1 (modelo geométrico)',
  onChange,
}: Workspace2DProps) {
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [frameProfileWidth, setFrameProfileWidth] = useState(initialProfileWidth);
  const [graph, setGraph] = useState<ContainerGraph>(() => createFrame(initialWidth, initialHeight, initialProfileWidth));
  const [history, setHistory] = useState<ContainerGraph[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onChange?.(graph);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  const drawW = CANVAS_W - 2 * PAD;
  const drawH = CANVAS_H - 2 * PAD;
  const scale = Math.min(drawW / graph.frame.width, drawH / graph.frame.height);
  const rW = graph.frame.width * scale;
  const rH = graph.frame.height * scale;
  const rX = PAD + (drawW - rW) / 2;
  const rY = PAD + (drawH - rH) / 2;
  const toX = (cm: number) => rX + cm * scale;
  const toY = (cm: number) => rY + cm * scale;
  const toLen = (cm: number) => cm * scale;

  const applyNewFrame = (w: number, h: number, pf: number) => {
    setWidth(w); setHeight(h); setFrameProfileWidth(pf);
    setGraph(createFrame(w, h, pf));
    setHistory([]);
    setSelectedId(null);
    setError(null);
  };

  const pushHistory = () => setHistory((h) => [...h, graph].slice(-20));

  const handleSplit = useCallback((direction: SplitDirection, positionCm: number, dividerWidth: number) => {
    if (!selectedId) return;
    try {
      const next = splitZone(graph, selectedId, direction, positionCm, dividerWidth);
      pushHistory();
      setGraph(next);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, selectedId]);

  const handleInsertSystem = useCallback((systemType: SystemType, config: SystemConfig) => {
    if (!selectedId) return;
    try {
      const next = insertSystem(graph, selectedId, systemType, config);
      pushHistory();
      setGraph(next);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, selectedId]);

  const handleReset = useCallback((zoneId: string) => {
    try {
      const next = resetZone(graph, zoneId);
      pushHistory();
      setGraph(next);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  const handleUndo = useCallback(() => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setGraph(prev);
    setError(null);
  }, [history]);

  const selectedNode = selectedId ? getNode(graph, selectedId) : null;
  const summary = useMemo(() => summarizeGraph(graph), [graph]);

  function renderZone(nodeId: string): ReactNode[] {
    const node = graph.nodes[nodeId];
    if (!node) return [];
    const elements: ReactNode[] = [];

    if (node.childIds) {
      const [aId, bId] = node.childIds;
      const a = graph.nodes[aId];
      const divW = node.dividerProfileWidth || 0;
      const divRect = node.splitDirection === 'vertical'
        ? { x: a.rect.x + a.rect.width, y: node.rect.y, w: divW, h: node.rect.height }
        : { x: node.rect.x, y: a.rect.y + a.rect.height, w: node.rect.width, h: divW };
      elements.push(
        <rect key={`div-${node.id}`} x={toX(divRect.x)} y={toY(divRect.y)} width={toLen(divRect.w)} height={toLen(divRect.h)} fill={ALUM_COLOR} opacity={0.85} />
      );
      elements.push(...renderZone(aId), ...renderZone(bId));
      return elements;
    }

    const sx = toX(node.rect.x), sy = toY(node.rect.y), sw = toLen(node.rect.width), sh = toLen(node.rect.height);
    const isSelected = node.id === selectedId;
    const cx = sx + sw / 2, cy = sy + sh / 2;
    const medida = `${node.rect.width.toFixed(0)}×${node.rect.height.toFixed(0)}`;
    const cabeMedida = sw > 52 && sh > 22;

    if (!node.leaf) {
      elements.push(
        <g key={node.id} onClick={() => setSelectedId(node.id)} style={{ cursor: 'pointer' }}>
          <rect
            x={sx} y={sy} width={sw} height={sh}
            fill="rgba(240,248,255,.4)" stroke={isSelected ? SEL_STROKE : '#c7dbe8'}
            strokeWidth={isSelected ? 2.5 : 1} strokeDasharray="5,4"
          />
          {cabeMedida && (
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="#8aa8bc" fontFamily={MONO} style={{ pointerEvents: 'none' }}>
              {medida}
            </text>
          )}
        </g>
      );
      return elements;
    }

    const etiqueta = `${SYSTEM_LABEL[node.leaf.systemType]}${node.leaf.config.hojas ? ` ${node.leaf.config.hojas}H` : ''}`;

    elements.push(
      <g key={node.id} onClick={() => setSelectedId(node.id)} style={{ cursor: 'pointer' }}>
        {node.leaf.systemType !== 'glass' && (
          <rect x={sx} y={sy} width={sw} height={sh} fill={ALUM_COLOR} opacity={0.5} />
        )}
        {node.leaf.panels.map((p) => {
          const px = toX(p.x), py = toY(p.y), pw = toLen(p.width), ph = toLen(p.height);
          return (
            <g key={p.id}>
              <rect x={px} y={py} width={pw} height={ph} fill={p.material === 'vidrio' ? VIDRIO_FILL : SOLIDO_FILL} stroke={VIDRIO_STROKE} strokeWidth={0.8} />
              {p.material === 'vidrio' && (
                <>
                  <line x1={px + 2} y1={py + 2} x2={px + pw - 2} y2={py + ph - 2} stroke={VIDRIO_STROKE} strokeWidth={0.8} strokeDasharray="5,4" opacity={0.5} />
                  <line x1={px + pw - 2} y1={py + 2} x2={px + 2} y2={py + ph - 2} stroke={VIDRIO_STROKE} strokeWidth={0.8} strokeDasharray="5,4" opacity={0.5} />
                </>
              )}
            </g>
          );
        })}
        {cabeMedida && (
          <g style={{ pointerEvents: 'none' }}>
            <rect x={cx - Math.min(sw - 6, 74) / 2} y={cy - 15} width={Math.min(sw - 6, 74)} height={26} rx={4} fill="rgba(255,255,255,.85)" />
            <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={700} fill="#1a2a3a" fontFamily={MONO}>
              {etiqueta}
            </text>
            <text x={cx} y={cy + 7} textAnchor="middle" dominantBaseline="middle" fontSize={8.5} fill="#5a7a90" fontFamily={MONO}>
              {medida}
            </text>
          </g>
        )}
        <rect x={sx} y={sy} width={sw} height={sh} fill="none" stroke={isSelected ? SEL_STROKE : 'transparent'} strokeWidth={isSelected ? 2.5 : 0} />
      </g>
    );
    return elements;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, alignItems: 'start', fontFamily: "'Open Sans',sans-serif", padding: 20, maxWidth: 980, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: 17, fontWeight: 700, color: '#1a2a3a' }}>{title}</span>

        <div style={{ background: 'rgba(240,248,255,.6)', borderRadius: 12, border: '1px solid rgba(128,194,220,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <svg viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} width={CANVAS_W} height={CANVAS_H} style={{ display: 'block', maxWidth: '100%' }}>
            <defs>
              <marker id="ws-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 Z" fill={DIM_COLOR} />
              </marker>
              <marker id="ws-arrow-r" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
                <path d="M0,0 L0,6 L6,3 Z" fill={DIM_COLOR} />
              </marker>
            </defs>

            {renderZone(graph.rootId)}

            {/* Cota de ANCHO total, arriba */}
            <line x1={rX} y1={rY - ARROW_OFFSET} x2={rX + rW} y2={rY - ARROW_OFFSET} stroke={DIM_COLOR} strokeWidth={1} markerStart="url(#ws-arrow-r)" markerEnd="url(#ws-arrow)" />
            <line x1={rX} y1={rY - 6} x2={rX} y2={rY - ARROW_OFFSET + 2} stroke={DIM_COLOR} strokeWidth={0.8} strokeDasharray="3,2" opacity={0.6} />
            <line x1={rX + rW} y1={rY - 6} x2={rX + rW} y2={rY - ARROW_OFFSET + 2} stroke={DIM_COLOR} strokeWidth={0.8} strokeDasharray="3,2" opacity={0.6} />
            <text x={rX + rW / 2} y={rY - ARROW_OFFSET - 6} textAnchor="middle" fill="#1a2a3a" fontSize={11} fontFamily={MONO} fontWeight={700}>
              ANCHO {graph.frame.width} cm
            </text>

            {/* Cota de ALTO total, a la derecha */}
            <line x1={rX + rW + ARROW_OFFSET} y1={rY} x2={rX + rW + ARROW_OFFSET} y2={rY + rH} stroke={DIM_COLOR} strokeWidth={1} markerStart="url(#ws-arrow-r)" markerEnd="url(#ws-arrow)" />
            <line x1={rX + rW + 6} y1={rY} x2={rX + rW + ARROW_OFFSET - 2} y2={rY} stroke={DIM_COLOR} strokeWidth={0.8} strokeDasharray="3,2" opacity={0.6} />
            <line x1={rX + rW + 6} y1={rY + rH} x2={rX + rW + ARROW_OFFSET - 2} y2={rY + rH} stroke={DIM_COLOR} strokeWidth={0.8} strokeDasharray="3,2" opacity={0.6} />
            <text x={rX + rW + ARROW_OFFSET + 7} y={rY + rH / 2} textAnchor="middle" fill="#1a2a3a" fontSize={11} fontFamily={MONO} fontWeight={700} transform={`rotate(90, ${rX + rW + ARROW_OFFSET + 7}, ${rY + rH / 2})`}>
              ALTO {graph.frame.height} cm
            </text>
          </svg>
        </div>

        <div style={{ ...CARD, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Field label="Ancho (cm)">
            <input style={INPUT_STYLE} type="number" min={20} max={1000} value={width}
              onChange={(e) => applyNewFrame(Math.max(20, Number(e.target.value)), height, frameProfileWidth)} />
          </Field>
          <Field label="Alto (cm)">
            <input style={INPUT_STYLE} type="number" min={20} max={1000} value={height}
              onChange={(e) => applyNewFrame(width, Math.max(20, Number(e.target.value)), frameProfileWidth)} />
          </Field>
          <Field label="Perfil marco (cm)">
            <input style={INPUT_STYLE} type="number" min={1} step={0.5} value={frameProfileWidth}
              onChange={(e) => applyNewFrame(width, height, Math.max(1, Number(e.target.value)))} />
          </Field>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#8aa8bc' }}>Cambiar estas medidas reinicia el diseño.</span>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#8aa8bc' }}>
          <span>Paños: <b style={{ color: '#2d4a62' }}>{summary.paneles}</b></span>
          <span>Vidrio: <b style={{ color: '#2d4a62' }}>{summary.areaVidrioM2.toFixed(2)} m²</b></span>
          <span>Perfiles: <b style={{ color: '#2d4a62' }}>{summary.perfiles}</b></span>
          <span>Aluminio: <b style={{ color: '#2d4a62' }}>{summary.largoAluminioTotalM.toFixed(2)} m</b></span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={CARD}>
          <Toolbox
            node={selectedNode}
            defaultProfileWidth={frameProfileWidth}
            onSplit={handleSplit}
            onInsertSystem={handleInsertSystem}
            onReset={handleReset}
            onUndo={handleUndo}
            canUndo={history.length > 0}
            error={error}
          />
        </div>
        <div style={CARD}>
          <PropertiesPanel node={selectedNode} />
        </div>
      </div>
    </div>
  );
}

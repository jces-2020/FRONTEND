import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import type { ZoneNode, SplitDirection, SystemType } from '../../engine/geometry/ContainerGraph';
import type { SystemConfig } from '../../engine/geometry/DeductionEngine';

const CARD_LABEL: CSSProperties = {
  fontFamily: "'IBM Plex Mono',monospace",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.2,
  color: '#8aa8bc',
  textTransform: 'uppercase',
  marginBottom: 6,
};

const FIELD: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 3 };
const INPUT: CSSProperties = {
  width: 74, padding: '6px 8px', borderRadius: 7, border: '1.5px solid rgba(128,194,220,.45)',
  fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, textAlign: 'center', outline: 'none',
};
const SELECT: CSSProperties = { ...INPUT, width: 150, textAlign: 'left' };
const ROW: CSSProperties = { display: 'flex', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap' };
const BTN: CSSProperties = {
  padding: '8px 12px', borderRadius: 9, border: '1px solid rgba(128,194,220,.4)', background: 'rgba(255,255,255,.85)',
  fontFamily: "'Oswald',sans-serif", fontSize: 12, fontWeight: 700, color: '#2d4a62', cursor: 'pointer',
};
const BTN_PRIMARY: CSSProperties = { ...BTN, background: '#127fc3', color: '#fff', borderColor: '#127fc3' };
const BTN_DANGER: CSSProperties = { ...BTN, color: '#991b1b', borderColor: 'rgba(220,38,38,.3)' };

const SYSTEM_OPTIONS: Array<{ value: SystemType; label: string }> = [
  { value: 'fixed', label: 'Paño Fijo' },
  { value: 'sliding', label: 'Sistema Corredizo' },
  { value: 'hinged', label: 'Puerta Batiente' },
];

interface ToolboxProps {
  node: ZoneNode | null;
  defaultProfileWidth: number;
  onSplit: (direction: SplitDirection, positionCm: number, dividerWidth: number) => void;
  onInsertSystem: (systemType: SystemType, config: SystemConfig) => void;
  onReset: (zoneId: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  error?: string | null;
}

export default function Toolbox({ node, defaultProfileWidth, onSplit, onInsertSystem, onReset, onUndo, canUndo, error }: ToolboxProps) {
  const [posV, setPosV] = useState('');
  const [posH, setPosH] = useState('');
  const [dividerWidth, setDividerWidth] = useState(String(defaultProfileWidth));

  const [systemType, setSystemType] = useState<SystemType>('fixed');
  const [profileWidth, setProfileWidth] = useState(String(defaultProfileWidth));
  const [hojas, setHojas] = useState('2');
  const [traslape, setTraslape] = useState('2');

  useEffect(() => {
    setPosV(''); setPosH('');
  }, [node?.id]);

  if (!node) {
    return <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#8aa8bc' }}>Haz click en una zona del plano para editarla.</div>;
  }
  if (node.childIds) {
    return <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#8aa8bc' }}>Selecciona uno de los dos paneles resultantes de esta división.</div>;
  }

  const handleSplit = (direction: SplitDirection) => {
    const pos = Number(direction === 'vertical' ? posV : posH);
    const dw = Number(dividerWidth);
    if (!pos || Number.isNaN(pos) || !dw || Number.isNaN(dw)) return;
    onSplit(direction, pos, dw);
  };

  const handleInsert = () => {
    const config: SystemConfig = { profileWidth: Number(profileWidth) || defaultProfileWidth };
    if (systemType === 'sliding') {
      config.hojas = Math.max(2, Number(hojas) || 2);
      config.traslape = Number(traslape) || 2;
    }
    onInsertSystem(systemType, config);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {error && (
        <div style={{ padding: '8px 12px', borderRadius: 9, background: 'rgba(220,38,38,.07)', border: '1px solid rgba(220,38,38,.2)', color: '#991b1b', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5 }}>
          {error}
        </div>
      )}

      {!node.leaf ? (
        <>
          <div>
            <div style={CARD_LABEL}>Dividir zona</div>
            <div style={ROW}>
              <div style={FIELD}>
                <span style={{ fontSize: 9, color: '#8aa8bc' }}>Ancho perfil (cm)</span>
                <input style={INPUT} type="number" min={1} step={0.5} value={dividerWidth} onChange={(e) => setDividerWidth(e.target.value)} />
              </div>
            </div>
            <div style={{ ...ROW, marginTop: 8 }}>
              <div style={FIELD}>
                <span style={{ fontSize: 9, color: '#8aa8bc' }}>Vertical a (cm)</span>
                <input style={INPUT} type="number" min={3} value={posV} onChange={(e) => setPosV(e.target.value)} placeholder={String(Math.round(node.rect.width / 2))} />
              </div>
              <button style={BTN} onClick={() => handleSplit('vertical')}>+ División vertical</button>
            </div>
            <div style={{ ...ROW, marginTop: 8 }}>
              <div style={FIELD}>
                <span style={{ fontSize: 9, color: '#8aa8bc' }}>Horizontal a (cm)</span>
                <input style={INPUT} type="number" min={3} value={posH} onChange={(e) => setPosH(e.target.value)} placeholder={String(Math.round(node.rect.height / 2))} />
              </div>
              <button style={BTN} onClick={() => handleSplit('horizontal')}>+ División horizontal</button>
            </div>
          </div>

          <div>
            <div style={CARD_LABEL}>Insertar sistema</div>
            <div style={ROW}>
              <select style={SELECT} value={systemType} onChange={(e) => setSystemType(e.target.value as SystemType)}>
                {SYSTEM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ ...ROW, marginTop: 8 }}>
              <div style={FIELD}>
                <span style={{ fontSize: 9, color: '#8aa8bc' }}>Perfil (cm)</span>
                <input style={INPUT} type="number" min={1} step={0.5} value={profileWidth} onChange={(e) => setProfileWidth(e.target.value)} />
              </div>
              {systemType === 'sliding' && (
                <>
                  <div style={FIELD}>
                    <span style={{ fontSize: 9, color: '#8aa8bc' }}>Hojas</span>
                    <input style={INPUT} type="number" min={2} max={6} value={hojas} onChange={(e) => setHojas(e.target.value)} />
                  </div>
                  <div style={FIELD}>
                    <span style={{ fontSize: 9, color: '#8aa8bc' }}>Traslape (cm)</span>
                    <input style={INPUT} type="number" min={0.5} step={0.5} value={traslape} onChange={(e) => setTraslape(e.target.value)} />
                  </div>
                </>
              )}
            </div>
            <button style={{ ...BTN_PRIMARY, marginTop: 8, width: '100%' }} onClick={handleInsert}>Insertar sistema</button>
          </div>
        </>
      ) : (
        <button style={BTN_DANGER} onClick={() => onReset(node.id)}>Quitar sistema</button>
      )}

      <button style={BTN} onClick={onUndo} disabled={!canUndo}>Deshacer último cambio</button>
    </div>
  );
}

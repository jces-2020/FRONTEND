import type { CSSProperties } from 'react';
import type { ZoneNode } from '../../engine/geometry/ContainerGraph';

const LABEL_STYLE: CSSProperties = {
  fontFamily: "'IBM Plex Mono',monospace",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.2,
  color: '#8aa8bc',
  textTransform: 'uppercase',
};

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontFamily: "'IBM Plex Mono',monospace",
  fontSize: 12,
  color: '#2d4a62',
  padding: '3px 0',
};

const SYSTEM_LABEL: Record<string, string> = {
  glass: 'Vidrio (sin aluminio)',
  fixed: 'Paño Fijo',
  sliding: 'Sistema Corredizo',
  hinged: 'Puerta Batiente',
};

interface PropertiesPanelProps {
  node: ZoneNode | null;
  onUpdateColor?: (color: string) => void;
}

export default function PropertiesPanel({ node, onUpdateColor }: PropertiesPanelProps) {
  if (!node) {
    return (
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#8aa8bc' }}>
        Selecciona una zona del plano para ver sus propiedades.
      </div>
    );
  }

  if (node.childIds) {
    return (
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#8aa8bc' }}>
        Esta zona está dividida en dos — selecciona uno de los paneles resultantes.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={LABEL_STYLE}>Zona</div>
        <div style={ROW_STYLE}><span>Ancho</span><span>{node.rect.width.toFixed(1)} cm</span></div>
        <div style={ROW_STYLE}><span>Alto</span><span>{node.rect.height.toFixed(1)} cm</span></div>
      </div>

      {!node.leaf ? (
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#8aa8bc' }}>
          Zona vacía — usa el panel de herramientas para dividirla o insertar un sistema.
        </div>
      ) : (
        <>
          <div>
            <div style={LABEL_STYLE}>Sistema</div>
            <div style={ROW_STYLE}><span>Tipo</span><span>{SYSTEM_LABEL[node.leaf.systemType] || node.leaf.systemType}</span></div>
            {node.leaf.systemType !== 'glass' && (
              <div style={ROW_STYLE}><span>Perfil</span><span>{node.leaf.config.profileWidth} cm</span></div>
            )}
            {node.leaf.config.hojas != null && (
              <div style={ROW_STYLE}><span>Hojas</span><span>{node.leaf.config.hojas}</span></div>
            )}
          </div>

          <div>
            <div style={LABEL_STYLE}>Paños ({node.leaf.panels.length})</div>
            {node.leaf.panels.map((p) => (
              <div key={p.id} style={ROW_STYLE}>
                <span>{p.material === 'vidrio' ? 'Vidrio' : 'Sólido'}</span>
                <span>{p.width.toFixed(1)} × {p.height.toFixed(1)} cm</span>
              </div>
            ))}
          </div>

          <div>
            <div style={LABEL_STYLE}>Perfiles ({node.leaf.profiles.length})</div>
            <div style={{ maxHeight: 140, overflowY: 'auto' }}>
              {node.leaf.profiles.map((b) => (
                <div key={b.id} style={ROW_STYLE}>
                  <span>{b.role} ({b.angleStart}°)</span>
                  <span>{b.length.toFixed(1)} cm</span>
                </div>
              ))}
            </div>
          </div>

          {onUpdateColor && (
            <div>
              <div style={LABEL_STYLE}>Color del vidrio/perfil</div>
              <input
                type="color"
                value={node.leaf.config.color || '#4a9eff'}
                onChange={(e) => onUpdateColor(e.target.value)}
                style={{ width: 48, height: 28, border: 'none', background: 'none', cursor: 'pointer' }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

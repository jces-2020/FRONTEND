// Fórmulas de holguras y descuentos: convierte el hueco nominal de una Zona
// en las medidas reales de fabricación de sus paños y perfiles, según el tipo
// de Sistema insertado.
//
// A propósito no trae tablas de descuento por catálogo de fabricante (Cuprum,
// Miyasato, etc.) — esos valores reales dependen de la línea de perfil exacta
// y deben salir de los manuales técnicos, no inventarse. Todo acá es
// geometría genérica parametrizada: quien use el motor pasa el ancho de
// perfil, la holgura de vidrio, el traslape, etc. como configuración.

import type { Rect, Panel, ProfileBar, PanelMaterial, SystemType } from './ContainerGraph';
import type { CutAngle } from './AngleCalculator';
import { miterCutLengths, squareCutLength } from './AngleCalculator';

export interface SystemConfig {
  /** Ancho visto del perfil principal del sistema (marco/riel), en cm. */
  profileWidth: number;
  /** Ancho visto del perfil de cada hoja/puerta, si es distinto al principal. Por defecto usa `profileWidth`. */
  hojaProfileWidth?: number;
  /** Cantidad de hojas corredizas (solo `sliding`). */
  hojas?: number;
  /** Traslape entre perfiles de hojas corredizas contiguas, en cm (solo `sliding`). */
  traslape?: number;
  /** Holgura entre el vidrio y la garra del perfil, por lado, en cm. */
  holguraVidrio?: number;
  /** Holgura alrededor de la hoja batiente para que abra sin rozar, en cm (solo `hinged`). */
  holguraBisagra?: number;
  /** Ángulo de corte de las esquinas del sub-marco del sistema (no del marco exterior del vano). */
  cornerAngle?: CutAngle;
  color?: string;
  espesorVidrio?: number;
}

export interface DeductionResult {
  panels: Array<Omit<Panel, 'id'>>;
  profiles: Array<Omit<ProfileBar, 'id'>>;
}

const DEFAULT_HOLGURA_VIDRIO = 0.5; // cm por lado
const DEFAULT_TRASLAPE = 2.0; // cm, típico en corredizas de 2-4 hojas
const DEFAULT_HOLGURA_BISAGRA = 0.4; // cm por lado

function frameBars(rect: Rect, profileWidth: number, cornerAngle: CutAngle, rolePrefix: string): Array<Omit<ProfileBar, 'id'>> {
  const sides: Array<{ role: string; length: number }> = [
    { role: `${rolePrefix}-superior`, length: rect.width },
    { role: `${rolePrefix}-inferior`, length: rect.width },
    { role: `${rolePrefix}-izquierdo`, length: rect.height },
    { role: `${rolePrefix}-derecho`, length: rect.height },
  ];
  return sides.map(({ role, length }) => {
    if (cornerAngle === 45) {
      const { longPoint, shortPoint } = miterCutLengths(length, profileWidth);
      return { role, length: longPoint, shortPointLength: shortPoint, angleStart: 45 as CutAngle, angleEnd: 45 as CutAngle, profileWidth };
    }
    const cut = squareCutLength(length, 0);
    return { role, length: cut, shortPointLength: cut, angleStart: 90 as CutAngle, angleEnd: 90 as CutAngle, profileWidth };
  });
}

const VIDRIO: PanelMaterial = 'vidrio';

/**
 * Paño Fijo: el hueco de la zona donde se inserta ya está delimitado por
 * aluminio real (el marco exterior del vano, o un divisor creado al dividir
 * la zona) — no se genera un marco nuevo. El vidrio va sostenido ahí con
 * junquillo (una garra liviana de captura, no una barra estructural), por
 * eso `profileWidth` solo se usa para calcular cuánto se mete el vidrio
 * hacia adentro, sin producir perfiles nuevos para cortar.
 */
export function deduceFixedPanel(rect: Rect, config: SystemConfig): DeductionResult {
  const profileWidth = config.profileWidth;
  const holgura = config.holguraVidrio ?? DEFAULT_HOLGURA_VIDRIO;

  const glassWidth = rect.width - 2 * profileWidth - 2 * holgura;
  const glassHeight = rect.height - 2 * profileWidth - 2 * holgura;

  const panel: Omit<Panel, 'id'> = {
    material: VIDRIO,
    x: rect.x + profileWidth + holgura,
    y: rect.y + profileWidth + holgura,
    width: glassWidth,
    height: glassHeight,
    color: config.color,
    thickness: config.espesorVidrio,
  };

  return { panels: [panel], profiles: [] };
}

/**
 * Sistema Corredizo de N hojas: reparte el ancho disponible entre las hojas
 * considerando el traslape (cruce) de los perfiles centrales — cada unión
 * intermedia "regala" `traslape` cm de vuelta al ancho total de hojas, por
 * eso se suma (hojas-1)*traslape antes de dividir entre la cantidad de hojas.
 */
export function deduceSlidingSystem(rect: Rect, config: SystemConfig): DeductionResult {
  const hojas = Math.max(2, Math.round(config.hojas ?? 2));
  const trackProfileWidth = config.profileWidth;
  const hojaProfileWidth = config.hojaProfileWidth ?? config.profileWidth;
  const traslape = config.traslape ?? DEFAULT_TRASLAPE;
  const holgura = config.holguraVidrio ?? DEFAULT_HOLGURA_VIDRIO;
  const cornerAngle = config.cornerAngle ?? 90; // las hojas corredizas se ensamblan a escuadra, no a inglete

  const trackInnerWidth = rect.width - 2 * trackProfileWidth;
  const trackInnerHeight = rect.height - 2 * trackProfileWidth;
  const hojaWidth = (trackInnerWidth + (hojas - 1) * traslape) / hojas;

  const panels: Array<Omit<Panel, 'id'>> = [];
  const profiles: Array<Omit<ProfileBar, 'id'>> = [];

  for (let i = 0; i < hojas; i += 1) {
    const hojaX = rect.x + trackProfileWidth + i * (hojaWidth - traslape);
    const hojaRect: Rect = { x: hojaX, y: rect.y + trackProfileWidth, width: hojaWidth, height: trackInnerHeight };
    const glassWidth = hojaWidth - 2 * hojaProfileWidth - 2 * holgura;
    const glassHeight = trackInnerHeight - 2 * hojaProfileWidth - 2 * holgura;

    panels.push({
      material: VIDRIO,
      x: hojaRect.x + hojaProfileWidth + holgura,
      y: hojaRect.y + hojaProfileWidth + holgura,
      width: glassWidth,
      height: glassHeight,
      color: config.color,
      thickness: config.espesorVidrio,
    });
    profiles.push(...frameBars(hojaRect, hojaProfileWidth, cornerAngle, `hoja-${i + 1}`));
  }

  // Riel superior e inferior: el canal por donde deslizan las hojas es un
  // perfil real y distinto (no un marco genérico), así que sí se cuenta.
  // Los lados izquierdo/derecho NO generan perfil nuevo: ahí las hojas
  // apoyan directo contra el marco o divisor que ya delimita la zona (mismo
  // motivo que el paño fijo — no hay que volver a enmarcar un borde que ya
  // es aluminio).
  const rielSup = squareCutLength(rect.width, 0);
  profiles.push(
    { role: 'riel-superior', length: rielSup, shortPointLength: rielSup, angleStart: 90, angleEnd: 90, profileWidth: trackProfileWidth },
    { role: 'riel-inferior', length: rielSup, shortPointLength: rielSup, angleStart: 90, angleEnd: 90, profileWidth: trackProfileWidth },
  );

  return { panels, profiles };
}

/**
 * Puerta Batiente: igual que el paño fijo, la jamba no genera perfil nuevo
 * (el hueco ya está delimitado por el marco exterior o un divisor) — solo la
 * hoja, la parte móvil con bisagras, es aluminio nuevo de verdad.
 */
export function deduceHingedDoor(rect: Rect, config: SystemConfig): DeductionResult {
  const jambProfileWidth = config.profileWidth;
  const doorProfileWidth = config.hojaProfileWidth ?? config.profileWidth;
  const holguraBisagra = config.holguraBisagra ?? DEFAULT_HOLGURA_BISAGRA;
  const holguraVidrio = config.holguraVidrio ?? DEFAULT_HOLGURA_VIDRIO;
  const cornerAngle = config.cornerAngle ?? 45;

  const doorRect: Rect = {
    x: rect.x + jambProfileWidth + holguraBisagra,
    y: rect.y + jambProfileWidth + holguraBisagra,
    width: rect.width - 2 * jambProfileWidth - 2 * holguraBisagra,
    height: rect.height - 2 * jambProfileWidth - 2 * holguraBisagra,
  };
  const glassWidth = doorRect.width - 2 * doorProfileWidth - 2 * holguraVidrio;
  const glassHeight = doorRect.height - 2 * doorProfileWidth - 2 * holguraVidrio;

  const panel: Omit<Panel, 'id'> = {
    material: VIDRIO,
    x: doorRect.x + doorProfileWidth + holguraVidrio,
    y: doorRect.y + doorProfileWidth + holguraVidrio,
    width: glassWidth,
    height: glassHeight,
    color: config.color,
    thickness: config.espesorVidrio,
  };

  return {
    panels: [panel],
    profiles: frameBars(doorRect, doorProfileWidth, cornerAngle, 'hoja-batiente'),
  };
}

export function deduceSystem(systemType: SystemType, rect: Rect, config: SystemConfig): DeductionResult {
  switch (systemType) {
    case 'fixed':
      return deduceFixedPanel(rect, config);
    case 'sliding':
      return deduceSlidingSystem(rect, config);
    case 'hinged':
      return deduceHingedDoor(rect, config);
    default:
      throw new Error(`Sistema desconocido: ${systemType}`);
  }
}

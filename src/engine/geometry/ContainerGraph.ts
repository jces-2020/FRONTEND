// Modelo geométrico del editor CAD: Grafo de Contenedores (Marco > Zonas > Hojas/Paños).
//
// A diferencia del árbol binario anterior (un nodo = un panel, sin conceptos
// intermedios), acá una Zona es solo un "hueco" del plano: puede quedar vacía,
// dividirse en dos Zonas hijas, o recibir un Sistema (Leaf) — Paño Fijo,
// Corrediza o Puerta Batiente — que ya trae sus propios paños y perfiles
// calculados por el DeductionEngine. El grafo se representa como un mapa
// plano id -> nodo (no un árbol anidado), para poder crecer a futuro hacia
// relaciones no estrictamente jerárquicas (p.ej. perfiles compartidos entre
// zonas vecinas) sin cambiar la forma de los datos.

import { miterCutLengths, squareCutLength } from './AngleCalculator';
import type { CutAngle } from './AngleCalculator';
import { deduceSystem } from './DeductionEngine';
import type { SystemConfig } from './DeductionEngine';

export type SplitDirection = 'vertical' | 'horizontal';
export type SystemType = 'fixed' | 'sliding' | 'hinged';
export type PanelMaterial = 'vidrio' | 'solido';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProfileBar {
  id: string;
  role: string;
  /** Medida de corte (punta larga si es inglete a 45°). */
  length: number;
  /** Medida punta corta — igual a `length` en cortes a 90°. */
  shortPointLength: number;
  angleStart: CutAngle;
  angleEnd: CutAngle;
  profileWidth: number;
}

export interface Panel {
  id: string;
  material: PanelMaterial;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  thickness?: number;
}

export interface Leaf {
  id: string;
  systemType: SystemType;
  config: SystemConfig;
  panels: Panel[];
  profiles: ProfileBar[];
}

export interface ZoneNode {
  id: string;
  parentId: string | null;
  /** Rect nominal del hueco disponible, en cm, relativo al origen del marco. */
  rect: Rect;
  splitDirection: SplitDirection | null;
  childIds: [string, string] | null;
  dividerProfileWidth: number | null;
  leaf: Leaf | null;
}

export interface ContainerGraph {
  frame: { width: number; height: number; profileWidth: number; cornerAngle: CutAngle };
  rootId: string;
  nodes: Record<string, ZoneNode>;
}

const MIN_ZONE_CM = 10;

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

export function createFrame(
  width: number,
  height: number,
  profileWidth = 4.5,
  cornerAngle: CutAngle = 45
): ContainerGraph {
  const rootId = nextId('zone');
  const root: ZoneNode = {
    id: rootId,
    parentId: null,
    rect: {
      x: profileWidth,
      y: profileWidth,
      width: Math.max(0, width - 2 * profileWidth),
      height: Math.max(0, height - 2 * profileWidth),
    },
    splitDirection: null,
    childIds: null,
    dividerProfileWidth: null,
    leaf: null,
  };
  return {
    frame: { width, height, profileWidth, cornerAngle },
    rootId,
    nodes: { [rootId]: root },
  };
}

export function getNode(graph: ContainerGraph, id: string): ZoneNode | null {
  return graph.nodes[id] ?? null;
}

export function isTerminal(node: ZoneNode): boolean {
  return node.childIds === null;
}

export function canSplit(node: ZoneNode, direction: SplitDirection, dividerWidth: number): boolean {
  if (!isTerminal(node)) return false;
  const dimension = direction === 'vertical' ? node.rect.width : node.rect.height;
  return dimension >= 2 * MIN_ZONE_CM + dividerWidth;
}

/**
 * Divide una zona terminal en dos zonas hijas, dejando el hueco del ancho de
 * `dividerWidth` para el perfil divisor. `positionCm` es la medida (en cm,
 * desde el borde inicial de la zona) del primer hijo.
 */
export function splitZone(
  graph: ContainerGraph,
  zoneId: string,
  direction: SplitDirection,
  positionCm: number,
  dividerWidth: number
): ContainerGraph {
  const node = getNode(graph, zoneId);
  if (!node) throw new Error(`La zona ${zoneId} no existe`);
  if (!canSplit(node, direction, dividerWidth)) {
    throw new Error('La zona es muy chica para dividir con ese perfil');
  }
  const dimension = direction === 'vertical' ? node.rect.width : node.rect.height;
  if (positionCm < MIN_ZONE_CM || positionCm > dimension - dividerWidth - MIN_ZONE_CM) {
    throw new Error(`La posición debe dejar al menos ${MIN_ZONE_CM} cm a cada lado`);
  }

  const idA = nextId('zone');
  const idB = nextId('zone');
  let rectA: Rect;
  let rectB: Rect;
  if (direction === 'vertical') {
    rectA = { x: node.rect.x, y: node.rect.y, width: positionCm, height: node.rect.height };
    rectB = {
      x: node.rect.x + positionCm + dividerWidth,
      y: node.rect.y,
      width: node.rect.width - positionCm - dividerWidth,
      height: node.rect.height,
    };
  } else {
    rectA = { x: node.rect.x, y: node.rect.y, width: node.rect.width, height: positionCm };
    rectB = {
      x: node.rect.x,
      y: node.rect.y + positionCm + dividerWidth,
      width: node.rect.width,
      height: node.rect.height - positionCm - dividerWidth,
    };
  }

  const zoneA: ZoneNode = { id: idA, parentId: zoneId, rect: rectA, splitDirection: null, childIds: null, dividerProfileWidth: null, leaf: null };
  const zoneB: ZoneNode = { id: idB, parentId: zoneId, rect: rectB, splitDirection: null, childIds: null, dividerProfileWidth: null, leaf: null };
  const updatedNode: ZoneNode = { ...node, splitDirection: direction, childIds: [idA, idB], dividerProfileWidth: dividerWidth, leaf: null };

  return {
    ...graph,
    nodes: { ...graph.nodes, [zoneId]: updatedNode, [idA]: zoneA, [idB]: zoneB },
  };
}

/** Vuelve una zona (y todo lo que cuelga de ella) a una zona terminal vacía. Sirve para deshacer/limpiar una rama. */
export function resetZone(graph: ContainerGraph, zoneId: string): ContainerGraph {
  const node = getNode(graph, zoneId);
  if (!node) throw new Error(`La zona ${zoneId} no existe`);
  const descendantIds = collectDescendantIds(graph, zoneId);
  const nodes = { ...graph.nodes };
  descendantIds.forEach((id) => { delete nodes[id]; });
  nodes[zoneId] = { ...node, splitDirection: null, childIds: null, dividerProfileWidth: null, leaf: null };
  return { ...graph, nodes };
}

function collectDescendantIds(graph: ContainerGraph, zoneId: string, acc: string[] = []): string[] {
  const node = graph.nodes[zoneId];
  if (node?.childIds) {
    node.childIds.forEach((childId) => {
      acc.push(childId);
      collectDescendantIds(graph, childId, acc);
    });
  }
  return acc;
}

/** Inserta un Sistema (Paño Fijo / Corrediza / Batiente) en una zona terminal vacía, calculando paños y perfiles reales vía DeductionEngine. */
export function insertSystem(graph: ContainerGraph, zoneId: string, systemType: SystemType, config: SystemConfig): ContainerGraph {
  const node = getNode(graph, zoneId);
  if (!node) throw new Error(`La zona ${zoneId} no existe`);
  if (!isTerminal(node)) throw new Error('Solo se puede insertar un sistema en una zona sin divisiones');

  const { panels, profiles } = deduceSystem(systemType, node.rect, config);
  if (panels.some((p) => p.width <= 0 || p.height <= 0)) {
    throw new Error('La zona es demasiado pequeña para este sistema con esta configuración de perfiles');
  }

  const leaf: Leaf = {
    id: nextId('leaf'),
    systemType,
    config,
    panels: panels.map((p) => ({ ...p, id: nextId('panel') })),
    profiles: profiles.map((b) => ({ ...b, id: nextId('perfil') })),
  };

  return { ...graph, nodes: { ...graph.nodes, [zoneId]: { ...node, leaf } } };
}

export function listZones(graph: ContainerGraph): ZoneNode[] {
  return Object.values(graph.nodes);
}

export function listTerminalZones(graph: ContainerGraph): ZoneNode[] {
  return listZones(graph).filter(isTerminal);
}

/** Perfiles divisores internos (los que separan dos zonas hermanas), a 90° por defecto. */
export function listDividerBars(graph: ContainerGraph): ProfileBar[] {
  const bars: ProfileBar[] = [];
  listZones(graph).forEach((node) => {
    if (!node.childIds || node.dividerProfileWidth == null) return;
    const length = node.splitDirection === 'vertical' ? node.rect.height : node.rect.width;
    const cut = squareCutLength(length, 0);
    bars.push({
      id: nextId('divisor'),
      role: `divisor-${node.splitDirection}`,
      length: cut,
      shortPointLength: cut,
      angleStart: 90,
      angleEnd: 90,
      profileWidth: node.dividerProfileWidth,
    });
  });
  return bars;
}

/** Perfiles del marco exterior del vano completo (mitrados a 45° por defecto). */
export function frameProfileBars(graph: ContainerGraph): ProfileBar[] {
  const { width, height, profileWidth, cornerAngle } = graph.frame;
  const sides: Array<{ role: string; length: number }> = [
    { role: 'marco-superior', length: width },
    { role: 'marco-inferior', length: width },
    { role: 'marco-izquierdo', length: height },
    { role: 'marco-derecho', length: height },
  ];
  return sides.map(({ role, length }) => {
    if (cornerAngle === 45) {
      const { longPoint, shortPoint } = miterCutLengths(length, profileWidth);
      return { id: nextId('marco'), role, length: longPoint, shortPointLength: shortPoint, angleStart: 45, angleEnd: 45, profileWidth };
    }
    const cut = squareCutLength(length, 0);
    return { id: nextId('marco'), role, length: cut, shortPointLength: cut, angleStart: 90, angleEnd: 90, profileWidth };
  });
}

export function listAllPanels(graph: ContainerGraph): Panel[] {
  return listTerminalZones(graph).flatMap((z) => z.leaf?.panels ?? []);
}

export function listAllProfileBars(graph: ContainerGraph): ProfileBar[] {
  const leafBars = listTerminalZones(graph).flatMap((z) => z.leaf?.profiles ?? []);
  return [...frameProfileBars(graph), ...listDividerBars(graph), ...leafBars];
}

export interface GraphSummary {
  paneles: number;
  areaVidrioM2: number;
  perfiles: number;
  largoAluminioTotalM: number;
}

export function summarizeGraph(graph: ContainerGraph): GraphSummary {
  const panels = listAllPanels(graph);
  const bars = listAllProfileBars(graph);
  const areaVidrioM2 = panels.reduce((acc, p) => acc + (p.width * p.height) / 10000, 0);
  const largoAluminioTotalM = bars.reduce((acc, b) => acc + b.length, 0) / 100;
  return { paneles: panels.length, areaVidrioM2, perfiles: bars.length, largoAluminioTotalM };
}

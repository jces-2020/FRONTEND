// Matemáticas de cortes de perfilería: ingletes a 45° y cortes rectos a 90°,
// más las funciones de consumo de material (kerf = muesca del disco) que usa
// el motor de optimización 1D de aluminio.

export type CutAngle = 45 | 90;

export interface MiterLengths {
  /** Medida punta larga (esquina exterior a esquina exterior) — es la medida de corte estándar en fábrica. */
  longPoint: number;
  /** Medida punta corta (esquina interior a esquina interior) — útil como referencia/control de calidad. */
  shortPoint: number;
}

/**
 * Largo de una barra con inglete a 45° en ambos extremos, dado el largo
 * exterior nominal del lado del marco y el ancho visto del perfil.
 * Con 45°, tan(45°)=1, así que cada extremo "pierde" exactamente un ancho de
 * perfil entre la punta larga y la punta corta.
 */
export function miterCutLengths(outerLength: number, profileWidth: number): MiterLengths {
  return {
    longPoint: outerLength,
    shortPoint: outerLength - 2 * profileWidth,
  };
}

/**
 * Largo de una barra con corte recto (90°), que topa contra un perfil
 * perpendicular en cada extremo con el que se solapa. `adjoiningReduction`
 * es cuánto hay que descontar por esos topes (0 si no topa contra nada, p.ej.
 * un extremo libre).
 */
export function squareCutLength(outerLength: number, adjoiningReduction = 0): number {
  return outerLength - adjoiningReduction;
}

/** Material total que se pierde por el grosor del disco a lo largo de N cortes en una misma barra. */
export function kerfAllowance(kerfWidth: number, cutsCount: number): number {
  return Math.max(0, kerfWidth) * Math.max(0, cutsCount);
}

/** Cuánto largo de barra consume realmente una pieza, incluyendo el kerf de su propio corte. */
export function materialConsumedPerPiece(cutLength: number, kerfWidth: number): number {
  return cutLength + Math.max(0, kerfWidth);
}

/** Consumo total de una barra dado el listado de piezas que se cortarán de ella (para el optimizador 1D). */
export function totalBarConsumption(pieceLengths: number[], kerfWidth: number): number {
  if (pieceLengths.length === 0) return 0;
  const sumPieces = pieceLengths.reduce((acc, l) => acc + l, 0);
  return sumPieces + kerfAllowance(kerfWidth, pieceLengths.length);
}

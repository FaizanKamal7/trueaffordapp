export interface ScaleGeometryInput {
  comfortableMax: number;
  stretchMax: number;
  riskyMax: number;
  evaluatedPrice: number;
}

export interface ScaleGeometry {
  comfortableWidthPct: number;
  stretchWidthPct: number;
  riskyWidthPct: number;
  unaffordableWidthPct: number;
  markerLeftPct: number;
}

/**
 * Shared by ScaleBar.astro (server render) and the client-side calculator
 * script (live updates), so the visual scale math lives in exactly one
 * place.
 */
export function computeScaleGeometry({ comfortableMax, stretchMax, riskyMax, evaluatedPrice }: ScaleGeometryInput): ScaleGeometry {
  const total = Math.max(riskyMax * 1.2, comfortableMax, stretchMax, evaluatedPrice, 1);
  const pct = (value: number) => Math.max(0, Math.min(100, (value / total) * 100));

  const comfortableWidthPct = pct(comfortableMax);
  const stretchWidthPct = pct(stretchMax) - comfortableWidthPct;
  const riskyWidthPct = pct(riskyMax) - comfortableWidthPct - stretchWidthPct;
  const unaffordableWidthPct = 100 - comfortableWidthPct - stretchWidthPct - riskyWidthPct;
  const markerLeftPct = pct(evaluatedPrice);

  return { comfortableWidthPct, stretchWidthPct, riskyWidthPct, unaffordableWidthPct, markerLeftPct };
}

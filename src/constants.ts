// Three.jsシーンのスケール設定
// 1 Three.js単位 = SCALE_FACTOR mm
export const SCALE_FACTOR = 100; // 1単位 = 100mm

// mm単位をThree.js単位に変換
export function mmToUnits(mm: number): number {
  return mm / SCALE_FACTOR;
}

// Three.js単位をmm単位に変換
export function unitsToMm(units: number): number {
  return units * SCALE_FACTOR;
}

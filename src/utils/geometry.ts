import type { Vector3 } from '../types/lumber';

// グリッドスナップ
export function snapToGrid(position: Vector3, gridSize: number): Vector3 {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
    z: Math.round(position.z / gridSize) * gridSize,
  };
}

// 閾値を考慮したグリッドスナップ
// 各軸ごとにグリッド位置からの距離が閾値以内の場合のみスナップする
export function snapToGridWithThreshold(
  position: Vector3,
  gridSize: number,
  threshold: number,
  debug = false
): Vector3 {
  const snapped = snapToGrid(position, gridSize);
  
  // 各軸ごとに閾値を判定
  const dx = Math.abs(position.x - snapped.x);
  const dy = Math.abs(position.y - snapped.y);
  const dz = Math.abs(position.z - snapped.z);
  
  const result: Vector3 = {
    x: dx <= threshold ? snapped.x : position.x,
    y: dy <= threshold ? snapped.y : position.y,
    z: dz <= threshold ? snapped.z : position.z,
  };
  
  if (debug) {
    const dist = distance(position, snapped);
    console.log('[GridSnap]', {
      original: position,
      snapped,
      result,
      distances: { x: dx.toFixed(2), y: dy.toFixed(2), z: dz.toFixed(2) },
      totalDistance: dist.toFixed(2),
      threshold,
      applied: result.x !== position.x || result.y !== position.y || result.z !== position.z,
      gridSize,
    });
  }
  
  return result;
}

// ベクトルの長さを計算
export function vectorLength(v: Vector3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

// ベクトルを正規化
export function normalize(v: Vector3): Vector3 {
  const len = vectorLength(v);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return {
    x: v.x / len,
    y: v.y / len,
    z: v.z / len,
  };
}

// ベクトルの内積
export function dot(v1: Vector3, v2: Vector3): number {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

// ベクトルの外積
export function cross(v1: Vector3, v2: Vector3): Vector3 {
  return {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x,
  };
}

// ベクトルの減算
export function subtract(v1: Vector3, v2: Vector3): Vector3 {
  return {
    x: v1.x - v2.x,
    y: v1.y - v2.y,
    z: v1.z - v2.z,
  };
}

// ベクトルの加算
export function add(v1: Vector3, v2: Vector3): Vector3 {
  return {
    x: v1.x + v2.x,
    y: v1.y + v2.y,
    z: v1.z + v2.z,
  };
}

// ベクトルのスカラー倍
export function scale(v: Vector3, s: number): Vector3 {
  return {
    x: v.x * s,
    y: v.y * s,
    z: v.z * s,
  };
}

// 2点間の距離
export function distance(v1: Vector3, v2: Vector3): number {
  return vectorLength(subtract(v1, v2));
}

// 中点を計算
export function midpoint(v1: Vector3, v2: Vector3): Vector3 {
  return {
    x: (v1.x + v2.x) / 2,
    y: (v1.y + v2.y) / 2,
    z: (v1.z + v2.z) / 2,
  };
}

// 値を範囲内にクランプ
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// 2つの線分間の最短距離を計算
export function closestPointsBetweenSegments(
  seg1Start: Vector3,
  seg1End: Vector3,
  seg2Start: Vector3,
  seg2End: Vector3
): {
  distance: number;
  point1: Vector3;
  point2: Vector3;
} {
  const d1 = subtract(seg1End, seg1Start);
  const d2 = subtract(seg2End, seg2Start);
  const r = subtract(seg1Start, seg2Start);

  const a = dot(d1, d1);
  const b = dot(d1, d2);
  const c = dot(d2, d2);
  const d = dot(d1, r);
  const e = dot(d2, r);

  const denom = a * c - b * b;

  let s: number;
  let t: number;

  if (denom !== 0) {
    s = clamp((b * e - c * d) / denom, 0, 1);
  } else {
    s = 0;
  }

  t = (b * s + e) / c;
  t = clamp(t, 0, 1);

  // 再計算してより正確な値を得る
  s = clamp((b * t - d) / a, 0, 1);

  const point1 = add(seg1Start, scale(d1, s));
  const point2 = add(seg2Start, scale(d2, t));

  return {
    distance: distance(point1, point2),
    point1,
    point2,
  };
}

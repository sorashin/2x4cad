import type { Vector3, Lumber, Face, Quaternion } from '../types/lumber';
import { LUMBER_DIMENSIONS } from '../types/lumber';

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

// クォータニオンをベクトルに適用
export function applyQuaternion(v: Vector3, q: Quaternion): Vector3 {
  const x = v.x, y = v.y, z = v.z;
  const qx = q.x, qy = q.y, qz = q.z, qw = q.w;

  // クォータニオンによるベクトル回転: q * v * q^-1
  const ix = qw * x + qy * z - qz * y;
  const iy = qw * y + qz * x - qx * z;
  const iz = qw * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;

  return {
    x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
    y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
    z: iz * qw + iw * -qz + ix * -qy - iy * -qx,
  };
}

// Lumberの方向ベクトルを取得（始点から終点への単位ベクトル）
export function getLumberDirection(lumber: Lumber): Vector3 {
  // デフォルトのY軸方向を回転で変換
  return applyQuaternion({ x: 0, y: 1, z: 0 }, lumber.rotation);
}

// Lumberの終点を計算
export function getLumberEndPoint(lumber: Lumber): Vector3 {
  const direction = getLumberDirection(lumber);
  return add(lumber.position, scale(direction, lumber.length));
}

// 法線ベクトルが平行かどうかを判定（同じ方向または逆方向）
export function areNormalsParallel(n1: Vector3, n2: Vector3): boolean {
  // GridSnap前提で法線は軸方向のみなので、内積の絶対値が1に近ければ平行
  const dotProduct = Math.abs(dot(n1, n2));
  return dotProduct > 0.99;
}

// 面の平面位置を取得（法線方向の座標値）
export function getPlanePosition(face: Face): number {
  // 法線が指す軸の座標値を返す
  const { normal, center } = face;
  if (Math.abs(normal.x) > 0.9) return center.x;
  if (Math.abs(normal.y) > 0.9) return center.y;
  return center.z;
}

// 法線から軸インデックスを取得（0=X, 1=Y, 2=Z）
export function getNormalAxis(normal: Vector3): 'x' | 'y' | 'z' {
  if (Math.abs(normal.x) > 0.9) return 'x';
  if (Math.abs(normal.y) > 0.9) return 'y';
  return 'z';
}

// Lumberの6面を取得
export function getLumberFaces(lumber: Lumber): Face[] {
  const dimensions = LUMBER_DIMENSIONS[lumber.type];
  const direction = getLumberDirection(lumber);
  const endPoint = getLumberEndPoint(lumber);
  
  // 木材のローカル座標系を構築
  // direction = Y軸方向（木材の長さ方向）
  // 横方向と高さ方向を計算
  
  // GridSnap前提で、directionは軸方向のみ
  // direction に垂直な2つの軸を取得
  let widthDir: Vector3;
  let heightDir: Vector3;
  
  if (Math.abs(direction.y) > 0.9) {
    // Y軸方向の木材
    widthDir = { x: 1, y: 0, z: 0 };
    heightDir = { x: 0, y: 0, z: 1 };
  } else if (Math.abs(direction.x) > 0.9) {
    // X軸方向の木材
    widthDir = { x: 0, y: 1, z: 0 };
    heightDir = { x: 0, y: 0, z: 1 };
  } else {
    // Z軸方向の木材
    widthDir = { x: 1, y: 0, z: 0 };
    heightDir = { x: 0, y: 1, z: 0 };
  }
  
  const halfWidth = dimensions.width / 2;
  const halfHeight = dimensions.height / 2;
  
  const faces: Face[] = [];
  
  // 始点側の小口面（StartFace）
  const startFaceNormal = scale(direction, -1);
  faces.push({
    center: lumber.position,
    normal: startFaceNormal,
    vertices: [
      add(lumber.position, add(scale(widthDir, -halfWidth), scale(heightDir, -halfHeight))),
      add(lumber.position, add(scale(widthDir, halfWidth), scale(heightDir, -halfHeight))),
      add(lumber.position, add(scale(widthDir, halfWidth), scale(heightDir, halfHeight))),
      add(lumber.position, add(scale(widthDir, -halfWidth), scale(heightDir, halfHeight))),
    ],
  });
  
  // 終点側の小口面（EndFace）
  faces.push({
    center: endPoint,
    normal: direction,
    vertices: [
      add(endPoint, add(scale(widthDir, -halfWidth), scale(heightDir, -halfHeight))),
      add(endPoint, add(scale(widthDir, halfWidth), scale(heightDir, -halfHeight))),
      add(endPoint, add(scale(widthDir, halfWidth), scale(heightDir, halfHeight))),
      add(endPoint, add(scale(widthDir, -halfWidth), scale(heightDir, halfHeight))),
    ],
  });
  
  // 中心点（木材の中央）
  const centerPoint = midpoint(lumber.position, endPoint);
  
  // 側面1（+width方向）
  const side1Center = add(centerPoint, scale(widthDir, halfWidth));
  faces.push({
    center: side1Center,
    normal: widthDir,
    vertices: [
      add(lumber.position, add(scale(widthDir, halfWidth), scale(heightDir, -halfHeight))),
      add(endPoint, add(scale(widthDir, halfWidth), scale(heightDir, -halfHeight))),
      add(endPoint, add(scale(widthDir, halfWidth), scale(heightDir, halfHeight))),
      add(lumber.position, add(scale(widthDir, halfWidth), scale(heightDir, halfHeight))),
    ],
  });
  
  // 側面2（-width方向）
  const side2Center = add(centerPoint, scale(widthDir, -halfWidth));
  faces.push({
    center: side2Center,
    normal: scale(widthDir, -1),
    vertices: [
      add(lumber.position, add(scale(widthDir, -halfWidth), scale(heightDir, -halfHeight))),
      add(endPoint, add(scale(widthDir, -halfWidth), scale(heightDir, -halfHeight))),
      add(endPoint, add(scale(widthDir, -halfWidth), scale(heightDir, halfHeight))),
      add(lumber.position, add(scale(widthDir, -halfWidth), scale(heightDir, halfHeight))),
    ],
  });
  
  // 側面3（+height方向）
  const side3Center = add(centerPoint, scale(heightDir, halfHeight));
  faces.push({
    center: side3Center,
    normal: heightDir,
    vertices: [
      add(lumber.position, add(scale(widthDir, -halfWidth), scale(heightDir, halfHeight))),
      add(endPoint, add(scale(widthDir, -halfWidth), scale(heightDir, halfHeight))),
      add(endPoint, add(scale(widthDir, halfWidth), scale(heightDir, halfHeight))),
      add(lumber.position, add(scale(widthDir, halfWidth), scale(heightDir, halfHeight))),
    ],
  });
  
  // 側面4（-height方向）
  const side4Center = add(centerPoint, scale(heightDir, -halfHeight));
  faces.push({
    center: side4Center,
    normal: scale(heightDir, -1),
    vertices: [
      add(lumber.position, add(scale(widthDir, -halfWidth), scale(heightDir, -halfHeight))),
      add(endPoint, add(scale(widthDir, -halfWidth), scale(heightDir, -halfHeight))),
      add(endPoint, add(scale(widthDir, halfWidth), scale(heightDir, -halfHeight))),
      add(lumber.position, add(scale(widthDir, halfWidth), scale(heightDir, -halfHeight))),
    ],
  });
  
  return faces;
}

// 平行な面を持つFaceとその情報を格納する型
export interface ParallelFaceInfo {
  face: Face;
  lumberId: string;
  planePosition: number; // 法線方向の座標値
  axis: 'x' | 'y' | 'z';
}

// PreviewLumberのEndFace法線と平行な面をすべて検索
export function findParallelFaces(
  endFaceNormal: Vector3,
  lumbers: Record<string, Lumber>
): ParallelFaceInfo[] {
  const result: ParallelFaceInfo[] = [];
  const axis = getNormalAxis(endFaceNormal);
  
  for (const lumber of Object.values(lumbers)) {
    const faces = getLumberFaces(lumber);
    
    for (const face of faces) {
      if (areNormalsParallel(endFaceNormal, face.normal)) {
        result.push({
          face,
          lumberId: lumber.id,
          planePosition: getPlanePosition(face),
          axis,
        });
      }
    }
  }
  
  return result;
}

// 指定位置から最も近い平行面を検索（閾値内）
export function findClosestParallelFace(
  position: Vector3,
  parallelFaces: ParallelFaceInfo[],
  threshold: number
): ParallelFaceInfo | null {
  let closest: ParallelFaceInfo | null = null;
  let minDistance = threshold;
  
  for (const faceInfo of parallelFaces) {
    // 法線方向の座標値の差で距離を計算
    const positionValue = faceInfo.axis === 'x' ? position.x 
                        : faceInfo.axis === 'y' ? position.y 
                        : position.z;
    const distance = Math.abs(positionValue - faceInfo.planePosition);
    
    if (distance < minDistance) {
      minDistance = distance;
      closest = faceInfo;
    }
  }
  
  return closest;
}

// 位置を面にスナップ
export function snapToFace(
  position: Vector3,
  faceInfo: ParallelFaceInfo
): Vector3 {
  const result = { ...position };
  
  if (faceInfo.axis === 'x') {
    result.x = faceInfo.planePosition;
  } else if (faceInfo.axis === 'y') {
    result.y = faceInfo.planePosition;
  } else {
    result.z = faceInfo.planePosition;
  }
  
  return result;
}

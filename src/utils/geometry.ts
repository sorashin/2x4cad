import type { Vector3, Lumber, Face, Quaternion } from '../types/lumber';
import { LUMBER_DIMENSIONS, FaceType } from '../types/lumber';

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
  // widthDir: 木端面の法線方向（地面と平行で、directionと垂直）
  // heightDir: 面の法線方向（widthDirとdirectionに垂直）
  
  let widthDir: Vector3;
  let heightDir: Vector3;
  
  const upVector: Vector3 = { x: 0, y: 1, z: 0 };
  
  // directionが垂直（Y軸方向）かどうかをチェック
  if (Math.abs(dot(direction, upVector)) > 0.99) {
    // 垂直の場合、widthDirをX軸、heightDirをZ軸にする
    widthDir = { x: 1, y: 0, z: 0 };
    heightDir = { x: 0, y: 0, z: 1 };
  } else {
    // 水平または斜めの場合、地面と平行な方向をwidthDirとする
    widthDir = normalize(cross(direction, upVector));
    // heightDirはdirectionとwidthDirに垂直（上方向成分を持つ）
    heightDir = normalize(cross(widthDir, direction));
  }
  
  const halfWidth = dimensions.width / 2;
  const halfHeight = dimensions.height / 2;
  
  const faces: Face[] = [];
  
  // 始点側の小口面（StartFace）
  const startFaceNormal = scale(direction, -1);
  const startV0 = add(lumber.position, add(scale(widthDir, -halfWidth), scale(heightDir, -halfHeight)));
  const startV1 = add(lumber.position, add(scale(widthDir, halfWidth), scale(heightDir, -halfHeight)));
  const startV2 = add(lumber.position, add(scale(widthDir, halfWidth), scale(heightDir, halfHeight)));
  const startV3 = add(lumber.position, add(scale(widthDir, -halfWidth), scale(heightDir, halfHeight)));
  
  faces.push({
    center: lumber.position,
    normal: startFaceNormal,
    vertices: [startV0, startV1, startV2, startV3],
    widthDir,
    heightDir,
    faceType: FaceType.END,
    edges: [
      { start: startV0, end: startV1, length: dimensions.width, direction: widthDir },
      { start: startV1, end: startV2, length: dimensions.height, direction: heightDir },
      { start: startV2, end: startV3, length: dimensions.width, direction: scale(widthDir, -1) },
      { start: startV3, end: startV0, length: dimensions.height, direction: scale(heightDir, -1) },
    ],
    edgeLengths: { width: dimensions.width, height: dimensions.height },
  });
  
  // 終点側の小口面（EndFace）
  const endV0 = add(endPoint, add(scale(widthDir, -halfWidth), scale(heightDir, -halfHeight)));
  const endV1 = add(endPoint, add(scale(widthDir, halfWidth), scale(heightDir, -halfHeight)));
  const endV2 = add(endPoint, add(scale(widthDir, halfWidth), scale(heightDir, halfHeight)));
  const endV3 = add(endPoint, add(scale(widthDir, -halfWidth), scale(heightDir, halfHeight)));
  
  faces.push({
    center: endPoint,
    normal: direction,
    vertices: [endV0, endV1, endV2, endV3],
    widthDir,
    heightDir,
    faceType: FaceType.END,
    edges: [
      { start: endV0, end: endV1, length: dimensions.width, direction: widthDir },
      { start: endV1, end: endV2, length: dimensions.height, direction: heightDir },
      { start: endV2, end: endV3, length: dimensions.width, direction: scale(widthDir, -1) },
      { start: endV3, end: endV0, length: dimensions.height, direction: scale(heightDir, -1) },
    ],
    edgeLengths: { width: dimensions.width, height: dimensions.height },
  });
  
  // 中心点（木材の中央）
  const centerPoint = midpoint(lumber.position, endPoint);
  
  // 側面1（+width方向）- 木端（EDGE）
  const side1Center = add(centerPoint, scale(widthDir, halfWidth));
  const side1V0 = add(lumber.position, add(scale(widthDir, halfWidth), scale(heightDir, -halfHeight)));
  const side1V1 = add(endPoint, add(scale(widthDir, halfWidth), scale(heightDir, -halfHeight)));
  const side1V2 = add(endPoint, add(scale(widthDir, halfWidth), scale(heightDir, halfHeight)));
  const side1V3 = add(lumber.position, add(scale(widthDir, halfWidth), scale(heightDir, halfHeight)));
  
  faces.push({
    center: side1Center,
    normal: widthDir,
    vertices: [side1V0, side1V1, side1V2, side1V3],
    widthDir: direction,  // 側面の場合、長さ方向がwidthになる
    heightDir,
    faceType: FaceType.EDGE,
    edges: [
      { start: side1V0, end: side1V1, length: lumber.length, direction: direction },
      { start: side1V1, end: side1V2, length: dimensions.height, direction: heightDir },
      { start: side1V2, end: side1V3, length: lumber.length, direction: scale(direction, -1) },
      { start: side1V3, end: side1V0, length: dimensions.height, direction: scale(heightDir, -1) },
    ],
  });
  
  // 側面2（-width方向）- 木端（EDGE）
  const side2Center = add(centerPoint, scale(widthDir, -halfWidth));
  const side2V0 = add(lumber.position, add(scale(widthDir, -halfWidth), scale(heightDir, -halfHeight)));
  const side2V1 = add(endPoint, add(scale(widthDir, -halfWidth), scale(heightDir, -halfHeight)));
  const side2V2 = add(endPoint, add(scale(widthDir, -halfWidth), scale(heightDir, halfHeight)));
  const side2V3 = add(lumber.position, add(scale(widthDir, -halfWidth), scale(heightDir, halfHeight)));
  
  faces.push({
    center: side2Center,
    normal: scale(widthDir, -1),
    vertices: [side2V0, side2V1, side2V2, side2V3],
    widthDir: direction,  // 側面の場合、長さ方向がwidthになる
    heightDir,
    faceType: FaceType.EDGE,
    edges: [
      { start: side2V0, end: side2V1, length: lumber.length, direction: direction },
      { start: side2V1, end: side2V2, length: dimensions.height, direction: heightDir },
      { start: side2V2, end: side2V3, length: lumber.length, direction: scale(direction, -1) },
      { start: side2V3, end: side2V0, length: dimensions.height, direction: scale(heightDir, -1) },
    ],
  });
  
  // 側面3（+height方向）- 面（FACE）
  const side3Center = add(centerPoint, scale(heightDir, halfHeight));
  const side3V0 = add(lumber.position, add(scale(widthDir, -halfWidth), scale(heightDir, halfHeight)));
  const side3V1 = add(endPoint, add(scale(widthDir, -halfWidth), scale(heightDir, halfHeight)));
  const side3V2 = add(endPoint, add(scale(widthDir, halfWidth), scale(heightDir, halfHeight)));
  const side3V3 = add(lumber.position, add(scale(widthDir, halfWidth), scale(heightDir, halfHeight)));
  
  faces.push({
    center: side3Center,
    normal: heightDir,
    vertices: [side3V0, side3V1, side3V2, side3V3],
    widthDir: direction,  // 側面の場合、長さ方向がwidthDirになる
    heightDir: widthDir,  // 短手方向（ローカルのwidthDir）
    faceType: FaceType.FACE,
    edges: [
      { start: side3V0, end: side3V1, length: lumber.length, direction: direction },
      { start: side3V1, end: side3V2, length: dimensions.width, direction: widthDir },
      { start: side3V2, end: side3V3, length: lumber.length, direction: scale(direction, -1) },
      { start: side3V3, end: side3V0, length: dimensions.width, direction: scale(widthDir, -1) },
    ],
  });
  
  // 側面4（-height方向）- 面（FACE）
  const side4Center = add(centerPoint, scale(heightDir, -halfHeight));
  const side4V0 = add(lumber.position, add(scale(widthDir, -halfWidth), scale(heightDir, -halfHeight)));
  const side4V1 = add(endPoint, add(scale(widthDir, -halfWidth), scale(heightDir, -halfHeight)));
  const side4V2 = add(endPoint, add(scale(widthDir, halfWidth), scale(heightDir, -halfHeight)));
  const side4V3 = add(lumber.position, add(scale(widthDir, halfWidth), scale(heightDir, -halfHeight)));
  
  faces.push({
    center: side4Center,
    normal: scale(heightDir, -1),
    vertices: [side4V0, side4V1, side4V2, side4V3],
    widthDir: direction,  // 側面の場合、長さ方向がwidthDirになる
    heightDir: widthDir,  // 短手方向（ローカルのwidthDir）
    faceType: FaceType.FACE,
    edges: [
      { start: side4V0, end: side4V1, length: lumber.length, direction: direction },
      { start: side4V1, end: side4V2, length: dimensions.width, direction: widthDir },
      { start: side4V2, end: side4V3, length: lumber.length, direction: scale(direction, -1) },
      { start: side4V3, end: side4V0, length: dimensions.width, direction: scale(widthDir, -1) },
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

// 面の頂点から指定位置に最も近い頂点を検索
export function findClosestVertex(
  position: Vector3,
  face: Face,
  threshold: number
): Vector3 | null {
  let closest: Vector3 | null = null;
  let minDistance = threshold;
  
  for (const vertex of face.vertices) {
    const dist = distance(position, vertex);
    if (dist < minDistance) {
      minDistance = dist;
      closest = vertex;
    }
  }
  
  return closest;
}

// 法線方向とupベクトルから回転（クォータニオン）を計算
// 新しいLumberのY軸がnormal方向、X軸（幅方向）がup方向に一致するようにする
export function calculateRotationFromNormalAndUp(
  normal: Vector3,
  up: Vector3
): Quaternion {
  // 正規化
  const n = normalize(normal);
  const u = normalize(up);
  
  // Lumberのローカル座標系:
  // X軸 = 幅方向 (width)
  // Y軸 = 長さ方向 (length/direction) = normal
  // Z軸 = 高さ方向 (height)
  
  // Z軸方向を計算（normalとupに直交）
  const z = normalize(cross(u, n));
  
  // X軸を再計算（直交性を保証）
  const x = normalize(cross(n, z));
  
  // 回転行列からクォータニオンを計算
  // 行列の列ベクトル: [x, n, z]
  // これは、ローカル座標系 (1,0,0), (0,1,0), (0,0,1) を
  // ワールド座標系 (x, n, z) に変換する回転
  
  // クォータニオンの計算（回転行列から）
  const trace = x.x + n.y + z.z;
  let qw: number, qx: number, qy: number, qz: number;
  
  if (trace > 0) {
    const s = Math.sqrt(trace + 1.0) * 2; // s = 4 * qw
    qw = 0.25 * s;
    qx = (z.y - n.z) / s;
    qy = (x.z - z.x) / s;
    qz = (n.x - x.y) / s;
  } else if (x.x > n.y && x.x > z.z) {
    const s = Math.sqrt(1.0 + x.x - n.y - z.z) * 2; // s = 4 * qx
    qw = (z.y - n.z) / s;
    qx = 0.25 * s;
    qy = (x.y + n.x) / s;
    qz = (x.z + z.x) / s;
  } else if (n.y > z.z) {
    const s = Math.sqrt(1.0 + n.y - x.x - z.z) * 2; // s = 4 * qy
    qw = (x.z - z.x) / s;
    qx = (x.y + n.x) / s;
    qy = 0.25 * s;
    qz = (n.z + z.y) / s;
  } else {
    const s = Math.sqrt(1.0 + z.z - x.x - n.y) * 2; // s = 4 * qz
    qw = (n.x - x.y) / s;
    qx = (x.z + z.x) / s;
    qy = (n.z + z.y) / s;
    qz = 0.25 * s;
  }
  
  // 正規化
  const len = Math.sqrt(qw * qw + qx * qx + qy * qy + qz * qz);
  if (len > 0.0001) {
    return {
      x: qx / len,
      y: qy / len,
      z: qz / len,
      w: qw / len,
    };
  }
  
  // デフォルト（単位クォータニオン）
  return { x: 0, y: 0, z: 0, w: 1 };
}

// 面のローカル座標系からupベクトルを計算（断面の中心線を合わせるため）
// 面の種類に応じて適切なベクトルを返す
export function getFaceUpVector(face: Face): Vector3 {
  // 面の種類に応じてupベクトルを選択
  // upベクトルは新しいLumberのX軸（幅方向）に対応する
  
  if (face.faceType === FaceType.EDGE) {
    // 木端面（EDGE）の場合：heightDirをupベクトルとして使用
    // これにより、previewLumberの高さ方向が既存Lumberの高さ方向と揃う
    if (face.heightDir) {
      return normalize(face.heightDir);
    }
  } else if (face.faceType === FaceType.FACE) {
    // 面（FACE）の場合：heightDir（=元のwidthDir）をupベクトルとして使用
    if (face.heightDir) {
      return normalize(face.heightDir);
    }
  } else if (face.faceType === FaceType.END) {
    // 木口面（END）の場合：widthDirをupベクトルとして使用
    if (face.widthDir) {
      return normalize(face.widthDir);
    }
  }
  
  // フォールバック: widthDirがあればそれを使用
  if (face.widthDir) {
    return normalize(face.widthDir);
  }
  
  // 最終フォールバック: デフォルトの上方向
  return { x: 0, y: 0, z: 1 };
}

// 面の中心線上の最も近い点を計算
// 面の中心を通り、法線に垂直な直線（中心線）上で、指定位置に最も近い点を返す
export function snapToFaceCenterLine(position: Vector3, face: Face): Vector3 {
  // 面の中心線は、面の中心を通り法線に垂直な直線
  // widthDirまたはheightDirが定義されている場合、それらの方向の中心線を使用
  
  if (!face.widthDir && !face.heightDir) {
    // 中心線情報がない場合は面の中心を返す
    return face.center;
  }
  
  // 面の中心から位置へのベクトル
  const toPosition = subtract(position, face.center);
  
  // widthDir方向の成分を抽出（これが中心線方向）
  let centerLineDir: Vector3;
  if (face.widthDir) {
    centerLineDir = normalize(face.widthDir);
  } else if (face.heightDir) {
    centerLineDir = normalize(face.heightDir);
  } else {
    return face.center;
  }
  
  // 中心線方向への射影
  const projection = dot(toPosition, centerLineDir);
  
  // 中心線上の最も近い点
  return add(face.center, scale(centerLineDir, projection));
}

// previewLumberの木口面と既存Lumberの面の辺が位置的に一致するか判定
// previewLumberを90度回転させた時に辺が同一直線上に重なるかをチェック
export function shouldRotate90Degrees(
  _previewLumberType: { width: number; height: number },
  targetFace: Face,
  _startPosition: Vector3,
  baseRotation: Quaternion
): boolean {
  // targetFaceの辺がない場合は判定不可
  if (!targetFace.edges || targetFace.edges.length < 4) return false;
  
  // previewLumberの木口面をstartPositionに配置した時の辺を計算
  // baseRotationは法線方向を合わせた基本回転
  
  // ローカル座標系でのpreviewLumberの木口面の4辺
  // width方向（X軸）とheight方向（Z軸）
  // const halfWidth = previewLumberType.width / 2;
  // const halfHeight = previewLumberType.height / 2;
  
  // 回転なしの場合のwidthDir, heightDir
  const widthDir = applyQuaternion({ x: 1, y: 0, z: 0 }, baseRotation);
  const heightDir = applyQuaternion({ x: 0, y: 0, z: 1 }, baseRotation);
  
  // 回転なしの場合の辺の方向
  const edgeDirs = [widthDir, heightDir];
  
  // 90度回転した場合のwidthDir, heightDir
  const faceNormal = applyQuaternion({ x: 0, y: 1, z: 0 }, baseRotation);
  const rotated90Rotation = rotateQuaternionAroundAxis(baseRotation, normalize(faceNormal));
  const widthDirRotated = applyQuaternion({ x: 1, y: 0, z: 0 }, rotated90Rotation);
  const heightDirRotated = applyQuaternion({ x: 0, y: 0, z: 1 }, rotated90Rotation);
  
  // 90度回転した場合の辺の方向
  const edgeDirsRotated = [widthDirRotated, heightDirRotated];
  
  // targetFaceの辺の方向を取得
  const targetEdgeDirs = targetFace.edges.map(e => normalize(e.direction));
  
  // 辺の方向が一致するかをチェック（回転なし vs 90度回転）
  let matchCountWithoutRotation = 0;
  let matchCountWithRotation = 0;
  
  for (const targetEdgeDir of targetEdgeDirs) {
    // 回転なしの場合
    for (const edgeDir of edgeDirs) {
      if (Math.abs(dot(targetEdgeDir, edgeDir)) > 0.99) {
        matchCountWithoutRotation++;
        break;
      }
    }
    
    // 90度回転した場合
    for (const edgeDirRot of edgeDirsRotated) {
      if (Math.abs(dot(targetEdgeDir, edgeDirRot)) > 0.99) {
        matchCountWithRotation++;
        break;
      }
    }
  }
  
  // 90度回転した場合の方が多くの辺が一致する場合は回転を適用
  // ただし、回転なしでも同程度一致する場合は回転しない
  return matchCountWithRotation > matchCountWithoutRotation;
}

// クォータニオンを軸周りに90度回転させる
// axis: 回転軸（正規化されたベクトル）
export function rotateQuaternionAroundAxis(
  q: Quaternion,
  axis: Vector3
): Quaternion {
  // 90度（π/2 rad）の回転クォータニオンを作成
  const angle = Math.PI / 2;
  const halfAngle = angle / 2;
  const sinHalf = Math.sin(halfAngle);
  
  const rotQuat: Quaternion = {
    x: axis.x * sinHalf,
    y: axis.y * sinHalf,
    z: axis.z * sinHalf,
    w: Math.cos(halfAngle),
  };
  
  // クォータニオンの合成: rotQuat * q
  return multiplyQuaternions(rotQuat, q);
}

// クォータニオンの乗算
function multiplyQuaternions(a: Quaternion, b: Quaternion): Quaternion {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y + a.y * b.w + a.z * b.x - a.x * b.z,
    z: a.w * b.z + a.z * b.w + a.x * b.y - a.y * b.x,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

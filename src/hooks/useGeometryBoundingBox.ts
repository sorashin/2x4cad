import { Vector3, BufferGeometry } from 'three';
import type { LumberType } from '../types/lumber';
import { LUMBER_DIMENSIONS } from '../types/lumber';

export interface BoundingBoxSize {
  x: number;
  y: number;
  z: number;
}

/**
 * BufferGeometryからbounding boxのサイズを取得
 */
export function getGeometryBoundingBoxSize(geometry: BufferGeometry): BoundingBoxSize {
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  if (!bbox) {
    return { x: 0, y: 0, z: 0 };
  }

  const size = new Vector3();
  bbox.getSize(size);

  return {
    x: Math.abs(size.x),
    y: Math.abs(size.y),
    z: Math.abs(size.z),
  };
}

/**
 * 3辺のサイズとLumberTypeから長さを特定する
 *
 * LumberTypeの2辺（width, height）と3辺のうち2辺がほぼ一致するはず
 * 一致しない残りの1辺が「長さ」となる
 *
 * @param bboxSize bounding boxの3辺サイズ
 * @param boardType LumberType
 * @param candidateLengths useNodeOutputsByLabelsの結果（検証用、オプション）
 * @param tolerance 一致判定の許容誤差（デフォルト: 5mm）
 */
export function inferBoardLength(
  bboxSize: BoundingBoxSize,
  boardType: LumberType,
  candidateLengths?: number[],
  tolerance = 5
): number {
  const dimensions = LUMBER_DIMENSIONS[boardType];
  const { width, height } = dimensions;

  // 3辺を配列にして、LumberTypeの2辺とマッチングする
  const sides = [bboxSize.x, bboxSize.y, bboxSize.z];

  // 各辺がwidth/heightとマッチするかチェック
  const matches: boolean[] = sides.map((side) => {
    return (
      Math.abs(side - width) <= tolerance ||
      Math.abs(side - height) <= tolerance
    );
  });

  // マッチしない辺が長さ
  const lengthIndex = matches.findIndex((m) => !m);

  let inferredLength: number;
  if (lengthIndex !== -1) {
    inferredLength = sides[lengthIndex];
  } else {
    // すべてマッチした場合（正方形に近い場合など）、最も長い辺を長さとする
    inferredLength = Math.max(...sides);
  }

  // candidateLengthsが提供されている場合、最も近い値を返す
  if (candidateLengths && candidateLengths.length > 0) {
    let closestLength = candidateLengths[0];
    let minDiff = Math.abs(inferredLength - closestLength);

    for (const candidate of candidateLengths) {
      const diff = Math.abs(inferredLength - candidate);
      if (diff < minDiff) {
        minDiff = diff;
        closestLength = candidate;
      }
    }

    return closestLength;
  }

  return Math.round(inferredLength);
}

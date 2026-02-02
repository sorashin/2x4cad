import type { GeometryIdentifier, NodeInterop } from 'nodi-modular';
import type { LumberType } from '../types/lumber';
import { DEFAULT_BOARDS } from '../stores/templates/raisedBed';

const GEOMETRY_LABEL_PREFIX = 'geometry_';

/**
 * GeometryIdentifierからboardName（ノードのlabel）を取得
 * ノードのラベルは "geometry_sideBoard" のような形式で、プレフィックスを除去して返す
 */
export function getBoardNameFromGeometryId(
  geometryId: GeometryIdentifier,
  nodes: NodeInterop[]
): string | undefined {
  const nodeId = geometryId.graphNodeSet?.nodeId;
  if (!nodeId) return undefined;

  const node = nodes.find((n) => n.id === nodeId);
  const label = node?.label;

  if (!label) return undefined;

  // "geometry_" プレフィックスを除去
  if (label.startsWith(GEOMETRY_LABEL_PREFIX)) {
    return label.slice(GEOMETRY_LABEL_PREFIX.length);
  }

  return label;
}

/**
 * boardNameからboardTypeを取得（DEFAULT_BOARDSを参照）
 */
export function getBoardTypeFromName(boardName: string): LumberType | undefined {
  const board = DEFAULT_BOARDS.find((b) => b.name === boardName);
  return board?.type;
}

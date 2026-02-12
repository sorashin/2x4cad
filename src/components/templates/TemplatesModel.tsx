import { useMemo } from 'react';
import { Vector3 } from 'three';
import { useModularStore, type BoardGeometryWithId } from '../../stores/templates/modular';
import { useUIStore } from '../../stores/templates/ui';
import { mmToUnits } from '../../constants';
import { BoardMesh } from './BoardMesh';

function getBoardGeometryKey(bg: { id: { graphNodeSet?: { nodeId?: string }; transform?: unknown } }, index: number): string {
  const nodeId = bg.id.graphNodeSet?.nodeId ?? 'n';
  return `${nodeId}-${index}`;
}

const EXPLOSION_MULTIPLIER = 2;

export function TemplatesModel() {
  const { boardGeometries } = useModularStore();
  const { bom } = useUIStore();
  const scale = mmToUnits(1); // 1mm = 1/100 Three.js units

  // 全メッシュの中心を計算（点B: シーンの重心）
  const sceneCenter = useMemo(() => {
    if (boardGeometries.length === 0) return new Vector3(0, 0, 0);

    const sum = new Vector3();
    boardGeometries.forEach((bg) => {
      bg.geometry.computeBoundingBox();
      const center = new Vector3();
      bg.geometry.boundingBox?.getCenter(center);
      sum.add(center);
    });
    return sum.divideScalar(boardGeometries.length);
  }, [boardGeometries]);

  // 各メッシュのオフセットを計算
  const getOffset = (bg: BoardGeometryWithId): [number, number, number] => {
    if (bom === 0) return [0, 0, 0];

    bg.geometry.computeBoundingBox();
    const meshCenter = new Vector3();
    bg.geometry.boundingBox?.getCenter(meshCenter);

    // B→A方向のベクトル
    const direction = meshCenter.clone().sub(sceneCenter);

    // オフセット = direction * bom * (EXPLOSION_MULTIPLIER - 1)
    const offset = direction.multiplyScalar(bom * (EXPLOSION_MULTIPLIER - 1));

    return [offset.x, -offset.y, -offset.z];
  };

  return (
    <group rotation={[Math.PI / 2, 0, 0]} scale={scale}>
      {boardGeometries.map((bg, index) => (
        <BoardMesh
          key={getBoardGeometryKey(bg, index)}
          boardGeometry={bg}
          positionOffset={getOffset(bg)}
        />
      ))}
    </group>
  );
}

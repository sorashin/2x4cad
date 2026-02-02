import { useModularStore } from '../../stores/templates/modular';
import { mmToUnits } from '../../constants';
import { BoardMesh } from './BoardMesh';

function getBoardGeometryKey(bg: { id: { graphNodeSet?: { nodeId?: string }; transform?: unknown } }, index: number): string {
  const nodeId = bg.id.graphNodeSet?.nodeId ?? 'n';
  return `${nodeId}-${index}`;
}

export function TemplatesModel() {
  const { boardGeometries } = useModularStore();
  const scale = mmToUnits(1); // 1mm = 1/100 Three.js units

  return (
    <group rotation={[Math.PI / 2, 0, 0]} scale={scale}>
      {boardGeometries.map((bg, index) => (
        <BoardMesh key={getBoardGeometryKey(bg, index)} boardGeometry={bg} />
      ))}
    </group>
  );
}

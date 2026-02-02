import { useState, useMemo, useEffect } from 'react';
import { Text, Billboard, Edges } from '@react-three/drei';
import { Vector3 } from 'three';
import type { BoardGeometryWithId } from '../../stores/templates/modular';
import { LUMBER_DIMENSIONS } from '../../types/lumber';

interface BoardMeshProps {
  boardGeometry: BoardGeometryWithId;
}

export function BoardMesh({ boardGeometry }: BoardMeshProps) {
  const [hovered, setHovered] = useState(false);
  const { geometry, boardName, boardType, boardLength } = boardGeometry;

  // LumberTypeから厚み・幅を取得
  const dimensions = LUMBER_DIMENSIONS[boardType];

  // メッシュの中心位置を計算
  const meshCenter = useMemo(() => {
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    if (!bbox) return new Vector3(0, 0, 0);

    const center = new Vector3();
    bbox.getCenter(center);
    return center;
  }, [geometry]);

  // 法線を geometry 変更時のみ再計算（render 内での副作用を避ける）
  useEffect(() => {
    geometry.computeVertexNormals();
  }, [geometry]);

  return (
    <mesh
      geometry={geometry}
      rotation={[Math.PI, 0, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <meshStandardMaterial color={hovered ? '#e5c9a8' : '#d4a373'} flatShading />
      <Edges threshold={45} color="#8b5a2b" />

      {hovered && (
        <Billboard position={meshCenter} follow lockX={false} lockY={false} lockZ={false}>
          <Text
            fontSize={40}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
            outlineWidth={2}
            outlineColor="#000000"
          >
            {`${boardName} (${boardType})`}
          </Text>
          <Text
            fontSize={30}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
            position={[0, -50, 0]}
            outlineWidth={1.5}
            outlineColor="#000000"
          >
            {`${dimensions.width}×${dimensions.height}×${boardLength}mm`}
          </Text>
        </Billboard>
      )}
    </mesh>
  );
}

import { useState, useMemo, useEffect, useRef } from 'react';
import { Html, Edges } from '@react-three/drei';
import { Vector3 } from 'three';
import type { BoardGeometryWithId } from '../../stores/templates/modular';
import { LUMBER_DIMENSIONS } from '../../types/lumber';

interface BoardMeshProps {
  boardGeometry: BoardGeometryWithId;
  positionOffset?: [number, number, number];
}

const HOVER_OFF_DELAY_MS = 120;
const LABEL_OFFSET_Y_PX = 60; // ラベルを上にオフセットするピクセル数

export function BoardMesh({ boardGeometry, positionOffset }: BoardMeshProps) {
  const [hovered, setHovered] = useState(false);
  const hoverOffTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // アンマウント時に遅延オフ用タイマーをクリア
  useEffect(() => () => {
    if (hoverOffTimeoutRef.current) clearTimeout(hoverOffTimeoutRef.current);
  }, []);

  return (
    <mesh
      geometry={geometry}
      rotation={[Math.PI, 0, 0]}
      position={positionOffset}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (hoverOffTimeoutRef.current) {
          clearTimeout(hoverOffTimeoutRef.current);
          hoverOffTimeoutRef.current = null;
        }
        setHovered(true);
      }}
      onPointerOut={() => {
        if (hoverOffTimeoutRef.current) {
          clearTimeout(hoverOffTimeoutRef.current);
          hoverOffTimeoutRef.current = null;
        }
        hoverOffTimeoutRef.current = setTimeout(() => {
          hoverOffTimeoutRef.current = null;
          setHovered(false);
        }, HOVER_OFF_DELAY_MS);
      }}
    >
      <meshStandardMaterial color={hovered ? '#e5c9a8' : '#d4a373'} flatShading />
      <Edges threshold={45} color="#8b5a2b" />

      {hovered && (
        <Html
          position={meshCenter}
          center
          pointerEvents="none"
          style={{ pointerEvents: 'none' }}
          calculatePosition={(el, camera, size) => {
            const objectPos = new Vector3().setFromMatrixPosition(el.matrixWorld);
            objectPos.project(camera);
            const widthHalf = size.width / 2;
            const heightHalf = size.height / 2;
            return [
              objectPos.x * widthHalf + widthHalf,
              -(objectPos.y * heightHalf) + heightHalf - LABEL_OFFSET_Y_PX,
            ];
          }}
        >
          <div
            className="pointer-events-none whitespace-nowrap text-center text-sm text-white rounded-sm p-1 bg-content-h"
            
          >
            <div >
              {`${boardName} (${boardType})`}
            </div>
            <div >
              {`${dimensions.width}×${dimensions.height}×${boardLength}mm`}
            </div>
          </div>
        </Html>
      )}
    </mesh>
  );
}

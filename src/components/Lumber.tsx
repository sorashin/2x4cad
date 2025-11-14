import { useRef } from 'react';
import { Mesh, Quaternion as ThreeQuaternion, Vector3 as ThreeVector3 } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import type { Lumber as LumberType } from '../types/lumber';
import { LUMBER_DIMENSIONS } from '../types/lumber';
import { useLumberStore } from '../stores/lumber';
import { mmToUnits } from '../constants';

interface LumberProps {
  lumber: LumberType;
}

export function Lumber({ lumber }: LumberProps) {
  const meshRef = useRef<Mesh>(null);
  const { selectLumber, deselectAll, selectedIds } = useLumberStore();

  const isSelected = selectedIds.has(lumber.id);

  // 角材の寸法を取得
  const dimensions = LUMBER_DIMENSIONS[lumber.type];

  // クォータニオンをThree.jsのQuaternionに変換
  const quaternion = new ThreeQuaternion(
    lumber.rotation.x,
    lumber.rotation.y,
    lumber.rotation.z,
    lumber.rotation.w
  );

  // 位置をThree.jsのVector3に変換（mm → Three.js単位）
  const position = new ThreeVector3(
    mmToUnits(lumber.position.x),
    mmToUnits(lumber.position.y),
    mmToUnits(lumber.position.z)
  );

  // 角材の中心に配置するため、長さの半分だけオフセット
  // 回転後の方向に沿ってオフセットを適用
  const direction = new ThreeVector3(0, 1, 0).applyQuaternion(quaternion);
  const centerOffset = direction.multiplyScalar(mmToUnits(lumber.length) / 2);
  const centerPosition = position.clone().add(centerOffset);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    if (event.shiftKey) {
      // Shift + クリック: 複数選択
      selectLumber(lumber.id, true);
    } else {
      // 通常クリック: 単一選択
      deselectAll();
      selectLumber(lumber.id, false);
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={centerPosition}
      quaternion={quaternion}
      onClick={handleClick}
    >
      <boxGeometry
        args={[
          mmToUnits(dimensions.width),
          mmToUnits(lumber.length),
          mmToUnits(dimensions.height),
        ]}
      />
      <meshStandardMaterial
        color={isSelected ? '#4CAF50' : '#D2691E'}
        emissive={isSelected ? '#2E7D32' : '#000000'}
        emissiveIntensity={isSelected ? 0.3 : 0}
      />
      {/* 選択時に輪郭線を表示 */}
      {isSelected && (
        <Edges
          scale={1}
          threshold={15}
          color="#00ff00"
          linewidth={3}
        />
      )}
    </mesh>
  );
}

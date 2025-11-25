import { Quaternion as ThreeQuaternion, Vector3 as ThreeVector3 } from 'three';
import { Text, Billboard } from '@react-three/drei';
import type { Vector3 } from '../../types/lumber';
import { LUMBER_DIMENSIONS } from '../../types/lumber';
import { mmToUnits } from '../../constants';
import { useInteractionStore } from '../../stores/interaction';
import { useSettingsStore } from '../../stores/settings';
import { snapToGrid } from '../../utils/geometry';

interface PreviewLumberProps {
  start: Vector3;
  end: Vector3;
}

/**
 * Preview lumber component shown during placement
 * Displays a semi-transparent lumber between start and end points
 */
export function PreviewLumber({ start, end }: PreviewLumberProps) {
  const selectedLumberType = useInteractionStore((s) => s.selectedLumberType);
  const activeSnapFace = useInteractionStore((s) => s.activeSnapFace);
  const lockedFaceSnap = useInteractionStore((s) => s.lockedFaceSnap);
  const dimensions = LUMBER_DIMENSIONS[selectedLumberType];
  const snapToGridEnabled = useSettingsStore((s) => s.snapToGrid);
  const gridSize = useSettingsStore((s) => s.gridSize);

  // 始点のスナップ処理
  // lockedFaceSnapが有効な場合は、既に中心線スナップが適用されているのでグリッドスナップしない
  const snappedStart = (lockedFaceSnap || !snapToGridEnabled) ? start : snapToGrid(start, gridSize);
  
  // 終点は面スナップが適用されている場合はそのまま使用、そうでなければグリッドスナップを適用
  // （InteractionHandler で既に面スナップまたはグリッドスナップが適用されている）
  let snappedEnd = end;
  
  // 方向ロックが有効な場合は軸スナップをスキップ
  if (!lockedFaceSnap) {
    // 軸スナップを適用（面スナップされていない軸に対してのみ）
    snappedEnd = snapToAxisWithFaceSnap(snappedStart, snappedEnd, activeSnapFace?.axis);
  }

  // Calculate direction and length
  const dx = snappedEnd.x - snappedStart.x;
  const dy = snappedEnd.y - snappedStart.y;
  const dz = snappedEnd.z - snappedStart.z;
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (length < 1) {
    return null; // Don't render if length is too small
  }

  // 方向ロックが有効な場合は固定回転を使用、そうでなければ方向ベクトルから計算
  let quaternion: { x: number; y: number; z: number; w: number };
  if (lockedFaceSnap) {
    // 固定回転を使用（角を合わせるため）
    quaternion = lockedFaceSnap.rotation;
  } else {
    // Calculate direction vector
    const dir = {
      x: dx / length,
      y: dy / length,
      z: dz / length,
    };
    
    // Calculate rotation quaternion from Y-axis to direction
    quaternion = calculateRotationQuaternion({ x: 0, y: 1, z: 0 }, dir);
  }

  // Position at start point (mm → Three.js units)
  const position = new ThreeVector3(
    mmToUnits(snappedStart.x),
    mmToUnits(snappedStart.y),
    mmToUnits(snappedStart.z)
  );

  // Offset to center
  const direction = new ThreeVector3(0, 1, 0).applyQuaternion(
    new ThreeQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w)
  );
  const centerOffset = direction.multiplyScalar(mmToUnits(length) / 2);
  const centerPosition = position.clone().add(centerOffset);

  // 始点の表示位置（グリッドスナップ済みなので整数値）
  const startPosition = new ThreeVector3(
    mmToUnits(snappedStart.x),
    mmToUnits(snappedStart.y),
    mmToUnits(snappedStart.z)
  );

  return (
    <group>
      <mesh
        position={centerPosition}
        quaternion={new ThreeQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w)}
      >
        <boxGeometry
          args={[
            mmToUnits(dimensions.width),
            mmToUnits(length),
            mmToUnits(dimensions.height),
          ]}
        />
        <meshStandardMaterial
          color="#00BFFF"
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </mesh>
      {/* 始点をsphereで表示（デバッグ用） */}
      <mesh position={startPosition}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#FF0000" />
      </mesh>
      {/* 長さ表示テキスト */}
      <Billboard position={centerPosition} follow={true} lockX={false} lockY={false} lockZ={false}>
        <Text
          fontSize={0.5}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {Math.round(length)}mm
        </Text>
      </Billboard>
      {/* 始点座標を表示 */}
      <Billboard position={startPosition} follow={true} lockX={false} lockY={false} lockZ={false}>
        <Text
          fontSize={0.35}
          color="#FFFF00"
          anchorX="left"
          anchorY="bottom"
          outlineWidth={0.03}
          outlineColor="#000000"
          position={[0.2, 0.2, 0]}
        >
          {`始点: (${snappedStart.x}, ${snappedStart.y}, ${snappedStart.z})`}
        </Text>
        {/* 90度回転が適用されている場合の表示 */}
        {lockedFaceSnap?.isRotated90 && (
          <Text
            fontSize={0.3}
            color="#00FFFF"
            anchorX="left"
            anchorY="top"
            outlineWidth={0.03}
            outlineColor="#000000"
            position={[0.2, -0.1, 0]}
          >
            [90°回転済み]
          </Text>
        )}
      </Billboard>
      {/* 終点座標を表示（面スナップ時はハイライト） */}
      <Billboard 
        position={new ThreeVector3(
          mmToUnits(snappedEnd.x),
          mmToUnits(snappedEnd.y),
          mmToUnits(snappedEnd.z)
        )} 
        follow={true} 
        lockX={false} 
        lockY={false} 
        lockZ={false}
      >
        <Text
          fontSize={0.35}
          color={activeSnapFace ? '#00FF00' : '#FFFF00'}
          anchorX="left"
          anchorY="bottom"
          outlineWidth={0.03}
          outlineColor="#000000"
          position={[0.2, 0.2, 0]}
        >
          {`終点: (${snappedEnd.x}, ${snappedEnd.y}, ${snappedEnd.z})${activeSnapFace ? ' [面スナップ]' : ''}`}
        </Text>
      </Billboard>
    </group>
  );
}

/**
 * Default preview lumber that follows mouse cursor
 * Shows a 100mm lumber for visual guidance
 */
export function DefaultPreviewLumber({ position }: { position: Vector3 }) {
  const selectedLumberType = useInteractionStore((s) => s.selectedLumberType);
  const dimensions = LUMBER_DIMENSIONS[selectedLumberType];
  const snapToGridEnabled = useSettingsStore((s) => s.snapToGrid);
  const gridSize = useSettingsStore((s) => s.gridSize);

  const DEFAULT_LENGTH = 100; // 100mm default length

  // 常にグリッド交点にスナップ
  const snappedPosition = snapToGridEnabled ? snapToGrid(position, gridSize) : position;

  // Position in Three.js units（グリッドスナップ済みなので整数値）
  const centerPosition = new ThreeVector3(
    mmToUnits(snappedPosition.x),
    mmToUnits(snappedPosition.y) + mmToUnits(DEFAULT_LENGTH) / 2,
    mmToUnits(snappedPosition.z)
  );
  
  // 始点位置（小口面の中心）
  const startPosition = new ThreeVector3(
    mmToUnits(snappedPosition.x),
    mmToUnits(snappedPosition.y),
    mmToUnits(snappedPosition.z)
  );

  return (
    <group>
      <mesh position={centerPosition}>
        <boxGeometry
          args={[
            mmToUnits(dimensions.width),
            mmToUnits(DEFAULT_LENGTH),
            mmToUnits(dimensions.height),
          ]}
        />
        <meshStandardMaterial
          color="#00BFFF"
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
      {/* 始点をsphereで表示（デバッグ用） */}
      <mesh position={startPosition}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#FF0000" />
      </mesh>
      {/* 始点座標とグリッドサイズを表示 */}
      <Billboard position={startPosition} follow={true} lockX={false} lockY={false} lockZ={false}>
        <Text
          fontSize={0.4}
          color="#FFFF00"
          anchorX="left"
          anchorY="bottom"
          outlineWidth={0.04}
          outlineColor="#000000"
          position={[0.3, 0.1, 0]}
        >
          {`始点: (${snappedPosition.x}, ${snappedPosition.y}, ${snappedPosition.z})`}
        </Text>
        <Text
          fontSize={0.3}
          color="#00FF00"
          anchorX="left"
          anchorY="top"
          outlineWidth={0.03}
          outlineColor="#000000"
          position={[0.3, -0.1, 0]}
        >
          {`Grid: ${gridSize}mm [G]で切替`}
        </Text>
      </Billboard>
    </group>
  );
}

// Helper functions

/**
 * 終点を最も近い軸にスナップする
 * 面スナップが適用されている場合は、その軸の値を保持する
 */
function snapToAxisWithFaceSnap(
  start: Vector3, 
  end: Vector3, 
  faceSnapAxis: 'x' | 'y' | 'z' | undefined
): Vector3 {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  const dz = Math.abs(end.z - start.z);
  
  // 面スナップが適用されている軸を判定
  // 面スナップ軸は PreviewLumber の伸びる方向を決める
  let primaryAxis: 'x' | 'y' | 'z';
  
  if (faceSnapAxis) {
    // 面スナップが適用されている場合、その軸方向に伸ばす
    primaryAxis = faceSnapAxis;
  } else {
    // 面スナップがない場合、最も差が大きい軸を選択
    if (dx >= dy && dx >= dz) {
      primaryAxis = 'x';
    } else if (dy >= dx && dy >= dz) {
      primaryAxis = 'y';
    } else {
      primaryAxis = 'z';
    }
  }
  
  // 選択された軸方向にのみ伸ばす
  switch (primaryAxis) {
    case 'x':
      return { x: end.x, y: start.y, z: start.z };
    case 'y':
      return { x: start.x, y: end.y, z: start.z };
    case 'z':
      return { x: start.x, y: start.y, z: end.z };
  }
}

function calculateRotationQuaternion(from: Vector3, to: Vector3): {
  x: number;
  y: number;
  z: number;
  w: number;
} {
  const cross = {
    x: from.y * to.z - from.z * to.y,
    y: from.z * to.x - from.x * to.z,
    z: from.x * to.y - from.y * to.x,
  };

  const dot = from.x * to.x + from.y * to.y + from.z * to.z;
  const w = 1 + dot;
  const norm = Math.sqrt(cross.x * cross.x + cross.y * cross.y + cross.z * cross.z + w * w);

  if (norm < 0.0001) {
    return { x: 1, y: 0, z: 0, w: 0 };
  }

  return {
    x: cross.x / norm,
    y: cross.y / norm,
    z: cross.z / norm,
    w: w / norm,
  };
}

import { useEffect, useRef, useState } from 'react';
import { TransformControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Vector3 as ThreeVector3 } from 'three';
import type { Mesh } from 'three';
import { useLumberStore } from '../stores/lumber';
import { useHistoryStore } from '../stores/history';
import { UpdateLumberHistory } from '../histories/UpdateLumberHistory';
import { unitsToMm, mmToUnits } from '../constants';
import type { Vector3, Quaternion } from '../types/lumber';

interface LumberTransformControlsProps {
  lumberId: string;
  meshRef: React.RefObject<Mesh>;
}

export function LumberTransformControls({ lumberId, meshRef }: LumberTransformControlsProps) {
  const [mode, setMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const { camera, gl } = useThree();
  const transformRef = useRef<any>(null);
  const { updateLumber, lumbers } = useLumberStore();
  const { push } = useHistoryStore();

  // 変更前の状態を保存
  const initialStateRef = useRef<{
    position: Vector3;
    rotation: Quaternion;
    length: number;
  } | null>(null);

  // キーボードショートカット（T, R, E）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 't' || e.key === 'T') {
        setMode('translate');
      } else if (e.key === 'r' || e.key === 'R') {
        setMode('rotate');
      } else if (e.key === 'e' || e.key === 'E') {
        setMode('scale');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // TransformControlsのイベントハンドラ
  const handleDragStart = () => {
    // 変更前の状態を保存
    const lumber = lumbers[lumberId];
    if (lumber) {
      initialStateRef.current = {
        position: { ...lumber.position },
        rotation: { ...lumber.rotation },
        length: lumber.length,
      };
    }
  };

  const handleDragEnd = () => {
    if (!meshRef.current || !initialStateRef.current) return;

    const mesh = meshRef.current;
    const lumber = lumbers[lumberId];
    if (!lumber) return;

    const newRotation: Quaternion = {
      x: mesh.quaternion.x,
      y: mesh.quaternion.y,
      z: mesh.quaternion.z,
      w: mesh.quaternion.w,
    };

    // スケール変更の場合は長さを更新
    let newLength = lumber.length;
    if (mode === 'scale') {
      // Y軸方向のスケールを長さに反映
      newLength = lumber.length * mesh.scale.y;
      mesh.scale.set(1, 1, 1); // スケールをリセット
    }

    // meshの位置（中心位置）から始点位置を計算
    // 中心位置 - (方向ベクトル * 長さ/2) = 始点位置
    const centerPosition = mesh.position.clone();
    const direction = new ThreeVector3(0, 1, 0).applyQuaternion(mesh.quaternion);
    const offset = direction.multiplyScalar(mmToUnits(newLength) / 2);
    const startPosition = centerPosition.clone().sub(offset);

    const newPosition: Vector3 = {
      x: unitsToMm(startPosition.x),
      y: unitsToMm(startPosition.y),
      z: unitsToMm(startPosition.z),
    };

    // 履歴に追加
    const history = new UpdateLumberHistory(
      lumberId,
      initialStateRef.current,
      { position: newPosition, rotation: newRotation, length: newLength }
    );
    push(history);

    // ストアを更新
    updateLumber(lumberId, {
      position: newPosition,
      rotation: newRotation,
      length: newLength,
    });

    initialStateRef.current = null;
  };

  // meshRef.currentがnullの場合は何も表示しない
  if (!meshRef.current) {
    return null;
  }

  return (
    <TransformControls
      ref={transformRef}
      object={meshRef.current}
      mode={mode}
      camera={camera}
      domElement={gl.domElement}
      onMouseDown={handleDragStart}
      onMouseUp={handleDragEnd}
    />
  );
}

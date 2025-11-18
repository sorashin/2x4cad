# よく使用するパターン

## 新しい角材タイプの追加

### 1. LumberTypeに新しいタイプを定義

```typescript
// src/types/lumber.ts
export enum LumberType {
  ONE_BY_FOUR = '1x4',
  TWO_BY_FOUR = '2x4',
  RAFTER = 'rafter',
  TWO_BY_SIX = '2x6',  // 新しい角材タイプ
}

export const LUMBER_DIMENSIONS: Record<LumberType, { width: number; height: number }> = {
  [LumberType.ONE_BY_FOUR]: { width: 19, height: 89 },
  [LumberType.TWO_BY_FOUR]: { width: 38, height: 89 },
  [LumberType.RAFTER]: { width: 30, height: 30 },
  [LumberType.TWO_BY_SIX]: { width: 38, height: 140 },  // 寸法を追加
};
```

## 新しい操作のUNDO/REDO対応（Historyパターン）

### 1. Historyクラスを作成

```typescript
// src/histories/DeleteLumberHistory.ts
import type { Lumber } from '../types/lumber';
import { useLumberStore } from '../stores/lumber';
import type { HistoryBase } from './HistoryBase';

export class DeleteLumberHistory implements HistoryBase {
  private lumberData: Lumber;

  constructor(lumberId: string) {
    // 削除前にデータを保存
    const store = useLumberStore.getState();
    this.lumberData = store.lumbers[lumberId];
  }

  undo() {
    // 削除を取り消して復元
    const store = useLumberStore.getState();
    store.restoreLumber(this.lumberData);
  }

  redo() {
    // 再度削除
    const store = useLumberStore.getState();
    store.deleteLumber(this.lumberData.id);
  }
}
```

### 2. コンポーネントから使用

```typescript
import { DeleteLumberHistory } from '../histories/DeleteLumberHistory';
import { useHistoryStore } from '../stores/history';

const { push } = useHistoryStore();

const deleteLumber = (lumberId: string) => {
  const history = new DeleteLumberHistory(lumberId);
  push(history); // UNDO/REDO対応
};
```

### 複合操作の例（NestedHistory）

```typescript
import { NestedHistory } from '../histories/NestedHistory';
import { AddLumberHistory } from '../histories/AddLumberHistory';
import { UpdateLumberHistory } from '../histories/UpdateLumberHistory';

// 複数の角材を一度に追加する操作
const addMultipleLumbers = (lumberIds: string[]) => {
  const histories = lumberIds.map(id => new AddLumberHistory(id));
  const nestedHistory = new NestedHistory(histories);
  push(nestedHistory); // 一度のUNDOで全部戻せる
};
```

## react-three-fiberコンポーネントの基本パターン

### Mesh コンポーネントの構造

```typescript
import { useRef } from 'react';
import { Mesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';

export function CustomMesh({ position, rotation, color }) {
  const meshRef = useRef<Mesh>(null);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    console.log('Mesh clicked!');
  };

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} onClick={handleClick}>
      <boxGeometry args={[1, 2, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
```

### TransformControls の使用

```typescript
import { TransformControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

export function MyTransformControls({ meshRef, mode }) {
  const { camera, gl } = useThree();

  const handleDragStart = () => {
    console.log('Transform started');
  };

  const handleDragEnd = () => {
    console.log('Transform ended');
  };

  return (
    <TransformControls
      object={meshRef.current}
      mode={mode}  // 'translate' | 'rotate' | 'scale'
      camera={camera}
      domElement={gl.domElement}
      onMouseDown={handleDragStart}
      onMouseUp={handleDragEnd}
    />
  );
}
```

## 角材の追加と座標変換

### 始点・終点から角材を作成

```typescript
import { useLumberStore } from '../stores/lumber';
import { LumberType } from '../types/lumber';
import { AddLumberHistory } from '../histories/AddLumberHistory';
import { useHistoryStore } from '../stores/history';

const { addLumber } = useLumberStore();
const { push } = useHistoryStore();

// 始点と終点から角材を追加
const start = { x: 0, y: 0, z: 0 };
const end = { x: 0, y: 1000, z: 0 };  // mm単位

const lumberId = addLumber(LumberType.TWO_BY_FOUR, start, end);

// UNDO/REDO対応
const history = new AddLumberHistory(lumberId);
push(history);
```

### mm単位 ↔ Three.js単位の変換

```typescript
import { mmToUnits, unitsToMm } from '../constants';

// mm → Three.js単位（100mm = 1単位）
const threePosition = mmToUnits(1000); // 10

// Three.js単位 → mm
const mmPosition = unitsToMm(10); // 1000
```

## Quaternion（回転）の扱い方

### Vector3方向からQuaternionを計算

```typescript
import { Vector3 as ThreeVector3, Quaternion as ThreeQuaternion } from 'three';

// 始点から終点への方向ベクトル
const direction = new ThreeVector3(
  end.x - start.x,
  end.y - start.y,
  end.z - start.z
).normalize();

// デフォルトのY軸方向からの回転を計算
const defaultUp = new ThreeVector3(0, 1, 0);
const quaternion = new ThreeQuaternion();
quaternion.setFromUnitVectors(defaultUp, direction);

// Lumber型のQuaternionに変換
const rotation = {
  x: quaternion.x,
  y: quaternion.y,
  z: quaternion.z,
  w: quaternion.w,
};
```

## 選択状態の管理

### 単一選択とマルチ選択

```typescript
import { useLumberStore } from '../stores/lumber';

const { selectLumber, deselectAll, selectedIds } = useLumberStore();

// 単一選択
const handleSingleSelect = (lumberId: string) => {
  deselectAll();
  selectLumber(lumberId, false);
};

// Shift + クリックでマルチ選択
const handleMultiSelect = (lumberId: string) => {
  selectLumber(lumberId, true);
};

// 選択されているかチェック
const isSelected = selectedIds.has(lumberId);
```

## キーボードショートカット

### グローバルショートカットの実装

```typescript
import { useEffect } from 'react';

export function useCustomShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd判定
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlKey && e.key === 's') {
        e.preventDefault();
        // 保存処理
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

## デバッグ支援

### コンソールログのパターン

```typescript
// 重要なアクションは必ずログ出力
console.log('[Lumber] Added:', lumberId, lumber);
console.log('[History] Push:', history);
console.log('[Transform] Updated:', { position, rotation, length });
```

### Zustandのデバッグ

```typescript
// ブラウザのコンソールで実行
useLumberStore.getState()      // 現在の角材データ
useHistoryStore.getState()     // UNDO/REDO履歴

// 角材の一覧
Object.values(useLumberStore.getState().lumbers)

// 選択中の角材
Array.from(useLumberStore.getState().selectedIds)
```

## パフォーマンス最適化パターン

### useMemoの適切な使用

```typescript
import { useMemo } from 'react';

// 重い計算（Quaternion変換、座標計算等）
const centerPosition = useMemo(() => {
  const direction = new ThreeVector3(0, 1, 0).applyQuaternion(quaternion);
  const offset = direction.multiplyScalar(mmToUnits(length) / 2);
  return position.clone().add(offset);
}, [position, quaternion, length]);
```

### useCallbackの適切な使用

```typescript
import { useCallback } from 'react';

// イベントハンドラー（子コンポーネントのpropsとして渡す場合）
const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
  event.stopPropagation();
  selectLumber(lumberId, event.shiftKey);
}, [lumberId, selectLumber]);
```

### 不要な再レンダリングの防止

```typescript
// React.memoでコンポーネントをメモ化
import { memo } from 'react';

export const Lumber = memo(({ lumber }: LumberProps) => {
  // ...
});
```

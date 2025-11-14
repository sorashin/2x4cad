# 2x4 CAD システム設計仕様書

## 概要

3D空間で2x4材や1x4材、垂木を使って簡易な構造物を設計するためのCADシステム。

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **3Dレンダリング**: React Three Fiber (@react-three/fiber)
- **状態管理**: Zustand
- **3Dモデリング**: 初期はBoxGeometry、将来的にNodi Modular統合

## 要件

### 基本機能

- 角材の始点と終点（または始点とベクトル）を指定することで角材を設置できる
- 角材には1x4材(19x89mm)、2x4材(38 x 89mm)、垂木（30mm角）の3種類
- 角材はあとから選択し、伸縮・移動・回転できる
- 角材と角材が接しているかどうか、関係性を保存・更新できる
- 角材同士が接している場合は、接している角材すべてをひとかたまりに移動・回転させる

### データ永続化

- JSON形式で格納できる
  - 角材の座標
  - 角材の接点情報（どの角材と接しているか）
  - メタデータ（ビス止め、金具など接続方式）

### 操作性

- 履歴を持ち、Ctrl+Zで戻り、Ctrl+Shift+Zで進める
- 角材を伸縮・移動する間、並行になる面があれば、スナップできる
- 始点・終点配置時にグリッドスナップを適用
- Shift+クリックで複数選択

## データ構造設計

### 角材の型定義

```typescript
// 角材の種類
export enum LumberType {
  ONE_BY_FOUR = '1x4',    // 19x89mm
  TWO_BY_FOUR = '2x4',    // 38x89mm
  RAFTER = 'rafter'       // 30x30mm (垂木)
}

// 角材のメタデータ
export const LUMBER_DIMENSIONS: Record<LumberType, { width: number; height: number }> = {
  [LumberType.ONE_BY_FOUR]: { width: 19, height: 89 },
  [LumberType.TWO_BY_FOUR]: { width: 38, height: 89 },
  [LumberType.RAFTER]: { width: 30, height: 30 }
};

// 接続方式
export enum ConnectionType {
  SCREW = 'screw',           // ビス止め
  BRACKET = 'bracket',       // 金具
  NONE = 'none'              // 接触のみ
}

// 3D座標・回転
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

// 接続情報
export interface Connection {
  targetLumberId: string;    // 接続先の角材ID
  connectionType: ConnectionType;
  contactPoint: Vector3;     // 接触点（ローカル座標）
}

// 角材データ
export interface Lumber {
  id: string;
  type: LumberType;

  // 位置情報（始点ベース）
  position: Vector3;         // 始点座標
  length: number;            // 長さ（mm）
  rotation: Quaternion;      // 回転（クォータニオン）

  // 接続情報
  connections: Connection[];

  // メタデータ
  createdAt: number;
  updatedAt: number;
}

// プロジェクトデータ構造
export interface Project {
  version: string;           // データバージョン
  lumbers: Record<string, Lumber>;  // ID -> Lumber のマップ
  metadata: {
    name: string;
    createdAt: number;
    updatedAt: number;
  };
}
```

## 状態管理設計（Zustand）

### Lumber Store

```typescript
interface LumberStoreState {
  lumbers: Record<string, Lumber>;

  // CRUD操作
  addLumber: (type: LumberType, start: Vector3, end: Vector3) => string;
  updateLumber: (id: string, updates: Partial<Lumber>) => void;
  deleteLumber: (id: string) => void;

  // 選択状態
  selectedIds: Set<string>;
  selectLumber: (id: string, multi?: boolean) => void;
  deselectAll: () => void;

  // 接続関係の管理
  addConnection: (lumberId: string, connection: Connection) => void;
  removeConnection: (lumberId: string, targetId: string) => void;
  getConnectedLumbers: (id: string) => string[];  // 接続されている全角材のID
  getConnectedGroup: (id: string) => Set<string>; // 間接的に接続された全角材（グラフ探索）

  // スナップ機能
  snapToParallelFaces: (lumberId: string, position: Vector3) => Vector3 | null;
}
```

### History Store（EMARF_library_webパターン採用）

```typescript
interface HistoryState {
  currentIndex: number;
  histories: HistoryBase[];
}

export interface HistoryStoreState {
  historyState: HistoryState;
  push: (history: HistoryBase) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}
```

実装パターン:
- Command パターンでUndo/Redo実装
- `NestedHistory`で複数操作をまとめる
- 汎用的な`UpdateLumberHistory`で大半の操作に対応

### Settings Store

```typescript
interface SettingsStoreState {
  gridSize: number;           // グリッドサイズ（mm）
  snapToGrid: boolean;        // グリッドスナップ有効/無効
  snapThreshold: number;      // スナップ閾値（mm）
  contactThreshold: number;   // 接触判定閾値（mm、デフォルト1.0）
}
```

## 履歴管理実装

### History Base

```typescript
// src/histories/HistoryBase.ts
export interface HistoryBase {
  undo: () => void;
  redo: () => void;
}
```

### 汎用Update History

```typescript
// src/histories/UpdateLumberHistory.ts
export class UpdateLumberHistory implements HistoryBase {
  constructor(
    private lumberId: string,
    private prevState: Partial<Lumber>,
    private nextState: Partial<Lumber>
  ) {}

  undo() {
    useLumberStore.getState().updateLumber(this.lumberId, this.prevState);
  }

  redo() {
    useLumberStore.getState().updateLumber(this.lumberId, this.nextState);
  }
}
```

### Nested History（複数操作のまとめ）

```typescript
// src/histories/NestedHistory.ts
export class NestedHistory implements HistoryBase {
  constructor(private histories: HistoryBase[]) {}

  undo() {
    // 逆順でundo
    for (let i = this.histories.length - 1; i >= 0; i--) {
      this.histories[i].undo();
    }
  }

  redo() {
    // 順番にredo
    for (let i = 0; i < this.histories.length; i++) {
      this.histories[i].redo();
    }
  }
}
```

## 接続判定アルゴリズム

### 基本方針

角材同士はほとんどの場合外接しており、交錯していることは稀。
よって、**面間距離判定**が最適。

### 3段階判定アプローチ

```
粗判定（中心間距離）→ Three.js Box3判定 → 面間距離計算
    ↓ 除外              ↓ 除外           ↓ 接触検出
   99%                 90%              詳細判定
```

### ステップ1: 粗判定 - 中心間距離チェック

```typescript
function coarseProximityCheck(
  lumber1: Lumber,
  lumber2: Lumber,
  maxDistance: number = 200  // 角材の最大長さ程度
): boolean {
  const center1 = getLumberCenter(lumber1);
  const center2 = getLumberCenter(lumber2);

  const distance = Math.sqrt(
    (center1.x - center2.x) ** 2 +
    (center1.y - center2.y) ** 2 +
    (center1.z - center2.z) ** 2
  );

  return distance <= maxDistance;
}
```

### ステップ2: Three.js Box3による除外判定

```typescript
import * as THREE from 'three';

function quickBoxCheck(lumber1: Lumber, lumber2: Lumber, threshold: number): boolean {
  const box1 = createBox3FromLumber(lumber1);
  const box2 = createBox3FromLumber(lumber2);

  const expandedBox1 = box1.clone().expandByScalar(threshold);

  return expandedBox1.intersectsBox(box2);
}
```

### ステップ3: 精密判定 - 面間距離計算

```typescript
interface Face {
  center: Vector3;
  normal: Vector3;
  vertices: Vector3[];
}

function detectExternalContact(
  lumber1: Lumber,
  lumber2: Lumber,
  contactThreshold: number = 1.0
): ContactInfo | null {

  if (!coarseProximityCheck(lumber1, lumber2)) return null;
  if (!quickBoxCheck(lumber1, lumber2, contactThreshold)) return null;

  const faces1 = getLumberFaces(lumber1);
  const faces2 = getLumberFaces(lumber2);

  let minDistance = Infinity;
  let contactFacePair: [Face, Face] | null = null;

  for (const face1 of faces1) {
    for (const face2 of faces2) {
      if (!areFacesParallelAndOpposite(face1, face2)) continue;

      const distance = calculateFaceDistance(face1, face2);

      if (distance < minDistance && distance <= contactThreshold) {
        minDistance = distance;
        contactFacePair = [face1, face2];
      }
    }
  }

  if (contactFacePair) {
    return {
      distance: minDistance,
      contactPoint: calculateContactPoint(contactFacePair[0], contactFacePair[1]),
      contactType: 'face-to-face'
    };
  }

  return null;
}
```

### 面の平行・反対方向判定

```typescript
function areFacesParallelAndOpposite(face1: Face, face2: Face): boolean {
  const dotProduct =
    face1.normal.x * face2.normal.x +
    face1.normal.y * face2.normal.y +
    face1.normal.z * face2.normal.z;

  return dotProduct < -0.98;  // ほぼ反対方向（約12度以内）
}
```

### 面間距離計算

```typescript
function calculateFaceDistance(face1: Face, face2: Face): number {
  const centerDiff = {
    x: face2.center.x - face1.center.x,
    y: face2.center.y - face1.center.y,
    z: face2.center.z - face1.center.z
  };

  const distance = Math.abs(
    centerDiff.x * face1.normal.x +
    centerDiff.y * face1.normal.y +
    centerDiff.z * face1.normal.z
  );

  return distance;
}
```

## スナップ機能

### グリッドスナップ（配置時）

```typescript
export function snapToGrid(position: Vector3, gridSize: number): Vector3 {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
    z: Math.round(position.z / gridSize) * gridSize,
  };
}
```

### 並行面スナップ（移動時）

```typescript
function snapToParallelFaces(
  movingLumber: Lumber,
  targetPosition: Vector3,
  allLumbers: Lumber[],
  snapThreshold: number = 5
): Vector3 {
  let snappedPosition = targetPosition;
  let minDistance = Infinity;

  for (const other of allLumbers) {
    if (other.id === movingLumber.id) continue;

    const parallelFaces = findParallelFaces(movingLumber, other);

    for (const facePair of parallelFaces) {
      const distance = calculateFaceDistance(facePair, targetPosition);

      if (distance < snapThreshold && distance < minDistance) {
        minDistance = distance;
        snappedPosition = calculateSnapPosition(facePair, targetPosition);
      }
    }
  }

  return snappedPosition;
}
```

## JSON保存・読み込み

```typescript
// プロジェクトの保存
export function saveProject(project: Project): string {
  return JSON.stringify(project, null, 2);
}

// プロジェクトの読み込み
export function loadProject(json: string): Project {
  const data = JSON.parse(json);

  if (data.version !== CURRENT_VERSION) {
    data = migrateProject(data);
  }

  return data as Project;
}
```

## キーボードショートカット

```typescript
export function useKeyboardShortcuts() {
  const { undo, redo } = useHistoryStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlKey && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
      } else if (ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
}
```

## ディレクトリ構成

```
src/
├── types/
│   └── lumber.ts           # 型定義
├── stores/
│   ├── lumber.ts           # 角材の状態管理
│   ├── history.ts          # 履歴管理
│   └── settings.ts         # 設定（スナップ閾値など）
├── histories/
│   ├── HistoryBase.ts
│   ├── UpdateLumberHistory.ts
│   ├── NestedHistory.ts
│   └── AddLumberHistory.ts
├── utils/
│   ├── geometry.ts         # 幾何計算（交差判定、スナップなど）
│   ├── project.ts          # プロジェクト保存・読み込み
│   └── lumber-factory.ts   # 角材生成ヘルパー
├── components/
│   ├── Scene.tsx           # React Three Fiber メインシーン
│   ├── Lumber.tsx          # 角材コンポーネント
│   ├── Grid.tsx            # グリッド表示
│   ├── Controls.tsx        # カメラコントロール
│   └── ui/
│       ├── Toolbar.tsx     # ツールバー
│       ├── PropertiesPanel.tsx
│       └── HistoryViewer.tsx
├── hooks/
│   ├── useKeyboardShortcuts.ts
│   ├── useLumberInteraction.ts  # ドラッグ・選択
│   └── useConnectionDetection.ts
└── App.tsx
```

## 実装の優先順位

### Phase 1: 基本機能
1. 型定義とストア設計
2. 角材の配置（始点・終点指定）
3. 3D表示（BoxGeometry）
4. 選択機能

### Phase 2: 操作機能
5. 移動・回転・伸縮
6. 履歴機能（Undo/Redo）
7. JSON保存・読み込み

### Phase 3: 高度な機能
8. 接続判定と関係性管理
9. グループ移動（接続された角材一括移動）
10. スナップ機能

### Phase 4: UI/UX改善
11. プロパティパネル
12. 接続メタデータ編集（ビス、金具）
13. Nodi Modular統合

## EMARF_library_webから採用するパターン

1. **Zustand + devtools**: 状態管理
2. **History パターン**: Command パターンでUndo/Redo
3. **NestedHistory**: 複数操作のまとめ
4. **バックアップデータ**: 削除時のデータ保持でRedo実装

## 参考資料

- EMARF_library_web: `/Users/shintaro/dev/emarf_library_web`
  - History実装: `src/stores/history.ts`
  - NestedHistory: `src/histories/NestedHistory.ts`
  - Graph構造管理: `src/stores/graph.ts`

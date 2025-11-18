# プロジェクト知見集

## アーキテクチャ決定

### 1. History Pattern による完全なUNDO/REDO実装

**決定**: すべての操作をHistoryクラスで実装し、完全なUNDO/REDO機能を提供

**背景**:
- CADアプリケーションではUNDO/REDOは必須機能
- 単純なstate履歴では複雑な操作（複数の角材を同時に操作など）に対応できない
- 各操作の逆操作を明示的に定義する必要がある

**実装**:
```
HistoryBase インターフェース
  → すべての操作が実装すべき基本インターフェース（undo, redo）

具体的な History クラス:
  - AddLumberHistory: 角材の追加/削除
  - UpdateLumberHistory: 角材の変更（位置/回転/長さ）
  - NestedHistory: 複数の操作をグループ化

HistoryStore (Zustand):
  - histories: HistoryBase[]
  - currentIndex: number
  - push() / undo() / redo() / clear()
```

**利点**:
- 各操作がカプセル化され、メンテナンスしやすい
- 新しい操作を追加する際はHistoryBaseを実装するだけ
- NestedHistoryで複雑な操作も簡単に実装可能
- テストが容易（各Historyクラスを独立してテスト可能）

**トレードオフ**:
- すべての操作でHistoryクラスを作成する必要がある
- メモリ使用量がやや増える（履歴を保持するため）

### 2. mm単位とThree.js単位の分離

**決定**: アプリケーション内部はmm単位、Three.jsシーンは100mm=1単位

**理由**:
- 建築や木工では実際にmm単位を使用
- Three.jsでmm単位をそのまま使うと数値が大きくなりすぎる
- グリッドとの対応関係をわかりやすくするため（1グリッド = 10cm = 100mm）

**実装**:
```typescript
// constants.ts
export const MM_TO_UNITS = 0.01; // 100mm = 1単位
export const mmToUnits = (mm: number) => mm * MM_TO_UNITS;
export const unitsToMm = (units: number) => units / MM_TO_UNITS;
```

**パターン**:
- Lumberデータ（Store）: mm単位で保存
- Three.jsレンダリング時: mmToUnits()で変換
- TransformControls更新時: unitsToMm()で戻す

### 3. 角材の表現方法（始点 + 長さ + 回転）

**決定**: 角材を「始点座標 + 長さ + Quaternion回転」で表現

**背景**:
- 始点・終点の2点表現だと回転が一意に定まらない（ロール方向の自由度）
- Quaternionを使うことで任意の回転を表現可能
- 長さを持つことでスケール変更時の扱いが簡単

**実装**:
```typescript
interface Lumber {
  position: Vector3;      // 始点座標（mm）
  length: number;         // 長さ（mm）
  rotation: Quaternion;   // 回転（デフォルトY軸からの回転）
}
```

**利点**:
- 任意の3D回転を正確に表現できる
- TransformControls と相性が良い
- スケール（伸縮）操作が length の変更で済む

### 4. TransformControls の状態管理

**決定**: ドラッグ開始時に初期状態を保存、ドラッグ終了時にHistoryに記録

**理由**:
- TransformControls は連続的にオブジェクトを変更する
- すべての変更をHistoryに記録するとメモリ消費が激しい
- ドラッグ開始〜終了を1つの操作として扱うのが直感的

**実装パターン**:
```typescript
const initialStateRef = useRef<Partial<Lumber> | null>(null);

const handleDragStart = () => {
  // 変更前の状態を保存
  initialStateRef.current = {
    position: { ...lumber.position },
    rotation: { ...lumber.rotation },
    length: lumber.length,
  };
};

const handleDragEnd = () => {
  // 変更後の状態と比較してHistoryに記録
  const history = new UpdateLumberHistory(
    lumberId,
    initialStateRef.current!,
    { position: newPosition, rotation: newRotation, length: newLength }
  );
  push(history);
};
```

## 実装パターン

### History パターンの基本構造

```typescript
// 1. HistoryBase インターフェース (histories/HistoryBase.ts)
export interface HistoryBase {
  undo(): void;
  redo(): void;
}

// 2. 具体的な History クラス (histories/AddLumberHistory.ts)
export class AddLumberHistory implements HistoryBase {
  private lumberData: Lumber | null = null;

  constructor(private lumberId: string) {}

  undo() {
    const store = useLumberStore.getState();
    this.lumberData = store.lumbers[this.lumberId];
    store.deleteLumber(this.lumberId);
  }

  redo() {
    if (this.lumberData) {
      const store = useLumberStore.getState();
      store.restoreLumber(this.lumberData);
    }
  }
}

// 3. 使用箇所
const { push } = useHistoryStore();
const lumberId = addLumber(type, start, end);
const history = new AddLumberHistory(lumberId);
push(history);
```

### NestedHistory による複合操作

```typescript
// histories/NestedHistory.ts
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

// 使用例: 複数の角材を一度に追加
const histories = lumberIds.map(id => new AddLumberHistory(id));
const nestedHistory = new NestedHistory(histories);
push(nestedHistory); // 一度のUNDOで全部戻せる
```

### 角材の座標計算パターン

```typescript
// 始点から中心位置を計算（レンダリング用）
const quaternion = new ThreeQuaternion(
  lumber.rotation.x,
  lumber.rotation.y,
  lumber.rotation.z,
  lumber.rotation.w
);

const position = new ThreeVector3(
  mmToUnits(lumber.position.x),
  mmToUnits(lumber.position.y),
  mmToUnits(lumber.position.z)
);

// Y軸方向（角材のデフォルト方向）をQuaternionで回転
const direction = new ThreeVector3(0, 1, 0).applyQuaternion(quaternion);

// 中心位置 = 始点 + (方向 * 長さ/2)
const centerOffset = direction.multiplyScalar(mmToUnits(lumber.length) / 2);
const centerPosition = position.clone().add(centerOffset);
```

### 選択状態の管理

```typescript
// stores/lumber.ts
interface LumberStoreState {
  selectedIds: Set<string>;  // 選択中の角材ID

  selectLumber: (id: string, multi?: boolean) => void;
  deselectAll: () => void;
}

// 単一選択
selectLumber: (id, multi = false) => {
  const newSelectedIds = multi ? new Set(selectedIds) : new Set();
  newSelectedIds.add(id);
  set({ selectedIds: newSelectedIds });
}

// コンポーネントでの使用
const handleClick = (event: ThreeEvent<MouseEvent>) => {
  event.stopPropagation();

  if (event.shiftKey) {
    selectLumber(lumber.id, true);  // マルチ選択
  } else {
    deselectAll();
    selectLumber(lumber.id, false); // 単一選択
  }
};
```

## 避けるべきパターン

### ❌ 毎フレームHistoryに記録

**理由**: メモリ消費が激しく、履歴が膨大になる

```typescript
// 悪い例
const handleTransform = () => {
  // TransformControlsの変更ごとに記録 → NG
  push(new UpdateLumberHistory(...));
};

// 良い例
const handleDragEnd = () => {
  // ドラッグ終了時のみ記録 → OK
  push(new UpdateLumberHistory(...));
};
```

### ❌ Three.jsの座標をそのままStoreに保存

**理由**: アプリケーション内部は常にmm単位で統一すべき

```typescript
// 悪い例
updateLumber(id, {
  position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z }
});

// 良い例
updateLumber(id, {
  position: {
    x: unitsToMm(mesh.position.x),
    y: unitsToMm(mesh.position.y),
    z: unitsToMm(mesh.position.z),
  }
});
```

### ❌ Quaternionを直接編集

**理由**: Quaternionの正規化を忘れると回転が壊れる

```typescript
// 悪い例
const quaternion = { x: 0, y: 0, z: 0, w: 1 };
quaternion.x = 0.5; // 正規化されていない → NG

// 良い例
const threeQuat = new ThreeQuaternion();
threeQuat.setFromUnitVectors(from, to); // 自動的に正規化される
const quaternion = {
  x: threeQuat.x,
  y: threeQuat.y,
  z: threeQuat.z,
  w: threeQuat.w,
};
```

## トラブルシューティング

### TransformControlsが動かない

**症状**: TransformControlsをドラッグしても角材が動かない

**原因**:
- meshRef.current が null
- TransformControls の object プロパティが設定されていない

**解決**:
```typescript
if (!meshRef.current) {
  return null; // meshがマウントされるまでTransformControlsを表示しない
}

return (
  <TransformControls object={meshRef.current} {...} />
);
```

### 角材の回転がおかしい

**症状**: 角材が意図しない方向を向く

**原因**: Quaternionの計算ミス、または正規化忘れ

**解決**: Three.jsのQuaternionを使って計算
```typescript
const quaternion = new ThreeQuaternion();
quaternion.setFromUnitVectors(defaultUp, direction);
// 自動的に正規化される
```

### UNDO/REDOがうまく動かない

**症状**: UNDOしても状態が戻らない、または一部だけ戻る

**原因**:
- Historyクラスの undo() / redo() の実装ミス
- 状態のディープコピーを取っていない

**解決**:
```typescript
// 悪い例
this.prevState = lumber; // 参照をコピー → 変更されると壊れる

// 良い例
this.prevState = {
  position: { ...lumber.position },  // ディープコピー
  rotation: { ...lumber.rotation },
  length: lumber.length,
};
```

## パフォーマンス最適化

### useMemoの適切な使用

**重い計算**:
- Quaternion変換
- 中心位置の計算
- BufferGeometryの生成

**パターン**:
```typescript
const centerPosition = useMemo(() => {
  const direction = new ThreeVector3(0, 1, 0).applyQuaternion(quaternion);
  const offset = direction.multiplyScalar(mmToUnits(lumber.length) / 2);
  return position.clone().add(offset);
}, [position, quaternion, lumber.length]);
```

### React.memoでコンポーネントをメモ化

```typescript
export const Lumber = memo(({ lumber }: LumberProps) => {
  // lumber が変わらなければ再レンダリングしない
});
```

### 不要な state 更新を避ける

```typescript
// 悪い例: 毎フレーム更新
useFrame(() => {
  setPosition(mesh.position); // 毎フレーム再レンダリング → NG
});

// 良い例: 必要な時のみ更新
const handleDragEnd = () => {
  setPosition(mesh.position); // ドラッグ終了時のみ → OK
};
```

## アイコンとUIコンポーネント

### SVGアイコンコンポーネントパターン

**決定**: 統一されたIconコンポーネントで全アイコンを管理

**実装**:
```typescript
// components/Icon.tsx
interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export const Icon = ({ name, size = 24, className = '' }: IconProps) => {
  // アイコン名に応じたSVGパスを返す
  const getIconPath = (name: string) => {
    switch (name) {
      case 'undo':
        return 'M12.5 8c-2.65...';
      case 'redo':
        return 'M18.4 10...';
      // ...
    }
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d={getIconPath(name)} />
    </svg>
  );
};
```

**利点**:
- アイコンの一元管理
- サイズとスタイルの統一
- SVGなので拡大縮小しても高品質
- Tailwind CSSのクラスで簡単にスタイリング可能

**使用例**:
```typescript
<button onClick={undo}>
  <Icon name="undo" size={20} className="text-white" />
</button>
```

### Tailwind CSSのユーティリティクラス活用

**パターン**: コンポーネントごとにスタイルを分離せず、ユーティリティクラスで構築

**実装例**:
```typescript
// ツールバーボタン
<button className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
  <Icon name="add" />
</button>

// 選択状態の視覚的フィードバック
<mesh>
  <meshStandardMaterial
    color={isSelected ? "#4a9eff" : "#8b4513"}
  />
</mesh>
```

**利点**:
- CSS-in-JSを使わずに済む
- クラス名の衝突がない
- レスポンシブ対応が簡単（`md:`, `lg:` など）
- ダークモード対応が容易（`dark:` プレフィックス）

### 状態に応じたスタイリングパターン

```typescript
// ホバー、アクティブ、選択状態の管理
const [isHovered, setIsHovered] = useState(false);

<mesh
  onPointerOver={() => setIsHovered(true)}
  onPointerOut={() => setIsHovered(false)}
>
  <meshStandardMaterial
    color={
      isSelected ? "#4a9eff" :  // 選択時: 青
      isHovered ? "#a0522d" :   // ホバー時: 明るい茶
      "#8b4513"                 // 通常時: 茶色
    }
  />
</mesh>
```

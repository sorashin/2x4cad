# 改善履歴

## 2024-11-18: History Patternの導入によるUNDO/REDO実装

**問題**:
- 最初のプロトタイプにはUNDO/REDO機能がなかった
- CADアプリケーションでは操作の取り消しは必須機能
- 単純なstate履歴では複雑な操作（複数角材の同時移動など）に対応できない

**試行錯誤**:
- ❌ Zustandの状態全体をスナップショットで保存 → メモリ消費が激しい
- ❌ 各操作で差分だけを記録 → 複雑な操作の復元が困難
- ✅ History Patternで各操作をクラス化 → 完璧に動作

**最終解決策**:
1. **HistoryBase インターフェース**: `undo()`と`redo()`のみを定義
2. **具体的なHistoryクラス**: 各操作ごとに実装
   - `AddLumberHistory`: 角材の追加/削除
   - `UpdateLumberHistory`: 角材の変更（位置/回転/長さ）
   - `NestedHistory`: 複数の操作をグループ化

```typescript
// Before: UNDO/REDO機能なし
const updateLumber = (id, updates) => {
  store.updateLumber(id, updates);
  // 履歴管理なし
};

// After: History Patternで完全なUNDO/REDO
const history = new UpdateLumberHistory(
  lumberId,
  prevState,
  nextState
);
push(history); // 履歴に記録
```

**結果**:
- 完全なUNDO/REDO機能が実装された
- 新しい操作を追加する際はHistoryBaseを実装するだけ
- NestedHistoryで複合操作も簡単に実装可能
- コードの可読性・保守性が大幅に向上

**教訓**:
- 操作と履歴管理は明確に分離すべき
- インターフェースベースの設計は拡張性が高い
- このパターンはCADアプリケーションに非常に有効

---

## 2024-11-18: mm単位とThree.js単位の分離

**問題**:
- Three.jsで実寸（mm）を扱うと数値が大きくなりすぎる
- カメラやグリッドのスケール感が掴みにくい
- 浮動小数点の精度問題が発生しやすい

**試行錯誤**:
- ❌ すべてmm単位で統一 → Three.jsのシーンが巨大になりすぎる
- ❌ すべてcm単位で統一 → 建築図面との整合性が取れない
- ✅ 内部はmm、Three.jsは100mm=1単位で変換 → 両方のメリットを享受

**最終解決策**:
```typescript
// constants.ts
export const MM_TO_UNITS = 0.01;
export const mmToUnits = (mm: number) => mm * MM_TO_UNITS;
export const unitsToMm = (units: number) => units / MM_TO_UNITS;

// Lumberデータ: mm単位で保存
const lumber = {
  position: { x: 0, y: 0, z: 0 },
  length: 1000,  // mm
};

// Three.jsレンダリング時: 変換
<mesh position={[
  mmToUnits(lumber.position.x),
  mmToUnits(lumber.position.y),
  mmToUnits(lumber.position.z)
]} />
```

**結果**:
- グリッド1マス = 10cm で直感的
- 建築図面と同じmm単位でデータ管理
- 変換関数で明示的に変換するため、バグが入りにくい

**教訓**:
- ドメインモデルと表示層で単位を分離するのは良い設計
- 変換関数を定義することで、単位の混在を防げる

---

## 2024-11-18: TransformControlsの導入による直感的な操作

**問題**:
- 最初のプロトタイプでは角材を選択しても移動や回転ができなかった
- 3DCADとして使うには直感的な操作が必須

**試行錯誤**:
- ❌ ドラッグイベントを自前で実装 → ギズモの描画が大変
- ❌ 既存のライブラリを探したが適切なものが見つからない
- ✅ @react-three/dreiのTransformControlsを使用 → 完璧に動作

**最終解決策**:
```typescript
import { TransformControls } from '@react-three/drei';

<TransformControls
  object={meshRef.current}
  mode={mode}  // 'translate' | 'rotate' | 'scale'
  onMouseDown={handleDragStart}
  onMouseUp={handleDragEnd}
/>
```

**結果**:
- Blenderライクな直感的な操作を実現
- T/R/Eキーでモード切り替え
- ドラッグ開始〜終了を1つの操作としてUNDO/REDO対応

**教訓**:
- 車輪の再発明をしない
- @react-three/dreiには便利なヘルパーが豊富

---

## 2024-11-18: 角材の表現方法の決定（始点 + 長さ + Quaternion）

**問題**:
- 角材をどのように表現するか（始点・終点 vs 中心・方向 vs 始点・長さ・回転）

**試行錯誤**:
- ❌ 始点・終点の2点表現 → 回転の自由度（ロール）が表現できない
- ❌ 中心・方向・長さ → 始点位置の計算が面倒
- ✅ 始点・長さ・Quaternion → すべてを表現でき、TransformControlsと相性が良い

**最終解決策**:
```typescript
interface Lumber {
  position: Vector3;      // 始点座標（mm）
  length: number;         // 長さ（mm）
  rotation: Quaternion;   // 回転（デフォルトY軸からの回転）
}
```

**結果**:
- 任意の3D回転を正確に表現できる
- TransformControlsで直接回転を操作可能
- スケール操作がlengthの変更で済む

**教訓**:
- データ構造はUIの操作性に大きく影響する
- Quaternionは3D回転の標準的な表現

---

## 2024-11-18: NestedHistoryによる複合操作のサポート

**背景**:
- 複数の角材を一度に移動する場合、1回のUNDOで全部戻したい
- グループ操作を1つの履歴として扱う必要がある

**実装**:
```typescript
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

**結果**:
- 複数の操作を1つのUNDO/REDOユニットとして扱える
- コピー&ペーストなどの複合操作も簡単に実装可能

**教訓**:
- Composite Patternは階層的な操作に有効
- Historyの設計が良いと、拡張が簡単

---

## 2024-11-18: 選択状態の管理（Set型の採用）

**問題**:
- 複数選択に対応する必要がある
- 選択中の角材を効率的に管理したい

**試行錯誤**:
- ❌ 配列で管理 → 重複チェックや削除が非効率
- ✅ Set型で管理 → add/delete/hasが高速

**最終解決策**:
```typescript
interface LumberStoreState {
  selectedIds: Set<string>;

  selectLumber: (id: string, multi?: boolean) => void;
  deselectAll: () => void;
}
```

**結果**:
- 選択状態の管理が高速かつシンプルに
- Shift+クリックで複数選択が簡単に実装できた

**教訓**:
- データ構造の選択は重要
- Set型は一意性が必要な場合に最適

---

## 2024-11-18: Tailwind CSS導入とアイコンシステムの実装

**問題**:
- 最初のプロトタイプではスタイリングが最小限だった
- UIの視覚的フィードバックが不足していた
- アイコンが統一されていなかった

**試行錯誤**:
- ❌ インラインスタイルで記述 → コードが読みにくく、保守が困難
- ❌ CSS Modulesの検討 → Three.jsとの統合が煩雑
- ✅ Tailwind CSS + SVGアイコンコンポーネント → 高速で直感的

**最終解決策**:
```typescript
// 1. Tailwind CSSのセットアップ
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};

// 2. Iconコンポーネントの実装
export const Icon = ({ name, size = 24, className = '' }: IconProps) => {
  const icons = {
    undo: 'M12.5 8c-2.65 0-5.05...',
    redo: 'M18.4 10.6C16.55...',
    delete: 'M6 19c0 1.1.9...',
    // ...
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d={icons[name]} fill="currentColor" />
    </svg>
  );
};

// 3. ツールバーUIの実装
<div className="fixed top-0 left-0 right-0 p-4 bg-gray-800/90 backdrop-blur">
  <button
    onClick={undo}
    disabled={!canUndo}
    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
  >
    <Icon name="undo" size={20} className="text-white" />
  </button>
</div>
```

**結果**:
- 統一された視覚的UIが実現
- ホバー効果やdisabled状態が明確に
- アイコンの追加が簡単になった
- コードの可読性が向上

**教訓**:
- Tailwind CSSはプロトタイプから本番まで使える
- ユーティリティクラスは保守性が高い
- SVGアイコンはコンポーネント化すると管理が楽

---

## 2024-11-18: Vite設定の最適化（React Fast Refresh対応）

**問題**:
- Vite開発サーバーで型エラーが発生していた
- React Fast Refreshが動作しなかった

**原因**:
- `@vitejs/plugin-react`が正しく設定されていなかった
- tsconfig.jsonの設定が不適切だった

**最終解決策**:
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
});
```

**結果**:
- React Fast Refreshが正常に動作
- 開発体験が大幅に向上
- 型エラーが解消

**教訓**:
- Viteプラグインの設定は重要
- 開発環境の整備は最初に行うべき

---

## 今後の改善予定

### 角材の削除機能

**目的**: 選択中の角材をDeleteキーで削除

**実装予定**:
- DeleteLumberHistory クラスの作成
- キーボードショートカット（Delete/Backspace）の実装
- 複数選択時の一括削除（NestedHistory使用）

### プロジェクトの保存・読み込み

**目的**: 設計データをJSON形式で保存/読み込み

**実装予定**:
```typescript
interface Project {
  version: string;
  lumbers: Record<string, Lumber>;
  metadata: {
    name: string;
    createdAt: number;
    updatedAt: number;
  };
}

// 保存
const saveProject = () => {
  const json = JSON.stringify(project);
  // LocalStorage or File Download
};

// 読み込み
const loadProject = (json: string) => {
  const project = JSON.parse(json);
  // Validation and restore
};
```

### 角材同士の接続情報の可視化

**目的**: どの角材が接続されているか視覚的に表示

**実装予定**:
- 接続点にマーカーを表示
- 接続線を描画
- 接続情報のパネル表示

### スナップ機能（グリッドスナップ）

**目的**: 角材をグリッドに吸着させて正確に配置

**実装予定**:
- TransformControls の translationSnap プロパティを使用
- グリッド単位（10cm）にスナップ

### 寸法線の表示

**目的**: 角材の長さや間隔を表示

**実装予定**:
- Three.jsのLine/Textを使って寸法線を描画
- 選択中の角材のみ表示

### カメラの視点切り替え

**目的**: 正面/側面/上面の視点に素早く切り替え

**実装予定**:
- 数字キー（1/2/3/7）で視点切り替え
- OrbitControlsのtargetとcamera.positionをアニメーション

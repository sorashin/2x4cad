# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

2x4材などの角材を使った構造物を3Dで設計できるCADアプリケーション。始点と終点を指定して角材を配置し、移動・回転・伸縮が可能。履歴機能(Undo/Redo)と面スナップ機能を実装。

## 技術スタック

- **フレームワーク**: React 19 + TypeScript + Vite
- **3Dレンダリング**: Three.js + React Three Fiber + drei
- **状態管理**: Zustand (複数ストア), XState (UI mode管理)
- **スタイリング**: Tailwind CSS v4
- **ID生成**: nanoid

## 開発コマンド

```bash
# 開発サーバー起動
pnpm run dev

# プロダクションビルド
pnpm run build

# リント実行
pnpm run lint

# ビルド結果のプレビュー
pnpm run preview
```

## 重要な設計原則

### 1. 単位の統一と変換

**アプリケーション全体で最も重要な概念**

- **アプリケーション内部**: すべての座標・長さは**mm単位**で管理
- **Three.jsシーン**: `100mm = 1 Three.js単位`で変換
- 変換関数: `mmToUnits()` / `unitsToMm()` ([constants.ts](src/constants.ts))
- データ永続化もmm単位（JSONエクスポート/インポート時に変換不要）

### 2. 二重の状態管理パターン

#### Zustand（データ状態管理）
- `useLumberStore`: 角材データのCRUD、選択状態、接続関係
- `useHistoryStore`: Undo/Redo履歴管理
- `useInteractionStore`: 一時的な配置データ（始点、マウス位置、スナップ情報）
- `useSettingsStore`: グリッドサイズ、スナップ閾値などの設定

#### XState（UI mode管理）
- `uiMachine`: UIの状態遷移のみを管理 ([machines/uiMachine.ts](src/machines/uiMachine.ts))
- モード: `idle` → `lumber_placing_start` → `lumber_placing_end` → `idle`
- データは一切持たず、モード遷移のみに集中
- Zustandとの役割分担: XStateは「今どのモードか」、Zustandは「データはどうなっているか」

### 3. History/Command パターンによるUndo/Redo

- `HistoryBase`: インターフェース（`undo()`と`redo()`のみ）
- `CommandBase`: 抽象クラス（`HistoryBase`を実装、`name`や`timestamp`を追加）
- 各操作（AddLumberCommand, DeleteLumberCommand, UpdateLumberHistory）を個別のクラスとして実装
- `NestedHistory`: 複数の履歴をまとめて一つの操作として扱う
- 履歴はZustandの`useHistoryStore`で管理

### 4. 角材の表現方法

```typescript
interface Lumber {
  position: Vector3;      // 始点座標（mm）
  length: number;         // 長さ（mm）
  rotation: Quaternion;   // 回転（クォータニオン）
  // ...
}
```

- 始点 + 長さ + Quaternion回転で表現
- Three.jsの`TransformControls`と相性が良い
- 任意の3D回転を正確に保存・復元可能

### 5. 面スナップ機能のアーキテクチャ

#### Phase 1: Surface Snap（始点配置時）
- 既存角材の面をホバー時に検出
- 面の種類（face/edge/end）と法線方向を取得
- クリックで始点を固定し、回転情報を`lockedFaceSnap`に保存
- [geometry.ts](src/utils/geometry.ts)の`getLumberFaces()`で6面を生成

#### Phase 2: Face Snap（終点配置時）
- プレビュー中の角材と既存角材の平行な面を検出
- 閾値内（デフォルト5mm）で最も近い面にスナップ
- スナップ中の面は`activeSnapFace`として保存、ハイライト表示

## プロジェクト構造

```
src/
├── types/
│   └── lumber.ts              # 型定義（Lumber, Vector3, Face等）
├── stores/
│   ├── lumber.ts              # 角材CRUD、選択、接続関係
│   ├── history.ts             # Undo/Redo履歴管理
│   ├── interaction.ts         # 配置中の一時データ
│   └── settings.ts            # グリッド、スナップ設定
├── machines/
│   └── uiMachine.ts           # XState UI mode管理
├── contexts/
│   └── UIMachineContext.tsx   # XState machineのReact context
├── histories/
│   ├── HistoryBase.ts         # 履歴インターフェース
│   ├── NestedHistory.ts       # 複数操作のグループ化
│   ├── AddLumberHistory.ts
│   └── UpdateLumberHistory.ts
├── commands/
│   ├── CommandBase.ts         # コマンド抽象クラス
│   ├── AddLumberCommand.ts
│   └── DeleteLumberCommand.ts
├── utils/
│   ├── geometry.ts            # 幾何計算（面生成、スナップ判定）
│   ├── project.ts             # JSON保存・読み込み
│   └── (その他ユーティリティ)
├── components/
│   ├── 3d/
│   │   ├── Scene.tsx          # R3F メインシーン
│   │   ├── Lumber.tsx         # 角材3Dコンポーネント
│   │   ├── PreviewLumber.tsx  # 配置中プレビュー
│   │   ├── HighlightedFace.tsx # スナップ面のハイライト
│   │   └── LumberTransformControls.tsx
│   └── ui/
│       ├── Toolbar.tsx
│       ├── CommandBar.tsx
│       ├── Hint.tsx
│       └── (その他UIコンポーネント)
├── hooks/
│   ├── useKeyboardShortcuts.ts
│   └── useUIMode.ts
├── constants.ts               # 単位変換関数、SCALE_FACTOR
├── App.tsx
└── main.tsx
```

## コーディング規約

### TypeScript型定義
- `LumberType`や`ConnectionType`は`as const`パターンを使用
- `interface`を優先（拡張可能性のため）
- Zustandストアの型は`create<StoreName>()`で明示的に指定

### コンポーネント
- 関数コンポーネントのみ使用
- パフォーマンス重視箇所は`React.memo`でメモ化
- React Three Fiberコンポーネントは`components/3d/`に配置

### 状態管理の使い分け
- **Zustand**: データの永続的な状態（角材、履歴、設定）
- **XState**: UIモードの遷移のみ（データを持たせない）
- **React state**: ローカルな一時的UI状態のみ

### ファイル命名
- コンポーネント: PascalCase (`Scene.tsx`, `Lumber.tsx`)
- ユーティリティ/ストア: camelCase (`lumber.ts`, `geometry.ts`)
- 定数ファイル: camelCase (`constants.ts`)

## キーボードショートカット

- `Cmd/Ctrl + Z`: Undo
- `Cmd/Ctrl + Shift + Z`: Redo
- `Escape`: キャンセル（配置中断、選択解除）
- `Shift + Click`: 複数選択（未実装）

## 詳細設計

より詳しい設計思想やアルゴリズムについては[DESIGN.md](DESIGN.md)を参照。

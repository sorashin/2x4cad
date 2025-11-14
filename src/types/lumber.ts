// 角材の種類
export enum LumberType {
  ONE_BY_FOUR = '1x4',    // 19x89mm
  TWO_BY_FOUR = '2x4',    // 38x89mm
  RAFTER = 'rafter'       // 30x30mm (垂木)
}

// 角材の寸法
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

// 3D座標
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// クォータニオン（回転）
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

// 接触情報
export interface ContactInfo {
  distance: number;
  contactPoint: Vector3;
  contactType: 'face-to-face' | 'edge-to-edge';
}

// 面（接触判定用）
export interface Face {
  center: Vector3;
  normal: Vector3;
  vertices: Vector3[];
}

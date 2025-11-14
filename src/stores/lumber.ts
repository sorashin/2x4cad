import { create } from 'zustand';
import type { Lumber, Vector3, Connection } from '../types/lumber';
import { LumberType } from '../types/lumber';
import { nanoid } from 'nanoid';

interface LumberStoreState {
  lumbers: Record<string, Lumber>;
  selectedIds: Set<string>;

  // CRUD操作
  addLumber: (type: LumberType, start: Vector3, end: Vector3) => string;
  updateLumber: (id: string, updates: Partial<Lumber>) => void;
  deleteLumber: (id: string) => void;
  restoreLumber: (lumber: Lumber) => void;

  // 選択状態
  selectLumber: (id: string, multi?: boolean) => void;
  deselectAll: () => void;

  // 接続関係の管理
  addConnection: (lumberId: string, connection: Connection) => void;
  removeConnection: (lumberId: string, targetId: string) => void;
  getConnectedLumbers: (id: string) => string[];
  getConnectedGroup: (id: string) => Set<string>;
}

export const useLumberStore = create<LumberStoreState>()((set, get) => ({
  lumbers: {},
  selectedIds: new Set<string>(),

  addLumber: (type: LumberType, start: Vector3, end: Vector3) => {
    const id = nanoid();

    // 始点から終点へのベクトルを計算
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // 方向ベクトルを正規化
    const dir = {
      x: dx / length,
      y: dy / length,
      z: dz / length,
    };

    // デフォルトのY軸方向（0, 1, 0）から、ベクトル方向への回転を計算
    // クォータニオンを計算（簡易版：Y軸からの回転）
    const up = { x: 0, y: 1, z: 0 };
    const rotation = calculateRotationQuaternion(up, dir);

    const lumber: Lumber = {
      id,
      type,
      position: start,
      length,
      rotation,
      connections: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => ({
      lumbers: { ...state.lumbers, [id]: lumber },
    }));

    return id;
  },

  updateLumber: (id: string, updates: Partial<Lumber>) => {
    set((state) => {
      const lumber = state.lumbers[id];
      if (!lumber) return state;

      return {
        lumbers: {
          ...state.lumbers,
          [id]: {
            ...lumber,
            ...updates,
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  deleteLumber: (id: string) => {
    set((state) => {
      const { [id]: deleted, ...rest } = state.lumbers;
      const newSelectedIds = new Set(state.selectedIds);
      newSelectedIds.delete(id);

      return {
        lumbers: rest,
        selectedIds: newSelectedIds,
      };
    });
  },

  restoreLumber: (lumber: Lumber) => {
    set((state) => ({
      lumbers: { ...state.lumbers, [lumber.id]: lumber },
    }));
  },

  selectLumber: (id: string, multi = false) => {
    set((state) => {
      const newSelectedIds = multi ? new Set(state.selectedIds) : new Set<string>();
      newSelectedIds.add(id);
      return { selectedIds: newSelectedIds };
    });
  },

  deselectAll: () => {
    set({ selectedIds: new Set<string>() });
  },

  addConnection: (lumberId: string, connection: Connection) => {
    set((state) => {
      const lumber = state.lumbers[lumberId];
      if (!lumber) return state;

      return {
        lumbers: {
          ...state.lumbers,
          [lumberId]: {
            ...lumber,
            connections: [...lumber.connections, connection],
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  removeConnection: (lumberId: string, targetId: string) => {
    set((state) => {
      const lumber = state.lumbers[lumberId];
      if (!lumber) return state;

      return {
        lumbers: {
          ...state.lumbers,
          [lumberId]: {
            ...lumber,
            connections: lumber.connections.filter(
              (c) => c.targetLumberId !== targetId
            ),
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  getConnectedLumbers: (id: string) => {
    const lumber = get().lumbers[id];
    if (!lumber) return [];
    return lumber.connections.map((c) => c.targetLumberId);
  },

  getConnectedGroup: (id: string) => {
    const visited = new Set<string>();
    const queue = [id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;

      visited.add(currentId);
      const connected = get().getConnectedLumbers(currentId);
      queue.push(...connected.filter((id) => !visited.has(id)));
    }

    return visited;
  },
}));

// ベクトル間の回転を表すクォータニオンを計算
function calculateRotationQuaternion(from: Vector3, to: Vector3): {
  x: number;
  y: number;
  z: number;
  w: number;
} {
  // 外積を計算（回転軸）
  const cross = {
    x: from.y * to.z - from.z * to.y,
    y: from.z * to.x - from.x * to.z,
    z: from.x * to.y - from.y * to.x,
  };

  // 内積を計算
  const dot = from.x * to.x + from.y * to.y + from.z * to.z;

  // クォータニオンを計算
  const w = 1 + dot;
  const norm = Math.sqrt(cross.x * cross.x + cross.y * cross.y + cross.z * cross.z + w * w);

  if (norm < 0.0001) {
    // ベクトルが正反対の場合
    return { x: 1, y: 0, z: 0, w: 0 };
  }

  return {
    x: cross.x / norm,
    y: cross.y / norm,
    z: cross.z / norm,
    w: w / norm,
  };
}

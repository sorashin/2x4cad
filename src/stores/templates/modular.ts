import { create } from 'zustand';
import type { GeometryIdentifier, NodeInterop } from 'nodi-modular';
import { Modular } from 'nodi-modular';
import { BufferGeometry } from 'three';
import { convertGeometryInterop } from '../../utils/geometryUtils';
import init from 'nodi-modular';
import raisedbed from '../../assets/graph/raisedbed.json';

// WebAssemblyの初期化状態をグローバルに管理
let initPromise: Promise<void> | null = null;
let isInitialized = false;

// ジオメトリ情報の型を定義
export interface GeometryWithId {
  id: GeometryIdentifier;
  geometry: BufferGeometry;
}

// Zustandストアの型定義
interface ModularState {
  modular: Modular | null;
  nodes: NodeInterop[];
  geometries: GeometryWithId[];
  inputNodeId: string;

  // アクション
  setModular: (modular: Modular) => void;
  setNodes: (nodes: NodeInterop[]) => void;
  setGeometries: (geometries: GeometryWithId[]) => void;
  setInputNodeId: (inputNodeId: string) => void;

  // 複雑な操作
  initializeModular: () => Promise<void>;
  loadGraph: (slug?: string) => Promise<void>;
  evaluateGraph: () => Promise<void>;
  updateNodeProperty: (id: string, value: number | string) => void;
}

// 必要に応じてグラフを動的にインポートする関数
const importGraph = async (slug: string) => {
  try {
    return await import(`../../assets/graph/${slug}.json`);
  } catch (error) {
    console.error(`Graph for ${slug} not found:`, error);
    // デフォルトのグラフを返す
    return raisedbed;
  }
};

// Zustandストアの作成
export const useModularStore = create<ModularState>((set, get) => ({
  modular: null,
  nodes: [],
  geometries: [],
  inputNodeId: '',

  setModular: (modular) => set({ modular }),
  setNodes: (nodes) => set({ nodes }),
  setGeometries: (geometries) => set({ geometries }),
  setInputNodeId: (inputNodeId) => set({ inputNodeId }),

  initializeModular: async () => {
    // 既に初期化済みの場合はスキップ
    if (isInitialized) {
      const { modular } = get();
      if (!modular) {
        set({ modular: Modular.new() });
      }
      return;
    }

    // 既に初期化中の場合は、そのPromiseを待つ
    if (initPromise) {
      await initPromise;
      const { modular } = get();
      if (!modular) {
        set({ modular: Modular.new() });
      }
      return;
    }

    // 初回初期化
    initPromise = (async () => {
      try {
        await init();
        isInitialized = true;
      } catch (error) {
        // エラーが発生した場合は、Promiseをリセットして再試行可能にする
        initPromise = null;
        isInitialized = false;
        throw error;
      }
    })();

    await initPromise;
    set({ modular: Modular.new() });
  },

  loadGraph: async (slug = 'raisedbed') => {
    const { modular, setNodes, setInputNodeId } = get();
    if (!modular) return;

    try {
      // slugに基づいてグラフを動的に読み込む
      const imported = await importGraph(slug);
      const graphData = imported.default;

      modular.loadGraph(JSON.stringify(graphData.graph));
      const nodes = modular.getNodes();
      setNodes(nodes);
      console.log('nodes:', nodes);

      // "input" ラベルを持つノードを検索
      const inputNode = nodes.find((node) => node.label === 'input');
      if (inputNode) {
        setInputNodeId(inputNode.id);
      }
    } catch (error) {
      console.error(`Error loading graph for ${slug}:`, error);
    }
  },

  evaluateGraph: async () => {
    const { modular, setGeometries } = get();
    if (!modular) return;

    try {
      const result = await modular.evaluate();
      const { geometryIdentifiers } = result;

      const gs = geometryIdentifiers!
        .map((id) => {
          const interop = modular.findGeometryInteropById(id);
          const { transform } = id;
          const geometry = interop ? convertGeometryInterop(interop, transform) : null;

          return geometry
            ? {
                id,
                geometry,
              }
            : null;
        })
        .filter((g): g is GeometryWithId => g !== null);

      setGeometries(gs);
    } catch (error) {
      console.error('Error evaluating graph:', error);
      setGeometries([]);
    }
  },

  updateNodeProperty: (id, value) => {
    const { modular, nodes } = get();
    if (!modular) {
      console.warn('modular is not initialized');
      return;
    }

    try {
      // ノードの存在を確認
      const targetNode = nodes.find((node) => node.id === id);
      if (!targetNode) {
        console.error(`Node with ID ${id} not found`);
        return;
      }

      const property =
        typeof value === 'string'
          ? {
              name: 'content',
              value: {
                type: 'String' as const,
                content: value,
              },
            }
          : {
              name: 'value',
              value: {
                type: 'Number' as const,
                content: value as number,
              },
            };

      console.log(`Updating node ${id} with property:`, property);
      modular.changeNodeProperty(id, property);
      get().evaluateGraph();
    } catch (error) {
      console.error(`Error in changeNodeProperty for node ${id}:`, error);
    }
  },
}));

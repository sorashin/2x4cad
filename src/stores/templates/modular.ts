import { create } from 'zustand';
import type { GeometryIdentifier, NodeInterop } from 'nodi-modular';
import { Modular } from 'nodi-modular';
import { BufferGeometry } from 'three';
import { convertGeometryInterop } from '../../utils/geometryUtils';
import init from 'nodi-modular';
import raisedbed from '../../assets/graph/raisedbed.json';
import type { LumberType } from '../../types/lumber';
import { getBoardNameFromGeometryId, getBoardTypeFromName } from '../../utils/boardUtils';
import { getGeometryBoundingBoxSize, inferBoardLength } from '../../hooks/useGeometryBoundingBox';
import { parseNodeOutputToNumberArray } from '../../utils/nodeOutputParser';

const LENGTH_LABEL_PREFIX = 'length_';

// WebAssemblyの初期化状態をグローバルに管理
let initPromise: Promise<void> | null = null;
let isInitialized = false;

// ジオメトリ情報の型を定義
export interface GeometryWithId {
  id: GeometryIdentifier;
  geometry: BufferGeometry;
}
export interface BoardGeometryWithId {
  id: GeometryIdentifier;
  geometry: BufferGeometry;
  boardType: LumberType;
  boardName: string;
  boardLength: number;
}

// Zustandストアの型定義
interface ModularState {
  modular: Modular | null;
  nodes: NodeInterop[];
  geometries: GeometryWithId[];
  boardGeometries: BoardGeometryWithId[];
  inputNodeId: string;

  // アクション
  setModular: (modular: Modular) => void;
  setNodes: (nodes: NodeInterop[]) => void;
  setGeometries: (geometries: GeometryWithId[]) => void;
  setBoardGeometries: (boardGeometries: BoardGeometryWithId[]) => void;
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
  boardGeometries: [],
  inputNodeId: '',

  setModular: (modular) => set({ modular }),
  setNodes: (nodes) => set({ nodes }),
  setGeometries: (geometries) => set({ geometries }),
  setBoardGeometries: (boardGeometries) => set({ boardGeometries }),
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
    const { modular, nodes, setGeometries, setBoardGeometries } = get();
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

      // 各boardNameに対応する長さの候補を取得するためのマップを作成
      const lengthCandidatesMap = new Map<string, number[]>();
      for (const node of nodes) {
        if (node.label?.startsWith(LENGTH_LABEL_PREFIX)) {
          const boardName = node.label.slice(LENGTH_LABEL_PREFIX.length);
          const output = modular.getNodeOutput(node.id);
          const lengths = parseNodeOutputToNumberArray(output);
          if (lengths.length > 0) {
            lengthCandidatesMap.set(boardName, lengths);
          }
        }
      }

      // boardGeometriesを生成
      const boardGs = gs.map((g) => {
        const boardName = getBoardNameFromGeometryId(g.id, nodes);
        const boardType = boardName ? getBoardTypeFromName(boardName) : undefined;

        // boardTypeが見つからない場合はデフォルト値を使用
        const effectiveBoardType = boardType ?? ('1x4' as LumberType);
        const bboxSize = getGeometryBoundingBoxSize(g.geometry);

        // 対応する長さの候補配列を取得
        const candidateLengths = boardName ? lengthCandidatesMap.get(boardName) : undefined;
        const boardLength = inferBoardLength(bboxSize, effectiveBoardType, candidateLengths);

        return {
          ...g,
          boardName: boardName ?? '',
          boardType: effectiveBoardType,
          boardLength,
        };
      });
      setBoardGeometries(boardGs);
    } catch (error) {
      console.error('Error evaluating graph:', error);
      setGeometries([]);
      setBoardGeometries([]);
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

      modular.changeNodeProperty(id, property);
      get().evaluateGraph();
    } catch (error) {
      console.error(`Error in changeNodeProperty for node ${id}:`, error);
    }
  },
}));

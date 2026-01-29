import { useMemo } from 'react';
import { useModularStore } from '../stores/templates/modular';
import { parseNodeOutputToNumberArray } from '../utils/nodeOutputParser';

/**
 * 指定したラベル名のノード出力を数値配列で取得する汎用hooks
 * 
 * グラフ内の各ノードのlabelプロパティと一致するノードを検索し、
 * その出力を数値配列として取得する。
 * 
 * 使用例:
 * ```typescript
 * const outputs = useNodeOutputsByLabels(['sideBoard', 'bottomBoard']);
 * // => { sideBoard: [680, 680, 1200, 1200, ...], bottomBoard: [89, 38] }
 * ```
 * 
 * @param labels - 取得したいノードのラベル名配列（読み取り専用推奨）
 * @returns 各ラベルに対応する数値配列のRecord（見つからない場合は未定義）
 */
export function useNodeOutputsByLabels<T extends string>(
  labels: readonly T[]
): Partial<Record<T, number[]>> {
  const { modular, nodes, geometries } = useModularStore();

  return useMemo(() => {
    if (!modular) return {};

    const result: Partial<Record<T, number[]>> = {};

    for (const label of labels) {
      // 同一ラベルのノードが複数ある場合、出力が非空のものを採用する（例: post が2つあるとき Flatten Tree 側を取る）
      const candidates = nodes.filter((n) => n.label === label);
      let arr: number[] = [];
      for (const node of candidates) {
        const output = modular.getNodeOutput(node.id);
        arr = parseNodeOutputToNumberArray(output);
        if (arr.length > 0) break;
      }
      if (arr.length > 0) {
        result[label] = arr;
      }
    }

    return result;
    // geometries が変わる = evaluateGraph 完了 → getNodeOutput が最新評価結果を返すため再計算する
    // eslint-disable-next-line -- 意図的な依存（評価完了のトリガー）
  }, [modular, nodes, labels, geometries]);
}

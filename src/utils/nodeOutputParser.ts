import type { NodeOutput } from 'nodi-modular';

/**
 * Map構造から数値配列を抽出するヘルパー関数
 * 
 * キーの末尾の数値でソートし、各エントリの value 配列から .data を取得する。
 */
function extractNumbersFromMap(mapData: Map<unknown, unknown>): number[] {
  const entries = Array.from(mapData.entries());
  entries.sort((a, b) => {
    const aKey = typeof a[0] === "string" ? a[0] : "";
    const bKey = typeof b[0] === "string" ? b[0] : "";
    const aIndex = Number(aKey.split(";").at(-1) ?? 0);
    const bIndex = Number(bKey.split(";").at(-1) ?? 0);
    return aIndex - bIndex;
  });
  // value 配列の全要素から .data を取得（例: [{data:89},{data:19}] → [89,19]）
  return entries.flatMap(([, value]) => {
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === 'object' && item !== null && 'data' in item) {
            const data = (item as { data?: unknown }).data;
            return typeof data === 'number' ? data : null;
          }
          return null;
        })
        .filter((v): v is number => v !== null);
    }
    return [];
  });
}

/**
 * NodeOutputから数値配列を抽出する
 * 
 * nodi-modularのgetNodeOutput()が返すNodeOutput型（Map構造）から、
 * 数値データの配列を抽出する。
 * 
 * @param output - ノードの出力（NodeOutput型）
 * @returns 抽出された数値配列
 */
export function parseNodeOutputToNumberArray(output: NodeOutput | undefined): number[] {
  if (!output || !Array.isArray(output)) return [];

  const collected: number[] = [];
  for (let i = 0; i < output.length; i++) {
    const el = output[i];
    if (el instanceof Map) {
      collected.push(...extractNumbersFromMap(el as Map<unknown, unknown>));
    } else if (el != null && typeof (el as Map<unknown, unknown>).entries === 'function') {
      // WASM等でinstanceof Mapがfalseでもentries()があればMap扱い
      collected.push(...extractNumbersFromMap(el as Map<unknown, unknown>));
    }
  }
  return collected;
}



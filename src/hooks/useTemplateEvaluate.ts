import { useEffect, useRef } from 'react';
import { useModularStore } from '../stores/templates/modular';

interface UseTemplateEvaluateOptions<TSource> {
  /** テンプレート用のパラメータストア */
  store: TSource;
  /** ストアをグラフ入力用JSON文字列に変換する関数（テンプレートごとに形式が異なる） */
  serialize: (store: TSource) => string;
  /** グラフのinputノードのID（未設定時はスキップ） */
  inputNodeId: string | undefined;
}

/**
 * テンプレートストアの変更を監視し、自動的にnodi-modularのグラフを評価する。
 * serializeでテンプレート依存のJSON形式に変換するため、hook自体はテンプレート非依存。
 * debounce処理により連続変更時のパフォーマンスを最適化。
 */
export const useTemplateEvaluate = <TSource>({
  store,
  serialize,
  inputNodeId,
}: UseTemplateEvaluateOptions<TSource>) => {
  const { updateNodeProperty } = useModularStore();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);
  const prevSerializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!inputNodeId) {
      return;
    }

    const serialized = serialize(store);

    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      prevSerializedRef.current = serialized;
      return;
    }

    if (prevSerializedRef.current === serialized) {
      return;
    }
    prevSerializedRef.current = serialized;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        updateNodeProperty(inputNodeId, serialized);
      } catch (error) {
        console.error('Error in useTemplateEvaluate:', error);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [store, serialize, inputNodeId, updateNodeProperty]);
};

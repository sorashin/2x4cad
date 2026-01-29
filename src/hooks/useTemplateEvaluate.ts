import { useEffect, useRef } from 'react';
import { useModularStore } from '../stores/modular';

interface UseTemplateEvaluateOptions {
  store: any; // パラメータストア
  storeKey: string; // JSONキー名（例: 'raisedBedStore'）
  inputNodeId: string | undefined; // グラフのinput nodeのID
}

/**
 * テンプレートストアの変更を監視し、自動的にnodi-modularのグラフを評価する
 * debounce処理により連続変更時のパフォーマンスを最適化
 */
export const useTemplateEvaluate = ({ store, storeKey, inputNodeId }: UseTemplateEvaluateOptions) => {
  const { updateNodeProperty } = useModularStore();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    // 初回マウント時はスキップ（TemplatesPageのloadGraph時に評価されるため）
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // inputNodeIdがない場合はスキップ
    if (!inputNodeId) {
      return;
    }

    // 既存のタイマーをクリア
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // debounce処理: 300ms待ってからupdateNodePropertyを実行
    debounceTimerRef.current = setTimeout(() => {
      try {
        const json = JSON.stringify({ [storeKey]: store });
        updateNodeProperty(inputNodeId, json);
      } catch (error) {
        console.error('Error in useTemplateEvaluate:', error);
      }
    }, 300);

    // クリーンアップ
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [store, inputNodeId, storeKey, updateNodeProperty]);
};

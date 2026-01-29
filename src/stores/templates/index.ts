import { useRaisedBedStore } from './raisedBed';

// テンプレート名とストアフックのマッピング
export const TEMPLATE_STORES: Record<string, () => any> = {
  raisedbed: useRaisedBedStore,
  // 将来追加: deck: useDeckStore, など
};

// テンプレート名とJSONキー名のマッピング
export const STORE_KEYS: Record<string, string> = {
  raisedbed: 'raisedBedStore',
  // 将来追加: deck: 'deckStore', など
};

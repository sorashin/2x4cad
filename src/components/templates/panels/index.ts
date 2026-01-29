import { RaisedBedPanel } from './RaisedBedPanel';

// テンプレート名とパネルコンポーネントのマッピング
export const TEMPLATE_PANELS: Record<string, React.ComponentType> = {
  raisedbed: RaisedBedPanel,
  // 将来追加: deck: DeckPanel, など
};

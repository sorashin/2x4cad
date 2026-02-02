import { useEffect } from 'react';
import { useModularStore } from '../../../stores/templates/modular';
import { useTemplateEvaluate } from '../../../hooks/useTemplateEvaluate';
import { useRaisedBedStore } from '../../../stores/templates/raisedBed';
import { DialogDimensions } from '../../../components/templates/DialogDimensions';
import { useUIStore } from '../../../stores/templates/ui';
import { TemplateLayout } from '../../../components/templates/TemplateLayout';
import { TEMPLATE_PANELS } from '../../../components/templates/panels';

const templateName = 'raisedbed';

/** RaisedBedストアをグラフ入力用JSON文字列に変換（グラフは sideBoard/bottomBoard 等のプロパティを期待） */
function serializeRaisedBedStore(store: ReturnType<typeof useRaisedBedStore.getState>) {
  const { width, height, depth, boards } = store;
  const boardsObj: Record<string, [number, number]> = {};
  for (const board of boards) {
    boardsObj[board.name] = board.size;
  }
  return JSON.stringify({ raisedBedStore: { width, height, depth, ...boardsObj } });
}

export function RaisedBedPage() {
  const { initializeModular, loadGraph, evaluateGraph, inputNodeId } = useModularStore();
  const templateStore = useRaisedBedStore();
  const { closeDialog, dialog } = useUIStore();
  const TemplatePanel = TEMPLATE_PANELS[templateName];

  useEffect(() => {
    const init = async () => {
      try {
        await initializeModular();
        await loadGraph(templateName);
        await evaluateGraph();
      } catch (error) {
        console.error('Error initializing templates page:', error);
      }
    };
    init();
  }, [initializeModular, loadGraph, evaluateGraph]);

  useTemplateEvaluate({
    store: templateStore,
    serialize: serializeRaisedBedStore,
    inputNodeId,
  });

  return (
    <>
      <TemplateLayout left={<TemplatePanel />} />
      <DialogDimensions
        isOpen={dialog.isOpen && dialog.type === 'dimensions'}
        onClose={closeDialog}
      />
    </>
  );
}

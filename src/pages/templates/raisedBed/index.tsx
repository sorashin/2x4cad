import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useModularStore } from '../../../stores/templates/modular';
import { useTemplateEvaluate } from '../../../hooks/useTemplateEvaluate';
import { TemplatesCanvas } from '../../../components/templates/TemplatesCanvas';
import { TEMPLATE_PANELS } from '../../../components/templates/panels';
import { useRaisedBedStore } from '../../../stores/templates/raisedBed';
import { DialogDimensions } from '../../../components/templates/DialogDimensions';
import { useUIStore } from '../../../stores/templates/ui';

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

  const TemplatePanel = TEMPLATE_PANELS[templateName];
  const templateStore = useRaisedBedStore();
  const { closeDialog, dialog } = useUIStore();

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
    <div className="w-screen h-screen relative text-content-h-a">
      <Link
        to="/"
        className="absolute left-4 bottom-4 z-10"
      >
        ← エディタに戻る
      </Link>
      <TemplatesCanvas />
      <TemplatePanel />
      <DialogDimensions
          isOpen={dialog.isOpen && dialog.type === 'dimensions'}
          onClose={closeDialog}
        />  
    </div>
  );
}

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
const storeKey = 'raisedBedStore';

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
    storeKey,
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

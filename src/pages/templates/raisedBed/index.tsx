import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useModularStore } from '../../../stores/templates/modular';
import { useTemplateEvaluate } from '../../../hooks/useTemplateEvaluate';
import { TemplatesCanvas } from '../../../components/templates/TemplatesCanvas';
import { TEMPLATE_PANELS } from '../../../components/templates/panels';
import { useRaisedBedStore } from '../../../stores/templates/raisedBed';

const templateName = 'raisedbed';
const storeKey = 'raisedBedStore';

export function RaisedBedPage() {
  const { initializeModular, loadGraph, evaluateGraph, inputNodeId } = useModularStore();

  const TemplatePanel = TEMPLATE_PANELS[templateName];
  const templateStore = useRaisedBedStore();

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
    <div className="w-screen h-screen relative">
      <Link
        to="/"
        className="absolute left-4 top-4 bg-white/90 px-4 py-2 rounded-lg shadow-lg hover:bg-white z-10 text-content-h-a"
      >
        ← エディタに戻る
      </Link>
      <TemplatesCanvas />
      <TemplatePanel />
    </div>
  );
}

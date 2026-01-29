import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useModularStore } from '../../../stores/modular';
import { useTemplateEvaluate } from '../../../hooks/useTemplateEvaluate';
import { TemplatesCanvas } from '../../../components/templates/TemplatesCanvas';
import { TEMPLATE_PANELS } from '../../../components/templates/panels';
import { TEMPLATE_STORES, STORE_KEYS } from '../../../stores/templates';

const templateName = 'raisedbed';

export function RaisedBedPage() {
  const { initializeModular, loadGraph, evaluateGraph, inputNodeId } = useModularStore();

  const useTemplateStore = TEMPLATE_STORES[templateName];
  const TemplatePanel = TEMPLATE_PANELS[templateName];
  const storeKey = STORE_KEYS[templateName];
  const templateStore = useTemplateStore ? useTemplateStore() : null;

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

      <div className="absolute left-1/2 transform -translate-x-1/2 top-4 bg-white/90 px-6 py-2 rounded-lg shadow-lg z-10">
        <h1 className="text-xl font-bold">テンプレート: {templateName}</h1>
      </div>

      <TemplatesCanvas />
      <TemplatePanel />
    </div>
  );
}

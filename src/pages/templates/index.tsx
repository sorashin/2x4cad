import type { ComponentType } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RaisedBedPage } from './raisedBed';


const TEMPLATE_PAGES: Record<string, ComponentType> = {
  raisedbed: RaisedBedPage,
  
};

export function TemplatesPage() {
  const { graphName } = useParams<{ graphName: string }>();
  const PageComponent = graphName ? TEMPLATE_PAGES[graphName] : null;

  if (!PageComponent) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">テンプレートが見つかりません</h1>
          <p className="mb-4">テンプレート「{graphName}」は存在しません。</p>
          <Link to="/" className="text-blue-500 hover:underline">
            ← エディタに戻る
          </Link>
        </div>
      </div>
    );
  }

  return <PageComponent />;
}

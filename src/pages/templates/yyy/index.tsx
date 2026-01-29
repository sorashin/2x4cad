import { Link } from 'react-router-dom';

export function YyyPage() {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">テンプレート: yyy</h1>
        <p className="mb-4">このテンプレートは準備中です。</p>
        <Link to="/" className="text-blue-500 hover:underline">
          ← エディタに戻る
        </Link>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useUIStore } from '../../stores/templates/ui';
import { TemplatesCanvas } from './TemplatesCanvas';

interface TemplateLayoutProps {
  left: ReactNode;
}

export function TemplateLayout({ left }: TemplateLayoutProps) {
  const { leftMenuWidth, setLeftMenuWidth } = useUIStore();
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    // モバイルではリサイズ機能を無効化
    if (window.innerWidth < 768) return;

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      // 最小240px、最大はコンテナ幅の50%まで
      const maxWidth = containerRect.width * 0.5;
      if (newWidth >= 240 && newWidth <= maxWidth) {
        setLeftMenuWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, setLeftMenuWidth]);

  return (
    <div className="relative h-screen w-screen">
      {/* Mobile: 縦方向レイアウト（left: 上64px固定、right: 残り） */}
      <div className="md:hidden flex flex-col h-full w-full">
        {/* Left Panel - 上に64px固定 */}
        <div className="h-14 overflow-y-auto bg-surface-base p-2">
          {left}
        </div>

        {/* Right Panel - 残りのスペース */}
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0">
            <TemplatesCanvas />
            <Link
              to="/"
              className="absolute left-4 bottom-4 z-10 text-content-h-a"
            >
              ← エディタに戻る
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop: 横方向ResizableLayout */}
      <div ref={containerRef} className="hidden md:flex h-full w-full relative">
        {/* Left Panel */}
        <div
          className="h-full w-full overflow-y-auto bg-white"
          style={{
            width: `${leftMenuWidth}px`,
            minWidth: '240px',
          }}>
          {left}
        </div>

        {/* Resize Handle */}
        <div
          className={`bg-white hover:bg-sub-blue w-1 cursor-col-resize transition-all`}
          onMouseDown={handleMouseDown}
          style={{ userSelect: 'none' }}
        />

        {/* Right Panel */}
        <div className="flex-1 h-full overflow-hidden relative">
          <div className="absolute inset-0">
            <TemplatesCanvas />
            <Link
              to="/"
              className="absolute left-4 bottom-4 z-10 text-content-h-a"
            >
              ← エディタに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

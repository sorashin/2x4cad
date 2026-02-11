import { useMemo } from 'react';
import { Dialog } from '../ui/Dialog';
import { useModularStore } from '../../stores/templates/modular';
import { BoardRectangle } from './BoardRectangle';
import { exportPartsToPdf, type BoardPart } from '../../utils/pdfExport';
import { LUMBER_DIMENSIONS } from '../../types/lumber';
import type { BoardGeometryWithId } from '../../stores/templates/modular';

interface DialogDimensionsProps {
  isOpen: boolean;
  onClose: () => void;
}

/** boardGeometries を boardName でグループ化した Record */
function groupBoardGeometriesByBoardName(
  boardGeometries: BoardGeometryWithId[]
): Record<string, BoardGeometryWithId[]> {
  const grouped: Record<string, BoardGeometryWithId[]> = {};
  for (const g of boardGeometries) {
    const name = g.boardName || '(unknown)';
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(g);
  }
  return grouped;
}

/** boardType から断面の高さ（表示用）を取得 */
function getBoardCrossSectionHeight(boardType: BoardGeometryWithId['boardType']): number {
  const dims = LUMBER_DIMENSIONS[boardType];
  return dims ? Math.max(dims.width, dims.height) : 0;
}

export function DialogDimensions({ isOpen, onClose }: DialogDimensionsProps) {
  const boardGeometries = useModularStore((s) => s.boardGeometries);

  const boardGroups = useMemo(
    () => groupBoardGeometriesByBoardName(boardGeometries),
    [boardGeometries]
  );

  const getAllParts = (): BoardPart[] => {
    const parts: BoardPart[] = [];
    for (const [label, items] of Object.entries(boardGroups)) {
      const height = items[0] ? getBoardCrossSectionHeight(items[0].boardType) : 0;
      for (const g of items) {
        parts.push({ label, width: g.boardLength, height });
      }
    }
    return parts;
  };

  const handleExportPdf = async () => {
    const parts = getAllParts();
    await exportPartsToPdf(parts);
  };

  const totalParts = boardGeometries.length;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-h-[85vh] overflow-hidden flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-content-xl bg-content-xxl shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg uppercase text-content-h text-balance">
              Parts List
            </h2>
            <p className="font-display text-overline text-content-m-a mt-0.5">
              <span className="tabular-nums">{totalParts}</span> parts total
            </p>
          </div>
          <button
            onClick={handleExportPdf}
            className="h-9 px-4 font-display text-xs uppercase bg-wood-m text-white rounded hover:bg-wood-h focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wood-h"
            aria-label="Export parts list to PDF"
          >
            Export PDF
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-8">
          {Object.entries(boardGroups).map(([boardName, items]) => {
            if (items.length === 0) return null;
            const crossSectionHeight = getBoardCrossSectionHeight(items[0].boardType);

            return (
              <section key={boardName}>
                {/* Section header */}
                <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-content-xl">
                  <h3 className="font-display text-sm uppercase text-content-m text-balance">
                    {boardName}
                  </h3>
                  <span className="font-display text-xs tabular-nums text-content-h">
                    {items.length}
                    <span className="text-content-m-a ml-1">pcs</span>
                  </span>
                </div>

                {/* Board grid: 板の長さを矩形で表示 */}
                <div className="flex flex-wrap gap-3">
                  {items.map((g, index) => (
                    <BoardRectangle
                      key={`${boardName}-${index}`}
                      width={g.boardLength}
                      height={crossSectionHeight}
                      maxWidth={120}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-content-xl bg-content-xxl shrink-0">
        <button
          onClick={onClose}
          className="w-full h-10 font-display text-sm uppercase bg-content-xl text-content-h rounded hover:bg-content-l focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-content-m"
        >
          Close
        </button>
      </footer>
    </Dialog>
  );
}

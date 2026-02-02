import { Dialog } from '../ui/Dialog';
import { useRaisedBedStore, getBoardLabels } from '../../stores/templates/raisedBed';
import { useNodeOutputsByLabels } from '../../hooks/useNodeOutputsByLabels';
import { BoardRectangle } from './BoardRectangle';
import { exportPartsToPdf, type BoardPart } from '../../utils/pdfExport';

interface DialogDimensionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DialogDimensions({ isOpen, onClose }: DialogDimensionsProps) {
  const { boards } = useRaisedBedStore();
  const boardLabels = getBoardLabels();
  const boardOutputs = useNodeOutputsByLabels(boardLabels);

  const getBoardHeight = (label: string): number => {
    const board = boards.find((b) => b.name === label);
    if (!board) return 0;
    return Math.max(board.size[0], board.size[1]);
  };

  const getAllParts = (): BoardPart[] => {
    const parts: BoardPart[] = [];
    for (const [label, values] of Object.entries(boardOutputs)) {
      if (!values) continue;
      const height = getBoardHeight(label);
      for (const width of values) {
        parts.push({ label, width, height });
      }
    }
    return parts;
  };

  const handleExportPdf = () => {
    const parts = getAllParts();
    exportPartsToPdf(parts);
  };

  const totalParts = getAllParts().length;

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
          {boardLabels.map((label) => {
            const values = boardOutputs[label];
            if (!values || values.length === 0) return null;

            const boardHeight = getBoardHeight(label);

            return (
              <section key={label}>
                {/* Section header */}
                <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-content-xl">
                  <h3 className="font-display text-sm uppercase text-content-m text-balance">
                    {label}
                  </h3>
                  <span className="font-display text-xs tabular-nums text-content-h">
                    {values.length}
                    <span className="text-content-m-a ml-1">pcs</span>
                  </span>
                </div>

                {/* Board grid */}
                <div className="flex flex-wrap gap-3">
                  {values.map((width, index) => (
                    <BoardRectangle
                      key={`${label}-${index}`}
                      width={width}
                      height={boardHeight}
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

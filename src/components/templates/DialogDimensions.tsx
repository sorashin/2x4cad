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

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="p-6 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-content-h-a">部材リスト</h2>
        <button
          onClick={handleExportPdf}
          className="px-4 py-2 rounded hover:bg-blue-600 text-sm"
        >
          PDFをエクスポート
        </button>
      </div>

      <div className="space-y-6">
        {boardLabels.map((label) => {
          const values = boardOutputs[label];
          if (!values || values.length === 0) return null;

          const boardHeight = getBoardHeight(label);

          return (
            <div key={label} className="border-t pt-4 first:border-t-0 first:pt-0">
              <h3 className="text-sm font-semibold text-content-h-a mb-3">
                {label} ({values.length}個)
              </h3>
              <div className="flex flex-wrap gap-4">
                {values.map((width, index) => (
                  <BoardRectangle
                    key={`${label}-${index}`}
                    width={width}
                    height={boardHeight}
                    maxWidth={150}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
        >
          閉じる
        </button>
      </div>
    </Dialog>
  );
}

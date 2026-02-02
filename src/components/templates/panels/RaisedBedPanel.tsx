import { useMemo } from 'react';
import { useRaisedBedStore } from '../../../stores/templates/raisedBed';
import { useModularStore } from '../../../stores/templates/modular';
import { useUIStore } from '../../../stores/templates/ui';
import { ParameterSlider } from '../ParameterSlider';

/** boardGeometries を boardName でグループ化した Record */
function groupBoardGeometriesByBoardName(
  boardGeometries: { boardName: string }[]
): Record<string, { boardName: string }[]> {
  const grouped: Record<string, { boardName: string }[]> = {};
  for (const g of boardGeometries) {
    const name = g.boardName || '(unknown)';
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(g);
  }
  return grouped;
}

export function RaisedBedPanel() {
  const { width, height, depth, setWidth, setHeight, setDepth } = useRaisedBedStore();
  const { openDialog } = useUIStore();
  const boardGeometries = useModularStore((s) => s.boardGeometries);

  const boardGroups = useMemo(
    () => groupBoardGeometriesByBoardName(boardGeometries),
    [boardGeometries]
  );

  const totalParts = boardGeometries.length;

  return (
    <aside
      className="w-full h-full "
      role="complementary"
      aria-label="Model parameters"
    >
      {/* Header */}
      <header className="px-4 py-3 border-b border-content-xl ">
        <h2 className="font-display text-sm uppercase text-content-m text-balance">
          Raised Bed
        </h2>
      </header>

      {/* Parameters */}
      <div className="p-4 space-y-6">
        <ParameterSlider
          label="幅"
          value={width}
          min={600}
          max={2400}
          onChange={setWidth}
        />
        <ParameterSlider
          label="高さ"
          value={height}
          min={100}
          max={600}
          onChange={setHeight}
        />
        <ParameterSlider
          label="奥行き"
          value={depth}
          min={300}
          max={1200}
          onChange={setDepth}
        />
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-content-xl" />

      {/* Output summary */}
      {boardGeometries.length > 0 && (
        <div className="p-4">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="font-display text-overline uppercase text-content-m-a text-balance">
              Output
            </h3>
            <span className="font-display text-sm tabular-nums text-content-h">
              {totalParts}
              <span className="text-content-m-a ml-1">parts</span>
            </span>
          </div>
          <ul className="space-y-1">
            {Object.entries(boardGroups).map(([boardName, items]) => (
              <li
                key={boardName}
                className="flex items-baseline justify-between font-display text-xs"
              >
                <span className="text-content-m truncate">{boardName}</span>
                <span className="tabular-nums text-content-h">
                  {items.length}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action */}
      <div className="p-4 pt-0">
        <button
          onClick={() => openDialog('dimensions')}
          className="w-full h-10 font-display text-sm uppercase bg-wood-m text-white rounded hover:bg-wood-h focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wood-h"
        >
          View Parts List
        </button>
      </div>

    </aside>
  );
}

import { useMemo } from 'react';
import { useRaisedBedStore } from '../../../stores/templates/raisedBed';
import { useModularStore, type BoardGeometryWithId } from '../../../stores/templates/modular';
import { useUIStore } from '../../../stores/templates/ui';
import { ParameterSlider } from '../ParameterSlider';
import { exportBoardGeometriesAsSTL } from '../../../utils/stlExport';
import { BOARD_COLOR_MAP } from '../../../constants/boardColors';
import { BoardRectangle } from '../BoardRectangle';
import { LUMBER_DIMENSIONS } from '../../../types/lumber';
import { getBoardGeometryKey } from '../../../utils/boardGeometryKey';

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

/** 同一グループ内を長さ別にサブグループ化 */
function groupByLength(items: BoardGeometryWithId[]): BoardGeometryWithId[][] {
  const map = new Map<number, BoardGeometryWithId[]>();
  for (const g of items) {
    const len = g.boardLength;
    if (!map.has(len)) map.set(len, []);
    map.get(len)!.push(g);
  }
  // 長い順にソート
  return [...map.entries()].sort((a, b) => b[0] - a[0]).map(([, v]) => v);
}

export function RaisedBedPanel() {
  const { width, height, depth, setWidth, setHeight, setDepth } = useRaisedBedStore();
  const { openDialog, colorByBoard, setHoveredBoardKey } = useUIStore();
  const boardGeometries = useModularStore((s) => s.boardGeometries);

  const boardGroups = useMemo(
    () => groupBoardGeometriesByBoardName(boardGeometries),
    [boardGeometries]
  );

  const totalParts = boardGeometries.length;

  // パネル内の描画幅(px) — padding 16px*2 を除いた領域
  const containerWidth = 288 - 32;

  // 全材の最大長を基準にスケールを決定
  const maxLength = useMemo(
    () => Math.max(...boardGeometries.map((g) => g.boardLength), 1),
    [boardGeometries]
  );
  const pxPerMm = containerWidth / maxLength;

  // 各BoardGeometryWithIdオブジェクトの参照 → グローバルindex のマップ
  const boardKeyMap = useMemo(() => {
    const map = new Map<BoardGeometryWithId, string>();
    boardGeometries.forEach((bg, index) => {
      map.set(bg, getBoardGeometryKey(bg, index));
    });
    return map;
  }, [boardGeometries]);

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
          <div className="space-y-4">
            {Object.entries(boardGroups).map(([boardName, items]) => {
              const dims = LUMBER_DIMENSIONS[items[0].boardType];
              const crossHeight = dims ? Math.max(dims.width, dims.height) : 0;

              return (
                <div key={boardName}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-xs text-content-m flex items-center gap-1.5">
                      {colorByBoard && BOARD_COLOR_MAP[boardName] && (
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: BOARD_COLOR_MAP[boardName] }}
                        />
                      )}
                      {boardName}
                    </span>
                    <span className="font-display text-xs tabular-nums text-content-h">
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {groupByLength(items).map((subGroup) => {
                      const colWidth = Math.max(subGroup[0].boardLength * pxPerMm, 24);
                      return (
                        <div
                          key={subGroup[0].boardLength}
                          className="grid gap-2"
                          style={{
                            gridTemplateColumns: `repeat(auto-fill, ${colWidth}px)`,
                          }}
                        >
                          {subGroup.map((g, i) => {
                            const key = boardKeyMap.get(g);
                            return (
                              <BoardRectangle
                                key={`${boardName}-${g.boardLength}-${i}`}
                                width={g.boardLength}
                                height={crossHeight}
                                scale={pxPerMm}
                                color={colorByBoard ? BOARD_COLOR_MAP[boardName] : undefined}
                                label={g.boardType}
                                onHover={(h) => setHoveredBoardKey(h ? key ?? null : null)}
                              />
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action */}
      <div className="p-4 pt-0 space-y-2">
        <button
          onClick={() => openDialog('dimensions')}
          className="w-full h-10 font-display text-sm uppercase bg-wood-m text-white rounded hover:bg-wood-h focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wood-h"
        >
          View Parts List
        </button>
        <button
          onClick={() => exportBoardGeometriesAsSTL(boardGeometries)}
          disabled={boardGeometries.length === 0}
          className="w-full h-10 font-display text-sm uppercase border border-wood-m text-wood-m rounded hover:bg-wood-m/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wood-h disabled:opacity-40 disabled:pointer-events-none"
        >
          Export STL
        </button>
      </div>

    </aside>
  );
}

import { useRaisedBedStore, getBoardLabels } from '../../../stores/templates/raisedBed';
import { useNodeOutputsByLabels } from '../../../hooks/useNodeOutputsByLabels';

export function RaisedBedPanel() {
  const { width, height, depth, setWidth, setHeight, setDepth } = useRaisedBedStore();
  const boardLabels = getBoardLabels();
  const boardOutputs = useNodeOutputsByLabels(boardLabels);

  return (
    <div className="absolute right-4 top-4 bg-white/90 p-6 rounded-lg shadow-lg min-w-[300px] text-content-h-a">
      <h2 className="text-lg font-bold mb-4">Raised Bed パラメータ</h2>

      <div className="space-y-4">
        {/* Width */}
        <div>
          <label className="block text-sm font-medium mb-1">
            幅 (Width): {width}mm
          </label>
          <input
            type="range"
            min={600}
            max={2400}
            step={10}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Height */}
        <div>
          <label className="block text-sm font-medium mb-1">
            高さ (Height): {height}mm
          </label>
          <input
            type="range"
            min={100}
            max={600}
            step={10}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Depth */}
        <div>
          <label className="block text-sm font-medium mb-1">
            奥行き (Depth): {depth}mm
          </label>
          <input
            type="range"
            min={300}
            max={1200}
            step={10}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Board Sizes - グラフから取得 */}
        <div className="border-t pt-4 mt-4">
          {boardOutputs && Object.keys(boardOutputs).length > 0 && (
            <>
              <h3 className="text-sm font-bold mb-2">ボードサイズ（グラフ出力）</h3>
              <div className="space-y-1 text-xs">
                {Object.entries(boardOutputs).map(([label, values]) => (
                  <div key={label}>
                    {label}: [{values.join(', ')}]
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

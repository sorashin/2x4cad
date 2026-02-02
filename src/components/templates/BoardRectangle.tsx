interface BoardRectangleProps {
  width: number;
  height: number;
  maxWidth?: number;
}

export function BoardRectangle({ width, height, maxWidth = 200 }: BoardRectangleProps) {
  const scale = maxWidth / Math.max(width, 1);
  const scaledWidth = Math.max(width * scale, 32);
  const scaledHeight = Math.max(height * scale, 12);

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Board visualization */}
      <div
        className="bg-wood-l border border-wood-m flex items-center justify-center rounded-sm"
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
        }}
      >
        <span className="font-display text-[10px] text-wood-h tabular-nums truncate px-1">
          {width}
        </span>
      </div>

      {/* Dimensions label */}
      <span className="font-display text-[10px] text-content-m tabular-nums">
        {width} × {height}
      </span>
    </div>
  );
}

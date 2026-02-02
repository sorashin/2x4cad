interface BoardRectangleProps {
  width: number;
  height: number;
  maxWidth?: number;
}

export function BoardRectangle({ width, height, maxWidth = 200 }: BoardRectangleProps) {
  const scale = maxWidth / Math.max(width, 1);
  const scaledWidth = width * scale;
  const scaledHeight = Math.max(height * scale, 8);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="bg-amber-200 border border-amber-600 flex items-center justify-center"
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          minWidth: '20px',
        }}
      >
        <span className="text-[10px] text-amber-800 font-medium truncate px-1">
          {width} mm
        </span>
      </div>
      <span className="text-[10px] text-gray-500">
        {width} × {height} mm
      </span>
    </div>
  );
}

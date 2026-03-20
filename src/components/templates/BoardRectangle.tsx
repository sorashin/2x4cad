interface BoardRectangleProps {
  width: number;
  height: number;
  /** 1mmあたりのpx数 */
  scale: number;
  color?: string;
  label?: string;
  onHover?: (hovered: boolean) => void;
}

export function BoardRectangle({ width, height, scale, color, label, onHover }: BoardRectangleProps) {
  const scaledWidth = Math.max(width * scale, 24);
  const scaledHeight = Math.max(height * scale, 8);

  return (
    <div
      className="flex flex-col items-center gap-1"
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {/* Board visualization */}
      <div
        className="flex items-center justify-center"
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          backgroundColor: color ? `${color}33` : undefined,
          borderColor: color ?? undefined,
          borderWidth: '1px',
          borderStyle: 'solid',
          ...(!color && { backgroundColor: 'var(--color-wood-l)', borderColor: 'var(--color-wood-m)' }),
        }}
      >
        <span className="font-display text-[10px] tabular-nums truncate px-1" style={{ color: color ?? undefined, ...(!color && { color: 'var(--color-wood-h)' }) }}>
          {width}
        </span>
      </div>

      {/* Label */}
      <span className="font-display text-[10px] text-content-m tabular-nums">
        {label ?? `${width} × ${height}`}
      </span>
    </div>
  );
}

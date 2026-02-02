import { useId } from 'react';

interface ParameterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function ParameterSlider({
  label,
  value,
  min,
  max,
  step = 10,
  unit = 'mm',
  onChange,
}: ParameterSliderProps) {
  const id = useId();
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="group">
      {/* Label row */}
      <div className="flex items-baseline justify-between mb-1">
        <label
          htmlFor={id}
          className="font-display text-overline uppercase text-content-m-a"
        >
          {label}
        </label>
        <output
          htmlFor={id}
          className="font-display text-xl tabular-nums text-content-h"
        >
          {value}
          <span className="text-sm text-content-m-a ml-0.5">{unit}</span>
        </output>
      </div>

      {/* Slider track */}
      <div className="relative h-8 flex items-center">
        {/* Background track */}
        <div className="absolute inset-x-0 h-1 bg-content-xl rounded-full" />

        {/* Filled track */}
        <div
          className="absolute left-0 h-1 bg-wood-m rounded-full"
          style={{ width: `${percentage}%` }}
        />

        {/* Native input - visually hidden but accessible */}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />

        {/* Custom thumb */}
        <div
          className="absolute size-4 bg-content-h rounded-sm border-2 border-white shadow-md pointer-events-none"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />

        {/* Min/Max labels */}
        <div className="absolute -bottom-1 inset-x-0 flex justify-between">
          <span className="font-display text-xs tabular-nums text-content-l-a">
            {min}
          </span>
          <span className="font-display text-xs tabular-nums text-content-l-a">
            {max}
          </span>
        </div>
      </div>
    </div>
  );
}

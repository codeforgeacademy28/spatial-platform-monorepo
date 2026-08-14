interface CanvasOverlayProps {
  scaleMetric?: number;
  unit?: 'meters' | 'feet';
}

export function CanvasOverlay({
  scaleMetric = 0,
  unit = 'meters',
}: CanvasOverlayProps): JSX.Element {
  const displayValue = scaleMetric.toFixed(2);
  const scalePercentage = Math.min((scaleMetric / 10) * 100, 100);

  return (
    <div className="fixed bottom-6 left-6 z-40 bg-neutral-900/70 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-xl text-neutral-300 font-mono text-xs">
      <div className="flex items-center gap-2">
        <span>Scale: {displayValue}</span>
        <span className="text-neutral-500">{unit.charAt(0)}</span>
      </div>
      <div className="mt-1 w-32 h-1 bg-neutral-800/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-200"
          style={{ width: `${scalePercentage}%` }}
        />
      </div>
    </div>
  );
}

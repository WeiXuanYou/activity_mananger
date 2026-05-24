export function TrendChart({ values }: { values: number[] }) {
  return (
    <div>
      <div className="h-48 flex items-end gap-2 border-b border-slate-200 pb-2">
        {values.map((h, i) => (
          <div key={i} className="flex-1 h-full flex flex-col justify-end gap-0.5">
            <div className="bg-slate-ink rounded-t" style={{ height: `${h}%` }} />
            <div className="bg-slate-300 rounded-t" style={{ height: `${Math.round(h * 0.4)}%` }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        {values.map((_, i) => <span key={i}>W{i + 1}</span>)}
      </div>
    </div>
  );
}

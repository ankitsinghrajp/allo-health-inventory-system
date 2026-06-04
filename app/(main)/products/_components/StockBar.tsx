export function StockBar({ available, total, name }: { available: number; total: number; name: string }) {
  const pct = total === 0 ? 0 : Math.round((available / total) * 100);
  const color = pct === 0 ? "bg-red-400" : pct < 30 ? "bg-amber-400" : "bg-emerald-400";

  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-slate-500">{name}</span>
        <span className="text-xs font-semibold text-slate-700">{available.toLocaleString()}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

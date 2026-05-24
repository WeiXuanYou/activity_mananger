import type { Kpi } from "../queries";

export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div className="bg-white rounded-soft border border-slate-200 p-4 shadow-sm">
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{kpi.label}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-semibold text-slate-ink">{kpi.value}</div>
        <div className="text-sm font-medium text-emerald-600">↑ {kpi.delta}</div>
      </div>
    </div>
  );
}


type Status = "Available" | "Low Stock" | "Out Of Stock";

export function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { bg: string; text: string; dot: string }> = {
    Available: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    "Low Stock": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    "Out Of Stock": { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

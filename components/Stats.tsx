import { Boxes, Clock, Package, Warehouse } from "lucide-react";

const STATS = [
  { label: "Total Products", value: "252", icon: Package, color: "bg-blue-100 text-blue-600" },
  { label: "Warehouses", value: "4", icon: Warehouse, color: "bg-cyan-100 text-cyan-600" },
  { label: "Active Reservations", value: "1,284", icon: Clock, color: "bg-amber-100 text-amber-600" },
  { label: "Available Stock", value: "3,465", icon: Boxes, color: "bg-emerald-100 text-emerald-600" },
];

export function Stats() {
  return (
    <section className="bg-white border-y border-slate-100 py-10">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-100 rounded-2xl overflow-hidden shadow-sm">
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white px-8 py-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500 font-medium">{label}</p>
              <p className="text-4xl font-extrabold text-slate-900 mt-1 tracking-tight">
                {value}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
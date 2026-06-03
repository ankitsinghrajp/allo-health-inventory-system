import { CheckCircle2, Clock, CreditCard, Package, RefreshCcw } from "lucide-react";

const LIFECYCLE_STEPS = [
  { icon: Package, label: "Product", color: "bg-blue-500" },
  { icon: Clock, label: "Reserve", color: "bg-blue-500" },
  { icon: CreditCard, label: "Payment", color: "bg-violet-500" },
  { icon: CheckCircle2, label: "Confirm", color: "bg-emerald-500" },
];

export function Lifecycle() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Reservation lifecycle
          </h2>
          <p className="text-slate-500 mt-3 text-lg max-w-lg mx-auto">
            A predictable, observable path from product view to confirmed order.
          </p>
        </div>

        {/* Steps */}
        <div className="bg-white border border-slate-200 rounded-2xl p-10">
          <div className="flex items-center justify-center gap-0 mb-10">
            {LIFECYCLE_STEPS.map(({ icon: Icon, label, color }, i) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`w-16 h-16 rounded-full ${color} flex items-center justify-center shadow-md`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">{label}</span>
                </div>
                {i < LIFECYCLE_STEPS.length - 1 && (
                  <div className="w-24 md:w-36 h-px bg-slate-200 mx-1 mb-6 shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Path cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">Happy path</span>
              </div>
              <p className="text-sm text-emerald-700/80">
                Reservation confirmed → inventory decremented → order created.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <RefreshCcw className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-bold text-amber-700">Expiry path</span>
              </div>
              <p className="text-sm text-amber-700/80">
                Timer ends → reservation released → stock returned to pool.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
import { CheckCircle2, Clock, CreditCard, Package, RefreshCcw } from "lucide-react";

const LIFECYCLE_STEPS = [
  { icon: Package, label: "Product", colorClass: "bg-indigo-50 border-indigo-100", iconClass: "text-indigo-600" },
  { icon: Clock, label: "Reserve", colorClass: "bg-indigo-50 border-indigo-100", iconClass: "text-indigo-600" },
  { icon: CreditCard, label: "Payment", colorClass: "bg-indigo-50 border-indigo-100", iconClass: "text-indigo-600" },
  { icon: CheckCircle2, label: "Confirm", colorClass: "bg-green-50 border-green-100", iconClass: "text-green-600" },
];

export function Lifecycle() {
  return (
    <section className="py-20 bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
            Reservation lifecycle
          </h2>
          <p className="text-gray-500 mt-3 text-base max-w-lg mx-auto">
            A predictable, observable path from product view to confirmed order.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">

          {/* Steps */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {LIFECYCLE_STEPS.map(({ icon: Icon, label, colorClass, iconClass }, i) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center gap-2.5">
                  <div className={`w-12 h-12 rounded-xl border ${colorClass} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${iconClass}`} />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">{label}</span>
                </div>
                {i < LIFECYCLE_STEPS.length - 1 && (
                  <div className="w-16 md:w-28 h-px bg-gray-200 mx-2 mb-6 shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Path cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Happy path</span>
              </div>
              <p className="text-sm text-green-700/80">
                Reservation confirmed → inventory decremented → order created.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <RefreshCcw className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-semibold text-yellow-700">Expiry path</span>
              </div>
              <p className="text-sm text-yellow-700/80">
                Timer ends → reservation released → stock returned to pool.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
import { Clock, Eye, RefreshCcw, ShieldCheck } from "lucide-react";

const FEATURES = [
  {
    icon: Eye,
    title: "Inventory Visibility",
    desc: "Real-time stock tracking across every warehouse, region, and channel.",
  },
  {
    icon: Clock,
    title: "Reservation Engine",
    desc: "Temporary inventory holds during checkout — confirm or auto-release.",
  },
  {
    icon: ShieldCheck,
    title: "Concurrency Safe",
    desc: "Atomic operations prevent race conditions and overselling at any scale.",
  },
  {
    icon: RefreshCcw,
    title: "Auto Expiry",
    desc: "Reservations expire automatically. Inventory returns to the pool instantly.",
  },
];

export function Features() {
  return (
    <section className="py-20 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
            Built for scale, designed for trust
          </h2>
          <p className="text-gray-500 mt-3 text-base max-w-lg mx-auto">
            Everything you need to manage reservations from cart to confirmation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-gray-300 transition-all duration-150"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
                <Icon className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1.5">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
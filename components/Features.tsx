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
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Built for scale, designed for trust
          </h2>
          <p className="text-slate-500 mt-3 text-lg max-w-xl mx-auto">
            Everything you need to manage reservations from cart to confirmation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

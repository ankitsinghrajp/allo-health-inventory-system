"use client";

import { ArrowRight, CheckCircle2, Clock, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export function Hero() {
  const router = useRouter();

  const handleExploreClick = () => {
    router.push("/products");
  };

  return (
    <section className="relative bg-gradient-to-b from-slate-50 via-blue-50/40 to-white pt-20 pb-10 overflow-hidden">
      {/* Subtle grid bg */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(to right, #0ea5e9 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-6xl mx-auto px-6 relative">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-blue-100 shadow-sm text-xs font-semibold text-blue-600">
            <Zap className="w-3.5 h-3.5 fill-blue-500 stroke-blue-500" />
            Built for high-concurrency commerce
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-center text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.05] tracking-tight max-w-4xl mx-auto">
          Real-Time Inventory
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
            Reservation System
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-center text-slate-500 text-lg mt-6 max-w-xl mx-auto leading-relaxed">
          Prevent overselling. Reserve inventory instantly. Handle thousands of
          concurrent shoppers with confidence.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
          <button
            onClick={handleExploreClick}
            className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-200/60 transition text-sm"
          >
            Explore Products
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Floating chips */}
        <div className="relative h-8 mt-8 hidden md:block">
          <div className="absolute left-[12%] -top-2 bg-white rounded-xl shadow-md border border-slate-100 px-4 py-2.5 flex items-center gap-2.5 text-sm">
            <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] text-slate-400 font-medium">Reservation</p>
              <p className="text-xs font-bold text-slate-800">Confirmed</p>
            </div>
          </div>
          <div className="absolute right-[10%] -top-2 bg-white rounded-xl shadow-md border border-slate-100 px-4 py-2.5 flex items-center gap-2.5 text-sm">
            <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] text-slate-400 font-medium">Holds active</p>
              <p className="text-xs font-bold text-slate-800">1,284</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
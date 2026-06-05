"use client";

import { ArrowRight, CheckCircle2, Clock, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export function Hero() {
  const router = useRouter();

  const handleExploreClick = () => {
    router.push("/products");
  };

  return (
    <section className="relative bg-gray-50 border-b border-gray-200 pt-20 pb-16 overflow-hidden">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-semibold text-indigo-600">
            <Zap className="w-3 h-3 fill-indigo-500 stroke-indigo-500" />
            Built for high-concurrency commerce
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-semibold text-gray-900 leading-tight tracking-tight max-w-3xl mx-auto">
          Real-Time Inventory{" "}
          <span className="text-indigo-600">Reservation System</span>
        </h1>

        {/* Subheading */}
        <p className="text-center text-gray-500 text-base sm:text-lg mt-5 max-w-xl mx-auto leading-relaxed">
          Prevent overselling. Reserve inventory instantly. Handle thousands of
          concurrent shoppers with confidence.
        </p>

        {/* CTA */}
        <div className="flex items-center justify-center mt-8">
          <button
            onClick={handleExploreClick}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition"
          >
            Explore Products
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Floating chips */}
        <div className="relative h-10 mt-10 hidden md:block">
          <div className="absolute left-[12%] -top-1 bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-2.5 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] text-gray-400 font-medium">Reservation</p>
              <p className="text-xs font-semibold text-gray-900">Confirmed</p>
            </div>
          </div>
          <div className="absolute right-[10%] -top-1 bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-2.5 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] text-gray-400 font-medium">Holds active</p>
              <p className="text-xs font-semibold text-gray-900">1,284</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
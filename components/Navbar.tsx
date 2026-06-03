import { Boxes, Clock, Menu, Package, Warehouse } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <span className="text-[17px] font-bold text-slate-900 tracking-tight">
            Reservex
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Products", icon: Package },
            { label: "Warehouses", icon: Warehouse },
            { label: "Reservations", icon: Clock },
          ].map(({ label, icon: Icon }) => (
            <a
              key={label}
              href="#"
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition font-medium"
            >
              <Icon className="w-4 h-4 text-slate-400" />
              {label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:block">
          <button className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm shadow-blue-200 transition">
            Get Started
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-slate-600"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-3">
          {["Products", "Warehouses", "Reservations"].map((l) => (
            <a key={l} href="#" className="block text-sm text-slate-700 py-1">
              {l}
            </a>
          ))}
          <button className="w-full mt-2 px-4 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold">
            Get Started
          </button>
        </div>
      )}
    </nav>
  );
}
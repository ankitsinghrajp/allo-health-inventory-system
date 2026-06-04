"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CurlyBracesIcon } from "lucide-react";

const links = [
  { label: "Products", href: "/products" },
  { label: "Warehouses", href: "/warehouses" },
  { label: "Reservations", href: "/reservations" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-200">
            <CurlyBracesIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-slate-900 text-lg tracking-tight">Reservex</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center bg-slate-50 rounded-full p-1 gap-0.5 border border-slate-200">
          {links.map(({ label, href }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* CTA */}
        <button className="hidden md:flex bg-blue-600 text-white text-sm font-bold px-5 py-2 rounded-full hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          Get Started
        </button>
      </div>
    </header>
  );
}
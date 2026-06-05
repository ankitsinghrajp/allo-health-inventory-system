"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Products", href: "/products" },
  { label: "Warehouses", href: "/warehouses" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 no-underline">
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0 relative">
            <span className="text-white text-xs font-bold tracking-tight">R</span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-600" />
          </div>
          <span className="text-sm font-semibold text-gray-900 tracking-tight">Reservex</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1 flex-1 justify-center">
          {links.map(({ label, href }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                  isActive
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-indigo-600" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Balancing spacer */}
        <div className="flex-shrink-0 w-20 hidden sm:block" />

      </div>
    </header>
  );
}
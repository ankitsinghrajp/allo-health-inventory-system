"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CurlyBracesIcon, MapPinIcon, RefreshCwIcon } from "lucide-react";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type WarehouseStatus = "Healthy" | "Warning" | "Critical";

interface Warehouse {
  id: number;
  name: string;
  location: string;
  status: WarehouseStatus;
  total: number;
  reserved: number;
  available: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const WAREHOUSES: Warehouse[] = [
  {
    id: 1,
    name: "Warehouse Alpha",
    location: "Mumbai, MH",
    status: "Healthy",
    total: 1240,
    reserved: 184,
    available: 1056,
  },
  {
    id: 2,
    name: "Warehouse Beta",
    location: "Delhi, DL",
    status: "Healthy",
    total: 860,
    reserved: 92,
    available: 768,
  },
  {
    id: 3,
    name: "Warehouse Gamma",
    location: "Bangalore, KA",
    status: "Healthy",
    total: 520,
    reserved: 47,
    available: 473,
  },
  {
    id: 4,
    name: "Warehouse Delta",
    location: "Chennai, TN",
    status: "Healthy",
    total: 1480,
    reserved: 312,
    available: 1168,
  },
];

const TOTALS = {
  facilities: WAREHOUSES.length,
  totalStock: WAREHOUSES.reduce((s, w) => s + w.total, 0),
  reserved: WAREHOUSES.reduce((s, w) => s + w.reserved, 0),
  available: WAREHOUSES.reduce((s, w) => s + w.available, 0),
};

// ─── Navbar ───────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Products", href: "/products" },
  { label: "Warehouses", href: "/warehouses" },
  { label: "Reservations", href: "/reservations" },
];

function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-200">
            <CurlyBracesIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-slate-900 text-lg tracking-tight">Reservex</span>
        </Link>

        <nav className="hidden md:flex items-center bg-slate-50 rounded-full p-1 gap-0.5 border border-slate-200">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = pathname === href;
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

        <button className="hidden md:flex bg-blue-600 text-white text-sm font-bold px-5 py-2 rounded-full hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          Get Started
        </button>
      </div>
    </header>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ pct }: { pct: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const reservedDash = circ * ((100 - pct) / 100);
  const availableDash = circ * (pct / 100);

  return (
    <div className="relative w-[140px] h-[140px] flex-shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        {/* Track */}
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        {/* Reserved (blue) */}
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke="#3b82f6"
          strokeWidth="10"
          strokeDasharray={`${reservedDash} ${circ}`}
          strokeLinecap="round"
        />
        {/* Available (teal) */}
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke="#14b8a6"
          strokeWidth="10"
          strokeDasharray={`${availableDash} ${circ - availableDash}`}
          strokeDashoffset={-reservedDash}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-slate-900">{pct}%</span>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Available</span>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WarehouseStatus }) {
  const map: Record<WarehouseStatus, string> = {
    Healthy: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    Warning: "bg-amber-50 text-amber-600 border border-amber-200",
    Critical: "bg-red-50 text-red-600 border border-red-200",
  };
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full ${map[status]}`}>
      {status}
    </span>
  );
}

// ─── Warehouse Card ───────────────────────────────────────────────────────────

function WarehouseCard({ warehouse }: { warehouse: Warehouse }) {
  const pct = Math.round((warehouse.available / warehouse.total) * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-sm shadow-blue-200 flex-shrink-0">
            <WarehouseIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg leading-tight">{warehouse.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPinIcon className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">{warehouse.location}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={warehouse.status} />
      </div>

      {/* Body */}
      <div className="flex items-center gap-6">
        <DonutChart pct={pct} />

        <div className="flex-1 space-y-3">
          {/* Total */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-sm text-slate-500">Total</span>
            </div>
            <span className="text-sm font-bold text-slate-800">{warehouse.total.toLocaleString()}</span>
          </div>
          <div className="h-px bg-slate-50" />

          {/* Reserved */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-500">Reserved</span>
            </div>
            <span className="text-sm font-bold text-slate-800">{warehouse.reserved.toLocaleString()}</span>
          </div>
          <div className="h-px bg-slate-50" />

          {/* Available */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="text-sm text-slate-500">Available</span>
            </div>
            <span className="text-sm font-bold text-slate-800">{warehouse.available.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

function WarehouseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
    </svg>
  );
}

function BoxesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

const STAT_CARDS = [
  { label: "Facilities", value: TOTALS.facilities.toString(), Icon: WarehouseIcon, color: "text-blue-500", bg: "bg-blue-50" },
  { label: "Total Stock", value: TOTALS.totalStock.toLocaleString(), Icon: BoxesIcon, color: "text-teal-500", bg: "bg-teal-50" },
  { label: "Reserved", value: TOTALS.reserved.toLocaleString(), Icon: ClockIcon, color: "text-amber-500", bg: "bg-amber-50" },
  { label: "Available", value: TOTALS.available.toLocaleString(), Icon: CheckCircleIcon, color: "text-emerald-500", bg: "bg-emerald-50" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Warehouses() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full mb-3 border border-blue-100">
            <WarehouseIcon className="w-3.5 h-3.5" />
            OPERATIONS
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                Warehouse Overview
              </h1>
              <p className="text-slate-500 mt-2 text-base">
                Live capacity, reservations and availability across every facility.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <RefreshCwIcon className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map(({ label, value, Icon, color, bg }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Warehouse Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {WAREHOUSES.map((wh) => (
            <WarehouseCard key={wh.id} warehouse={wh} />
          ))}
        </div>
      </main>
    </div>
  );
}
"use client";

import { Navbar } from "@/components/Navbar";
import { useState } from "react";
import { ReserveDialog } from "./_components/ReserveDialogue";
import { ProductCard } from "./_components/ProductCard";
import { SkeletonCard } from "./_components/SkeletonCard";
import { ClockIcon, CubeIcon, RefreshIcon, SearchIcon, SlidersIcon, SparklesIcon, WarehouseIcon } from "./_components/IconComponents";

// ─── Types ───────────────────────────────────────────────────────────────────

type Status = "Available" | "Low Stock" | "Out Of Stock";

interface WarehouseStock {
  name: string;
  available: number;
  total: number;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  image: string;
  totalAvailable: number;
  warehouses: WarehouseStock[];
  status: Status;
}

// Mock data
const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "MacBook Pro",
    sku: "MBP-M3-001",
    category: "Computers",
    price: 1999,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
    totalAvailable: 178,
    warehouses: [
      { name: "Mumbai", available: 120, total: 150 },
      { name: "Delhi", available: 43, total: 60 },
      { name: "Bangalore", available: 15, total: 20 },
    ],
    status: "Available",
  },
  {
    id: 2,
    name: "iPhone 16",
    sku: "IPH-16-PRO",
    category: "Phones",
    price: 999,
    image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&q=80",
    totalAvailable: 274,
    warehouses: [
      { name: "Mumbai", available: 88, total: 100 },
      { name: "Delhi", available: 130, total: 150 },
      { name: "Bangalore", available: 56, total: 80 },
    ],
    status: "Available",
  },
  {
    id: 3,
    name: "AirPods Pro",
    sku: "APP-GEN2-003",
    category: "Audio",
    price: 249,
    image: "https://images.unsplash.com/photo-1606741965509-717c2b2a5f62?w=600&q=80",
    totalAvailable: 104,
    warehouses: [
      { name: "Mumbai", available: 24, total: 50 },
      { name: "Delhi", available: 8, total: 30 },
      { name: "Bangalore", available: 72, total: 90 },
    ],
    status: "Available",
  },
  {
    id: 4,
    name: "Dell Monitor",
    sku: "DEL-U2723D",
    category: "Peripherals",
    price: 449,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80",
    totalAvailable: 1,
    warehouses: [
      { name: "Mumbai", available: 1, total: 10 },
      { name: "Delhi", available: 0, total: 5 },
      { name: "Bangalore", available: 0, total: 3 },
    ],
    status: "Low Stock",
  },
  {
    id: 5,
    name: "Mechanical Keyboard",
    sku: "KBD-MX-310",
    category: "Peripherals",
    price: 179,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
    totalAvailable: 0,
    warehouses: [
      { name: "Mumbai", available: 0, total: 0 },
      { name: "Delhi", available: 0, total: 0 },
      { name: "Bangalore", available: 0, total: 0 },
    ],
    status: "Out Of Stock",
  },
  {
    id: 6,
    name: "iPad Pro",
    sku: "IPD-PRO-13",
    category: "Tablets",
    price: 1099,
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
    totalAvailable: 56,
    warehouses: [
      { name: "Mumbai", available: 20, total: 30 },
      { name: "Delhi", available: 22, total: 25 },
      { name: "Bangalore", available: 14, total: 20 },
    ],
    status: "Available",
  },
];

const STATS = [
  { label: "Total Products", value: "6", icon: CubeIcon, color: "text-blue-500", bg: "bg-blue-50" },
  { label: "Available Units", value: "1,543", icon: SparklesIcon, color: "text-emerald-500", bg: "bg-emerald-50" },
  { label: "Reserved Units", value: "250", icon: ClockIcon, color: "text-amber-500", bg: "bg-amber-50" },
  { label: "Active Warehouses", value: "4", icon: WarehouseIcon, color: "text-sky-500", bg: "bg-sky-50" },
];

const CATEGORIES = ["All", "Computers", "Phones", "Audio", "Peripherals", "Tablets"];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading] = useState(false);
  const [reservingProduct, setReservingProduct] = useState<Product | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = PRODUCTS.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || p.category === category;
    return matchSearch && matchCat;
  });

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
            <SparklesIcon className="w-3.5 h-3.5" />
            CATALOG
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                Product Inventory
              </h1>
              <p className="text-slate-500 mt-2 text-base">
                Live availability across every warehouse. Reserve in one click.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <RefreshIcon className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-4.5 h-4.5 ${stat.color} w-5 h-5`} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by product or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <SlidersIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    category === cat
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <SearchIcon className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No products found</h3>
            <p className="text-sm text-slate-400">Try adjusting your search or filter criteria.</p>
            <button
              onClick={() => { setSearch(""); setCategory("All"); }}
              className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 font-semibold text-sm rounded-xl hover:bg-blue-100 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onReserve={() => setReservingProduct(product)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Reserve Dialog */}
      {reservingProduct && (
        <ReserveDialog
          product={reservingProduct}
          onClose={() => setReservingProduct(null)}
        />
      )}
    </div>
  );
}
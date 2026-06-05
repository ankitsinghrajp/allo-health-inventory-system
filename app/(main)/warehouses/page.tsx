"use client";

import { useState, useEffect } from "react";

interface Warehouse {
  id: string;
  name: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await fetch("/api/warehouses");
        if (!response.ok) throw new Error(`Failed to fetch warehouses: ${response.status}`);
        const data = await response.json();
        const warehousesData = Array.isArray(data) ? data : data.warehouses || [];
        setWarehouses(warehousesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching warehouses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };

  const uniqueLocations = new Set(warehouses.map((w) => w.location)).size;

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading warehouses…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 max-w-sm w-full text-center">
          <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Error</h2>
          <p className="text-sm text-gray-500 mb-5">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">Inventory Management</p>
          <h1 className="text-2xl font-semibold text-gray-900">Warehouse Management</h1>
          <p className="mt-1 text-sm text-gray-500">View all inventory fulfillment centers.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Warehouses</p>
              <p className="text-2xl font-semibold text-gray-900 leading-tight mt-0.5">{warehouses.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Locations</p>
              <p className="text-2xl font-semibold text-gray-900 leading-tight mt-0.5">{uniqueLocations}</p>
            </div>
          </div>
        </div>

        {/* Section label */}
        {warehouses.length > 0 && (
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
            {warehouses.length} {warehouses.length === 1 ? "center" : "centers"}
          </p>
        )}

        {/* Grid */}
        {warehouses.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
            <p className="text-sm text-gray-400">No warehouses found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {warehouses.map((warehouse) => (
              <div
                key={warehouse.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:border-gray-300 transition-all duration-150"
              >
                {/* Top accent strip */}
                <div className="h-1 w-full bg-indigo-500 flex-shrink-0" />

                <div className="p-5 flex flex-col flex-1">
                  {/* Name row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-1">{warehouse.name}</h3>
                  </div>

                  <div className="border-t border-gray-100 mb-4" />

                  {/* Meta */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">{warehouse.location}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-500">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide mr-1.5">Since</span>
                        {formatDate(warehouse.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
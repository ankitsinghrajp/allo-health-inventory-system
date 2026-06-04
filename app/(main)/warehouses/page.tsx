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
        if (!response.ok) {
          throw new Error(`Failed to fetch warehouses: ${response.status}`);
        }
        const data = await response.json();
        // Assuming API returns array directly or { warehouses: [...] }
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
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const uniqueLocations = new Set(warehouses.map((w) => w.location)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading warehouses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-red-700 font-semibold text-lg">Error</h2>
          <p className="text-red-600 mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Warehouse Management</h1>
          <p className="text-gray-600 mt-1">View all inventory fulfillment centers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Warehouses</p>
                <p className="text-3xl font-bold text-gray-900">{warehouses.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Locations</p>
                <p className="text-3xl font-bold text-gray-900">{uniqueLocations}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Warehouse Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((warehouse) => (
            <div
              key={warehouse.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-2">🏢</span>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {warehouse.name}
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">📍</span>
                    <span>{warehouse.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <span className="mr-2">📅</span>
                    <span>Created: {formatDate(warehouse.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {warehouses.length === 0 && !loading && !error && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500">No warehouses found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
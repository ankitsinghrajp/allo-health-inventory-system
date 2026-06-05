"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

// Type definitions
interface InventoryItem {
  inventoryId: string;
  productId: string;
  productName: string;
  productDescription: string;
  warehouseId: string;
  warehouseName: string;
  warehouseLocation: string;
  totalStock: number;
  reservedStock?: number;
  availableStock?: number;
}

interface ApiInventoryItem extends InventoryItem {}

interface ReservationPayload {
  inventoryId: string;
  quantity: number;
}

interface ReservationSuccessResponse {
  success?: boolean;
  reservation?: { id: string };
  id?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const getAvailableStock = (item: ApiInventoryItem): number => {
  if (item.availableStock !== undefined) return item.availableStock;
  return item.totalStock - (item.reservedStock || 0);
};

const hasInventoryChanged = (
  oldItems: InventoryItem[],
  newItems: InventoryItem[]
): boolean => {
  if (oldItems.length !== newItems.length) return true;
  for (let i = 0; i < oldItems.length; i++) {
    const o = oldItems[i], n = newItems[i];
    if (
      o.totalStock !== n.totalStock ||
      o.reservedStock !== n.reservedStock ||
      o.availableStock !== n.availableStock
    ) return true;
  }
  return false;
};

// ─── Modal ───────────────────────────────────────────────────────────────────

const ReserveModal = ({
  isOpen,
  onClose,
  productName,
  warehouseName,
  maxAvailable,
  onConfirm,
  isLoading,
  errorMessage,
  onClearError,
}: {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  warehouseName: string;
  maxAvailable: number;
  onConfirm: (quantity: number) => void;
  isLoading: boolean;
  errorMessage: string | null;
  onClearError: () => void;
}) => {
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (isOpen) { setQuantity(1); onClearError(); }
  }, [isOpen, onClearError]);

  useEffect(() => {
    if (maxAvailable > 0 && quantity > maxAvailable) setQuantity(maxAvailable);
  }, [maxAvailable, quantity]);

  if (!isOpen) return null;

  const isOutOfStock = maxAvailable <= 0;

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(maxAvailable, Math.max(1, parseInt(e.target.value) || 1));
    setQuantity(v);
    if (errorMessage) onClearError();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < 1 || quantity > maxAvailable) return;
    onConfirm(quantity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40">
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Reserve Product</h2>
          <p className="mt-0.5 text-sm text-gray-500">Confirm the details below to place your reservation.</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          {/* Product */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Product</label>
            <p className="text-sm font-medium text-gray-900">{productName}</p>
          </div>
          <div className="border-t border-gray-100" />
          {/* Warehouse */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Warehouse</label>
            <p className="text-sm font-medium text-gray-900">{warehouseName}</p>
          </div>
          <div className="border-t border-gray-100" />
          {/* Stock */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Available Stock</label>
            {isOutOfStock
              ? <p className="text-sm font-semibold text-red-600">Out of stock</p>
              : <p className="text-sm font-medium text-gray-900">{maxAvailable} units</p>
            }
          </div>

          {isOutOfStock ? (
            <div className="mt-1 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm font-semibold text-red-700">⚠ No stock available</p>
              <p className="text-xs text-red-600 mt-0.5">Someone just reserved the last unit. Please check back later.</p>
            </div>
          ) : (
            <div className="pt-1">
              <div className="border-t border-gray-100 mb-3" />
              <label htmlFor="quantity" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                min={1}
                max={maxAvailable}
                value={quantity}
                onChange={handleQuantityChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
              />
              {errorMessage && (
                <div className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                  <p className="text-xs font-medium text-red-700">{errorMessage}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isOutOfStock ? "Close" : "Cancel"}
          </button>
          {!isOutOfStock && (
            <button
              onClick={handleSubmit}
              disabled={isLoading || quantity < 1 || quantity > maxAvailable}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? "Reserving…" : "Confirm Reservation"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Stock Badge ─────────────────────────────────────────────────────────────

const StockBadge = ({ available }: { available: number }) => {
  if (available <= 0)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Out of Stock
      </span>
    );
  if (available <= 10)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
        Low Stock
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      In Stock
    </span>
  );
};

// ─── Product Card ─────────────────────────────────────────────────────────────

const ProductCard = ({
  item,
  onReserveClick,
}: {
  item: InventoryItem;
  onReserveClick: (item: InventoryItem) => void;
}) => {
  const available = getAvailableStock(item);
  const isOutOfStock = available <= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-150">
      {/* Stock indicator strip */}
      <div className={`h-1 w-full flex-shrink-0 ${
        isOutOfStock ? "bg-red-400" : available <= 10 ? "bg-yellow-400" : "bg-green-500"
      }`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-1 flex-1">
            {item.productName}
          </h3>
          <StockBadge available={available} />
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
          {item.productDescription}
        </p>

        {/* Divider */}
        <div className="border-t border-gray-100 mb-4" />

        {/* Meta */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium text-gray-700">{item.warehouseName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-gray-500">
              {isOutOfStock
                ? <span className="text-red-600 font-medium">No units available</span>
                : <span><span className="font-semibold text-gray-900">{available}</span> of {item.totalStock} available</span>
              }
            </span>
          </div>
        </div>

        {/* Stock bar */}
        {!isOutOfStock && item.totalStock > 0 && (
          <div className="mb-4">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${available <= 10 ? "bg-yellow-400" : "bg-green-500"}`}
                style={{ width: `${Math.min(100, (available / item.totalStock) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto">
          <button
            onClick={() => onReserveClick(item)}
            disabled={isOutOfStock}
            className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition ${
              isOutOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm hover:shadow"
            }`}
          >
            {isOutOfStock ? "Unavailable" : "Reserve Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Stats Card ───────────────────────────────────────────────────────────────

const StatsCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4">
    <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-semibold text-gray-900 leading-tight mt-0.5">{value}</p>
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Products() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [reserving, setReserving] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const router = useRouter();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentInventoryRef = useRef<InventoryItem[]>([]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get<ApiInventoryItem[]>("/api/products");
      const transformed = response.data.map((item) => ({
        ...item,
        availableStock: getAvailableStock(item),
      }));

      setInventory((prev) => {
        if (hasInventoryChanged(prev, transformed)) {
          currentInventoryRef.current = transformed;
          return transformed;
        }
        return prev;
      });

      setSelectedItem((prevSelected) => {
        if (!prevSelected) return prevSelected;
        const fresh = transformed.find((i) => i.inventoryId === prevSelected.inventoryId);
        if (!fresh) return prevSelected;
        if (
          fresh.totalStock !== prevSelected.totalStock ||
          fresh.reservedStock !== prevSelected.reservedStock ||
          fresh.availableStock !== prevSelected.availableStock
        ) return fresh;
        return prevSelected;
      });

      setError(null);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError((prev) => prev || "Failed to load products. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    pollingIntervalRef.current = setInterval(fetchProducts, 2000);
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [fetchProducts]);

  const uniqueProductsCount = new Set(inventory.map((i) => i.productId)).size;
  const uniqueWarehousesCount = new Set(inventory.map((i) => i.warehouseId)).size;
  const totalStockValue = inventory.reduce((s, i) => s + (i.totalStock || 0), 0);

  const handleReserveClick = (item: InventoryItem) => {
    if (getAvailableStock(item) <= 0) return;
    setSelectedItem(item);
    setModalOpen(true);
    setReservationError(null);
  };

  const handleConfirmReservation = async (quantity: number) => {
    if (!selectedItem) return;
    setReserving(true);
    setReservationError(null);

    try {
      const payload: ReservationPayload = { inventoryId: selectedItem.inventoryId, quantity };
      const response = await axios.post<ReservationSuccessResponse>("/api/reservations", payload);
      const reservationId = response.data.reservation?.id || response.data.id;
      if (!reservationId) throw new Error("Reservation ID not found in response");
      setModalOpen(false);
      setSelectedItem(null);
      router.push(`/reservations/${reservationId}`);
    } catch (err) {
      console.error("Reservation error:", err);
      if (axios.isAxiosError(err) && err.response) {
        switch (err.response.status) {
          case 409:
            setReservationError("Not enough stock available — someone just reserved the last unit.");
            fetchProducts();
            break;
          case 410: setReservationError("Reservation expired"); break;
          case 404: setReservationError("Inventory item not found"); break;
          default: setReservationError("Failed to create reservation. Please try again.");
        }
      } else {
        setReservationError("Network error. Please check your connection.");
      }
    } finally {
      setReserving(false);
    }
  };

  const closeModal = () => {
    if (!reserving) { setModalOpen(false); setSelectedItem(null); setReservationError(null); }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading inventory…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-5 max-w-md text-center">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // ── Main ──
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">Inventory Management</p>
          <h1 className="text-2xl font-semibold text-gray-900">Product Catalog</h1>
          <p className="mt-1 text-sm text-gray-500">Browse and reserve products across all warehouse locations.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatsCard
            title="Products"
            value={uniqueProductsCount}
            icon={
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          <StatsCard
            title="Warehouses"
            value={uniqueWarehousesCount}
            icon={
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
          />
          <StatsCard
            title="Total Stock"
            value={totalStockValue.toLocaleString()}
            icon={
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>

        {/* Section label */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{inventory.length} items</p>
        </div>

        {/* Grid */}
        {inventory.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
            <p className="text-sm text-gray-400">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {inventory.map((item) => (
              <ProductCard key={item.inventoryId} item={item} onReserveClick={handleReserveClick} />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedItem && (
        <ReserveModal
          isOpen={modalOpen}
          onClose={closeModal}
          productName={selectedItem.productName}
          warehouseName={selectedItem.warehouseName}
          maxAvailable={getAvailableStock(selectedItem)}
          onConfirm={handleConfirmReservation}
          isLoading={reserving}
          errorMessage={reservationError}
          onClearError={() => setReservationError(null)}
        />
      )}
    </div>
  );
}
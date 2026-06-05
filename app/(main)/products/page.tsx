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

interface ApiInventoryItem extends InventoryItem {
  // Backend might send additional fields, but we use the above
}

interface ReservationPayload {
  inventoryId: string;
  quantity: number;
}

interface ReservationSuccessResponse {
  success?: boolean;
  reservation?: {
    id: string;
  };
  id?: string;
}

// Helper to compute available stock safely
const getAvailableStock = (item: ApiInventoryItem): number => {
  if (item.availableStock !== undefined) return item.availableStock;
  const reserved = item.reservedStock || 0;
  return item.totalStock - reserved;
};

// Helper to get badge color based on stock level
const getStockBadgeColor = (available: number): string => {
  if (available > 10) return "bg-green-100 text-green-800";
  if (available >= 1 && available <= 10) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
};

// Helper to get stock label
const getStockLabel = (available: number): string => {
  if (available <= 0) return "Out Of Stock";
  return `Available: ${available}`;
};

// Deep comparison to check if inventory data has changed
const hasInventoryChanged = (oldItems: InventoryItem[], newItems: InventoryItem[]): boolean => {
  if (oldItems.length !== newItems.length) return true;
  for (let i = 0; i < oldItems.length; i++) {
    const oldItem = oldItems[i];
    const newItem = newItems[i];
    if (
      oldItem.totalStock !== newItem.totalStock ||
      oldItem.reservedStock !== newItem.reservedStock ||
      oldItem.availableStock !== newItem.availableStock
    ) {
      return true;
    }
  }
  return false;
};

// Modal Component
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
    if (isOpen) {
      setQuantity(1);
      onClearError();
    }
  }, [isOpen, onClearError]);

  // ✅ FIX: When stock drops to 0 after a race condition (409), clamp quantity
  useEffect(() => {
    if (maxAvailable > 0 && quantity > maxAvailable) {
      setQuantity(maxAvailable);
    }
  }, [maxAvailable, quantity]);

  if (!isOpen) return null;

  const isOutOfStock = maxAvailable <= 0;

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = Math.min(maxAvailable, Math.max(1, parseInt(e.target.value) || 1));
    setQuantity(newQuantity);
    if (errorMessage) onClearError();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < 1 || quantity > maxAvailable) return;
    onConfirm(quantity);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Reserve Product</h2>
        <div className="space-y-3 mb-5">
          <p className="text-gray-700">
            <span className="font-medium">Product:</span> {productName}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Warehouse:</span> {warehouseName}
          </p>

          {/* ✅ FIX: Show live stock with visual feedback when it changes */}
          <p className="text-gray-700">
            <span className="font-medium">Available: </span>
            <span className={isOutOfStock ? "text-red-600 font-semibold" : "text-gray-900"}>
              {isOutOfStock ? "Out of stock" : maxAvailable}
            </span>
          </p>

          {/* ✅ FIX: Show out-of-stock state inside modal instead of closing it */}
          {isOutOfStock ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
              <p className="text-red-700 text-sm font-medium">
                ⚠️ No stock available
              </p>
              <p className="text-red-600 text-xs mt-1">
                Someone just reserved the last unit. Please check back later.
              </p>
            </div>
          ) : (
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                min={1}
                max={maxAvailable}
                value={quantity}
                onChange={handleQuantityChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {/* ✅ FIX: Error message stays visible inside modal (409 race condition) */}
              {errorMessage && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errorMessage}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            disabled={isLoading}
          >
            {isOutOfStock ? "Close" : "Cancel"}
          </button>
          {/* ✅ FIX: Hide Reserve button when out of stock after race condition */}
          {!isOutOfStock && (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              disabled={isLoading || quantity < 1 || quantity > maxAvailable}
            >
              {isLoading ? "Reserving..." : "Reserve"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard = ({
  item,
  onReserveClick,
}: {
  item: InventoryItem;
  onReserveClick: (item: InventoryItem) => void;
}) => {
  const available = getAvailableStock(item);
  const isOutOfStock = available <= 0;
  const badgeColor = getStockBadgeColor(available);
  const stockLabel = getStockLabel(available);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{item.productName}</h3>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeColor}`}>
            {isOutOfStock ? "Out Of Stock" : available > 10 ? "In Stock" : "Low Stock"}
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{item.productDescription}</p>
        <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{item.warehouseName}</span>
        </div>
        <div className="mb-4">
          <p className={`text-sm font-medium ${isOutOfStock ? "text-red-600" : "text-gray-700"}`}>
            {stockLabel}
          </p>
        </div>
      </div>
      <div className="px-5 pb-5 pt-0">
        <button
          onClick={() => onReserveClick(item)}
          disabled={isOutOfStock}
          className={`w-full py-2 rounded-lg font-medium transition ${
            isOutOfStock
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {isOutOfStock ? "Unavailable" : "Reserve Now"}
        </button>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value }: { title: string; value: string | number }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col items-center justify-center text-center">
      <p className="text-gray-500 text-sm uppercase tracking-wide">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
};

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

      setInventory((prevInventory) => {
        if (hasInventoryChanged(prevInventory, transformed)) {
          currentInventoryRef.current = transformed;
          return transformed;
        }
        return prevInventory;
      });

      // ✅ FIX: Keep selectedItem in sync with latest inventory so modal
      // reflects real-time stock. When polling detects stock changed (e.g.
      // first user booked all 8), the modal's maxAvailable updates immediately.
      setSelectedItem((prevSelected) => {
        if (!prevSelected) return prevSelected;
        const freshItem = transformed.find(
          (item) => item.inventoryId === prevSelected.inventoryId
        );
        if (!freshItem) return prevSelected;
        // Only update if stock-related fields changed
        if (
          freshItem.totalStock !== prevSelected.totalStock ||
          freshItem.reservedStock !== prevSelected.reservedStock ||
          freshItem.availableStock !== prevSelected.availableStock
        ) {
          return freshItem;
        }
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

    pollingIntervalRef.current = setInterval(() => {
      fetchProducts();
    }, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [fetchProducts]);

  const uniqueProductsCount = new Set(inventory.map((item) => item.productId)).size;
  const uniqueWarehousesCount = new Set(inventory.map((item) => item.warehouseId)).size;
  const totalStockValue = inventory.reduce((sum, item) => sum + (item.totalStock || 0), 0);

  const handleReserveClick = (item: InventoryItem) => {
    const available = getAvailableStock(item);
    if (available <= 0) return;
    setSelectedItem(item);
    setModalOpen(true);
    setReservationError(null);
  };

  const handleConfirmReservation = async (quantity: number) => {
    if (!selectedItem) return;
    setReserving(true);
    setReservationError(null);

    try {
      const payload: ReservationPayload = {
        inventoryId: selectedItem.inventoryId,
        quantity: quantity,
      };

      const response = await axios.post<ReservationSuccessResponse>(
        "/api/reservations",
        payload
      );

      const reservationId = response.data.reservation?.id || response.data.id;

      if (!reservationId) {
        throw new Error("Reservation ID not found in response");
      }

      // ✅ FIX: Only close modal on success path before redirect
      setModalOpen(false);
      setSelectedItem(null);
      router.push(`/reservations/${reservationId}`);

    } catch (err) {
      console.error("Reservation error:", err);

      if (axios.isAxiosError(err) && err.response) {
        const status = err.response.status;
        switch (status) {
          case 409:
            // ✅ FIX: Show error inside modal — do NOT close it.
            // The polling (every 2s) will also update maxAvailable in the modal
            // so the user sees "Out of stock" reflected live.
            setReservationError("Not enough stock available — someone just reserved the last unit.");
            // Immediately force a fresh fetch so stock count updates right away
            fetchProducts();
            break;
          case 410:
            setReservationError("Reservation expired");
            break;
          case 404:
            setReservationError("Inventory item not found");
            break;
          default:
            setReservationError("Failed to create reservation. Please try again.");
        }
      } else {
        setReservationError("Network error. Please check your connection.");
      }

    } finally {
      // ✅ FIX: Only reset spinner — modal stays open on error
      setReserving(false);
    }
  };

  const closeModal = () => {
    if (!reserving) {
      setModalOpen(false);
      setSelectedItem(null);
      setReservationError(null);
    }
  };

  const clearReservationError = () => {
    setReservationError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatsCard title="Products" value={uniqueProductsCount} />
          <StatsCard title="Warehouses" value={uniqueWarehousesCount} />
          <StatsCard title="Total Stock" value={totalStockValue} />
        </div>

        {/* Product Grid */}
        {inventory.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inventory.map((item) => (
              <ProductCard key={item.inventoryId} item={item} onReserveClick={handleReserveClick} />
            ))}
          </div>
        )}
      </main>

      {/* Reserve Modal */}
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
          onClearError={clearReservationError}
        />
      )}
    </div>
  );
}
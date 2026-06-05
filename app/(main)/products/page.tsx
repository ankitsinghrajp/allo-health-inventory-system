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
  if (available > 10) return "stock-badge-green";
  if (available >= 1 && available <= 10) return "stock-badge-yellow";
  return "stock-badge-red";
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 15, 20, 0.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 1rem;
          animation: overlayIn 0.2s ease;
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e8e8ef;
          box-shadow:
            0 0 0 1px rgba(99,102,241,0.06),
            0 20px 60px rgba(15,15,40,0.15),
            0 4px 16px rgba(15,15,40,0.08);
          max-width: 440px;
          width: 100%;
          padding: 2rem;
          animation: modalIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          font-family: 'DM Sans', sans-serif;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f0f1a;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }
        .modal-field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0.75rem 1rem;
          background: #f8f8fc;
          border: 1px solid #ebebf5;
          border-radius: 12px;
          margin-bottom: 0.625rem;
        }
        .modal-field-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #9191a8;
        }
        .modal-field-value {
          font-size: 0.9rem;
          font-weight: 500;
          color: #0f0f1a;
        }
        .modal-field-value.out-of-stock {
          color: #dc2626;
          font-weight: 600;
        }
        .modal-out-of-stock-banner {
          background: #fff5f5;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 0.875rem 1rem;
          margin-top: 0.5rem;
        }
        .modal-out-of-stock-banner p:first-child {
          font-size: 0.85rem;
          font-weight: 600;
          color: #dc2626;
          margin: 0 0 0.25rem;
        }
        .modal-out-of-stock-banner p:last-child {
          font-size: 0.75rem;
          color: #ef4444;
          margin: 0;
        }
        .modal-qty-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #6b6b84;
          margin-bottom: 0.5rem;
          margin-top: 0.5rem;
        }
        .modal-qty-input {
          width: 100%;
          border: 1.5px solid #e0e0ef;
          border-radius: 10px;
          padding: 0.625rem 0.875rem;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          color: #0f0f1a;
          background: #fafafe;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .modal-qty-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
          background: #fff;
        }
        .modal-error {
          margin-top: 0.625rem;
          font-size: 0.8rem;
          font-weight: 500;
          color: #dc2626;
          background: #fff5f5;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }
        .btn-cancel {
          padding: 0.625rem 1.25rem;
          background: #f3f3f8;
          border: 1px solid #e4e4ef;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: #4b4b63;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .btn-cancel:hover:not(:disabled) {
          background: #eaeaf5;
          border-color: #d4d4e8;
        }
        .btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-reserve {
          padding: 0.625rem 1.5rem;
          background: #6366f1;
          border: 1.5px solid #6366f1;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
          box-shadow: 0 2px 8px rgba(99,102,241,0.3);
        }
        .btn-reserve:hover:not(:disabled) {
          background: #4f52e8;
          box-shadow: 0 4px 14px rgba(99,102,241,0.4);
          transform: translateY(-1px);
        }
        .btn-reserve:active:not(:disabled) { transform: translateY(0); }
        .btn-reserve:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
      `}</style>
      <div className="modal-overlay">
        <div className="modal-card">
          <h2 className="modal-title">Reserve Product</h2>

          <div className="modal-field">
            <span className="modal-field-label">Product</span>
            <span className="modal-field-value">{productName}</span>
          </div>
          <div className="modal-field">
            <span className="modal-field-label">Warehouse</span>
            <span className="modal-field-value">{warehouseName}</span>
          </div>
          <div className="modal-field">
            <span className="modal-field-label">Available Stock</span>
            <span className={`modal-field-value${isOutOfStock ? " out-of-stock" : ""}`}>
              {isOutOfStock ? "Out of stock" : maxAvailable}
            </span>
          </div>

          {/* ✅ FIX: Show out-of-stock state inside modal instead of closing it */}
          {isOutOfStock ? (
            <div className="modal-out-of-stock-banner">
              <p>⚠️ No stock available</p>
              <p>Someone just reserved the last unit. Please check back later.</p>
            </div>
          ) : (
            <div>
              <label htmlFor="quantity" className="modal-qty-label">Quantity</label>
              <input
                type="number"
                id="quantity"
                min={1}
                max={maxAvailable}
                value={quantity}
                onChange={handleQuantityChange}
                className="modal-qty-input"
              />
              {/* ✅ FIX: Error message stays visible inside modal (409 race condition) */}
              {errorMessage && (
                <p className="modal-error">{errorMessage}</p>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button
              onClick={onClose}
              className="btn-cancel"
              disabled={isLoading}
            >
              {isOutOfStock ? "Close" : "Cancel"}
            </button>
            {/* ✅ FIX: Hide Reserve button when out of stock after race condition */}
            {!isOutOfStock && (
              <button
                onClick={handleSubmit}
                className="btn-reserve"
                disabled={isLoading || quantity < 1 || quantity > maxAvailable}
              >
                {isLoading ? "Reserving…" : "Reserve"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
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
  const stockLabel = getStockLabel(available);

  const statusConfig = isOutOfStock
    ? { label: "Out of Stock", dot: "#f87171", bg: "#fff5f5", text: "#dc2626", border: "#fecaca" }
    : available > 10
    ? { label: "In Stock", dot: "#34d399", bg: "#f0fdf8", text: "#059669", border: "#a7f3d0" }
    : { label: "Low Stock", dot: "#fbbf24", bg: "#fffbeb", text: "#d97706", border: "#fde68a" };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        border: "1.5px solid #eaeaf5",
        boxShadow: "0 1px 3px rgba(15,15,40,0.05), 0 4px 16px rgba(15,15,40,0.04)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
        fontFamily: "'DM Sans', sans-serif",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "0 4px 6px rgba(15,15,40,0.06), 0 12px 40px rgba(99,102,241,0.1)";
        el.style.transform = "translateY(-2px)";
        el.style.borderColor = "#d4d4f5";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "0 1px 3px rgba(15,15,40,0.05), 0 4px 16px rgba(15,15,40,0.04)";
        el.style.transform = "translateY(0)";
        el.style.borderColor = "#eaeaf5";
      }}
    >
      {/* Card top accent strip */}
      <div style={{
        height: "3px",
        background: isOutOfStock
          ? "linear-gradient(90deg, #fca5a5, #f87171)"
          : available > 10
          ? "linear-gradient(90deg, #6ee7b7, #6366f1)"
          : "linear-gradient(90deg, #fde68a, #f59e0b)",
      }} />

      <div style={{ padding: "1.375rem 1.375rem 0", flex: 1 }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.625rem", gap: "0.75rem" }}>
          <h3 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "1rem",
            fontWeight: 700,
            color: "#0f0f1a",
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
            flex: 1,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
          }}>
            {item.productName}
          </h3>
          {/* Status pill */}
          <span style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            background: statusConfig.bg,
            border: `1px solid ${statusConfig.border}`,
            borderRadius: "999px",
            padding: "0.2rem 0.625rem",
            fontSize: "0.7rem",
            fontWeight: 600,
            color: statusConfig.text,
            letterSpacing: "0.04em",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusConfig.dot, flexShrink: 0 }} />
            {statusConfig.label}
          </span>
        </div>

        {/* Description */}
        <p style={{
          fontSize: "0.825rem",
          color: "#6b6b84",
          lineHeight: 1.55,
          marginBottom: "1.125rem",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}>
          {item.productDescription}
        </p>

        {/* Divider */}
        <div style={{ height: "1px", background: "#f0f0f8", marginBottom: "1rem" }} />

        {/* Warehouse row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
            border: "1px solid #c7d2fe",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="13" height="13" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span style={{ fontSize: "0.825rem", color: "#4b4b63", fontWeight: 500 }}>{item.warehouseName}</span>
        </div>

        {/* Stock count row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: isOutOfStock ? "#fff5f5" : "#f8f8fd",
          border: `1px solid ${isOutOfStock ? "#fecaca" : "#ebebf5"}`,
          borderRadius: "10px",
          padding: "0.5rem 0.75rem",
          marginBottom: "1.125rem",
        }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9191a8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Stock</span>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: isOutOfStock ? "#dc2626" : "#0f0f1a" }}>
            {stockLabel}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "0 1.375rem 1.375rem" }}>
        <button
          onClick={() => onReserveClick(item)}
          disabled={isOutOfStock}
          style={{
            width: "100%",
            padding: "0.7rem 1rem",
            borderRadius: "11px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: isOutOfStock ? "not-allowed" : "pointer",
            transition: "all 0.15s",
            border: isOutOfStock ? "1.5px solid #e4e4ef" : "1.5px solid #6366f1",
            background: isOutOfStock ? "#f5f5fb" : "linear-gradient(135deg, #6366f1, #818cf8)",
            color: isOutOfStock ? "#b0b0c8" : "#ffffff",
            boxShadow: isOutOfStock ? "none" : "0 2px 10px rgba(99,102,241,0.25)",
            letterSpacing: "0.01em",
          }}
          onMouseEnter={(e) => {
            if (!isOutOfStock) {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.boxShadow = "0 4px 18px rgba(99,102,241,0.4)";
              el.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isOutOfStock) {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.boxShadow = "0 2px 10px rgba(99,102,241,0.25)";
              el.style.transform = "translateY(0)";
            }
          }}
        >
          {isOutOfStock ? "Unavailable" : "Reserve Now"}
        </button>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => {
  return (
    <div style={{
      background: "#ffffff",
      borderRadius: "16px",
      border: "1.5px solid #eaeaf5",
      boxShadow: "0 1px 3px rgba(15,15,40,0.05), 0 4px 12px rgba(15,15,40,0.04)",
      padding: "1.375rem 1.5rem",
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
        border: "1.5px solid #c7d2fe",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#9191a8", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{title}</p>
        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.75rem", fontWeight: 700, color: "#0f0f1a", margin: 0, lineHeight: 1.1, letterSpacing: "-0.03em" }}>{value}</p>
      </div>
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
            setReservationError("Not enough stock available — someone just reserved the last unit.");
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
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
        <div style={{ minHeight: "100vh", background: "#f7f7fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 48, height: 48, border: "3px solid #e0e0ef", borderTopColor: "#6366f1",
              borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#9191a8", fontSize: "0.875rem" }}>Loading inventory…</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
        <div style={{ minHeight: "100vh", background: "#f7f7fc", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div style={{
            background: "#fff5f5", border: "1.5px solid #fecaca", borderRadius: "16px",
            padding: "1.5rem 2rem", color: "#dc2626", textAlign: "center",
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", maxWidth: 480,
          }}>
            {error}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .products-page {
          min-height: 100vh;
          background: #f7f7fc;
          background-image:
            radial-gradient(ellipse 80% 40% at 50% -10%, rgba(99,102,241,0.07) 0%, transparent 70%);
        }
        .products-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem 4rem;
        }
        .page-header {
          margin-bottom: 2rem;
        }
        .page-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6366f1;
          margin: 0 0 0.375rem;
        }
        .page-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.6rem, 3vw, 2.25rem);
          font-weight: 700;
          color: #0f0f1a;
          letter-spacing: -0.03em;
          margin: 0 0 0.5rem;
          line-height: 1.1;
        }
        .page-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          color: #9191a8;
          margin: 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr; }
          .products-inner { padding: 1.5rem 1rem 3rem; }
        }
        .products-section-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          color: #9191a8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 1rem;
        }
        .products-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 900px) {
          .products-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .products-grid { grid-template-columns: 1fr; }
        }
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: #fff;
          border-radius: 18px;
          border: 1.5px dashed #ddddf0;
          font-family: 'DM Sans', sans-serif;
          color: #9191a8;
          font-size: 0.9rem;
        }
      `}</style>

      <div className="products-page">
        <main className="products-inner">

          {/* Page Header */}
          <div className="page-header">
            <p className="page-eyebrow">Inventory Management</p>
            <h1 className="page-title">Product Catalog</h1>
            <p className="page-subtitle">Browse and reserve products across all warehouse locations.</p>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <StatsCard
              title="Products"
              value={uniqueProductsCount}
              icon={
                <svg width="18" height="18" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
            />
            <StatsCard
              title="Warehouses"
              value={uniqueWarehousesCount}
              icon={
                <svg width="18" height="18" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              }
            />
            <StatsCard
              title="Total Stock"
              value={totalStockValue.toLocaleString()}
              icon={
                <svg width="18" height="18" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
          </div>

          {/* Section label */}
          <p className="products-section-label">{inventory.length} items</p>

          {/* Product Grid */}
          {inventory.length === 0 ? (
            <div className="empty-state">
              <p>No products found.</p>
            </div>
          ) : (
            <div className="products-grid">
              {inventory.map((item) => (
                <ProductCard key={item.inventoryId} item={item} onReserveClick={handleReserveClick} />
              ))}
            </div>
          )}
        </main>
      </div>

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
    </>
  );
}
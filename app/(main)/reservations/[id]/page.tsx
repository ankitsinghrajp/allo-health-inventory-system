"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";

// Type definitions based on actual API response
interface Product {
  name: string;
  description: string;
}

interface Warehouse {
  name: string;
  location: string;
}

interface Inventory {
  totalStock: number;
  reservedStock: number;
  product: Product;
  warehouse: Warehouse;
}

interface ReservationData {
  id: string;
  status: "PENDING" | "CONFIRMED" | "RELEASED";
  quantity: number;
  expiresAt: string;
  inventory: Inventory;
}

interface ApiResponse {
  success: boolean;
  reservation: ReservationData;
}

interface ActionResponse {
  success: boolean;
  message: string;
}

// Helper to check if reservation data has changed (status or stock)
const hasReservationChanged = (oldData: ReservationData | null, newData: ReservationData | null): boolean => {
  if (!oldData && !newData) return false;
  if (!oldData || !newData) return true;
  return (
    oldData.status !== newData.status ||
    oldData.quantity !== newData.quantity ||
    oldData.expiresAt !== newData.expiresAt ||
    oldData.inventory.totalStock !== newData.inventory.totalStock ||
    oldData.inventory.reservedStock !== newData.inventory.reservedStock
  );
};

export default function ReservationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  const expiredRefreshed = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const fetchReservation = useCallback(async (isPolling = false) => {
    if (!id) return;

    try {
      const response = await fetch(`/api/reservations/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Reservation Not Found");
        }
        throw new Error(`Failed to fetch reservation: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      if (!data.success || !data.reservation) {
        throw new Error("Invalid reservation data");
      }

      setReservation((prev) => {
        if (hasReservationChanged(prev, data.reservation)) {
          return data.reservation;
        }
        return prev;
      });

      setError(null);

      if (data.reservation.status !== "PENDING") {
        setIsExpired(false);
        expiredRefreshed.current = false;
      }

      if (data.reservation.status !== "PENDING" && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (err) {
      if (!isPolling) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
      console.error("Error fetching reservation:", err);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [id]);

  const refreshReservation = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/reservations/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Reservation Not Found");
          setReservation(null);
        }
        return;
      }
      const data: ApiResponse = await response.json();
      if (data.success && data.reservation) {
        setReservation(data.reservation);
      }
    } catch (err) {
      console.error("Error refreshing reservation:", err);
    }
  }, [id]);

  const redirectToProducts = () => {
    router.push("/products");
  };

  const handleConfirm = async () => {
    if (!reservation || reservation.status !== "PENDING") return;
    setConfirmLoading(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/reservations/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 410) {
        const data = await response.json();
        setError(data.error || "Reservation Expired");
        await refreshReservation();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setTimeRemaining(0);
        setTimeout(redirectToProducts, 1500);
        return;
      }

      if (response.status === 404) {
        setError("Reservation Not Found");
        setReservation(null);
        setTimeout(redirectToProducts, 1500);
        return;
      }

      if (!response.ok) {
        throw new Error(`Confirmation failed: ${response.status}`);
      }

      const data: ActionResponse = await response.json();
      if (data.success) {
        setSuccessMessage(data.message || "Reservation confirmed successfully");
        setTimeout(redirectToProducts, 1500);
      } else {
        throw new Error(data.message || "Confirmation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation failed");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!reservation || reservation.status !== "PENDING") return;
    setCancelLoading(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/reservations/${id}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 410) {
        const data = await response.json();
        setError(data.error || "Reservation Expired");
        await refreshReservation();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setTimeRemaining(0);
        setTimeout(redirectToProducts, 1500);
        return;
      }

      if (response.status === 404) {
        setError("Reservation Not Found");
        setReservation(null);
        setTimeout(redirectToProducts, 1500);
        return;
      }

      if (!response.ok) {
        throw new Error(`Cancellation failed: ${response.status}`);
      }

      const data: ActionResponse = await response.json();
      if (data.success) {
        setSuccessMessage(data.message || "Reservation released successfully");
        setTimeout(redirectToProducts, 1500);
      } else {
        throw new Error(data.message || "Cancellation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancellation failed");
    } finally {
      setCancelLoading(false);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!reservation || reservation.status !== "PENDING" || !reservation.expiresAt) {
      setTimeRemaining(0);
      return;
    }

    const expiresAtTime = new Date(reservation.expiresAt).getTime();
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAtTime - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0 && !expiredRefreshed.current) {
        setIsExpired(true);
        expiredRefreshed.current = true;
        refreshReservation();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    updateTimer();
    intervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [reservation, refreshReservation]);

  // Initial fetch
  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchReservation(false);
    }
    expiredRefreshed.current = false;
    setIsExpired(false);
  }, [id, fetchReservation]);

  // Polling effect
  useEffect(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (reservation && reservation.status === "PENDING") {
      pollingIntervalRef.current = setInterval(() => {
        fetchReservation(true);
      }, 2000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [reservation, fetchReservation]);

  const isButtonDisabled = () => {
    if (!reservation) return true;
    const { status } = reservation;
    if (status === "CONFIRMED" || status === "RELEASED") return true;
    if (confirmLoading || cancelLoading) return true;
    if (status === "PENDING" && timeRemaining <= 0) return true;
    return false;
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div style={{ minHeight: "100vh", background: "#f7f7fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 44, height: 44, border: "3px solid #e0e0ef", borderTopColor: "#6366f1",
              borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem",
            }} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#9191a8", fontSize: "0.875rem", margin: 0 }}>
              Loading reservation details…
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── Error (no reservation) ─────────────────────────────────────────────────
  if (error && !reservation) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500&display=swap');`}</style>
        <div style={{ minHeight: "100vh", background: "#f7f7fc", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{
            background: "#fff", borderRadius: 18, border: "1.5px solid #fecaca",
            boxShadow: "0 4px 24px rgba(220,38,38,0.08)",
            padding: "2rem", maxWidth: 400, width: "100%", textAlign: "center",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>⚠️</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#0f0f1a", margin: "0 0 0.5rem", fontSize: "1.1rem" }}>
              Error
            </h2>
            <p style={{ color: "#6b6b84", margin: "0 0 1.25rem", fontSize: "0.875rem" }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "0.625rem 1.5rem", background: "#6366f1", color: "#fff",
                border: "none", borderRadius: 10, fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600, fontSize: "0.875rem", cursor: "pointer",
                boxShadow: "0 2px 10px rgba(99,102,241,0.3)",
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── No reservation ─────────────────────────────────────────────────────────
  if (!reservation) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500&display=swap');`}</style>
        <div style={{ minHeight: "100vh", background: "#f7f7fc", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{
            background: "#fffbeb", borderRadius: 18, border: "1.5px solid #fde68a",
            padding: "2rem", maxWidth: 400, width: "100%", textAlign: "center",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔍</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#0f0f1a", margin: "0 0 0.5rem", fontSize: "1.1rem" }}>
              Not Found
            </h2>
            <p style={{ color: "#6b6b84", margin: 0, fontSize: "0.875rem" }}>Reservation does not exist.</p>
          </div>
        </div>
      </>
    );
  }

  const availableStock = reservation.inventory.totalStock - reservation.inventory.reservedStock;
  const disabled = isButtonDisabled();

  const statusConfig = {
    PENDING:   { label: "Pending",   dot: "#fbbf24", bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
    CONFIRMED: { label: "Confirmed", dot: "#34d399", bg: "#f0fdf8", text: "#059669", border: "#a7f3d0" },
    RELEASED:  { label: "Released",  dot: "#f87171", bg: "#fff5f5", text: "#dc2626", border: "#fecaca" },
  }[reservation.status];

  const timerUrgent = timeRemaining > 0 && timeRemaining <= 60;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }

        .res-page {
          min-height: 100vh;
          background: #f7f7fc;
          background-image: radial-gradient(ellipse 80% 40% at 50% -10%, rgba(99,102,241,0.07) 0%, transparent 70%);
          padding: 2.5rem 1.25rem 4rem;
          font-family: 'DM Sans', sans-serif;
        }
        .res-inner {
          max-width: 680px;
          margin: 0 auto;
        }

        /* Header */
        .res-header { margin-bottom: 1.75rem; }
        .res-eyebrow {
          font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.1em; color: #6366f1; margin: 0 0 0.35rem;
        }
        .res-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 700; color: #0f0f1a;
          letter-spacing: -0.03em; margin: 0 0 0.375rem; line-height: 1.1;
        }
        .res-id-pill {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: #f0f0f8; border: 1px solid #e0e0ef; border-radius: 999px;
          padding: 0.2rem 0.75rem;
          font-size: 0.7rem; font-weight: 600; color: #6b6b84;
          letter-spacing: 0.04em; font-family: 'DM Mono', monospace;
        }

        /* Toast */
        .toast {
          border-radius: 14px; padding: 1rem 1.125rem;
          margin-bottom: 1rem;
          animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
          display: flex; align-items: flex-start; gap: 0.75rem;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .toast-success {
          background: #f0fdf8; border: 1.5px solid #a7f3d0;
        }
        .toast-error {
          background: #fff5f5; border: 1.5px solid #fecaca;
        }
        .toast-icon {
          font-size: 1rem; flex-shrink: 0; margin-top: 1px;
        }
        .toast-title { font-size: 0.85rem; font-weight: 600; margin: 0 0 0.2rem; }
        .toast-sub   { font-size: 0.75rem; margin: 0; }
        .toast-success .toast-title { color: #059669; }
        .toast-success .toast-sub   { color: #34d399; }
        .toast-error .toast-title   { color: #dc2626; }
        .toast-error .toast-sub     { color: #f87171; }

        /* Cards */
        .res-card {
          background: #ffffff;
          border: 1.5px solid #eaeaf5;
          border-radius: 18px;
          box-shadow: 0 1px 3px rgba(15,15,40,0.05), 0 4px 16px rgba(15,15,40,0.04);
          overflow: hidden;
          margin-bottom: 1rem;
        }
        .res-card-header {
          padding: 1rem 1.375rem;
          border-bottom: 1px solid #f0f0f8;
          display: flex; align-items: center; gap: 0.625rem;
        }
        .res-card-icon {
          width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
          background: linear-gradient(135deg, #eef2ff, #e0e7ff);
          border: 1px solid #c7d2fe;
          display: flex; align-items: center; justify-content: center;
        }
        .res-card-title {
          font-family: 'Syne', sans-serif;
          font-size: 0.875rem; font-weight: 700;
          color: #0f0f1a; letter-spacing: -0.01em; margin: 0;
        }
        .res-card-body { padding: 1.25rem 1.375rem; }

        /* Row */
        .detail-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.625rem 0;
          border-bottom: 1px solid #f5f5fb;
        }
        .detail-row:last-child { border-bottom: none; padding-bottom: 0; }
        .detail-row:first-child { padding-top: 0; }
        .detail-label {
          font-size: 0.8rem; font-weight: 500; color: #9191a8;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .detail-value { font-size: 0.875rem; font-weight: 600; color: #0f0f1a; }
        .mono-value {
          font-family: 'DM Mono', 'Courier New', monospace;
          font-size: 0.75rem; background: #f5f5fb; border: 1px solid #eaeaf5;
          border-radius: 6px; padding: 0.2rem 0.5rem; color: #4b4b63;
        }

        /* Status pill */
        .status-pill {
          display: inline-flex; align-items: center; gap: 0.3rem;
          border-radius: 999px; padding: 0.2rem 0.625rem;
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.05em;
        }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        /* Product block */
        .product-name {
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem; font-weight: 700; color: #0f0f1a;
          letter-spacing: -0.02em; margin: 0 0 0.5rem;
        }
        .product-desc {
          font-size: 0.85rem; color: #6b6b84; line-height: 1.55; margin: 0;
        }

        /* Warehouse */
        .warehouse-name {
          font-family: 'Syne', sans-serif;
          font-size: 1rem; font-weight: 700; color: #0f0f1a;
          letter-spacing: -0.015em; margin: 0 0 0.375rem;
        }
        .warehouse-loc {
          display: inline-flex; align-items: center; gap: 0.35rem;
          font-size: 0.8rem; color: #9191a8; margin: 0;
        }

        /* Stock row */
        .stock-total-row {
          padding-top: 0.75rem;
          margin-top: 0.25rem;
          border-top: 1.5px solid #eaeaf5;
        }
        .stock-available {
          font-size: 1rem; font-weight: 700; color: #059669;
        }

        /* Timer card */
        .timer-display {
          text-align: center; padding: 0.5rem 0 0.25rem;
        }
        .timer-digits {
          font-family: 'Syne', sans-serif;
          font-size: 3rem; font-weight: 700; letter-spacing: 0.04em;
          line-height: 1;
        }
        .timer-urgent { color: #dc2626; }
        .timer-normal { color: #6366f1; }
        .timer-bar-wrap {
          height: 4px; background: #f0f0f8; border-radius: 999px;
          margin-top: 1rem; overflow: hidden;
        }
        .timer-expired {
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-size: 1rem; font-weight: 600; color: #dc2626;
          background: #fff5f5; border: 1.5px solid #fecaca;
          border-radius: 12px; padding: 0.75rem 1.25rem;
        }

        /* Buttons */
        .action-bar {
          display: flex; flex-direction: column; gap: 0.75rem;
          margin-top: 0.25rem;
        }
        @media (min-width: 480px) {
          .action-bar { flex-direction: row; }
        }
        .btn-confirm, .btn-cancel-res {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 0.5rem; padding: 0.8rem 1.25rem; border-radius: 12px;
          font-family: 'DM Sans', sans-serif; font-size: 0.875rem;
          font-weight: 700; cursor: pointer; border: none;
          transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
          letter-spacing: 0.01em;
        }
        .btn-confirm {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          box-shadow: 0 2px 12px rgba(16,185,129,0.3);
          border: 1.5px solid #059669;
        }
        .btn-confirm:hover:not(:disabled) {
          box-shadow: 0 4px 20px rgba(16,185,129,0.4);
          transform: translateY(-1px);
        }
        .btn-cancel-res {
          background: #fff;
          color: #dc2626;
          border: 1.5px solid #fca5a5;
          box-shadow: 0 1px 4px rgba(220,38,38,0.08);
        }
        .btn-cancel-res:hover:not(:disabled) {
          background: #fff5f5;
          border-color: #f87171;
          box-shadow: 0 4px 16px rgba(220,38,38,0.12);
          transform: translateY(-1px);
        }
        .btn-confirm:disabled, .btn-cancel-res:disabled {
          opacity: 0.45; cursor: not-allowed; transform: none !important; box-shadow: none !important;
        }
        .btn-confirm:active:not(:disabled),
        .btn-cancel-res:active:not(:disabled) { transform: translateY(0); }

        .spin-sm {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite; flex-shrink: 0;
        }
        .spin-sm-red {
          border-color: rgba(220,38,38,0.25); border-top-color: #dc2626;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .res-page { padding: 1.5rem 1rem 3rem; }
        }
      `}</style>

      <div className="res-page">
        <div className="res-inner">

          {/* Page Header */}
          <div className="res-header">
            <p className="res-eyebrow">Inventory Management</p>
            <h1 className="res-title">Reservation</h1>
            <span className="res-id-pill">#{reservation.id}</span>
          </div>

          {/* Success Toast */}
          {successMessage && (
            <div className="toast toast-success">
              <span className="toast-icon">✓</span>
              <div>
                <p className="toast-title">{successMessage}</p>
                <p className="toast-sub">Redirecting to products…</p>
              </div>
            </div>
          )}

          {/* Error Toast */}
          {error && (
            <div className="toast toast-error">
              <span className="toast-icon">⚠</span>
              <div>
                <p className="toast-title">{error}</p>
                {(error.includes("Expired") || error.includes("Not Found")) && (
                  <p className="toast-sub">Redirecting to products…</p>
                )}
              </div>
            </div>
          )}

          {/* Card 1: Reservation Status */}
          <div className="res-card">
            <div className="res-card-header">
              <div className="res-card-icon">
                <svg width="14" height="14" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="res-card-title">Reservation Details</p>
            </div>
            <div className="res-card-body">
              <div className="detail-row">
                <span className="detail-label">Reservation ID</span>
                <span className="mono-value">{reservation.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span
                  className="status-pill"
                  style={{ background: statusConfig.bg, border: `1px solid ${statusConfig.border}`, color: statusConfig.text }}
                >
                  <span className="status-dot" style={{ background: statusConfig.dot }} />
                  {statusConfig.label}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Quantity</span>
                <span className="detail-value">{reservation.quantity}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Product Details */}
          <div className="res-card">
            <div className="res-card-header">
              <div className="res-card-icon">
                <svg width="14" height="14" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="res-card-title">Product Information</p>
            </div>
            <div className="res-card-body">
              <p className="product-name">{reservation.inventory.product.name}</p>
              <p className="product-desc">{reservation.inventory.product.description}</p>
            </div>
          </div>

          {/* Card 3: Warehouse Details */}
          <div className="res-card">
            <div className="res-card-header">
              <div className="res-card-icon">
                <svg width="14" height="14" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p className="res-card-title">Warehouse</p>
            </div>
            <div className="res-card-body">
              <p className="warehouse-name">{reservation.inventory.warehouse.name}</p>
              <p className="warehouse-loc">
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {reservation.inventory.warehouse.location}
              </p>
            </div>
          </div>

          {/* Card 4: Inventory Details */}
          <div className="res-card">
            <div className="res-card-header">
              <div className="res-card-icon">
                <svg width="14" height="14" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="res-card-title">Inventory</p>
            </div>
            <div className="res-card-body">
              <div className="detail-row">
                <span className="detail-label">Total Stock</span>
                <span className="detail-value">{reservation.inventory.totalStock}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Reserved Stock</span>
                <span className="detail-value">{reservation.inventory.reservedStock}</span>
              </div>
              <div className={`detail-row stock-total-row`}>
                <span className="detail-label">Available Stock</span>
                <span className="stock-available">{availableStock}</span>
              </div>
            </div>
          </div>

          {/* Card 5: Countdown Timer — only when PENDING */}
          {reservation.status === "PENDING" && (
            <div className="res-card">
              <div className="res-card-header">
                <div className="res-card-icon">
                  <svg width="14" height="14" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="res-card-title">Time Remaining</p>
              </div>
              <div className="res-card-body">
                <div className="timer-display">
                  {timeRemaining > 0 ? (
                    <>
                      <div className={`timer-digits ${timerUrgent ? "timer-urgent" : "timer-normal"}`}>
                        {formatTime(timeRemaining)}
                      </div>
                      <div className="timer-bar-wrap">
                        <div style={{
                          height: "100%",
                          borderRadius: "999px",
                          background: timerUrgent
                            ? "linear-gradient(90deg, #f87171, #dc2626)"
                            : "linear-gradient(90deg, #818cf8, #6366f1)",
                          transition: "width 1s linear",
                        }} />
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "#9191a8", margin: "0.75rem 0 0", fontWeight: 500 }}>
                        {timerUrgent ? "⚡ Hurry — reservation expiring soon!" : "Complete your reservation before it expires"}
                      </p>
                    </>
                  ) : (
                    <span className="timer-expired">⏰ Reservation Expired</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-bar">
            <button
              onClick={handleConfirm}
              disabled={disabled}
              className="btn-confirm"
            >
              {confirmLoading ? (
                <>
                  <span className="spin-sm" />
                  Confirming…
                </>
              ) : (
                <>
                  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirm Purchase
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={disabled}
              className="btn-cancel-res"
            >
              {cancelLoading ? (
                <>
                  <span className="spin-sm spin-sm-red" />
                  Cancelling…
                </>
              ) : (
                <>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel Reservation
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
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
        if (response.status === 404) throw new Error("Reservation Not Found");
        throw new Error(`Failed to fetch reservation: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      if (!data.success || !data.reservation) throw new Error("Invalid reservation data");

      setReservation((prev) => {
        if (hasReservationChanged(prev, data.reservation)) return data.reservation;
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
      if (!isPolling) setError(err instanceof Error ? err.message : "An error occurred");
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
        if (response.status === 404) { setError("Reservation Not Found"); setReservation(null); }
        return;
      }
      const data: ApiResponse = await response.json();
      if (data.success && data.reservation) setReservation(data.reservation);
    } catch (err) {
      console.error("Error refreshing reservation:", err);
    }
  }, [id]);

  const redirectToProducts = () => router.push("/products");

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
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
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

      if (!response.ok) throw new Error(`Confirmation failed: ${response.status}`);

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
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
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

      if (!response.ok) throw new Error(`Cancellation failed: ${response.status}`);

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
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }

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
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      }
    };

    updateTimer();
    intervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [reservation, refreshReservation]);

  // Initial fetch
  useEffect(() => {
    if (id) { setLoading(true); fetchReservation(false); }
    expiredRefreshed.current = false;
    setIsExpired(false);
  }, [id, fetchReservation]);

  // Polling effect
  useEffect(() => {
    if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null; }

    if (reservation && reservation.status === "PENDING") {
      pollingIntervalRef.current = setInterval(() => fetchReservation(true), 2000);
    }

    return () => {
      if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null; }
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

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading reservation details…</p>
        </div>
      </div>
    );
  }

  // ── Error (no reservation) ──
  if (error && !reservation) {
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

  // ── No reservation ──
  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-yellow-200 shadow-sm p-8 max-w-sm w-full text-center">
          <div className="w-10 h-10 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Not Found</h2>
          <p className="text-sm text-gray-500">Reservation does not exist.</p>
        </div>
      </div>
    );
  }

  const availableStock = reservation.inventory.totalStock - reservation.inventory.reservedStock;
  const disabled = isButtonDisabled();
  const timerUrgent = timeRemaining > 0 && timeRemaining <= 60;

  const statusConfig = {
    PENDING:   { label: "Pending",   dotClass: "bg-yellow-400", pillClass: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    CONFIRMED: { label: "Confirmed", dotClass: "bg-green-500",  pillClass: "bg-green-50 text-green-700 border-green-200"   },
    RELEASED:  { label: "Released",  dotClass: "bg-red-400",    pillClass: "bg-red-50 text-red-700 border-red-200"         },
  }[reservation.status];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Page Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">Inventory Management</p>
          <h1 className="text-2xl font-semibold text-gray-900">Reservation</h1>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-full px-3 py-1">
            <span className="text-xs font-medium text-gray-500 font-mono">#{reservation.id}</span>
          </div>
        </div>

        {/* Success Toast */}
        {successMessage && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3.5 mb-4">
            <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-green-700">{successMessage}</p>
              <p className="text-xs text-green-600 mt-0.5">Redirecting to products…</p>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3.5 mb-4">
            <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-700">{error}</p>
              {(error.includes("Expired") || error.includes("Not Found")) && (
                <p className="text-xs text-red-500 mt-0.5">Redirecting to products…</p>
              )}
            </div>
          </div>
        )}

        {/* Card: Reservation Details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Reservation Details</h2>
          </div>
          <div className="px-5 divide-y divide-gray-50">
            <div className="flex items-center justify-between py-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reservation ID</span>
              <span className="text-xs font-medium text-gray-600 font-mono bg-gray-100 border border-gray-200 rounded-md px-2 py-1">{reservation.id}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.pillClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                {statusConfig.label}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quantity</span>
              <span className="text-sm font-semibold text-gray-900">{reservation.quantity}</span>
            </div>
          </div>
        </div>

        {/* Card: Product Information */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Product Information</h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-base font-semibold text-gray-900 mb-1">{reservation.inventory.product.name}</p>
            <p className="text-sm text-gray-500 leading-relaxed">{reservation.inventory.product.description}</p>
          </div>
        </div>

        {/* Card: Warehouse */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Warehouse</h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-base font-semibold text-gray-900 mb-1">{reservation.inventory.warehouse.name}</p>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {reservation.inventory.warehouse.location}
            </div>
          </div>
        </div>

        {/* Card: Inventory */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Inventory</h2>
          </div>
          <div className="px-5 divide-y divide-gray-50">
            <div className="flex items-center justify-between py-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Stock</span>
              <span className="text-sm font-semibold text-gray-900">{reservation.inventory.totalStock}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reserved Stock</span>
              <span className="text-sm font-semibold text-gray-900">{reservation.inventory.reservedStock}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Available Stock</span>
              <span className="text-sm font-semibold text-green-600">{availableStock}</span>
            </div>
          </div>
        </div>

        {/* Card: Countdown Timer — only when PENDING */}
        {reservation.status === "PENDING" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-gray-900">Time Remaining</h2>
            </div>
            <div className="px-5 py-6 text-center">
              {timeRemaining > 0 ? (
                <>
                  <p className={`text-5xl font-semibold tabular-nums tracking-tight ${timerUrgent ? "text-red-600" : "text-indigo-600"}`}>
                    {formatTime(timeRemaining)}
                  </p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-5">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${timerUrgent ? "bg-red-400" : "bg-indigo-500"}`}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3 font-medium">
                    {timerUrgent
                      ? "⚡ Hurry — reservation expiring soon!"
                      : "Complete your reservation before it expires"}
                  </p>
                </>
              ) : (
                <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-red-700">Reservation Expired</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleConfirm}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            {confirmLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Confirming…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Confirm Purchase
              </>
            )}
          </button>

          <button
            onClick={handleCancel}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            {cancelLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                Cancelling…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel Reservation
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
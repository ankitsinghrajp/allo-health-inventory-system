"use client";

import { useParams } from "next/navigation";
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

interface ConfirmResponse {
  success: boolean;
  message: string;
}

export default function ReservationPage() {
  const params = useParams();
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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const fetchReservation = useCallback(async () => {
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
      setReservation(data.reservation);
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
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching reservation:", err);
    } finally {
      setLoading(false);
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
        // Reservation expired
        const data = await response.json();
        setError(data.error || "Reservation Expired");
        await refreshReservation(); // This will update status to RELEASED
        // Stop timer manually
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setTimeRemaining(0);
        return;
      }

      if (response.status === 404) {
        setError("Reservation Not Found");
        setReservation(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`Confirmation failed: ${response.status}`);
      }

      const data: ConfirmResponse = await response.json();
      if (data.success) {
        setSuccessMessage(data.message || "Reservation confirmed successfully");
        await refreshReservation(); // This will change status to CONFIRMED
        // Timer will be cleared automatically because status is no longer PENDING
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
        return;
      }

      if (response.status === 404) {
        setError("Reservation Not Found");
        setReservation(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`Cancellation failed: ${response.status}`);
      }

      const data: ConfirmResponse = await response.json();
      if (data.success) {
        setSuccessMessage(data.message || "Reservation released successfully");
        await refreshReservation(); // Status becomes RELEASED
      } else {
        throw new Error(data.message || "Cancellation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancellation failed");
    } finally {
      setCancelLoading(false);
    }
  };

  // Timer effect
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

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchReservation();
    }
    expiredRefreshed.current = false;
    setIsExpired(false);
  }, [id, fetchReservation]);

  const isButtonDisabled = () => {
    if (!reservation) return true;
    const { status } = reservation;
    if (status === "CONFIRMED" || status === "RELEASED") return true;
    if (confirmLoading || cancelLoading) return true;
    if (status === "PENDING" && timeRemaining <= 0) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading reservation details...</p>
        </div>
      </div>
    );
  }

  if (error && !reservation) {
    // Show not found or fatal error
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

  if (!reservation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-yellow-700 font-semibold text-lg">Not Found</h2>
          <p className="text-yellow-600 mt-2">Reservation does not exist.</p>
        </div>
      </div>
    );
  }

  const availableStock = reservation.inventory.totalStock - reservation.inventory.reservedStock;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success Toast */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in">
            <p className="text-green-700 text-sm font-medium">{successMessage}</p>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Card 1: Reservation Status */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Reservation Details</h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Reservation ID</span>
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {reservation.id}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Status</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  reservation.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800"
                    : reservation.status === "CONFIRMED"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {reservation.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Quantity</span>
              <span className="text-gray-900">{reservation.quantity}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Product Details */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Product Information</h2>
          </div>
          <div className="p-6 space-y-2">
            <h3 className="text-lg font-medium text-gray-900">
              {reservation.inventory.product.name}
            </h3>
            <p className="text-gray-600">{reservation.inventory.product.description}</p>
          </div>
        </div>

        {/* Card 3: Warehouse Details */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Warehouse</h2>
          </div>
          <div className="p-6 space-y-2">
            <h3 className="text-lg font-medium text-gray-900">
              {reservation.inventory.warehouse.name}
            </h3>
            <p className="text-gray-600">Location: {reservation.inventory.warehouse.location}</p>
          </div>
        </div>

        {/* Card 4: Inventory Details */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Inventory</h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Stock</span>
              <span className="font-medium">{reservation.inventory.totalStock}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Reserved Stock</span>
              <span className="font-medium">{reservation.inventory.reservedStock}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-gray-800 font-semibold">Available Stock</span>
              <span className="font-bold text-green-600">{availableStock}</span>
            </div>
          </div>
        </div>

        {/* Card 5: Countdown Timer - only show if PENDING */}
        {reservation.status === "PENDING" && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Time Remaining</h2>
            </div>
            <div className="p-6 text-center">
              {timeRemaining > 0 ? (
                <div className="text-4xl font-mono font-bold text-blue-600 tracking-wider">
                  {formatTime(timeRemaining)}
                </div>
              ) : (
                <div className="text-red-600 font-semibold text-lg">
                  ⏰ Reservation Expired
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button
            onClick={handleConfirm}
            disabled={isButtonDisabled()}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              isButtonDisabled()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg"
            }`}
          >
            {confirmLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Confirming...
              </span>
            ) : (
              "Confirm Purchase"
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isButtonDisabled()}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              isButtonDisabled()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg"
            }`}
          >
            {cancelLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Cancelling...
              </span>
            ) : (
              "Cancel Reservation"
            )}
          </button>
        </div>
      </div>

      {/* Tailwind animation for fade-in */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
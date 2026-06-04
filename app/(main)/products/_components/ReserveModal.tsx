import { useEffect, useState } from "react";

export const ReserveModal = ({
  isOpen,
  onClose,
  productName,
  warehouseName,
  maxAvailable,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  warehouseName: string;
  maxAvailable: number;
  onConfirm: (quantity: number) => void;
  isLoading: boolean;
}) => {
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
          <p className="text-gray-700">
            <span className="font-medium">Available:</span> {maxAvailable}
          </p>
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
              onChange={(e) => setQuantity(Math.min(maxAvailable, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Reserve"}
          </button>
        </div>
      </div>
    </div>
  );
};
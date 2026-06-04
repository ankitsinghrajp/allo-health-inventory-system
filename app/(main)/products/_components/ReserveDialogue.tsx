import { useState } from "react";

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

type Status = "Available" | "Low Stock" | "Out Of Stock";

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function ReserveDialog({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [warehouse, setWarehouse] = useState(product.warehouses[0]?.name ?? "");
  const selectedWH = product.warehouses.find((w) => w.name === warehouse);
  const maxQty = selectedWH?.available ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Reserve Inventory</h2>
            <p className="text-sm text-slate-500 mt-0.5">Fill in reservation details below</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <XIcon className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Product</label>
            <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800">
              {product.name}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Warehouse</label>
            <select
              value={warehouse}
              onChange={(e) => {
                setWarehouse(e.target.value);
                setQty(1);
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {product.warehouses
                .filter((w) => w.available > 0)
                .map((w) => (
                  <option key={w.name} value={w.name}>
                    {w.name} Warehouse
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Available Units</label>
            <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-emerald-700">
              {maxQty.toLocaleString()} units
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Quantity to Reserve
            </label>
            <input
              type="number"
              min={1}
              max={maxQty}
              value={qty}
              onChange={(e) => setQty(Math.min(maxQty, Math.max(1, Number(e.target.value))))}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {qty > maxQty && (
              <p className="mt-1 text-xs text-red-500">Cannot exceed available stock</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
          >
            Confirm Reserve
          </button>
        </div>
      </div>
    </div>
  );
}
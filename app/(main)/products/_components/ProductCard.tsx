import { StatusBadge } from "./StatusBadge";
import { StockBar } from "./StockBar";


function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  );
}

export function ProductCard({ product, onReserve }: { product: Product; onReserve: () => void }) {
  const isOOS = product.status === "Out Of Stock";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-slate-50">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            <TagIcon className="w-3 h-3" />
            {product.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
            ${product.price.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title row */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="font-bold text-slate-900 text-base leading-tight">{product.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">SKU · {product.sku}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Available</p>
            <p className={`text-lg font-extrabold ${isOOS ? "text-red-500" : "text-emerald-500"}`}>
              {product.totalAvailable.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 my-4" />

        {/* Warehouse bars */}
        <div className="flex-1 space-y-0">
          {product.warehouses.map((wh) => (
            <StockBar key={wh.name} name={wh.name} available={wh.available} total={wh.total} />
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 my-4" />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <StatusBadge status={product.status} />
          <button
            disabled={isOOS}
            onClick={onReserve}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              isOOS
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm shadow-blue-200"
            }`}
          >
            {isOOS ? "Out of Stock" : "Reserve"}
            {!isOOS && <ArrowRightIcon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
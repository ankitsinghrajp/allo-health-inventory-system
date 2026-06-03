export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          © 2026 Reservex · Built for high-concurrency commerce.
        </p>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          All systems operational
        </div>
      </div>
    </footer>
  );
}
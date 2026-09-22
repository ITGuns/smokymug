export function Ticker({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div aria-hidden className="relative overflow-hidden border-y border-charcoal-900/10 bg-cream-50 py-3">
      <div className="flex w-max animate-[ticker_48s_linear_infinite] gap-10 whitespace-nowrap [--gap:2.5rem] motion-reduce:animate-none">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10 font-label text-[15px] uppercase tracking-[0.24em] text-charcoal-700">
            {t}
            <span className="h-1.5 w-1.5 rounded-full bg-ember-500" />
          </span>
        ))}
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

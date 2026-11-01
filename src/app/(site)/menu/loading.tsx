export default function Loading() {
  return (
    <div className="bg-cream-100">
      <div className="bg-charcoal-950 pb-14 pt-32 md:pt-40">
        <div className="container-site space-y-4">
          <div className="skeleton h-4 w-24 rounded-full bg-cream-50/10" />
          <div className="skeleton h-16 w-3/4 max-w-2xl rounded-2xl bg-cream-50/10" />
        </div>
      </div>
      {/* L2-D shape: featured column beside a clean list */}
      <div className="container-site py-14 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-12">
        <div className="skeleton mb-10 h-[420px] rounded-2xl lg:mb-0" />
        <div className="space-y-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

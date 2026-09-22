export default function Loading() {
  return (
    <div className="bg-cream-100">
      <div className="bg-charcoal-950 pb-14 pt-32 md:pt-40">
        <div className="container-site space-y-4">
          <div className="skeleton h-4 w-24 rounded-full bg-cream-50/10" />
          <div className="skeleton h-16 w-3/4 max-w-2xl rounded-2xl bg-cream-50/10" />
        </div>
      </div>
      <div className="container-site grid gap-4 py-14 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="skeleton h-40 rounded-[22px]" />
        ))}
      </div>
    </div>
  );
}

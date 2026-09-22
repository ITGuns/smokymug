"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { AvailabilityInfo } from "@/lib/availability";
import type { CategoryNode, ItemNode } from "@/lib/data/menu";
import { DIETARY_FILTERS, type DietaryFilterKey } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { AddonsList } from "./AddonsList";
import { MenuItemCard } from "./MenuItemCard";
import { MenuItemModal } from "./MenuItemModal";
import { applyFilters, EMPTY_FILTERS, hasActiveFilters, type MenuFilters } from "./menu-filter";

export function MenuExplorer({
  categories,
  availability,
  happyHourNow,
  initialCategory,
  initialItem,
}: {
  categories: CategoryNode[];
  availability: Record<number, AvailabilityInfo>;
  happyHourNow: boolean;
  initialCategory?: string;
  initialItem?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const allItems = useMemo(() => categories.flatMap((c) => c.sections.flatMap((s) => s.items)), [categories]);
  const itemBySlug = useMemo(() => new Map(allItems.map((i) => [i.slug, i])), [allItems]);

  const [active, setActive] = useState<string>(() => {
    const fromItem = initialItem ? itemBySlug.get(initialItem)?.categorySlug : undefined;
    return fromItem ?? (categories.find((c) => c.slug === initialCategory)?.slug || categories[0]?.slug || "");
  });
  const [filters, setFilters] = useState<MenuFilters>(EMPTY_FILTERS);
  const deferredQuery = useDeferredValue(filters.query);
  const [openSlug, setOpenSlug] = useState<string | null>(initialItem ?? null);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const effectiveFilters = useMemo(() => ({ ...filters, query: deferredQuery }), [filters, deferredQuery]);
  const searching = Boolean(deferredQuery.trim());
  const filtered = useMemo(() => applyFilters(categories, effectiveFilters, availability), [categories, effectiveFilters, availability]);
  const visibleCategories = searching ? filtered.filter((c) => c.itemCount > 0) : filtered.filter((c) => c.slug === active);
  const totalMatches = filtered.reduce((n, c) => n + c.itemCount, 0);
  const openItem: ItemNode | null = openSlug ? (itemBySlug.get(openSlug) ?? null) : null;

  const syncUrl = useCallback(
    (next: { category?: string; item?: string | null }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.category !== undefined) params.set("category", next.category);
      if (next.item === null) params.delete("item");
      else if (next.item) params.set("item", next.item);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const selectCategory = (slug: string) => {
    setActive(slug);
    setFilters((f) => ({ ...f, query: "" }));
    syncUrl({ category: slug, item: null });
    requestAnimationFrame(() => {
      const top = (contentRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 150;
      if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
    });
  };
  const openModal = (slug: string) => {
    setOpenSlug(slug);
    syncUrl({ item: slug });
  };
  const closeModal = useCallback(() => {
    setOpenSlug(null);
    syncUrl({ item: null });
  }, [syncUrl]);

  useEffect(() => {
    if (initialItem && itemBySlug.has(initialItem)) setOpenSlug(initialItem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDietary = (key: DietaryFilterKey) =>
    setFilters((f) => ({ ...f, dietary: f.dietary.includes(key) ? f.dietary.filter((k) => k !== key) : [...f.dietary, key] }));
  const activeFilterCount = filters.dietary.length + (filters.availableNow ? 1 : 0) + (filters.featured ? 1 : 0);
  const toggleSection = (id: number) =>
    setCollapsed((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <>
      {/* Sticky category + search bar */}
      <div className="sticky top-[68px] z-30 border-b border-charcoal-900/10 bg-cream-100/90 backdrop-blur-xl md:top-[76px]">
        <div className="container-site flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label="Menu categories" className="-mx-5 overflow-x-auto px-5 scrollbar-none sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
            <ul className="flex w-max gap-1.5">
              {categories.map((c) => {
                const isActive = !searching && c.slug === active;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => selectCategory(c.slug)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "relative h-10 whitespace-nowrap rounded-full px-4 text-[14px] font-semibold tracking-tight transition-colors",
                        isActive ? "text-cream-50" : "text-charcoal-700 hover:bg-charcoal-900/5 hover:text-charcoal-900",
                      )}
                    >
                      {isActive && <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-charcoal-900" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                      <span className="relative">{c.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <label className="relative flex-1 lg:w-72">
              <span className="sr-only">Search the menu</span>
              <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="9" cy="9" r="6" />
                <path d="M14 14l4 4" />
              </svg>
              <input
                type="search"
                value={filters.query}
                onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                placeholder="Search brisket, latte, vegan…"
                className="h-10 w-full rounded-full border border-charcoal-900/12 bg-cream-50 pl-10 pr-4 text-[14px] text-charcoal-900 placeholder:text-charcoal-500/70 focus:border-ember-400 focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-controls="menu-filters"
              className={cn(
                "flex h-10 items-center gap-2 rounded-full border px-4 text-[14px] font-semibold transition-colors",
                activeFilterCount ? "border-ember-500 bg-ember-500 text-cream-50" : "border-charcoal-900/12 bg-cream-50 text-charcoal-800 hover:border-charcoal-900/30",
              )}
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 5h14M6 10h8M8 15h4" />
              </svg>
              Filters{activeFilterCount ? ` · ${activeFilterCount}` : ""}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              id="menu-filters"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-t border-charcoal-900/8"
            >
              <div className="container-site flex flex-wrap items-center gap-2 py-3">
                <span className="mr-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-charcoal-500">Dietary</span>
                {DIETARY_FILTERS.map((d) => (
                  <FilterChip key={d.key} active={filters.dietary.includes(d.key)} onClick={() => toggleDietary(d.key)}>
                    {d.label}
                  </FilterChip>
                ))}
                <span className="mx-2 hidden h-5 w-px bg-charcoal-900/15 sm:block" />
                <FilterChip active={filters.availableNow} onClick={() => setFilters((f) => ({ ...f, availableNow: !f.availableNow }))}>
                  Available now
                </FilterChip>
                <FilterChip active={filters.featured} onClick={() => setFilters((f) => ({ ...f, featured: !f.featured }))}>
                  Signature
                </FilterChip>
                {hasActiveFilters(filters) && (
                  <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="ml-auto text-[13px] font-semibold text-ember-600 hover:underline">
                    Clear all
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div ref={contentRef} className="container-site py-10 lg:py-14">
        {searching && (
          <p className="mb-8 text-[15px] text-charcoal-700" role="status" aria-live="polite">
            {totalMatches === 0 ? (
              <>
                No items match <span className="font-semibold text-charcoal-900">“{deferredQuery}”</span>.
              </>
            ) : (
              <>
                {totalMatches} {totalMatches === 1 ? "item" : "items"} for <span className="font-semibold text-charcoal-900">“{deferredQuery}”</span> across the menu.
              </>
            )}
          </p>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={searching ? "search" : active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-16"
          >
            {visibleCategories.map((cat) => (
              <section key={cat.id} aria-labelledby={`cat-${cat.id}`} className="scroll-mt-40">
                <header className="mb-8 max-w-3xl">
                  <h2 id={`cat-${cat.id}`} className="font-display text-[clamp(2.2rem,4.5vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-charcoal-900 display-sharp">
                    {cat.name}
                  </h2>
                  {cat.hoursNote && <p className="mt-3 font-label text-[15px] tracking-[0.16em] text-ember-600">{cat.hoursNote}</p>}
                  {cat.description && <p className="mt-2 text-[16px] leading-relaxed text-charcoal-700">{cat.description}</p>}
                </header>

                {cat.itemCount === 0 && !searching && (
                  <div className="rounded-[22px] border border-dashed border-charcoal-900/15 p-10 text-center text-charcoal-500">
                    Nothing here matches your filters.{" "}
                    <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="font-semibold text-ember-600 hover:underline">
                      Clear filters
                    </button>
                  </div>
                )}

                <div className="space-y-12">
                  {cat.sections.map((sec) => {
                    const isCollapsed = collapsed.has(sec.id);
                    return (
                      <section key={sec.id} aria-labelledby={`sec-${sec.id}`}>
                        <div className="mb-5 flex items-end justify-between gap-4 border-b border-charcoal-900/10 pb-3">
                          <div>
                            <h3 id={`sec-${sec.id}`} className="font-display text-2xl font-semibold text-charcoal-900">
                              {sec.name}
                            </h3>
                            {sec.description && sec.sectionType === "items" && <p className="mt-1 text-[14px] text-charcoal-500">{sec.description}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleSection(sec.id)}
                            aria-expanded={!isCollapsed}
                            className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-charcoal-500 hover:bg-charcoal-900/5 lg:hidden"
                          >
                            {isCollapsed ? "Show" : "Hide"}
                            <svg viewBox="0 0 20 20" className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M5 8l5 5 5-5" />
                            </svg>
                          </button>
                        </div>
                        {!isCollapsed &&
                          (sec.sectionType === "addons" && sec.linkedGroup ? (
                            <AddonsList group={sec.linkedGroup} description={sec.description} />
                          ) : (
                            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                              {sec.items.map((item) => (
                                <li key={item.id}>
                                  <MenuItemCard item={item} availability={availability[item.id]} happyHourNow={happyHourNow} onOpen={openModal} />
                                </li>
                              ))}
                            </ul>
                          ))}
                      </section>
                    );
                  })}
                </div>
              </section>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <MenuItemModal item={openItem} availability={openItem ? availability[openItem.id] : undefined} happyHourNow={happyHourNow} onClose={closeModal} />
    </>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
        active ? "border-charcoal-900 bg-charcoal-900 text-cream-50" : "border-charcoal-900/12 bg-cream-50 text-charcoal-800 hover:border-charcoal-900/40",
      )}
    >
      {children}
    </button>
  );
}

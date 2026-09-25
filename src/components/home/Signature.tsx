import Image from "next/image";
import Link from "next/link";
import type { ItemNode } from "@/lib/data/menu";
import { TiltCard } from "@/components/motion/TiltCard";
import { DietaryBadge, Pill } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { money } from "@/lib/format";
import { cn } from "@/lib/cn";

export type FeaturedItem = ItemNode & { availabilityLabel: string | null; availableNow: boolean };

function Price({ item, dark }: { item: FeaturedItem; dark?: boolean }) {
  if (item.price == null) return <span className="font-label text-xl tracking-wide">{item.priceNote ?? "Varies"}</span>;
  return (
    <span className={cn("shrink-0 font-label text-2xl tracking-wide", dark ? "text-cream-50" : "text-charcoal-900")}>
      {money(item.price)}
      {item.largePrice != null && <span className={dark ? "text-cream-400/80" : "text-charcoal-500/70"}> / {money(item.largePrice)}</span>}
    </span>
  );
}

export function Signature({ items }: { items: FeaturedItem[] }) {
  const withImage = items.filter((i) => i.image);
  const textOnly = items.filter((i) => !i.image);
  const lead = withImage[0];
  const rest = [...withImage.slice(1), ...textOnly].slice(0, 6);

  return (
    <section className="relative overflow-hidden bg-cream-100 py-24 lg:py-36">
      <div className="container-site">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <h2 className="font-display text-[clamp(2.4rem,5vw,4.4rem)] font-semibold leading-[1.02] text-charcoal-900 display-sharp">Signature plates</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <ButtonLink href="/menu" variant="secondary" arrow>
              View Full Menu
            </ButtonLink>
          </Reveal>
        </div>
        <p className="mt-4 text-[13px] text-charcoal-500 md:hidden">Swipe to browse →</p>
      </div>

      {/* Mobile: snap carousel. md+: editorial grid. */}
      <div className="mt-8 md:mt-12">
        <div className="container-site">
          <RevealGroup className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 md:mx-0 md:grid md:grid-cols-6 md:gap-5 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-12">
            {lead && (
              <RevealItem className="w-[84vw] shrink-0 snap-start sm:w-[70vw] md:col-span-6 md:w-auto lg:col-span-7 lg:row-span-2">
                <TiltCard max={3} className="group h-full">
                  <Link
                    href={`/menu?item=${lead.slug}`}
                    className="relative block h-full min-h-[420px] overflow-hidden rounded-[28px] bg-charcoal-900 text-cream-50 shadow-card transition-shadow duration-500 hover:shadow-lift lg:min-h-[560px]"
                  >
                    <Image src={lead.image!} alt={lead.imageAlt ?? lead.name} fill sizes="(min-width: 1024px) 58vw, 84vw" className="object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.04]" />
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-7 lg:p-9">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone="emberOnDark">{lead.categoryName}</Pill>
                        {lead.availabilityLabel && <Pill tone="light">{lead.availabilityLabel}</Pill>}
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-6">
                        <div>
                          <h3 className="font-display text-3xl font-semibold leading-tight lg:text-4xl">{lead.name}</h3>
                          {lead.description && <p className="mt-2 max-w-md text-[15px] leading-relaxed text-cream-100/80">{lead.description}</p>}
                          {lead.dietaryTags.length > 0 && (
                            <div className="mt-3 flex gap-1.5">
                              {lead.dietaryTags.map((t) => (
                                <DietaryBadge key={t} tag={t} onDark />
                              ))}
                            </div>
                          )}
                        </div>
                        <Price item={lead} dark />
                      </div>
                    </div>
                  </Link>
                </TiltCard>
              </RevealItem>
            )}

            {rest.map((item, i) => (
              <RevealItem
                key={item.id}
                className={cn("w-[78vw] shrink-0 snap-start sm:w-[60vw] md:col-span-3 md:w-auto lg:col-span-5", i >= 2 && "lg:col-span-4")}
              >
                <TiltCard max={5} className="group h-full">
                  <Link
                    href={`/menu?item=${item.slug}`}
                    className={cn(
                      "flex h-full flex-col overflow-hidden rounded-[22px] shadow-card transition-shadow duration-500 hover:shadow-lift",
                      item.image ? "bg-cream-50" : "bg-charcoal-900 text-cream-50",
                    )}
                  >
                    {item.image ? (
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image src={item.image} alt={item.imageAlt ?? item.name} fill sizes="(min-width: 1024px) 30vw, (min-width: 768px) 50vw, 78vw" className="object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.05]" />
                        {item.availabilityLabel && <Pill tone="light" className="absolute left-4 top-4">{item.availabilityLabel}</Pill>}
                      </div>
                    ) : (
                      <div className="relative flex items-center justify-between px-6 pt-6">
                        <span className="font-display text-6xl font-semibold leading-none text-ember-400/90 display-wonk">{item.name[0]}</span>
                        {item.availabilityLabel && <Pill tone="emberOnDark">{item.availabilityLabel}</Pill>}
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      <p className={cn("eyebrow", item.image ? "text-charcoal-500" : "text-cream-100/50")}>{item.sectionName}</p>
                      <div className="mt-2 flex items-start justify-between gap-4">
                        <h3 className="font-display text-2xl font-semibold leading-tight">{item.name}</h3>
                        <Price item={item} dark={!item.image} />
                      </div>
                      {(item.description || item.notes) && (
                        <p className={cn("mt-2 text-[14.5px] leading-relaxed", item.image ? "text-charcoal-700" : "text-cream-100/75")}>{item.description ?? item.notes}</p>
                      )}
                      {item.dietaryTags.length > 0 && (
                        <div className="mt-auto flex gap-1.5 pt-4">
                          {item.dietaryTags.map((t) => (
                            <DietaryBadge key={t} tag={t} size="xs" onDark={!item.image} />
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </TiltCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

/**
 * NW03 sketch (built 4 Nov 2026): three photo tiles under "MENUS.". The whole
 * tile is one link, named by its title; the subtitle is its description. A
 * tile with no href (Holiday Preorders while switched off: "Link needs toggle
 * (on/off)") renders as a plain, unfocusable box that still shows its subtitle.
 * Copy is the board's, verbatim. Treatments are the site's own: the /menu
 * header scrim, the Signature photo hover, the drawer's ember arrow, 16px radius.
 */
export type MenuTile = {
  id: string;
  /** Board title, one entry per sketch line. */
  title: string[];
  /** Short line under the title (admin subtitle). */
  subtitle?: string;
  /** Stacked words (the ALL DAY tile's six meals). */
  list?: string[];
  href: string | null;
  image: string;
  position?: string;
};

export function MenusTiles({ tiles }: { tiles: [MenuTile, MenuTile, MenuTile] }) {
  const [allDay, express, holiday] = tiles;
  return (
    // Sketch layout: ALL DAY on the left spanning both rows, the other two stacked on the right.
    <RevealGroup className="grid gap-4 md:grid-cols-2 md:grid-rows-2 md:gap-5">
      <RevealItem className="md:row-span-2">
        <Tile tile={allDay} className="min-h-[360px] md:min-h-[580px]" priority />
      </RevealItem>
      <RevealItem>
        <Tile tile={express} className="min-h-[260px]" />
      </RevealItem>
      <RevealItem>
        <Tile tile={holiday} className="min-h-[260px]" />
      </RevealItem>
    </RevealGroup>
  );
}

function Tile({ tile, className, priority }: { tile: MenuTile; className?: string; priority?: boolean }) {
  const titleId = `tile-${tile.id}-title`;
  const descId = `tile-${tile.id}-desc`;
  const linked = tile.href !== null;
  const body = (
    <>
      <Image
        src={tile.image}
        alt=""
        fill
        priority={priority}
        sizes="(min-width: 768px) 50vw, 100vw"
        className={cn("-z-10 object-cover", linked && "transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.04]")}
        style={{ objectPosition: tile.position ?? "50% 50%" }}
      />
      {/* Same scrim as the /menu header: the type sits on the photo, so it keeps 4.5:1 */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/65 to-charcoal-950/45" />
      <div className="flex flex-1 flex-col justify-end p-6 sm:p-8">
        <h2 id={titleId} className="font-display text-[clamp(1.9rem,4vw,3.25rem)] font-semibold leading-[0.95] tracking-[-0.02em] text-cream-50 display-sharp">
          {tile.title.map((line, i) => (
            <span key={line} className="block">
              {i > 0 && " "}
              {line}
            </span>
          ))}
        </h2>
        {/* cream-50, not cream-100/85: the faded tone measured about 4.4:1 on the Express photo */}
        <div id={descId} className="mt-4 text-cream-50">
          {tile.list && (
            <ul className="space-y-0.5 text-[1.0625rem] leading-snug">
              {tile.list.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          {tile.subtitle && <p className="max-w-md text-[1.0625rem] leading-relaxed">{tile.subtitle}</p>}
        </div>
        {linked && (
          <span aria-hidden className="mt-5 font-label text-lg tracking-[0.2em] text-ember-300 transition-transform duration-300 ease-out-expo group-hover:translate-x-1">
            →
          </span>
        )}
      </div>
    </>
  );
  const shell = cn("group relative isolate flex h-full flex-col overflow-hidden rounded-2xl bg-charcoal-900 text-cream-50", className);
  return linked ? (
    <Link href={tile.href!} aria-labelledby={titleId} aria-describedby={descId} className={cn(shell, "focus-visible:outline-offset-4")} data-tile={tile.id}>
      {body}
    </Link>
  ) : (
    <div className={shell} data-tile={tile.id}>
      {body}
    </div>
  );
}

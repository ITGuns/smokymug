import Image from "next/image";
import Link from "next/link";
import type { GalleryImage } from "@/db/schema";
import { Marquee } from "@/components/motion/Marquee";
import { Reveal } from "@/components/ui/Reveal";

export function GalleryStrip({ images }: { images: GalleryImage[] }) {
  return (
    <section className="overflow-hidden bg-charcoal-950 py-20 text-cream-50 lg:py-28">
      <div className="container-site flex items-end justify-between gap-6">
        <Reveal>
          <h2 className="font-display text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.05] display-sharp">Gallery</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Link href="/gallery" className="group/btn inline-flex items-center gap-2 text-[15px] font-semibold text-cream-100/80 hover:text-cream-50">
            See all photos
            <span className="transition-transform group-hover/btn:translate-x-1">→</span>
          </Link>
        </Reveal>
      </div>
      <Reveal className="mt-10" amount={0.1}>
        <Marquee speed={36} className="mask-fade-x py-2">
          {images.map((img) => {
            const tall = img.height > img.width;
            return (
              <Link
                key={img.id}
                href={`/gallery?photo=${img.id}`}
                draggable={false}
                className="group relative mr-4 block h-[240px] overflow-hidden rounded-[20px] bg-charcoal-800 sm:h-[300px] lg:h-[360px]"
                style={{ aspectRatio: tall ? "3/4" : `${img.width}/${img.height}` }}
              >
                <Image src={img.file} alt={img.alt} fill sizes="(min-width: 1024px) 420px, 300px" draggable={false} className="object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.06]" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-charcoal-950/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="absolute inset-x-4 bottom-4 translate-y-2 text-[13px] font-medium leading-snug text-cream-50 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  {img.alt}
                </span>
              </Link>
            );
          })}
        </Marquee>
        <p className="container-site mt-4 text-[12px] uppercase tracking-[0.16em] text-cream-100/70">Drag to browse</p>
      </Reveal>
    </section>
  );
}

import type { Metadata } from "next";
import { GalleryExplorer } from "@/components/gallery/GalleryExplorer";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { SplitText } from "@/components/motion/SplitText";
import { getGallery } from "@/lib/data/restaurant";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Brisket, ribs, house sausage, tacos on homemade tortillas, latte art and the wood-fired pit. Photos from The Smoky Mug in Brookland Park, Richmond VA.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ photo?: string }> }) {
  const [images, params] = await Promise.all([getGallery(), searchParams]);
  const initial = params.photo ? Number(params.photo) : undefined;
  return (
    <>
      <section className="relative isolate overflow-hidden bg-charcoal-950 text-cream-50">
        <ParallaxImage src="/images/spare-ribs-rack.jpg" alt="Smoked full rack of pork spare ribs" sizes="100vw" priority className="h-[70svh] min-h-[480px] w-full rounded-none" speed={0.3} reveal="none">
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/40 to-charcoal-950/30" />
          <div className="container-site absolute inset-x-0 bottom-0 z-[2] pb-14">
            <p className="eyebrow text-ember-300">Gallery</p>
            <SplitText as="h1" delay={0.2} lines={[{ text: "Come hungry." }]} className="mt-3 font-display text-[clamp(3rem,8vw,7rem)] font-semibold leading-[0.95] tracking-[-0.02em] display-wonk text-shadow-hero" />
            <p className="mt-4 max-w-lg text-[15px] text-cream-100/80">{images.length} photos from the pit, the kitchen and the espresso bar.</p>
          </div>
        </ParallaxImage>
      </section>
      <GalleryExplorer images={images} initialPhoto={Number.isFinite(initial) ? initial : undefined} />
    </>
  );
}

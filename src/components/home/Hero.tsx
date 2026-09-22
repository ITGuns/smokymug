"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ImageCarousel, type Slide } from "@/components/motion/ImageCarousel";
import { Magnetic } from "@/components/motion/Magnetic";
import { SplitText } from "@/components/motion/SplitText";
import { Logo } from "@/components/site/Logo";
import { SmokeBackdrop } from "@/components/site/SmokeBackdrop";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const ease = [0.16, 1, 0.3, 1] as const;

const SLIDES: Slide[] = [
  { src: "/images/bbq-platter-mac.jpg", alt: "Texas craft BBQ platter with smoked meats and homemade mac n cheese", caption: "Texas craft BBQ platter with smoked meats and homemade mac n cheese", position: "60% 45%" },
  { src: "/images/brisket-smoker.jpg", alt: "Whole briskets smoking in the wood-fired smoker", caption: "Smoked brisket, slow cooked in the wood-fire smoker", position: "50% 55%" },
  { src: "/images/brisket-taco.jpg", alt: "Tex Mex brisket taco on a fresh homemade tortilla", caption: "Tex Mex brisket taco on a fresh homemade tortilla", position: "50% 50%" },
  { src: "/images/spare-ribs-rack.jpg", alt: "Smoked full rack of pork spare ribs", caption: "Smoked full rack pork spare ribs", position: "50% 50%" },
  { src: "/images/sweet-cream-cold-brew.jpg", alt: "Sweet cream cold brew with lavender sweet cream", caption: "Sweet cream cold brew with lavender sweet cream", position: "50% 40%" },
];

export function Hero({
  tagline,
  status,
  addressShort,
}: {
  tagline: string;
  status: { isOpen: boolean; label: string; detail: string };
  addressShort: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "16%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-14%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-charcoal-950 text-cream-50">
      <motion.div style={{ y: imgY }} className="absolute inset-0 -z-10 will-change-transform">
        <ImageCarousel
          slides={SLIDES}
          priority
          interval={6500}
          className="h-full w-full"
          showCaption
          progressClassName="bottom-[max(env(safe-area-inset-bottom),20px)] right-5 lg:bottom-8 lg:right-24"
          overlay={
            <>
              <div aria-hidden className="absolute inset-0 z-[2] bg-[radial-gradient(120%_80%_at_70%_20%,transparent_30%,rgb(15_13_11/0.55)_70%)]" />
              <div aria-hidden className="absolute inset-0 z-[2] bg-gradient-to-t from-charcoal-950 via-charcoal-950/55 to-charcoal-950/20" />
              <div aria-hidden className="absolute inset-x-0 top-0 z-[2] h-40 bg-gradient-to-b from-charcoal-950/70 to-transparent" />
            </>
          }
        />
      </motion.div>
      <SmokeBackdrop intensity={0.9} />
      <div aria-hidden className="grain absolute inset-0 -z-[4]" />

      <motion.div style={{ y: textY, opacity: textOpacity }} className="container-site relative z-10 pb-32 pt-40 lg:pb-28">
        <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }} className="max-w-4xl">
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 1, ease } } }}>
            <Logo invert width={220} priority className="w-[180px] md:w-[240px]" />
          </motion.div>

          <SplitText
            as="h1"
            delay={0.35}
            lines={[
              { text: "Smoked low." },
              { text: "Brewed slow.", className: "text-ember-300" },
            ]}
            className="mt-8 font-display text-[clamp(3.25rem,10vw,8.5rem)] font-semibold leading-[0.92] tracking-[-0.02em] display-wonk text-shadow-hero"
          />

          <motion.p
            variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 1, ease, delay: 0.7 } } }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-cream-100/85 md:text-xl"
          >
            {tagline}
          </motion.p>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 1, ease, delay: 0.85 } } }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Magnetic>
              <ButtonLink href="/book" size="lg" arrow>
                Book a Table
              </ButtonLink>
            </Magnetic>
            <Magnetic strength={0.2}>
              <ButtonLink href="/menu" size="lg" variant="dark">
                Explore Menu
              </ButtonLink>
            </Magnetic>
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 1.2, ease, delay: 1 } } }}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-cream-100/70"
          >
            <span className="inline-flex items-center gap-2">
              <span className={cn("relative flex h-2 w-2", status.isOpen ? "text-sage-400" : "text-cream-300/60")}>
                {status.isOpen && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
              </span>
              <span className="font-semibold text-cream-50">{status.label}</span>
              {status.detail && <span>· {status.detail}</span>}
            </span>
            <Link href="/contact" className="inline-flex items-center gap-2 hover:text-cream-50">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {addressShort}
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-8 right-8 hidden flex-col items-center gap-2 text-cream-100/50 lg:flex"
      >
        <span className="eyebrow [writing-mode:vertical-rl]">Scroll</span>
        <span className="h-10 w-px overflow-hidden bg-cream-100/20">
          <motion.span className="block h-full w-full bg-ember-400" animate={{ y: ["-100%", "100%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
        </span>
      </motion.div>
    </section>
  );
}

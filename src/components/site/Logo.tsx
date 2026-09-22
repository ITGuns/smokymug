import Image from "next/image";
import { cn } from "@/lib/cn";

/** Official wordmark. The source PNG is black-on-transparent; `invert` flips it for dark backgrounds. */
export function Logo({ className, invert = false, priority = false, width = 160 }: { className?: string; invert?: boolean; priority?: boolean; width?: number }) {
  const height = Math.round(width * (306 / 557));
  return (
    <Image
      src="/images/logo.png"
      alt="The Smoky Mug"
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto select-none", invert && "invert", className)}
    />
  );
}

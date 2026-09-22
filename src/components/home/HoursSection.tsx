import type { Hours } from "@/db/schema";
import { HoursTable, ServiceHours } from "@/components/site/HoursTable";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";

export function HoursSection({ hours, todayDow, status }: { hours: Hours[]; todayDow: number; status: { isOpen: boolean; label: string; detail: string } }) {
  return (
    <section className="relative overflow-hidden bg-cream-200/60 py-24 lg:py-32">
      <div className="container-site grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <h2 className="font-display text-[clamp(2.2rem,4.4vw,3.8rem)] font-semibold leading-[1.02] text-charcoal-900 display-sharp">Hours</h2>
            <p className="mt-4 flex items-center gap-2 text-[15px] text-charcoal-700">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${status.isOpen ? "bg-sage-500" : "bg-brick-500"}`} />
              <span className="font-semibold text-charcoal-900">{status.label}</span>
              {status.detail && <span>· {status.detail}</span>}
            </p>
          </Reveal>
          <Reveal delay={0.1} className="mt-8 rounded-[24px] bg-cream-50 p-6 shadow-card sm:p-8">
            <HoursTable hours={hours} todayDow={todayDow} />
          </Reveal>
        </div>
        <div className="lg:col-span-7 lg:pl-8">
          <Reveal delay={0.05}>
            <p className="font-label text-[13px] tracking-[0.2em] text-charcoal-500">Service windows</p>
            <div className="mt-6">
              <ServiceHours hours={hours} />
            </div>
          </Reveal>
          <Reveal delay={0.15} className="mt-10 rounded-[24px] border border-charcoal-900/10 bg-cream-50/60 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-2xl font-semibold text-charcoal-900">Reservations</p>
                <p className="mt-1 text-[15px] text-charcoal-700">Book online or call ahead. BBQ can sell out early.</p>
              </div>
              <ButtonLink href="/book" arrow>
                Book a Table
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

import { ButtonLink } from "@/components/ui/Button";

/**
 * BK02 (board: "Integrate SpotOn Reservations basically a box with the spotOn
 * reservation interface"; in scope per Pol 3 Nov). The admin-set SpotOn link is
 * framed in a 16px card; a plain link sits under it in case SpotOn refuses to
 * be framed, and the phone covers SpotOn being down. With no link set yet the
 * card is just the phone number.
 */
export function ReservationsBox({ url, phone }: { url: string | null; phone: string }) {
  const tel = `tel:+1${phone.replace(/\D/g, "")}`;
  if (!url) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-charcoal-900/10 bg-cream-50 p-8 text-center shadow-card">
        <h2 className="font-display text-3xl font-semibold text-charcoal-900">Call us to book</h2>
        <p className="mt-3 text-charcoal-700">To reserve a table, call {phone}.</p>
        <ButtonLink href={tel} shape="soft" className="mt-6">
          Call {phone}
        </ButtonLink>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-2xl border border-charcoal-900/10 bg-cream-50 shadow-card">
        <iframe
          src={url}
          title="SpotOn reservations"
          className="block h-[760px] w-full border-0"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        />
      </div>
      <p className="mt-5 text-center text-[15px] text-charcoal-700">
        Box not loading?{" "}
        <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold text-ember-600 underline-offset-4 hover:underline">
          Open reservations ↗
        </a>{" "}
        or call{" "}
        <a href={tel} className="font-semibold text-charcoal-900">
          {phone}
        </a>
        .
      </p>
    </div>
  );
}

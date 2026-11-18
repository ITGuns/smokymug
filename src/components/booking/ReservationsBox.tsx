import { ButtonLink } from "@/components/ui/Button";
import { ReservationsFrame } from "@/components/booking/ReservationsFrame";

/**
 * BK02 (board: "Integrate SpotOn Reservations basically a box with the spotOn
 * reservation interface"; in scope per Pol 3 Nov). The admin-set SpotOn link is
 * framed in a 16px card; a plain link sits under it in case SpotOn refuses to
 * be framed, and the phone covers SpotOn being down. ReservationsFrame swaps
 * the frame for the link and phone when the host is unreachable (18 Nov). With no link set yet the
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
  return <ReservationsFrame url={url} phone={phone} tel={tel} />;
}

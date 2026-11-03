/**
 * CA03 "dual paper trail": email each catering inquiry to the catering address
 * with the admin's extra addresses on CC. Nothing is sent until a mail
 * provider is configured (NEEDS-INFRA): RESEND_API_KEY plus INQUIRY_FROM_EMAIL,
 * a sender on a domain verified in that Resend account. Until then inquiries
 * are only saved, exactly as before.
 */

export type InquiryMailConfig = { apiKey: string; from: string };

export function inquiryMailConfig(env: Record<string, string | undefined> = process.env): InquiryMailConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.INQUIRY_FROM_EMAIL?.trim();
  return apiKey && from ? { apiKey, from } : null;
}

export type InquiryForMail = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  occasion: string;
  eventDate?: string | null;
  guestCount?: number | null;
  serviceType: string;
  message?: string | null;
};

/** One line, no control characters, bounded: user text never reaches a header raw. */
const oneLine = (s: string, max = 80) => s.replace(/[\r\n\t\u0000-\u001f]+/g, " ").trim().slice(0, max);

/** Plain-text body only, so nothing the guest typed is ever rendered as HTML. */
export function buildInquiryEmail(q: InquiryForMail, to: string, cc: string[], from: string) {
  const lines = [
    `New catering inquiry #${q.id}`,
    "",
    `Name: ${q.name}`,
    `Email: ${q.email}`,
    q.phone ? `Phone: ${q.phone}` : null,
    `Occasion: ${q.occasion}`,
    q.eventDate ? `Event date: ${q.eventDate}` : null,
    q.guestCount != null ? `Guests: ${q.guestCount}` : null,
    `Service: ${q.serviceType}`,
    q.message ? `\nMessage:\n${q.message}` : null,
    "",
    "Reply to this email to answer the guest directly. All inquiries are also saved in the admin panel.",
  ].filter((l): l is string => l !== null);
  const copies = cc.filter((c) => c.toLowerCase() !== to.toLowerCase());
  return {
    from,
    to: [to],
    ...(copies.length ? { cc: copies } : {}),
    reply_to: q.email,
    subject: oneLine(`Catering inquiry: ${q.name}, ${q.occasion}`, 120),
    text: lines.join("\n"),
  };
}

/** Best effort: a failed or slow send is logged and never fails the inquiry. */
export async function sendInquiryEmail(q: InquiryForMail, to: string, cc: string[], config: InquiryMailConfig): Promise<void> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `catering-inquiry/${q.id}`,
      },
      body: JSON.stringify(buildInquiryEmail(q, to, cc, config.from)),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error(`catering inquiry #${q.id}: mail provider answered ${res.status}`);
  } catch (err) {
    console.error(`catering inquiry #${q.id}: mail send failed`, err instanceof Error ? err.message : err);
  }
}

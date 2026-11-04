import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { buildCsp } from "@/lib/csp";
import { isMissingSchema } from "@/lib/db-errors";
import { EVENT_KIND_ICON, EVENT_KINDS, isEventKind } from "@/lib/event-kinds";
import { buildInquiryEmail, inquiryMailConfig } from "@/lib/inquiry-mail";
import { balanceColumns } from "@/lib/masonry";
import { eventInput, inquiryCopiesInput, reservationSettingsInput } from "@/lib/validation";

// Seeded gallery aspect ratios (height / width), in admin order.
const GALLERY: [number, number][] = [
  [828, 636], [739, 1012], [668, 811], [732, 763], [828, 703], [828, 560], [668, 804], [679, 991],
  [706, 980], [735, 744], [687, 1062], [828, 555], [599, 581], [581, 799], [828, 812], [828, 798],
  [753, 801], [828, 814], [790, 780], [649, 425], [696, 871], [764, 871], [696, 871], [656, 821],
];
const ratios = GALLERY.map(([w, h]) => h / w);
const heights = (cols: number[][], gap: number) => cols.map((c) => c.reduce((n, i) => n + ratios[i] + gap, 0));

describe("GA03 balanced gallery columns", () => {
  for (const [count, colWidth] of [[4, 284], [3, 299], [3, 224], [2, 167]]) {
    it(`${count} columns at ${colWidth}px end within 80px of each other`, () => {
      const gap = 16 / colWidth;
      const cols = balanceColumns(ratios, count, gap);
      expect(cols).toHaveLength(count);
      expect(cols.flat().sort((a, b) => a - b)).toEqual(ratios.map((_, i) => i));
      const px = heights(cols, gap).map((h) => h * colWidth);
      expect(Math.max(...px) - Math.min(...px)).toBeLessThan(80);
    });
  }

  it("keeps the admin's first photos on the top row", () => {
    const cols = balanceColumns(ratios, 4, 16 / 284);
    expect(cols.map((c) => c[0]).sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
  });

  it("handles empty and tiny lists", () => {
    expect(balanceColumns([], 3)).toEqual([[], [], []]);
    expect(balanceColumns([1], 2)).toEqual([[0], []]);
  });
});

describe("B6 event types", () => {
  it("has 3 or 4 types, each with an icon", () => {
    expect(EVENT_KINDS.length).toBeGreaterThanOrEqual(3);
    expect(EVENT_KINDS.length).toBeLessThanOrEqual(4);
    for (const k of EVENT_KINDS) expect(EVENT_KIND_ICON[k.key].length).toBeGreaterThan(0);
  });

  it("validates the admin type field", () => {
    const base = { title: "QA", date: "2026-11-20" };
    expect(eventInput.parse({ ...base, kind: "music" }).kind).toBe("music");
    expect(eventInput.parse({ ...base, kind: "" }).kind).toBeNull();
    expect(eventInput.parse(base).kind).toBeNull();
    expect(eventInput.safeParse({ ...base, kind: "rave" }).success).toBe(false);
    expect(isEventKind("popup")).toBe(true);
    expect(isEventKind("nope")).toBe(false);
  });
});

describe("BK02 + CA03 settings", () => {
  it("reservations link must be a full http(s) URL", () => {
    expect(reservationSettingsInput.parse({ reservationsUrl: "https://example.com/r", bookingWizard: false }).reservationsUrl).toBe("https://example.com/r");
    expect(reservationSettingsInput.parse({ reservationsUrl: "" }).reservationsUrl).toBeNull();
    expect(reservationSettingsInput.safeParse({ reservationsUrl: "spoton.com/r" }).success).toBe(false);
    expect(reservationSettingsInput.safeParse({ reservationsUrl: "javascript:alert(1)" }).success).toBe(false);
  });

  it("inquiry copies: split, lowercase, dedupe, validate, cap at 10", () => {
    expect(inquiryCopiesInput.parse({ inquiryCc: "A@x.com\nb@x.com, a@x.com" }).inquiryCc).toEqual(["a@x.com", "b@x.com"]);
    expect(inquiryCopiesInput.parse({ inquiryCc: "" }).inquiryCc).toEqual([]);
    expect(inquiryCopiesInput.safeParse({ inquiryCc: "nope" }).success).toBe(false);
    const eleven = Array.from({ length: 11 }, (_, i) => `p${i}@x.com`).join("\n");
    expect(inquiryCopiesInput.safeParse({ inquiryCc: eleven }).success).toBe(false);
  });

  it("missing-table errors are recognised, wrapped or not", () => {
    expect(isMissingSchema({ code: "42P01" })).toBe(true);
    expect(isMissingSchema({ message: "wrapped", cause: { code: "42703" } })).toBe(true);
    expect(isMissingSchema({ code: "23505" })).toBe(false);
    expect(isMissingSchema(new Error("boom"))).toBe(false);
  });
});

describe("CA03 inquiry email", () => {
  it("does nothing until both env vars are set", () => {
    expect(inquiryMailConfig({})).toBeNull();
    expect(inquiryMailConfig({ RESEND_API_KEY: "k" })).toBeNull();
    expect(inquiryMailConfig({ RESEND_API_KEY: "k", INQUIRY_FROM_EMAIL: "Site <a@b.com>" })).toEqual({ apiKey: "k", from: "Site <a@b.com>" });
  });

  it("builds a plain-text email to the catering address with the copy list as BCC (P6)", () => {
    const mail = buildInquiryEmail(
      { id: 7, name: "QA Guest\r\nBcc: evil@x.com", email: "guest@x.com", occasion: "Birthday", serviceType: "pickup", guestCount: 20, message: "<b>hi</b>" },
      "bookings@x.com",
      ["copy@x.com", "BOOKINGS@x.com"],
      "Site <noreply@x.com>",
    );
    expect(mail.to).toEqual(["bookings@x.com"]);
    // BCC, not CC: Reply All from a staff inbox must not hand the guest the internal list
    expect(mail.bcc).toEqual(["copy@x.com"]);
    expect(mail).not.toHaveProperty("cc");
    expect(mail.reply_to).toBe("guest@x.com");
    expect(mail.subject).not.toMatch(/[\r\n]/);
    expect(mail.text).toContain("Guests: 20");
    expect(mail).not.toHaveProperty("html");
  });
});

describe("CSP", () => {
  it("next.config's site-wide policy matches the shared builder", async () => {
    const rules = await nextConfig.headers!();
    const csp = rules.flatMap((r) => r.headers).find((h) => h.key === "Content-Security-Policy")!.value;
    expect(csp).toBe(buildCsp({ dev: process.env.NODE_ENV === "development" }));
  });

  it("only the /book variant allows any https frame", () => {
    expect(buildCsp({ dev: false })).not.toMatch(/frame-src[^;]* https:(;|$)/);
    expect(buildCsp({ dev: false, frameAnyHttps: true })).toMatch(/frame-src[^;]* https:(;|$)/);
  });
});

import { DietaryBadge } from "@/components/ui/Badge";
import type { DietaryTag } from "@/db/schema";

/**
 * Static footnote section rendered below the menu explorer.
 * Covers:
 *  – Dietary-badge legend (GF*, VG*, V* — the "option" variants from the
 *    printed 2026 menu plus the non-option forms)
 *  – FDA raw/undercooked-egg consumer advisory (items marked with * in
 *    descriptions, e.g. Brisket Benedict, Huevos Rancheros)
 */

const LEGEND: { tag: DietaryTag; meaning: string }[] = [
  { tag: "gluten-free-option", meaning: "Gluten-free option available — ask your server" },
  { tag: "gluten-free", meaning: "Gluten-free" },
  { tag: "vegan-option", meaning: "Vegan option available — ask your server" },
  { tag: "vegan", meaning: "Vegan" },
  { tag: "vegetarian-option", meaning: "Vegetarian option available — ask your server" },
  { tag: "vegetarian", meaning: "Vegetarian" },
  { tag: "non-alcoholic", meaning: "Non-alcoholic" },
];

export function MenuFootnotes() {
  return (
    <footer
      aria-label="Menu footnotes"
      className="border-t border-charcoal-900/8 bg-cream-100 pb-16 pt-10"
    >
      <div className="container-site max-w-4xl space-y-8 text-[14px] leading-relaxed text-charcoal-600">
        {/* ── Dietary legend ── */}
        <section>
          <h2 className="mb-3 font-label text-[12px] uppercase tracking-[0.16em] text-charcoal-500">
            Dietary key
          </h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGEND.map(({ tag, meaning }) => (
              <li key={tag} className="flex items-center gap-2">
                <DietaryBadge tag={tag} size="xs" />
                <span>{meaning}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Consumer advisory ── */}
        <section className="text-[13px] text-charcoal-500">
          <p>
            <strong className="font-semibold text-charcoal-700">* Consumer Advisory:</strong>{" "}
            Items marked with an asterisk (*) contain or may be served with raw or
            undercooked eggs. Consuming raw or undercooked meats, poultry, seafood,
            shellfish, or eggs may increase your risk of foodborne illness, especially
            if you have certain medical conditions.
          </p>
        </section>
      </div>
    </footer>
  );
}


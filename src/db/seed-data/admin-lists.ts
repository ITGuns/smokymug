import { EVENT_KINDS } from "../../lib/event-kinds";
import { CATERING } from "./restaurant";

/** Audit F12 (18 Nov 2026): the first catering_packages rows, mapped from the
 *  printed copy so the wording is Dan's by construction. No price lines or
 *  include lists were ever supplied, so those start empty. Also the /catering
 *  fallback while the table is missing. */
export const CATERING_PACKAGES = CATERING.categories.map((c, i) => ({
  name: c.name,
  blurb: c.description,
  priceLine: null as string | null,
  includes: [] as string[],
  displayOrder: i,
  visible: true,
}));

/** Audit F11 (18 Nov 2026): the first event_kind_types rows, the four types the
 *  calendar already shows, in the same order. */
export const EVENT_KIND_TYPES = EVENT_KINDS.map((k, i) => ({ key: k.key as string, label: k.label as string, displayOrder: i }));

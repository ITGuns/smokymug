/** Screen-reader cue for links that open a new tab (audit F5). Sighted users get the arrow. */
export const NEW_TAB_TEXT = "(opens in a new tab)";

export function NewTabCue() {
  return <span className="sr-only"> {NEW_TAB_TEXT}</span>;
}

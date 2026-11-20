import type { ISearchOptions } from "@xterm/addon-search";

/**
 * Find in terminal (TERM-010). Pure helpers only: the query and the matches live in the FindBar and the
 * xterm search addon. Nothing here is stored, logged or sent to React global state.
 */
export type FindOptions = { caseSensitive: boolean; incremental?: boolean };
export type FindResults = { index: number; count: number };

/**
 * Terminal options the search addon needs. Match highlighting uses xterm's decoration API, which is
 * "proposed" and throws ("You must set the allowProposedApi option...") unless this is on. Without it,
 * typing in the find bar threw inside a React effect and blanked the whole app. It only unlocks extra
 * JS APIs for addons; it changes no escape-sequence handling.
 */
export const SEARCH_TERMINAL_OPTIONS = { allowProposedApi: true } as const;

/** Highlight colors must be #RRGGBB (xterm's requirement). */
const DECORATIONS = {
  matchBackground: "#3b4a6b",
  matchOverviewRuler: "#7aa2f7",
  activeMatchBackground: "#b07cf0",
  activeMatchColorOverviewRuler: "#b07cf0",
} as const;

/**
 * Plain-text search: the user's query is never treated as a regular expression, so a typed `(`, `[` or `*`
 * cannot throw or hang the renderer.
 */
export function toSearchOptions(o: FindOptions): ISearchOptions {
  return { regex: false, wholeWord: false, caseSensitive: o.caseSensitive, incremental: !!o.incremental, decorations: { ...DECORATIONS } };
}

/** "3/12", "No results", or "1000+" when xterm stopped counting (resultIndex -1). Empty query: no label. */
export function resultLabel(query: string, r: FindResults | null): string {
  if (query === "") return "";
  if (!r || r.count === 0) return "No results";
  return r.index < 0 ? `${r.count}+` : `${r.index + 1}/${r.count}`;
}

/** Run a search call; an addon error is logged (without the query) instead of crashing the app. */
export function safe(fn: () => unknown): void {
  try {
    fn();
  } catch (e) {
    console.warn("Terminal search failed:", e instanceof Error ? e.message : "unknown error");
  }
}

import { expect, test } from "vitest";
import { Terminal } from "@xterm/xterm";
import { SEARCH_TERMINAL_OPTIONS, resultLabel, safe, toSearchOptions } from "./search";

test("search is plain text, never a regex", () => {
  const o = toSearchOptions({ caseSensitive: false });
  expect(o.regex).toBe(false);
  expect(o.wholeWord).toBe(false);
});

test("case sensitivity and incremental pass through; incremental defaults off", () => {
  expect(toSearchOptions({ caseSensitive: true }).caseSensitive).toBe(true);
  expect(toSearchOptions({ caseSensitive: false }).incremental).toBe(false);
  expect(toSearchOptions({ caseSensitive: false, incremental: true }).incremental).toBe(true);
});

test("decoration colors are #RRGGBB as xterm requires", () => {
  const d = toSearchOptions({ caseSensitive: false }).decorations!;
  for (const c of [d.matchBackground, d.matchOverviewRuler, d.activeMatchBackground, d.activeMatchColorOverviewRuler]) {
    expect(c).toMatch(/^#[0-9a-f]{6}$/i);
  }
});

test("result label", () => {
  expect(resultLabel("", { index: 0, count: 5 })).toBe("");
  expect(resultLabel("x", null)).toBe("No results");
  expect(resultLabel("x", { index: -1, count: 0 })).toBe("No results");
  expect(resultLabel("x", { index: 2, count: 12 })).toBe("3/12");
  expect(resultLabel("x", { index: -1, count: 1000 })).toBe("1000+");
});

// Regression: typing in the find bar blanked the app. The addon highlights matches via
// registerDecoration, which xterm rejects unless allowProposedApi is set.
const decorate = (opts: object) => {
  const term = new Terminal(opts);
  return () => term.registerDecoration({ marker: term.registerMarker(0)! });
};

test("xterm rejects match decorations without allowProposedApi", () => {
  expect(decorate({})).toThrow(/allowProposedApi/);
});

test("the options TerminalView uses allow match decorations", () => {
  expect(decorate({ ...SEARCH_TERMINAL_OPTIONS })).not.toThrow();
});

test("safe() swallows an addon error instead of crashing the caller", () => {
  expect(() => safe(() => { throw new Error("boom"); })).not.toThrow();
});

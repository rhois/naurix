import { expect, test } from "vitest";
import { clipboardShortcut, MAC_SHORTCUTS, matchShortcut, OTHER_SHORTCUTS, tabIndexShortcut } from "./shortcuts";

const mac = (e: Parameters<typeof matchShortcut>[0]) => matchShortcut(e, MAC_SHORTCUTS, true);
const other = (e: Parameters<typeof matchShortcut>[0]) => matchShortcut(e, OTHER_SHORTCUTS, false);

const key = (code: string, o: Partial<{ metaKey: boolean; shiftKey: boolean; altKey: boolean; ctrlKey: boolean }> = {}) =>
  ({ code, metaKey: true, shiftKey: false, altKey: false, ctrlKey: false, ...o });

test("matches plain and shifted variants distinctly", () => {
  expect(mac(key("KeyD"))).toBe("splitRight");
  expect(mac(key("KeyD", { shiftKey: true }))).toBe("splitDown");
  expect(mac(key("BracketRight", { shiftKey: true }))).toBe("nextTab");
  expect(mac(key("BracketRight"))).toBe("nextPane");
});

test("requires Cmd and ignores Ctrl/Alt combos", () => {
  expect(mac(key("KeyT", { metaKey: false }))).toBeNull();
  expect(mac(key("KeyT", { ctrlKey: true }))).toBeNull();
  expect(mac(key("KeyT", { altKey: true }))).toBeNull();
  expect(mac(key("KeyC"))).toBeNull(); // copy stays native
});

test("no two shortcuts collide", () => {
  const seen = new Set<string>();
  for (const table of [MAC_SHORTCUTS, OTHER_SHORTCUTS]) {
    seen.clear();
    for (const s of Object.values(table)) {
      const k = `${s.code}:${!!s.shift}:${!!s.alt}`;
      expect(seen.has(k)).toBe(false);
      seen.add(k);
    }
  }
});

test("Cmd+digit selects tabs", () => {
  expect(tabIndexShortcut(key("Digit1"), true)).toBe(0);
  expect(tabIndexShortcut(key("Digit9"), true)).toBe(8);
  expect(tabIndexShortcut(key("Digit0"), true)).toBeNull();
  expect(tabIndexShortcut(key("Digit1", { shiftKey: true }), true)).toBeNull();
});

const ctrl = (code: string, o: Partial<{ metaKey: boolean; shiftKey: boolean; altKey: boolean; ctrlKey: boolean }> = {}) =>
  ({ code, metaKey: false, shiftKey: false, altKey: false, ctrlKey: true, ...o });

test("Linux/Windows use Ctrl+Shift so plain Ctrl+C/W/D stay with the terminal", () => {
  expect(other(ctrl("KeyC"))).toBeNull();
  expect(other(ctrl("KeyW"))).toBeNull();
  expect(other(ctrl("KeyD"))).toBeNull();
  expect(other(ctrl("KeyT", { shiftKey: true }))).toBe("newTab");
  expect(other(ctrl("KeyD", { shiftKey: true }))).toBe("splitRight");
  expect(other(ctrl("KeyE", { shiftKey: true }))).toBe("splitDown");
  expect(other(ctrl("BracketRight", { altKey: true }))).toBe("nextPane");
  expect(other(ctrl("BracketRight", { shiftKey: true }))).toBe("nextTab");
  expect(other(ctrl("Comma"))).toBe("settings");
  expect(other(ctrl("KeyT", { shiftKey: true, metaKey: true }))).toBeNull();
});

test("Ctrl+Alt+digit selects tabs on Linux/Windows", () => {
  expect(tabIndexShortcut(ctrl("Digit3", { altKey: true }), false)).toBe(2);
  expect(tabIndexShortcut(ctrl("Digit3"), false)).toBeNull(); // plain Ctrl+digit is the terminal's
  expect(tabIndexShortcut(ctrl("Digit3", { altKey: true, shiftKey: true }), false)).toBeNull();
});

test("Ctrl+Shift+C/V copy and paste only outside macOS", () => {
  expect(clipboardShortcut(ctrl("KeyC", { shiftKey: true }), false)).toBe("copy");
  expect(clipboardShortcut(ctrl("KeyV", { shiftKey: true }), false)).toBe("paste");
  expect(clipboardShortcut(ctrl("KeyC"), false)).toBeNull(); // SIGINT stays with the shell
  expect(clipboardShortcut(ctrl("KeyC", { shiftKey: true }), true)).toBeNull();
});

test("find: Cmd+F on macOS, Ctrl+Shift+F elsewhere (Ctrl+F stays with the terminal)", () => {
  expect(mac(key("KeyF"))).toBe("find");
  expect(other(key("KeyF", { metaKey: false, ctrlKey: true, shiftKey: true }))).toBe("find");
  expect(other(key("KeyF", { metaKey: false, ctrlKey: true }))).toBeNull();
});

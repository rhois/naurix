/**
 * Central shortcut table (UX-001). Matching uses physical key codes so Shift+[ etc. work.
 *
 * macOS uses Cmd. Linux and Windows cannot: Ctrl+C, Ctrl+W, Ctrl+D and friends are terminal control
 * keys, so those platforms use Ctrl+Shift (the convention of GNOME Terminal and Windows Terminal) and
 * Ctrl+Alt for the pane and tab-number variants (ADR 0021).
 */
export type ShortcutId =
  | "palette" | "newTab" | "closePane" | "splitRight" | "splitDown"
  | "nextTab" | "prevTab" | "nextPane" | "prevPane" | "addWorkspace" | "renameTab" | "launchAgent" | "settings" | "find";

export type Shortcut = { code: string; shift?: boolean; alt?: boolean; label: string };
export type ShortcutTable = Record<ShortcutId, Shortcut>;

export const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export const MAC_SHORTCUTS: ShortcutTable = {
  palette: { code: "KeyK", label: "⌘K" },
  newTab: { code: "KeyT", label: "⌘T" },
  closePane: { code: "KeyW", label: "⌘W" },
  splitRight: { code: "KeyD", label: "⌘D" },
  splitDown: { code: "KeyD", shift: true, label: "⇧⌘D" },
  nextTab: { code: "BracketRight", shift: true, label: "⇧⌘]" },
  prevTab: { code: "BracketLeft", shift: true, label: "⇧⌘[" },
  nextPane: { code: "BracketRight", label: "⌘]" },
  prevPane: { code: "BracketLeft", label: "⌘[" },
  addWorkspace: { code: "KeyO", label: "⌘O" },
  renameTab: { code: "KeyR", shift: true, label: "⇧⌘R" },
  launchAgent: { code: "KeyA", shift: true, label: "⇧⌘A" },
  settings: { code: "Comma", label: "⌘," },
  find: { code: "KeyF", label: "⌘F" },
};

export const OTHER_SHORTCUTS: ShortcutTable = {
  palette: { code: "KeyK", shift: true, label: "Ctrl+Shift+K" },
  newTab: { code: "KeyT", shift: true, label: "Ctrl+Shift+T" },
  closePane: { code: "KeyW", shift: true, label: "Ctrl+Shift+W" },
  splitRight: { code: "KeyD", shift: true, label: "Ctrl+Shift+D" },
  splitDown: { code: "KeyE", shift: true, label: "Ctrl+Shift+E" },
  nextTab: { code: "BracketRight", shift: true, label: "Ctrl+Shift+]" },
  prevTab: { code: "BracketLeft", shift: true, label: "Ctrl+Shift+[" },
  nextPane: { code: "BracketRight", alt: true, label: "Ctrl+Alt+]" },
  prevPane: { code: "BracketLeft", alt: true, label: "Ctrl+Alt+[" },
  addWorkspace: { code: "KeyO", shift: true, label: "Ctrl+Shift+O" },
  renameTab: { code: "KeyR", shift: true, label: "Ctrl+Shift+R" },
  launchAgent: { code: "KeyA", shift: true, label: "Ctrl+Shift+A" },
  settings: { code: "Comma", label: "Ctrl+," },
  find: { code: "KeyF", shift: true, label: "Ctrl+Shift+F" },
};

export const SHORTCUTS: ShortcutTable = IS_MAC ? MAC_SHORTCUTS : OTHER_SHORTCUTS;

/** Hints for the terminal context menu. Ctrl+C/V stay with the shell, so copy/paste use Ctrl+Shift. */
export const COPY_HINT = IS_MAC ? "⌘C" : "Ctrl+Shift+C";
export const PASTE_HINT = IS_MAC ? "⌘V" : "Ctrl+Shift+V";

type KeyLike = Pick<KeyboardEvent, "code" | "metaKey" | "shiftKey" | "altKey" | "ctrlKey">;

/** The primary modifier: Cmd on macOS, Ctrl elsewhere. The other one must not be held. */
function primary(e: KeyLike, mac: boolean): boolean {
  return mac ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
}

export function matchShortcut(e: KeyLike, table: ShortcutTable = SHORTCUTS, mac: boolean = IS_MAC): ShortcutId | null {
  if (!primary(e, mac)) return null;
  // On macOS Option is never part of a shortcut; elsewhere Alt is part of the pane variants.
  for (const [id, s] of Object.entries(table) as [ShortcutId, Shortcut][]) {
    if (e.code === s.code && !!s.shift === e.shiftKey && !!s.alt === e.altKey) return id;
  }
  return null;
}

/** Cmd+1..9 (macOS) or Ctrl+Alt+1..9 selects the Nth tab; returns the zero-based index or null. */
export function tabIndexShortcut(e: KeyLike, mac: boolean = IS_MAC): number | null {
  if (!primary(e, mac) || e.shiftKey || e.altKey !== !mac) return null;
  const m = /^Digit([1-9])$/.exec(e.code);
  return m ? Number(m[1]) - 1 : null;
}

/** Ctrl+Shift+C / Ctrl+Shift+V on Linux and Windows (macOS uses the native Edit menu). */
export function clipboardShortcut(e: KeyLike, mac: boolean = IS_MAC): "copy" | "paste" | null {
  if (mac || !e.ctrlKey || e.metaKey || e.altKey || !e.shiftKey) return null;
  return e.code === "KeyC" ? "copy" : e.code === "KeyV" ? "paste" : null;
}

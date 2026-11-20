import { useEffect, useRef } from "react";
import { endTurn, noteOutput, startTurn } from "../naurix/activity";
import { Channel } from "@tauri-apps/api/core";
import { registerDevTerminal, unregisterDevTerminal } from "../../dev/devTerminals";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { SearchAddon } from "@xterm/addon-search";
import "@xterm/xterm/css/xterm.css";
import { AckBatcher } from "./ackBatcher";
import { useStore } from "../../state/store";
import { agentApi } from "../agents/api";
import { fontStack } from "./theme";
import { terminalTheme } from "../../themes/apply";
import { terminalApi, type ExitPayload } from "./api";
import { sessionRegistry } from "./registry";
import { terminalHandles } from "./handles";
import { IMAGE_PASTE_KEY, clipboardHasOnlyImage } from "./attach";
import { FindBar } from "./FindBar";
import { SEARCH_TERMINAL_OPTIONS, safe, toSearchOptions } from "./search";

export type TerminalState =
  | { kind: "starting" }
  | { kind: "running" }
  | { kind: "exited"; code: number | null; signal: string | null }
  | { kind: "failed"; message: string };

/** Set when a WebGL context was lost or could not be created: stop trying and stay on the DOM renderer. */
let webglBroken = false;

/**
 * One xterm.js instance bound to one Rust PTY session. Terminal bytes flow
 * Rust -> Channel -> xterm.write and never touch React state.
 */
type Props = {
  workspaceId: string;
  paneId: string;
  title: string;
  /** On screen (active workspace + active tab). Hidden terminals stay mounted to keep their buffer. */
  visible: boolean;
  /** The pane that should receive keyboard focus. */
  focused: boolean;
  /** When set, start this agent instead of a shell. `reviewed`: the user confirmed the command. */
  agent?: { id: string; reviewed: boolean };
  /** Open a plain shell at the repository root instead of the workspace folder (decided by the backend). */
  atRepoRoot?: boolean;
  onState: (s: TerminalState) => void;
};

export function TerminalView({ workspaceId, paneId, title, visible, focused, agent, atRepoRoot, onState }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;
  const handle = useRef<{ fit: () => void; focus: () => void } | null>(null);
  const initial = useRef({ workspaceId, paneId, title, agent, atRepoRoot: !!atRepoRoot });
  const termRef = useRef<Terminal | null>(null);
  const t = useStore((s) => s.settings.terminal);
  const findOpen = useStore((s) => s.find?.paneId === paneId);

  // Follow the application theme. Assigning `options.theme` repaints in place: the Terminal object, its
  // PTY session, scrollback and cursor are untouched (nothing is recreated).
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    term.options.theme = terminalTheme(theme);
    term.options.minimumContrastRatio = theme.tokens.terminal.minContrast;
  }, [theme]);

  // Apply settings live. Changing the font re-flows the PTY size through fit().
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    term.options.fontFamily = fontStack(t.fontFamily);
    term.options.fontSize = t.fontSize;
    term.options.scrollback = t.scrollback;
    term.options.cursorBlink = t.cursorBlink;
    term.options.cursorStyle = t.cursorStyle;
    requestAnimationFrame(() => handle.current?.fit());
  }, [t.fontFamily, t.fontSize, t.scrollback, t.cursorBlink, t.cursorStyle]);

  // Re-fit and focus when this pane becomes visible/focused.
  useEffect(() => {
    if (!visible) return;
    handle.current?.fit();
    if (focused) handle.current?.focus();
  }, [visible, focused]);

  useEffect(() => {
    const el = host.current!;
    const cfg = useStore.getState().settings.terminal;
    const term = new Terminal({
      ...SEARCH_TERMINAL_OPTIONS,
      scrollback: cfg.scrollback,
      cursorBlink: cfg.cursorBlink,
      cursorStyle: cfg.cursorStyle,
      fontFamily: fontStack(cfg.fontFamily),
      fontSize: cfg.fontSize,
      theme: terminalTheme(useStore.getState().theme),
      minimumContrastRatio: useStore.getState().theme.tokens.terminal.minContrast,
    });
    termRef.current = term;
    const fit = new FitAddon();
    term.loadAddon(fit);
    const search = new SearchAddon();
    term.loadAddon(search);
    term.open(el);
    // Hidden (display:none) panes have no size; fitting them would shrink the PTY to nothing.
    const safeFit = () => {
      if (el.offsetParent !== null && el.clientWidth > 0 && el.clientHeight > 0) fit.fit();
    };
    safeFit();
    handle.current = { fit: safeFit, focus: () => term.focus() };
    terminalHandles.set(initial.current.paneId, { hasSelection: () => term.hasSelection(), getSelection: () => term.getSelection(), paste: (t) => term.paste(t), focus: () => term.focus(),
      find: {
        // A failing search must never take the UI down (it runs inside a React effect).
        next: (q, o) => safe(() => search.findNext(q, toSearchOptions(o))),
        prev: (q, o) => safe(() => search.findPrevious(q, toSearchOptions(o))),
        clear: () => safe(() => search.clearDecorations()),
        onResults: (cb) => {
          const d = search.onDidChangeResults((e) => cb({ index: e.resultIndex, count: e.resultCount }));
          return () => d.dispose();
        },
      },
    });
    if (import.meta.env.DEV) registerDevTerminal(initial.current.paneId, term);

    let id: number | null = null;
    let disposed = false;
    let pendingInput = "";
    let exited = false;

    const acks = new AckBatcher((n) => {
      if (id === null) return false;
      terminalApi.ack(id, n).catch(() => {});
      return true;
    });

    const output = new Channel<ArrayBuffer>();
    output.onmessage = (buf) => {
      const bytes = new Uint8Array(buf);
      noteOutput(initial.current.paneId);
      term.write(bytes, () => acks.add(bytes.length));
    };
    const exit = new Channel<ExitPayload>();
    exit.onmessage = (p) => {
      exited = true;
      endTurn(initial.current.paneId);
      onStateRef.current({ kind: "exited", code: p.code, signal: p.signal });
    };

    onStateRef.current({ kind: "starting" });
    const a = initial.current.agent;
    (a
      ? agentApi.launch(initial.current.workspaceId, a.id, a.reviewed, term.rows, term.cols, output, exit)
      : terminalApi.spawn(initial.current.workspaceId, initial.current.title, initial.current.atRepoRoot, term.rows, term.cols, output, exit)
    )
      .then((sid) => {
        if (disposed) {
          terminalApi.terminate(sid).catch(() => {});
          return;
        }
        id = sid;
        if (a) startTurn(initial.current.paneId);
        sessionRegistry.set(initial.current.paneId, sid);
        onStateRef.current({ kind: "running" });
        acks.flush();
        if (pendingInput) {
          terminalApi.write(sid, pendingInput).catch(() => {});
          pendingInput = "";
        }
      })
      .catch((e) => onStateRef.current({ kind: "failed", message: String(e) }));

    // xterm sends a plain CR for Shift+Enter, which submits. Send ESC+CR instead so
    // agent CLIs insert a newline while the user is still composing.
    term.attachCustomKeyEventHandler((e) => {
      if (e.key === "Enter" && e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (e.type === "keydown" && !exited) {
          if (id === null) pendingInput += "\x1b\r";
          else terminalApi.write(id, "\x1b\r").catch(() => {});
        }
        return false;
      }
      return true;
    });

    const subs = [
      term.onData((d) => {
        if (exited) return;
        if (initial.current.agent && d.includes("\r")) startTurn(initial.current.paneId);
        if (id === null) pendingInput += d;
        else terminalApi.write(id, d).catch(() => {});
      }),
      term.onBinary((d) => {
        if (id !== null && !exited) terminalApi.writeBytes(id, Array.from(d, (c) => c.charCodeAt(0) & 0xff)).catch(() => {});
      }),
      term.onResize(({ rows, cols }) => {
        if (id !== null && !exited) terminalApi.resize(id, rows, cols).catch(() => {});
      }),
    ];

    // A pasted screenshot has no text, so xterm would paste nothing. Agent CLIs read the clipboard image
    // themselves when they get Ctrl+V, so forward that key. Only when an image (and no text) is there.
    const onPaste = (e: ClipboardEvent) => {
      if (exited || !clipboardHasOnlyImage(e.clipboardData)) return;
      e.preventDefault();
      e.stopPropagation();
      if (id === null) pendingInput += IMAGE_PASTE_KEY;
      else terminalApi.write(id, IMAGE_PASTE_KEY).catch(() => {});
    };
    el.addEventListener("paste", onPaste, true);

    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(safeFit);
    });
    ro.observe(el);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      subs.forEach((s) => s.dispose());
      el.removeEventListener("paste", onPaste, true);
      acks.dispose();
      output.onmessage = () => {};
      exit.onmessage = () => {};
      if (id !== null && !exited) terminalApi.terminate(id).catch(() => {});
      endTurn(initial.current.paneId);
      handle.current = null;
      if (useStore.getState().find?.paneId === initial.current.paneId) useStore.getState().closeFind();
      terminalHandles.delete(initial.current.paneId);
      if (import.meta.env.DEV) unregisterDevTerminal(initial.current.paneId);
      term.dispose();
    };
  }, []);

  // Optional WebGL renderer (defined after the creation effect above so the terminal exists when it first runs). Browsers cap the number of WebGL contexts, so only a terminal that is on
  // screen holds one; a hidden terminal drops back to the DOM renderer and keeps its buffer.
  useEffect(() => {
    const term = termRef.current;
    if (!term || !visible) return;
    const setStatus = useStore.getState().setRendererStatus;
    if (t.renderer !== "webgl") return setStatus("dom");
    if (webglBroken) return setStatus("webgl-unavailable");
    let addon: WebglAddon | null = null;
    try {
      addon = new WebglAddon();
      addon.onContextLoss(() => {
        webglBroken = true;
        addon?.dispose();
        addon = null;
        setStatus("webgl-unavailable");
      });
      term.loadAddon(addon);
      setStatus("webgl-active");
    } catch (e) {
      webglBroken = true;
      addon?.dispose();
      addon = null;
      setStatus("webgl-unavailable");
      console.warn("WebGL renderer unavailable, using the DOM renderer:", e);
    }
    return () => addon?.dispose();
  }, [visible, t.renderer]);

  return (
    <div className="relative h-full w-full">
    {findOpen && <FindBar paneId={paneId} />}
    <div
      ref={host}
      data-pane={paneId}
      className="h-full w-full bg-terminal p-1"
      onContextMenu={(e) => {
        // Replace the browser menu with ours (Copy / Paste / splits).
        e.preventDefault();
        useStore.getState().openContextMenu({ x: e.clientX, y: e.clientY, paneId: initial.current.paneId });
      }}
    />
    </div>
  );
}

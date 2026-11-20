import { useEffect, useRef, useState } from "react";
import { SHORTCUTS } from "../../shortcuts";
import { useStore } from "../../state/store";
import { terminalHandles } from "./handles";
import { resultLabel, type FindResults } from "./search";

/**
 * Find bar for one terminal pane (TERM-010). The query and options are local to this component and are
 * dropped when it closes: nothing is persisted or put into the global store.
 * Enter = next, Shift+Enter = previous, Esc = close.
 */
export function FindBar({ paneId }: { paneId: string }) {
  const nonce = useStore((s) => s.find?.nonce);
  const [query, setQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [results, setResults] = useState<FindResults | null>(null);
  const input = useRef<HTMLInputElement>(null);

  // Opening, or pressing the shortcut again, focuses the field and selects the old query.
  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, [nonce]);

  useEffect(() => terminalHandles.get(paneId)?.find.onResults(setResults), [paneId]);

  // Search as the user types (and when the case option changes).
  useEffect(() => {
    const find = terminalHandles.get(paneId)?.find;
    if (!find) return;
    if (query === "") {
      find.clear();
      setResults(null);
    } else {
      find.next(query, { caseSensitive, incremental: true });
    }
  }, [query, caseSensitive, paneId]);

  // Closing removes the highlights.
  useEffect(() => () => terminalHandles.get(paneId)?.find.clear(), [paneId]);

  const close = () => {
    useStore.getState().closeFind();
    terminalHandles.get(paneId)?.focus();
  };
  const step = (back: boolean) => {
    if (query === "") return;
    const find = terminalHandles.get(paneId)?.find;
    if (back) find?.prev(query, { caseSensitive });
    else find?.next(query, { caseSensitive });
  };
  const label = resultLabel(query, results);
  const btn = "rounded px-1.5 py-0.5 text-xs text-muted hover:bg-line hover:text-cloud";

  return (
    <div
      role="search"
      aria-label="Find in terminal"
      className="absolute right-4 top-2 z-10 flex items-center gap-1 rounded-lg border border-line bg-popover p-1 text-sm shadow-xl"
    >
      <input
        ref={input}
        aria-label="Find in terminal"
        title={`Find (${SHORTCUTS.find.label})`}
        className="w-52 rounded bg-midnight px-2 py-0.5 text-cloud outline-none focus:ring-1 focus:ring-purple"
        placeholder="Find"
        spellCheck={false}
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            close();
          } else if (e.key === "Enter") {
            e.preventDefault();
            step(e.shiftKey);
          }
        }}
      />
      <span aria-live="polite" className="min-w-14 text-center text-xs text-faint">{label}</span>
      <button className={`${btn} ${caseSensitive ? "bg-line text-cloud" : ""}`} aria-pressed={caseSensitive} title="Match case" onClick={() => setCaseSensitive((v) => !v)}>Aa</button>
      <button className={btn} aria-label="Previous match" title="Previous (Shift+Enter)" onClick={() => step(true)}>↑</button>
      <button className={btn} aria-label="Next match" title="Next (Enter)" onClick={() => step(false)}>↓</button>
      <button className={btn} aria-label="Close find" title="Close (Esc)" onClick={close}>✕</button>
    </div>
  );
}

import { SHORTCUTS, type ShortcutId } from "../../shortcuts";
import { activeSpace, activeTab, useStore } from "../../state/store";

export type Action = { id: string; title: string; shortcut?: string; run: () => void };

const sc = (id: ShortcutId) => SHORTCUTS[id].label;

/** All user-facing actions; used by both the command palette and the keyboard handler. */
export function buildActions(): Action[] {
  const s = useStore.getState();
  const hasWs = s.activeWorkspaceId !== null;
  const hasTab = !!activeTab(s);
  const tabs = activeSpace(s)?.tabs ?? [];
  const list: Action[] = [
    { id: "mcp", title: "MCP integrations", run: () => s.setView("mcp") },
    { id: "skills", title: "Agent skills", run: () => s.setView("skills") },
    { id: "settings", title: "Settings", shortcut: sc("settings"), run: () => s.setView("settings") },
    { id: "git", title: "Git status", run: () => s.setView("git") },
    { id: "gitRefresh", title: "Refresh Git status", run: () => void s.refreshGit() },
    { id: "font", title: "Terminal font…", run: s.setFontFamilyWithPrompt },
    { id: "fontSize", title: "Terminal font size…", run: s.setFontSizeWithPrompt },
    { id: "addWorkspace", title: "Open project folder…", shortcut: sc("addWorkspace"), run: () => void s.addWorkspace() },
  ];
  if (hasWs) {
    list.push({ id: "newTab", title: "New terminal tab", shortcut: sc("newTab"), run: s.newTab });
    list.push({ id: "launchAgent", title: "Launch AI agent…", shortcut: sc("launchAgent"), run: () => s.openLauncher(true) });
  }
  if (hasTab) {
    list.push(
      { id: "splitRight", title: "Split pane right", shortcut: sc("splitRight"), run: () => s.splitActive("row") },
      { id: "splitDown", title: "Split pane down", shortcut: sc("splitDown"), run: () => s.splitActive("col") },
      { id: "closePane", title: "Close pane", shortcut: sc("closePane"), run: s.closeActivePane },
      { id: "closeTab", title: "Close tab", run: () => s.closeTab(activeTab(s)!.id) },
      { id: "find", title: "Find in terminal", shortcut: sc("find"), run: () => s.openFind(activeTab(s)!.activePaneId) },
      { id: "renameTab", title: "Rename tab…", shortcut: sc("renameTab"), run: () => s.renameTabWithPrompt() },
      { id: "nextPane", title: "Focus next pane", shortcut: sc("nextPane"), run: () => s.stepPane(1) },
      { id: "prevPane", title: "Focus previous pane", shortcut: sc("prevPane"), run: () => s.stepPane(-1) },
    );
  }
  if (tabs.length > 1) {
    list.push(
      { id: "nextTab", title: "Next tab", shortcut: sc("nextTab"), run: () => s.stepTab(1) },
      { id: "prevTab", title: "Previous tab", shortcut: sc("prevTab"), run: () => s.stepTab(-1) },
    );
  }
  for (const t of tabs) list.push({ id: `tab:${t.id}`, title: `Go to tab: ${t.title}`, run: () => s.selectTab(t.id) });
  for (const w of s.workspaces) {
    if (w.id !== s.activeWorkspaceId) list.push({ id: `ws:${w.id}`, title: `Switch workspace: ${w.name}`, run: () => s.openWorkspace(w.id) });
  }
  if (hasWs) {
    list.push(
      { id: "renameWs", title: "Rename workspace…", run: () => s.renameWorkspaceWithPrompt(s.activeWorkspaceId!) },
      { id: "removeWs", title: "Remove workspace…", run: () => s.removeWorkspaceWithConfirm(s.activeWorkspaceId!) },
    );
  }
  return list;
}

/** Run the action bound to a keyboard shortcut, if it is currently available. */
export function runShortcut(id: ShortcutId): void {
  const s = useStore.getState();
  if (id === "palette") return s.setPalette(!s.paletteOpen);
  buildActions().find((a) => a.id === id)?.run();
}

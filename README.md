<p align="center"><img src="assets/naurix-logo.svg" alt="Naurix" width="420"></p>

<p align="center"><a href="https://naurix.nana-dev.web.id/">Website</a> · <a href="docs/">Docs</a> · <a href="CONTRIBUTING.md">Contributing</a></p>

<p align="center"><b>One workspace. Infinite possibilities.</b><br>An open-source, lightweight terminal and workspace for AI coding agents.<br>macOS (supported) · Linux and Windows (code-complete, not yet validated on real hardware) · Apache-2.0</p>

> **Status: early development (M10 of 11).** You can open project folders as workspaces, run real shells in tabs and split panes, and launch AI coding CLIs (Claude Code, Codex, Gemini CLI, Antigravity CLI, OpenCode, or your own). MCP servers can be managed and synced to Claude Code and OpenCode, skills can be installed and linked into agents, and you can see your repository's Git status. Settings are available (⌘,) (see [Roadmap](#roadmap)).

Naurix (formerly *Agent Terminal*) is meant to run normal shells and AI coding CLIs (Claude Code, Codex, Gemini CLI, OpenCode, custom) side by side, per project. It is not an agent, an IDE, or a hosted service. Everything stays on your machine.

## Linux and Windows (experimental)

The code paths for Linux and Windows exist (ADR 0021) but **nothing is claimed to work** until a recorded run on real hardware is in [docs/PERFORMANCE_AND_COMPATIBILITY.md](docs/PERFORMANCE_AND_COMPATIBILITY.md). CI builds and runs the automated tests on macOS, Ubuntu and Windows.

- **Linux:** install the Tauri prerequisites (`libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libssl-dev libdbus-1-dev pkg-config`), then `./run.sh doctor`, `./run.sh` (dev) or `./run.sh bundle` (`.deb`, `.rpm`, `.AppImage`). Secrets need a running Secret Service keyring (GNOME Keyring or KWallet).
- **Windows:** install Rust (MSVC toolchain), Node 22+, pnpm and the WebView2 runtime, then in PowerShell: `pnpm install`, `pnpm tauri dev` or `pnpm tauri build` (`.msi`, NSIS `.exe`). `run.sh` is bash-only. Linking a skill into an agent folder uses symlinks, which need **Developer Mode** on Windows.
- **Shortcuts:** Cmd on macOS; **Ctrl+Shift** on Linux and Windows (so Ctrl+C/W/D stay with the shell): Ctrl+Shift+T new tab, Ctrl+Shift+D split, Ctrl+Shift+C / V copy and paste. Shown in the UI.
- **Known gaps:** no Windows memory reading in Settings; agent config locations are verified on macOS only; no signing or notarization on any OS.

## Quick start

```sh
cd naurix                        # the folder containing this README
./run.sh                         # checks your setup, installs dependencies, starts the app
```

That is all for development mode. The first run compiles the Rust side (a few minutes); later runs are fast.

| Command | What it does |
|---|---|
| `./run.sh` | Run in development mode (hot reload) |
| `./run.sh app` | Build `Naurix.app` and open it |
| `./run.sh install` | Build it and copy it to `~/Applications` (then open it from Spotlight like any app) |
| `./run.sh dmg` | Build a `Naurix_<version>_<arch>.dmg` installer in `target/release/bundle/dmg/` |
| `./run.sh sandbox` | Run a **second copy with throwaway data** next to your normal one (separate data folder and port) for experiments and tests |
| `./run.sh test` | Run every test and lint check |
| `./run.sh doctor` | Check that Xcode tools, Rust, Node 22+ and pnpm are installed, and tell you how to fix what is missing |

Something missing? `./run.sh doctor` prints the exact command to install it. The manual steps are under [Try it](#try-it).

## What works today

| Feature | State |
|---|---|
| Real shell on a PTY (your `$SHELL -l`), colors, resize, paste, 5,000-line scrollback | ✅ |
| Workspaces: open a folder, switch, rename, remove (never deletes files) | ✅ |
| Tabs (new, rename, close, switch) and split panes (right / down, drag to resize) | ✅ |
| Command palette and keyboard shortcuts | ✅ |
| Nerd Font / Powerlevel10k-style prompts (icons, powerline separators), configurable font | ✅ |
| Workspace list survives restart; old sessions shown as *interrupted* (processes are not restored) | ✅ |
| Confirmation before closing a pane/tab that has a command running | ✅ |
| Missing project folder handled (warning, remove option) | ✅ |
| Launch Claude Code / Codex / Gemini CLI / OpenCode / custom CLI agents, with command review, install detection and an executable path override | ✅ |
| Agent session list in the sidebar, stop agent, honest process-only status | ✅ |
| Per-agent capability list, version, and deprecation notices, each marked *verified* or *documented only* ([matrix](docs/AGENT_ADAPTERS.md)) | ✅ |
| **MCP Integrations**: add servers (catalog or manual), secrets in the OS credential store (macOS Keychain, Linux Secret Service, Windows Credential Manager), explicit approval, test connection, preview / apply / undo sync to agent configs | ✅ |
| **Git status** (read-only): branch, ahead/behind, changed files, conflicts, stash, diff, "Open in terminal" at the repo root | ✅ |
| **Settings** (⌘,): general, appearance (9 themes, light/dark/system, accent), terminal (font, scrollback, cursor, shell, renderer), agents, MCP, skills, performance, security | ✅ |
| Apple Silicon validation (arm64 runs on real hardware) | ⏳ M11a |
| Signing and notarization | ⏳ M11b (needs an Apple Developer account; not planned yet) |
| **Agent Skills**: install from a Git URL or a folder with a risk and compatibility review, enable per agent (symlink), update, switch back, uninstall | ✅ |

## Try it

### 1. Prerequisites (one time)

```sh
xcode-select --install                                   # compiler toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh   # Rust (rustup)
brew install node                                        # Node 22 or newer (26 works)
npm install -g pnpm                                      # or: corepack enable
```

`rust-toolchain.toml` pins the Rust channel and installs both macOS targets automatically. Open a new terminal afterwards so `cargo` is on your `PATH` (or run `source ~/.cargo/env`).

### 2. Run in development mode

(Or just `./run.sh`, which does the checks and these steps for you.)

```sh
cd naurix                           # the folder containing this README
pnpm install
pnpm tauri dev
```

The first run compiles the Rust side (a few minutes); later runs are fast and the UI hot-reloads. Note: a hot reload or page reload **stops all running terminals** (their state lives in the page).

### 3. Or build a double-clickable app

Shortcut: `./run.sh app` (build and open) or `./run.sh install` (copy to `~/Applications`). Manually:

```sh
pnpm tauri build --bundles app
open "target/release/bundle/macos/Naurix.app"
```

The app is built for the architecture of the Mac you build on (Intel → x86_64, Apple Silicon → arm64). It is **unsigned**: if you copy it to another Mac, macOS will ask you to approve it (right-click → Open).

### 4. Build a .dmg installer

Shortcut: `./run.sh dmg`. Manually:

```sh
pnpm install
pnpm tauri build --bundles dmg
open target/release/bundle/dmg      # Naurix_<version>_<arch>.dmg  (x64 on Intel, aarch64 on Apple Silicon)
```

Open the `.dmg` and drag **Naurix** into **Applications**. Notes:

- The first build compiles Rust in release mode (about 2–5 minutes). The version in the file name comes from `version` in `src-tauri/tauri.conf.json`.
- The `.dmg` is built for the architecture of the Mac you build on. Building both needs both Macs (or `--target`, which is not validated yet, see M11a).
- It is **unsigned and not notarized**: on another Mac, macOS says the app is "damaged" or from an unidentified developer. Right-click → Open, or run `xattr -dr com.apple.quarantine /Applications/Naurix.app`. Signing and notarization need an Apple Developer account and are deferred to M11b.
- If the build fails with `Finder got an error: AppleEvent timed out`, macOS is blocking the script that lays out the installer window. Allow your terminal to control Finder (System Settings → Privacy & Security → Automation), or build a plain `.dmg` without the custom layout: `CI=true pnpm tauri build --bundles dmg` (`./run.sh dmg` retries this way automatically). Close any leftover *Naurix* disk in Finder before retrying.

### 5. First steps

1. Click **Open folder…** (or press ⌘O) and pick a project directory.
2. Press ⌘T for a terminal tab. It starts your login shell in that folder.
3. ⌘D splits right, ⇧⌘D splits down. Drag the thin divider to resize.
4. Press ⌘K for the command palette and try *Rename tab…*, *Switch workspace*, *Remove workspace…*.
5. Quit and reopen: your workspaces are still there; the previous terminals are listed as "interrupted when the app closed".

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| ⌘K | Command palette |
| ⌘O | Open project folder |
| ⌘T | New terminal tab |
| ⌘W | Close pane (closes the tab when it was the last pane) |
| ⌘D / ⇧⌘D | Split right / split down |
| ⌘] / ⌘[ | Next / previous pane |
| ⇧⌘] / ⇧⌘[ | Next / previous tab |
| ⌘1 … ⌘9 | Go to tab N |
| ⇧⌘R | Rename tab (also: double-click the tab) |
| ⇧⌘A | Launch an AI agent |
| ⌘F | Find in the terminal (Ctrl+Shift+F on Linux and Windows). Enter / Shift+Enter: next / previous, Esc: close. Plain-text search of the retained scrollback; the query is never stored |

**Attach files:** drag files from Finder / Explorer onto a pane and Naurix types their quoted paths at the cursor (no Enter, nothing is read or run; agents such as Claude Code turn an image path into an attachment). **Screenshots:** with an image on the clipboard, paste as usual (⌘V on macOS) and Naurix sends Ctrl+V to the program, which is how agent CLIs read a clipboard image. On Linux and Windows press **Ctrl+V** (not Ctrl+Shift+V, which pastes text). Plain-text paste is unchanged.

**Right-click a terminal** for a menu: *Copy*, *Paste*, *Split Right / Left / Up / Down* and *Close Pane*. (⌘C / ⌘V on macOS, Ctrl+Shift+C / V on Linux and Windows; the menu's Paste reads the system clipboard only when you choose it, up to 1 MiB.)

Shortcuts are defined in `src/shortcuts.ts`. Note that ⌘K opens the palette, so it does not clear the screen as in some terminals (use `clear` or Ctrl-L).

### Prompt style and fonts (Powerlevel10k, Nerd Fonts)

Prompts such as Powerlevel10k draw their icons (the Apple logo, folder icon, `` separators) with a **Nerd Font**. Naurix asks for these fonts automatically, in this order: *your chosen font*, then `MesloLGS NF`, `JetBrainsMono Nerd Font`, `FiraCode Nerd Font`, `CaskaydiaCove Nerd Font`, `Hack Nerd Font`, `Symbols Nerd Font Mono`, then Menlo. The browser falls back **per character**, so you can use a normal font such as *Dank Mono* for text and still get the icons from a Nerd Font.

- Install one Nerd Font if prompts show empty boxes. Naurix does not bundle fonts, so this is needed once per computer:
  - macOS: `brew install --cask font-meslo-lg-nerd-font`
  - Linux: download *Meslo* from [nerdfonts.com/font-downloads](https://www.nerdfonts.com/font-downloads), unzip into `~/.local/share/fonts`, then run `fc-cache -fv`
  - Windows: `winget install DEVCOM.JetBrainsMonoNerdFont`, or download a font from the same page, right-click the files and choose *Install*
  - Restart Naurix afterwards. The MesloLGS NF fonts from the p10k docs also work.
- The OS logo at the start of a Powerlevel10k prompt comes from your shell theme, not from Naurix: it shows the Apple logo on macOS, the distro logo on Linux and the Windows logo on Windows. To change it, edit `POWERLEVEL9K_OS_ICON_CONTENT_EXPANSION` in `~/.p10k.zsh`.
- Pick your own font: **⌘K → "Terminal font…"**, type the font name (for example `Dank Mono`), Enter. **"Terminal font size…"** changes the size. Type `default` to reset. Both apply instantly and are remembered.
- Colors and the terminal background follow the selected theme (**Settings → Appearance**, see [Settings](#settings)).

### Launching an AI agent

1. Press ⇧⌘A (or the **＋** next to *Agents* in the sidebar, or ⌘K → *Launch AI agent…*).
2. Each agent shows whether it was found on your Mac (`✓ /path` or `Not found`). Naurix never installs anything. If an agent is installed somewhere unusual, choose **Set up…** and pick its executable.
3. **Launch** opens a **review** the first time: it shows the exact command, the working directory (your workspace) and any extra environment. Confirm to start. Presets you have already approved launch directly next time; changing the executable asks again. Custom agents are always reviewed.
4. The agent opens in its own tab and appears under **Agents** in the sidebar. **■** stops it (with confirmation while it is running).

**Custom agents:** *Add custom agent…* takes a name, an executable (a command name like `aider`, or an absolute path), arguments (one per line, no shell quoting) and optional `NAME=value` environment lines. Environment values are stored unencrypted, so names that look like secrets (`…KEY`, `…TOKEN`, `…SECRET`, `…PASSWORD`) are refused: keep API keys in your shell profile for now.

**Capabilities are shown honestly.** In the review step, *What Naurix can do with this agent* lists what is **verified** (confirmed against the real CLI), **documented but not enabled** (an official page says so, but it was not confirmed here) and **not supported yet**. Naurix only acts on verified items. Note: Google retired Gemini CLI for most individual accounts on 18 June 2026; the launcher warns about it and also offers its successor, **Antigravity CLI** (`agy`).

**Status is deliberately simple:** *Starting / Running / Exited / Failed* describe the **process** only. Naurix does not claim an agent is "waiting for approval" or "done", because it cannot know that without a reliable signal from the agent itself.

**Where it looks for agents:** your `PATH`, plus `/opt/homebrew/bin`, `/usr/local/bin`, `~/.local/bin`, `~/.claude/local`, `~/.opencode/bin`, `~/.bun/bin`, `~/.npm-global/bin`, `~/.cargo/bin`, `~/.volta/bin` and each `~/.nvm/versions/node/*/bin`. This matters because an app opened from Finder does not see your shell's `PATH`.

### MCP integrations

Open **MCP** in the sidebar (or ⌘K → *MCP integrations*).

1. **Add a server**: *Add from catalog…* (Filesystem, GitHub, PostgreSQL, Playwright, Context7, Sentry, with settings copied from each project's docs) or *Add manually…*. Nothing runs yet.
2. **Secrets** (tokens, passwords, connection strings): never type them into the command, arguments, environment or header fields. Declare a secret name, write `${secret:NAME}` where it goes (for example `Authorization: Bearer ${secret:GITHUB_PAT}`), then use **Set value…** on the server card. The value is stored in the **OS credential store** (macOS Keychain, Linux Secret Service, Windows Credential Manager); it is never written to Naurix's database or to agent config files, and no screen shows it again. Plain-text credentials are refused.
3. **Review & approve**: shows the exact command (or URL) and what it will receive. Approval is tied to that exact definition; editing the command, arguments, URL, environment or headers asks again. Commands like `npx` also warn that they download and run a package.
4. **Test connection** (local servers): starts the approved command, asks the server for its tools, then stops it. Remote servers cannot be tested from Naurix yet; the agent that connects to them tests them.
5. **Sync to agents**: pick an agent → *Preview changes…* → *Apply…*. Naurix shows exactly which entries it will add, update or remove, backs the file up first, and keeps an **Undo**. It only touches entries it wrote. If you already have an entry with the same name, or you edited one of Naurix's, it is left alone and reported as a conflict. Today this works for **Claude Code** (the project's `.mcp.json`) and **OpenCode** (`~/.config/opencode/opencode.json[c]` in the flat `mcp.<name>` layout). If that file has comments, Naurix will not rewrite it and shows you the entries to paste instead.

**Important:** agent config files only contain *references* to secrets. Naurix supplies the real values when it launches the agent, so **start Claude Code or OpenCode from the *Agents* panel** for servers that use secrets. An agent started elsewhere gets the reference text instead of the value (and Claude Code prints a warning).

### Agent skills

Open **Skills** in the sidebar (or ⌘K → *Agent skills*). A skill is a folder with a `SKILL.md` file.

1. **Install skills…** from an **HTTPS Git URL** (for example a public skills repository) or a **folder on this Mac**. Naurix downloads or reads it and shows a **review**: where it came from (URL @ commit, or folder), where it will be stored, how many files, every script-like file, risk warnings (shell commands, pre-approved shell tools, hooks, binaries) and which agents it is compatible with. Nothing is installed until you pick skills and confirm.
2. **Skills are untrusted.** Naurix never runs anything inside a skill. An agent might run its scripts or commands later, which is why the review lists them.
3. **Use with agents…**: switch a skill on for an agent, either for **all projects** (the agent's user folder) or for **this project**. Naurix adds a symlink in the folder that agent's documentation names (for example `~/.claude/skills`, `.agents/skills`, `.opencode/skills`), only if nothing is there yet, and removes it when you switch it off. If something already uses that name, it is left alone and reported.
4. **Check for updates** (Git sources: downloads again; folders: re-reads). You see which files were added, changed or removed, plus any *new* warnings, and the old version is kept: **Switch to previous version** goes back.
5. **Uninstall** removes Naurix's links, its stored copy and its record. Your original folder or repository is never touched, and a link you replaced yourself is left alone.

**Honest limit:** Naurix places the link where the agent's documentation says skills live, but it has **not verified** that each agent then loads a symlinked skill (the launcher shows this as *Link only, not verified*). Some agents also read each other's folders, so a skill can appear in more than one agent.

### Git status

Open **Git** in the sidebar (or ⌘K → *Git status*), or click the branch in the status bar. It shows the active workspace's repository: branch (or detached HEAD), ahead/behind its upstream, stashes, a merge/rebase in progress, and the files that changed, grouped as **Conflicts / Staged / Changes / Untracked**. Click a file for its diff. **Open in terminal** starts a shell at the repository root (even if your workspace is a subfolder).

- **Read-only.** Naurix never stages, commits, checks out or changes anything.
- **No polling.** It refreshes when you select a workspace, open the view, bring the window back to the front, finish a terminal or agent session, or press **Refresh**. It never takes Git's index lock, so it will not make your own `git` commands fail.
- **Safe on unknown repositories.** Git can run programs named in a repository's own configuration. Naurix switches those off, and if a repository's local config defines filters or includes (things that cannot be switched off), it refuses to run Git there until you press **Trust this repository…**. A repository with a Git LFS setup in your global config is not affected.
- Large changes are capped (first 2000 files; diffs of about 512 KB) and say so.

### Settings

Press **⌘,** or open **Settings** in the sidebar. Changes are checked by the backend, applied immediately and kept across restarts. **General:** close a shell pane when it exits normally; ask before closing running work. **Appearance:** nine themes (Naurix Dark/Light, Tokyo Night, Dracula, Nord, Catppuccin Mocha/Latte, GitHub Light, Solarized Light), Dark / Light / Follow system, and a custom accent color; the terminal's colors follow the theme without restarting any shell (see [docs/THEME_SYSTEM.md](docs/THEME_SYSTEM.md)). **Terminal:** font, size, scrollback (500–100,000 lines), cursor style and blink, login shell on/off (turn it off for a faster first prompt), shell path. **AI Agents:** where each agent was found and an optional executable path. **Performance:** renderer (DOM default, WebGL experimental) and a *Memory now* reading of the Naurix process. **Security:** no telemetry, data folder, Keychain service, withdraw all MCP approvals, revoke trusted Git repositories. Shell and login settings apply to new terminals; the rest apply live.

### Behaviors worth knowing

- Typing `exit` (code 0) closes a shell pane (agent panes stay open so you can read their last output). A non-zero exit or a killed process keeps the pane open with **Restart** / **Close** buttons so you can see what happened.
- A shell started by an app uses `$SHELL -l` (a *login* shell). If your shell startup is slow (e.g. heavy `.zshrc`, nvm), the first prompt can appear late; commands you type meanwhile run once startup finishes. That is your shell config, not the app.
- macOS may ask “Naurix would like to access files in your Downloads (or Documents, Desktop) folder”. Naurix itself does not read those folders. Shells and agents run as child processes of the app, so macOS attributes their file access to Naurix. The prompt appears when something in a terminal (a command, an agent, a drag-and-drop path you then open) first touches that folder. **Don't Allow** is safe; only access to that folder is denied. Change it later in System Settings → Privacy & Security → Files and Folders.
- Hidden tabs keep running and keep their scrollback. Terminals are stopped when you close them, remove their workspace, or quit the app.

### Where your data lives, and how to reset

Only metadata is stored (workspace names and paths, session title/state/timestamps, and agent settings such as custom agents and approved executables). Terminal input and output are never written to disk by the app.

```sh
~/Library/Application Support/dev.naurix.app/naurix.db    # SQLite
rm -rf ~/Library/Application\ Support/dev.naurix.app              # reset everything
```

### Troubleshooting

| Problem | Fix |
|---|---|
| An agent shows "Not found" but is installed | Use **Set up…** and choose its executable; or tell me where it lives so the search list can include it |
| Prompt icons show as empty boxes | No Nerd Font is installed, see [Prompt style and fonts](#prompt-style-and-fonts-powerlevel10k-nerd-fonts) |
| `cargo: command not found` | `source ~/.cargo/env` or open a new terminal |
| `Port 1420 is already in use` | Another dev instance is running: `pkill -f "tauri dev"; pkill -f vite` |
| Blank window in dev | Wait for the Vite server; check the terminal running `pnpm tauri dev` for errors |
| First prompt takes many seconds | Your login shell is slow to start; time it with `time zsh -l -i -c exit` |
| macOS asks for access to Downloads/Documents/Desktop | Expected when a shell or agent in a terminal touches that folder; see [Behaviors worth knowing](#behaviors-worth-knowing) |
| "App is damaged / can't be opened" on another Mac | The app is unsigned: right-click → Open, or `xattr -dr com.apple.quarantine "Naurix.app"` |

## Develop

```sh
pnpm typecheck && pnpm test          # frontend: TypeScript + Vitest
cargo test --workspace               # Rust: unit + real-PTY integration tests, incl. a scripted mock agent (needs /bin/zsh, /usr/bin/yes)
cargo clippy --workspace --all-targets -- -D warnings && cargo fmt --all --check
```

Layout:

```
crates/core/   Rust, no Tauri dependency: pty/ (sessions, supervisor, flow control), persistence/ (SQLite), agents/ (presets, search, launch planning, verified adapter facts), mcp/ (registry, OS credential store, probe, sync), platform.rs (the few OS differences), skills/ (store, git fetch, scan, links), git/ (hardened read-only status and diff)
src-tauri/     Thin Tauri shell: commands validate input and delegate to core
src/           React + TypeScript + Tailwind: features/{workspaces,tabs,layout,terminal,agents,mcp,skills,git,settings,palette}, state/store.ts
bench/         Memory/CPU measurement harness and recorded results
docs/          Product, design, plan, performance, and ADRs
```

### End-to-end smoke test (dev builds only)

Drives the real UI (opens a workspace, tabs, splits, types commands, exits a shell) and writes a JSON report with the terminal buffers:

```sh
mkdir -p /tmp/naurix-proj && cp scripts/mock-agent /tmp/naurix-proj/
NAURIX_SMOKE_OUT=/tmp/naurix-smoke.json NAURIX_SMOKE_WORKSPACE=/tmp/naurix-proj SHELL=/bin/sh ./run.sh sandbox
# wait ~20 s, then:  cat /tmp/naurix-smoke.json
```

`./run.sh sandbox` uses a throwaway data folder and its own dev-server port, so it can run next to your normal copy and never touches your real workspaces. (The smoke and benchmark modes refuse to run unless `NAURIX_DATA_DIR` is set, which the sandbox does for you.) The scenario also exercises the agent flow using `scripts/mock-agent`, a tiny scripted stand-in for an agent CLI (it needs that file copied into the workspace folder, as above).

### Measure memory (release build)

```sh
pnpm tauri build --no-bundle
mkdir -p /tmp/naurix-proj
NAURIX_DATA_DIR=/tmp/naurix-bench-data NAURIX_BENCH_WORKSPACE=/tmp/naurix-proj NAURIX_BENCH_TERMINALS=4 SHELL=/bin/sh \
  node bench/measure.mjs target/release/naurix --label 4terminals --seconds 30 --settle 10
```

Results go to `bench/results/`. Memory counts the app plus its WebKit helper processes (not your shells). Please run it on your Apple Silicon Mac and share the JSON; no arm64 numbers exist yet. See [Performance & Compatibility](docs/PERFORMANCE_AND_COMPATIBILITY.md) for current measurements and their caveats.

## Roadmap

M0 docs ✅ · M1 scaffold + benchmark harness ✅ · M2 PTY + supervisor ✅ · M3 terminal view ✅ · M4 workspaces, tabs, panes, palette ✅ · M5 agent launch ✅ · M6 agent adapters ✅ · M7 MCP manager ✅ · M8 skills manager ✅ · M9 Git status ✅ · **M10 settings + performance ✅** · **M11a Apple Silicon validation ⏳ (no arm64 run yet)** · **M11b signing/notarization ⏳ (needs an Apple Developer account)**. Details: [Implementation Plan](docs/IMPLEMENTATION_PLAN.md).

## Look and feel

The interface follows the Naurix brand system (`assets/brand/naurix-brand-system.png`): the **Aurora** palette, a sidebar with *Home / Projects / Agents / MCP / Skills / Git / Settings*, pill-shaped tabs titled like `~/your/folder`, and a terminal-style welcome screen.

| Token | Color | Use |
|---|---|---|
| Aurora Purple | `#8B7CFF` | accents, selection, cursor |
| Aurora Teal | `#39D6C5` | running state, success, focus ring |
| Midnight | `#0B1020` | app and terminal background |
| Cloud White | `#F4F7FF` | primary text |

Tokens live in `src/index.css`; the terminal palette in `src/features/terminal/theme.ts`. The logo and app icon are vector files in `assets/` (`naurix-mark.svg`, `naurix-logo.svg`, `naurix-icon.svg`); they are a redraw of the mark from the brand sheet; replace them with the master SVG if you have one, then regenerate the icons: `pnpm dlx sharp-cli -i assets/naurix-icon.svg -o assets/naurix-icon-1024.png resize 1024 1024 && pnpm tauri icon assets/naurix-icon-1024.png` (delete the `android/` and `ios/` folders it creates inside `src-tauri/icons`).

**Upgrading from the old name:** your workspaces and settings are moved automatically from `dev.agentterminal.app` to `dev.naurix.app` the first time Naurix starts.

## Documents

[Product Vision](docs/PRODUCT_VISION.md) · [PRD](docs/PRD.md) · [Technical Design](docs/TECHNICAL_DESIGN.md) · [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) · [Performance & Compatibility](docs/PERFORMANCE_AND_COMPATIBILITY.md) · [ADRs](docs/adr/README.md) · [Agent instructions](AGENTS.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)

## Principles

Terminal first · local first · user control · honest agent status · metadata-only persistence · measured performance.

Licensed under [Apache-2.0](LICENSE).

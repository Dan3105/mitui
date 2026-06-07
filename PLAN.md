# mitui — Framework Plan

> A personal TUI framework built on `@opentui/core` (anomalyco/opentui).
> Goal: reusable components, layout shells, work-domain plugins, and an agent skill —
> so future work is configuration + adapters, not rebuilding UI from scratch.

---

## Source
- [opentui(https://opentui.com/)]

## Stack

| Concern | Choice |
|---|---|
| Runtime | Bun (OpenTUI is Bun-exclusive; Node support in-progress upstream) |
| Language | TypeScript |
| Package manager | pnpm (Bun as runtime) |
| Framework binding | React |
| Monorepo | pnpm workspaces |

---

## Repo Structure

```
mitui/
├── packages/
│   ├── core/              # Base components, layouts, and plugins
│   │   ├── components/
│   │   ├── layouts/
│   │   └── plugins/
│   │       ├── ai/
│   │       ├── vault/
│   │       ├── code/
│   │       ├── tasks/
│   │       └── monitor/
│   └── agent-skill/       # SKILL.md consumed by coding agents
├── apps/
│   └── dev/               # Live dev harness for isolated component testing
├── package.json
└── bun.lockb
```

---

## Layer 1 — `packages/core/components` (Base Components)

All components wrap OpenTUI primitives with opinionated defaults.
Shared adapter interfaces are exported from `packages/core/components` as the package evolves.

| Component | Wraps (OpenTUI) | Purpose |
|---|---|---|
| `Panel` | `Box` | Bordered, titled container |
| `StatusBar` | `Box` + `Text` | Bottom bar — mode, context, keybindings |
| `CommandPalette` | `Input` + `ScrollBox` | Fuzzy-findable action list |
| `Tree` | `ScrollBox` + `Text` | File/node tree with expand/collapse |
| `ChatThread` | `ScrollBox` + `Markdown` | Scrollable AI conversation with streaming |
| `CodeBlock` | `Code` + `LineNumbers` | file or snippet, read-only, syntax highlighted |
| `FileDiff` | `Diff` | Wrapped diff with syntax highlight |
| `TaskList` | `ScrollBox` + `Text` | Checkable, filterable task rows |
| `MetricBar` | `Text` | label + value + status color |

**Rule:** components accept data via typed props and adapter interfaces only.
No component imports a specific SDK (Anthropic, fs, git, etc.) directly.

---

## Layer 2 — `packages/core/layouts`

Terminal layouts are constrained by the character grid — no sub-character positioning, no overlapping regions, fixed width. Keep layouts simple and composable.

Layouts are blueprint components. They define regions and sizing with plain JSX `<box>` primitives, and callers fill those regions by passing `ReactNode` props. No plugin registry is involved at this layer.

Two layouts are in scope. Others are deferred until there is a clear need.

```
FullscreenLayout  →  regions: main, footer
SidebarLayout     →  regions: sidebar, main, footer
```

**`FullscreenLayout`**
One region fills the entire terminal. `footer` is an optional fixed single-line strip at the bottom that collapses when absent.

```
┌─────────────────────────┐
│                         │
│          main           │
│                         │
├─────────────────────────┤
│         footer          │
└─────────────────────────┘
```

**`SidebarLayout`**
Fixed-width left sidebar + flexible right main area. `footer` spans the full width when present. Sidebar width is a fixed column count with a default of `40`.

```
┌────────┬────────────────┐
│        │                │
│sidebar │      main      │
│        │                │
├────────┴────────────────┤
│         footer          │
└─────────────────────────┘
```

**Composition note:** complex layouts are built by nesting — put a second layout or split inside `main` rather than creating a new top-level layout. This keeps the layout primitives minimal.

---

## Layer 3 — `packages/core/plugins`

Each plugin = `adapter(s)` + `component` + slot registration.
Components live in `packages/core/components`. Plugins wire adapters to components and register into slots.

### Plugin architecture pattern

```
plugin/
  adapters/
    <source>.ts    ← implements the adapter interface for one data source
  types.ts         ← adapter interface (also re-exported from packages/core/components/types)
  component.ts     ← renders using packages/core/components, accepts adapter
  index.ts         ← registers into slot registry
```

To add a new data source to any plugin: write one `adapter.ts`. Component unchanged.

---

### `ai-plugin`

**Slot:** `main`

**What it does:**
Renders a live streaming chat interface. User types in a `Textarea`, sends a message,
assistant response streams token-by-token into a `Markdown`-rendered `ScrollBox`.
Conversation history held in memory per session. Supports system prompt configuration.

**Features:**
- Multi-turn conversation with full history context
- Live token streaming (renders as tokens arrive, not after full response)
- Markdown-rendered assistant output (code blocks, lists, bold, etc. via OpenTUI `Markdown`)
- Syntax-highlighted code blocks in responses (Tree-sitter, via OpenTUI `Code`)
- Configurable system prompt per invocation
- Model switcher (via `Select` component — swap model without restarting)
- Session memory: conversation persists while the plugin is mounted

**Adapter interface:**
```ts
interface LLMMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface LLMAdapter {
  id: string           // "anthropic" | "openai" | "ollama" | "gemini"
  model: string        // "claude-sonnet-4-5", "gpt-4o", "llama3", etc.
  stream(messages: LLMMessage[]): AsyncIterable<string>  // yields token chunks
  models?(): Promise<string[]>  // optional: list available models
}
```

**Adapters to build:**
- `anthropic.ts` — Anthropic SDK stream
- `openai.ts` — OpenAI SDK stream (also covers OpenAI-compatible APIs)
- `ollama.ts` — Ollama REST stream

**Note:** `AsyncIterable<string>` compatibility across SDKs needs verification per adapter
before implementation. Flag as an implementation-time concern, not a design concern.

---

### `vault-plugin`

**Slot:** `sidebar`

**What it does:**
Renders your Obsidian vault as a navigable file tree. Integrates Graphify's `graph.json`
to show structural file relationships inline. Selecting a file emits an event consumed
by other plugins (e.g. `code-plugin` opens it, `ai-plugin` can load it as context).

**Features:**
- Vault directory tree with expand/collapse (keyboard-navigable)
- File watcher: tree auto-updates on vault changes without restart
- Graphify integration: shows related files from `graph.json` as inline hints
- File selection event bus — other plugins subscribe to `fileSelected`
- Filter/search bar to narrow tree by filename
- Visual indicator for files with Graphify relations

**Adapter interface:**
```ts
interface VaultNode {
  path: string
  label: string
  type: "file" | "dir"
  children?: VaultNode[]
  relations?: string[]   // file paths from Graphify graph.json
}

interface VaultAdapter {
  tree(): Promise<VaultNode[]>
  watch(cb: (tree: VaultNode[]) => void): () => void   // returns unwatch
}
```

**Adapters to build:**
- `fs.ts` — reads vault directory, watches via Bun file watcher
- `graphify.ts` — parses `graph.json`, attaches `relations` to nodes

---

### `code-plugin`

**Slot:** `main`

**What it does:**
Opens and renders a file with syntax highlighting. Optionally shows a git diff.
File picker (via `CommandPalette`) triggered by a keymap shortcut.
Listens to `vault-plugin` `fileSelected` events to auto-open files.

**Features:**
- Syntax-highlighted file view (Tree-sitter via OpenTUI `Code`)
- Git diff view toggle (side-by-side via OpenTUI `Diff`)
- Line numbers (via OpenTUI `LineNumbers`)
- File picker: fuzzy-search open via keymap shortcut
- Auto-open on `vault-plugin` `fileSelected` event
- Read-only by default; edit mode is a future concern

**Adapter interface:**
```ts
interface FileAdapter {
  read(path: string): Promise<string>
  diff(path: string): Promise<{ before: string; after: string } | null>
  filetype(path: string): string   // "typescript" | "python" | "markdown" | etc.
}
```

**Adapters to build:**
- `fs.ts` — local file read
- `git.ts` — git diff via shell exec (`git diff HEAD <path>`)

---

### `tasks-plugin`

**Slot:** `sidebar` or `main`

**What it does:**
Manages tasks from a markdown file using `- [ ]` / `- [x]` syntax.
Renders a filterable, checkable task list. Writes back to the source file on toggle.

**Features:**
- Parse and render tasks from markdown (`- [ ]` / `- [x]`)
- Toggle task done/undone with a keypress — writes back to file immediately
- Filter by: done status, tag (`#tag` in task text), or free-text search
- Group by: tag, file, or status
- Multi-file aggregation — pull tasks from multiple markdown files into one view
- Task count summary in `StatusBar` (e.g. `3/10 done`)
- Add new task inline (input row at bottom)
- Jump-to-file: open the source file in `code-plugin` at the task's line

**Ideas for how this helps your work:**
- Daily driver: keep a `tasks.md` in your Obsidian vault, surface it in the sidebar
  while you work — no context switching to a separate app
- Agent output tracking: when an AI agent completes subtasks, it writes them
  to a markdown file; `tasks-plugin` shows live progress in your TUI
- Project task board: one markdown file per project, switch between them via `Select`
- Code review checklist: a `review.md` per PR, open alongside `code-plugin` diff view
- Vault-integrated: because `vault-plugin` and `tasks-plugin` share the event bus,
  selecting a file in the vault can auto-load its embedded tasks

**Adapter interface:**
```ts
interface Task {
  id: string
  label: string
  done: boolean
  tags: string[]
  source: string    // file path
  line: number      // line number in source file
}

interface TaskAdapter {
  list(filter?: { tag?: string; done?: boolean; query?: string }): Promise<Task[]>
  toggle(id: string): Promise<void>
  add(label: string, tags?: string[]): Promise<void>
}
```

**Adapters to build:**
- `markdown-file.ts` — parse/write `- [ ]` markdown tasks (primary)
- `multi-file.ts` — aggregates across multiple markdown files (secondary)

**Future adapters (not in scope now):**
- `linear.ts` — Linear API
- `github.ts` — GitHub Issues

---

### `monitor-plugin`

**Slot:** `footer`

**What it does:**
Polls system metrics at a configurable interval. Renders compact `MetricBar` rows.
Color-coded by threshold (ok / warn / critical).

**Features:**
- CPU usage, memory usage, disk I/O
- Named process watch: show status of specific processes (e.g. your dev server)
- Configurable poll interval per metric
- Color threshold: green/yellow/red based on configurable bounds
- Alert on threshold breach (via OpenTUI `Notifications`)
- Metric history sparkline (optional — future)

**Adapter interface:**
```ts
interface Metric {
  label: string
  value: string | number
  unit?: string
  status?: "ok" | "warn" | "critical"
}

interface MonitorAdapter {
  poll(): Promise<Metric[]>
  interval: number   // ms
}
```

**Adapters to build:**
- `systeminformation.ts` — wraps `systeminformation` npm package

---

## Layer 4 — `packages/agent-skill`

A `SKILL.md` consumed by Claude Code, OpenCode, Cursor, and other coding agents.

**Contents:**
- Component API reference (props, children, usage pattern)
- Layout shells and their slot names
- How to register a new plugin
- How to write a new adapter
- Naming conventions
- What NOT to do (no direct SDK imports in components, no bypassing slot registry)

**Purpose:** agents read this and generate conforming code — no freeform decisions
about structure, naming, or wiring.

---

## Build Order

| Step | Package | Gate |
|---|---|---|
| 1 | `apps/dev` — harness only, no components yet | Nothing |
| 2 | `packages/core` — base components, adapter interfaces, no plugins | Nothing |
| 3 | `packages/core/layouts` — layout blueprints with named regions | Core done |
| 4 | `packages/core/plugins/tasks` — simplest plugin, no external API | Layouts done |
| 5 | `packages/core/plugins/vault` — file system + Graphify | Layouts done |
| 6 | `packages/core/plugins/code` — file reading + git diff | Layouts done |
| 7 | `packages/core/plugins/monitor` — systeminformation | Layouts done |
| 8 | `packages/core/plugins/ai` — LLM adapters | Layouts done |
| 9 | `packages/agent-skill` — write as you build, finalize last | All plugins done |

---

## Risks

| Risk | Detail |
|---|---|
| OpenTUI API instability | Actively developed. Pin `@opentui/core` version. Review changelog before upgrading. |
| Bun-only runtime | Node support in-progress upstream. Don't abstract prematurely — wait for official support. |
| `AsyncIterable` adapter compatibility | Verify per LLM SDK before implementing `ai-plugin` adapters. Design is sound; implementation needs confirmation. |
| Python `opentui` on PyPI | Separate community project. Not the same library. Do not mix. |
| Plugin slot bypass | Don't directly manipulate the renderer inside plugins. All UI goes through `SlotRenderable`. |

---

## Open Decisions

- [ ] Event bus implementation for cross-plugin communication (`fileSelected`, `taskCountChanged`, etc.) — evaluate OpenTUI's notification system vs a simple EventEmitter
- [ ] Persistence layer for tasks (in-memory per session vs writing back to file on every toggle)
- [ ] Package naming: `@mitui/*` or a real name

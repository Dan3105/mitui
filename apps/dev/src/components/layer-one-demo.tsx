import { SyntaxStyle } from "@opentui/core"
import {
  CommandPalette,
  CodeBlock,
  FileDiff,
  MetricBar,
  Panel,
  StatusBar,
  TaskList,
  Tree,
  type CommandPaletteItem,
  type TaskItem,
  type TreeNode,
} from "@path/core"

const markdownStyle = SyntaxStyle.create()

const commands: CommandPaletteItem[] = [
  { id: "open", label: "Open file", description: "Jump to a workspace file" },
  { id: "chat", label: "Ask assistant", description: "Send context to chat" },
  { id: "task", label: "Create task", description: "Add a markdown task" },
]

const tree: TreeNode[] = [
  {
    id: "packages",
    label: "packages",
    type: "dir",
    expanded: true,
    children: [
      {
        id: "core",
        label: "core",
        type: "dir",
        expanded: true,
        children: [{ id: "panel", label: "panel.tsx", type: "file" }],
      },
    ],
  },
  { id: "plan", label: "PLAN.md", type: "file" },
]

const codeBlockContent = `export function CodeBlockDemo() {
  const answer = 42

  return <text>The answer is {answer}</text>
}`

const diff = `diff --git a/panel.tsx b/panel.tsx
index 1111111..2222222 100644
--- a/panel.tsx
+++ b/panel.tsx
@@ -1,12 +1,20 @@
 export function Panel() {
-  return <box />
+  return <box border title="Panel" />
 }
+export function StatusBar() {
+  return <box border><text>DEV</text></box>
+}
+export function CommandPalette() {
+  return <scrollbox><input placeholder="Search" /></scrollbox>
+}
+export function Tree() {
+  return <scrollbox><text>packages</text></scrollbox>
+}
+export function ChatThread() {
+  return <scrollbox><markdown content="hello" /></scrollbox>
+}
+export function CodeBlock() {
+  return <line-number><code content="const answer = 42" filetype="typescript" syntaxStyle={syntaxStyle} /></line-number>
+}
+export function FileDiff() {
+  return <scrollbox scrollY><diff diff={diff} /></scrollbox>
+}
+export function TaskList() {
+  return <scrollbox><text>[ ] review</text></scrollbox>
+}
+export function MetricBar() {
+  return <text>CPU: 21%</text>
+}
`

const tasks: TaskItem[] = [
  { id: "task-panel", label: "Build Panel", done: true, tags: ["#core"] },
  { id: "task-status", label: "Review StatusBar", done: false, tags: ["#core"] },
]

export function LayerOneDemo() {
  return (
    <box flexDirection="column" width="100%" height="100%" backgroundColor="#020617">
      <box flexDirection="row" flexGrow={1}>
        <Panel title="Tree" width="28%" margin={1}>
          <Tree nodes={tree} activeId="panel" height={12} />
        </Panel>

        <box flexDirection="column" flexGrow={1} margin={1}>
          <Panel title="CommandPalette" height={5} marginBottom={1}>
            <CommandPalette commands={commands} activeId="chat" height={5} />
          </Panel>

          <Panel title="CodeBlock" height={8} marginBottom={1}>
            <CodeBlock
              content={codeBlockContent}
              filetype="typescript"
              syntaxStyle={markdownStyle}
              startLine={12}
              height="100%"
              width="100%"
            />
          </Panel>

          <Panel title="FileDiff" flexGrow={1}>
            <FileDiff diff={diff} filetype="typescript" height={"auto"} />
          </Panel>
        </box>

        <box flexDirection="column" width="28%" margin={1}>
          <Panel title="TaskList" height={9} marginBottom={1}>
            <TaskList tasks={tasks} activeId="task-status" height={6} />
          </Panel>

          <Panel title="MetricBar" height={7}>
            <MetricBar label="CPU" value={21} unit="%" status="ok" />
            <MetricBar label="Memory" value={68} unit="%" status="warn" />
            <MetricBar label="Disk" value={91} unit="%" status="critical" />
          </Panel>
        </box>
      </box>

      <StatusBar
        mode="DEV"
        context="Layer 1 components - part 1"
        keybindings={[
          { key: "Ctrl+C", label: "quit" },
          { key: "2", label: "chat demo" },
        ]}
      />
    </box>
  )
}

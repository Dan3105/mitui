# Components

Layer 1 components live in `packages/core/src/components` and are exported from `@path/core`.

Use these components as typed UI primitives. They should receive data through props only. Do not import SDKs, filesystem helpers, git helpers, or plugin adapters inside core components.

## Import

```tsx
import { Panel, StatusBar } from "@path/core"
```

## Panel

Wraps OpenTUI `box`.

Purpose: bordered, titled container.

Props:
- `PanelProps = Omit<BoxProps, "border" | "shouldFill">`
- `title?: string`
- `titleAlignment?: "left" | "center" | "right"`
- accepts normal OpenTUI box layout and color props

Example:

```tsx
<Panel title="Tree" width="30%">
  <text>Content</text>
</Panel>
```

## StatusBar

Wraps OpenTUI `box` + `text`.

Purpose: bottom bar for mode, context, and keybindings.

Types:

```ts
interface StatusBarKeybinding {
  key: string
  label: string
}
```

Props:
- `mode: string`
- `context?: string`
- `keybindings?: StatusBarKeybinding[]`
- accepts normal OpenTUI box props except `children`

Example:

```tsx
<StatusBar
  mode="DEV"
  context="Layer 1 components"
  keybindings={[{ key: "Ctrl+C", label: "quit" }]}
/>
```

## CommandPalette

Wraps OpenTUI `input` + `scrollbox`.

Purpose: fuzzy-findable action list.

Types:

```ts
interface CommandPaletteItem {
  id: string
  label: string
  description?: string
}
```

Props:
- `commands: CommandPaletteItem[]`
- `query?: string`
- `activeId?: string`
- `inputProps?: Omit<InputProps, "value">`
- accepts normal OpenTUI scrollbox props except `children`

Example:

```tsx
<CommandPalette
  commands={[
    { id: "open", label: "Open file", description: "Jump to a workspace file" },
  ]}
  activeId="open"
/>
```

## Tree

Wraps OpenTUI `scrollbox` + `text`.

Purpose: file or node tree with expand/collapse state provided by props.

Types:

```ts
interface TreeNode {
  id: string
  label: string
  type: "file" | "dir"
  children?: TreeNode[]
  expanded?: boolean
}
```

Props:
- `nodes: TreeNode[]`
- `activeId?: string`
- accepts normal OpenTUI scrollbox props except `children`

Example:

```tsx
<Tree
  activeId="panel"
  nodes={[
    {
      id: "core",
      label: "core",
      type: "dir",
      expanded: true,
      children: [{ id: "panel", label: "panel.tsx", type: "file" }],
    },
  ]}
/>
```

## ChatThread

Wraps OpenTUI `scrollbox` + `markdown`.

Purpose: scrollable AI conversation. The parent owns message data and a thread-level status; the component derives Markdown streaming state from `status + last message`.

Types:

```ts
interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
}

type ChatStatus = "idle" | "streaming"
```

Props:
- `messages: ChatMessage[]`
- `status: ChatStatus`
- `markdownProps: Pick<MarkdownProps, "syntaxStyle"> & Partial<Omit<MarkdownProps, "content" | "streaming">>`
- accepts normal OpenTUI scrollbox props except `children`

Example:

```tsx
<ChatThread
  messages={[{ id: "m1", role: "assistant", content: "Hello" }]}
  status="idle"
  markdownProps={{ syntaxStyle }}
/>
```

Simple streaming use case:

```tsx
import { useState } from "react"
import { ChatThread, type ChatMessage, type ChatStatus } from "@path/core"

const chunks = ["Hello", ", ", "streaming ", "world."]

function StreamingChat({ syntaxStyle }: { syntaxStyle: SyntaxStyle }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "user-1", role: "user", content: "Stream a reply" },
  ])
  const [status, setStatus] = useState<ChatStatus>("idle")

  function startStreaming() {
    setStatus("streaming")
    setMessages((current) => [
      ...current,
      { id: "assistant-1", role: "assistant", content: "" },
    ])

    chunks.forEach((chunk, index) => {
      setTimeout(() => {
        setMessages((current) =>
          current.map((message) =>
            message.id === "assistant-1"
              ? {
                  ...message,
                  content: `${message.content}${chunk}`,
                }
              : message,
          ),
        )

        if (index === chunks.length - 1) {
          setStatus("idle")
        }
      }, index * 300)
    })
  }

  return (
    <box flexDirection="column">
      <box border height={3} onMouseDown={startStreaming}>
        <text>Start streaming</text>
      </box>
      <ChatThread messages={messages} status={status} markdownProps={{ syntaxStyle }} />
    </box>
  )
}
```

`ChatThread` is streaming-compatible, not a streaming controller. The parent or plugin owns the async stream, updates `messages`, and sets `status`; `ChatThread` passes `streaming={true}` only to the last message while `status === "streaming"`.

## CodeBlock

Wraps OpenTUI `line-number` + `code`.

Purpose: read-only viewer for a single file or extracted code snippet with syntax highlighting and line numbers. Distinct from `FileDiff` because it has no before/after state, and distinct from `ChatThread` because it is a standalone viewer rather than part of a conversation.

Types:

```ts
interface CodeBlockProps extends Omit<LineNumberProps, "children" | "lineNumberOffset" | "showLineNumbers"> {
  content: string
  filetype: string
  syntaxStyle: SyntaxStyle
  showLineNumbers?: boolean
  startLine?: number
}
```

Props:
- `content: string`
- `filetype: string` mapped to OpenTUI `Code` filetype; normalize extensions or info strings with `infoStringToFiletype()`
- `syntaxStyle: SyntaxStyle`
- `showLineNumbers?: boolean` defaults to `true`
- `startLine?: number` defaults to `1`
- accepts normal OpenTUI `line-number` props except `children`, `showLineNumbers`, and `lineNumberOffset`

Example:

```tsx
<CodeBlock
  content={"const answer = 42\n"}
  filetype="typescript"
  syntaxStyle={syntaxStyle}
  startLine={12}
  height={8}
/>
```

## FileDiff

Wraps OpenTUI `scrollbox` + `diff`.

Purpose: scrollable diff viewer for long files.

Props:
- `diff: string`
- `view?: "unified" | "split"` defaults to `unified`
- `showLineNumbers?: boolean` defaults to `true`
- `syncScroll?: boolean` defaults to `true`
- `diffProps?: Omit<DiffProps, "diff">`
- accepts normal OpenTUI scrollbox props except `children`

Example:

```tsx
<FileDiff diff={diffText} filetype="typescript" height={12} />
```

## TaskList

Wraps OpenTUI `scrollbox` + `text`.

Purpose: checkable, filterable task rows. Current core component renders task state from props; toggling belongs in adapters/plugins.

Types:

```ts
interface TaskItem {
  id: string
  label: string
  done: boolean
  tags?: string[]
}
```

Props:
- `tasks: TaskItem[]`
- `activeId?: string`
- accepts normal OpenTUI scrollbox props except `children`

Example:

```tsx
<TaskList
  activeId="review"
  tasks={[{ id: "review", label: "Review StatusBar", done: false, tags: ["#core"] }]}
/>
```

## MetricBar

Wraps OpenTUI `text`.

Purpose: compact metric row with label, value, unit, and status color.

Props:
- `label: string`
- `value: string | number`
- `unit?: string`
- `status?: "ok" | "warn" | "critical"` defaults to `ok`
- accepts normal OpenTUI text props except `children` and `content`

Example:

```tsx
<MetricBar label="CPU" value={21} unit="%" status="ok" />
```

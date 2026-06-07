import type { ReactNode } from "react"
import { useKeyboard } from "@opentui/react"
import { TaskList, Tree, type TaskItem, type TreeNode } from "@path/core/components"
import { FullscreenLayout, SidebarLayout } from "@path/core/layouts"

const tree: TreeNode[] = [
  {
    id: "packages",
    label: "packages",
    type: "dir",
    expanded: true,
    children: [
      {
        id: "layouts",
        label: "layouts",
        type: "dir",
        expanded: true,
        children: [
          { id: "fullscreen", label: "FullscreenLayout.tsx", type: "file" },
          { id: "sidebar", label: "SidebarLayout.tsx", type: "file" },
        ],
      },
    ],
  },
  { id: "plan", label: "PLAN.md", type: "file" },
]

const tasks: TaskItem[] = [
  { id: "layout-blueprint", label: "Keep layouts pure", done: true, tags: ["#layouts"] },
  { id: "footer-collapse", label: "Collapse footer when absent", done: false, tags: ["#layouts"] },
  { id: "sidebar-width", label: "Verify custom sidebar width", done: false, tags: ["#demo"] },
]

type LayoutVariant = "fullscreen" | "sidebar" | "sidebar-no-footer"

interface DemoConfig {
  title: string
  summary: string
  layout: ReactNode
}

function FooterLine({ text }: { text: string }) {
  return (
    <box height={1} paddingX={1} backgroundColor="#1f2937">
      <text>{text}</text>
    </box>
  )
}

function FullscreenExample() {
  return (
    <FullscreenLayout
      main={
        <box flexDirection="column" paddingX={2} paddingY={1}>
          <text fg="#f8fafc">FullscreenLayout</text>
          <text fg="#94a3b8">Single content region with an optional one-line footer.</text>
          <box marginTop={1} flexDirection="column">
            <text>main fills remaining terminal space</text>
            <text>footer is rendered only when provided</text>
            <text>use nesting for more complex arrangements</text>
          </box>
        </box>
      }
      footer={
        <FooterLine text="footer | 1 layer-1 | 2 chat | F fullscreen | S sidebar | N no-footer | Ctrl+C quit" />
      }
    />
  )
}

function SidebarExample({ footer = true, sidebarWidth = 40 }: { footer?: boolean; sidebarWidth?: number }) {
  return (
    <SidebarLayout
      sidebarWidth={sidebarWidth}
      sidebar={
        <box border paddingX={1} paddingY={1}>
          <text fg="#f8fafc">sidebar</text>
          <Tree nodes={tree} activeId="fullscreen" height={10} />
        </box>
      }
      main={
        <box flexDirection="column" paddingX={2} paddingY={1}>
          <text fg="#f8fafc">main</text>
          <text fg="#94a3b8">Sidebar width is fixed while main grows to fill the rest.</text>
          <box marginTop={1}>
            <TaskList tasks={tasks} activeId="footer-collapse" height={7} />
          </box>
          <box marginTop={1} flexDirection="column">
            <text>sidebarWidth: {String(sidebarWidth)}</text>
            <text>footer: {footer ? "present" : "collapsed"}</text>
          </box>
        </box>
      }
      footer={
        footer ? (
          <FooterLine
            text={`footer | width ${sidebarWidth} | 1 layer-1 | 2 chat | F fullscreen | S sidebar | N no-footer`}
          />
        ) : undefined
      }
    />
  )
}

const demos: Record<LayoutVariant, DemoConfig> = {
  fullscreen: {
    title: "FullscreenLayout",
    summary: "One main region plus an optional single-line footer.",
    layout: <FullscreenExample />,
  },
  sidebar: {
    title: "SidebarLayout",
    summary: "Fixed 40-column sidebar with footer rendered.",
    layout: <SidebarExample />,
  },
  "sidebar-no-footer": {
    title: "SidebarLayout without footer",
    summary: "Custom 32-column sidebar with the footer region collapsed.",
    layout: <SidebarExample footer={false} sidebarWidth={32} />,
  },
}

export function LayerTwoDemo({
  variant,
  onVariantChange,
}: {
  variant: LayoutVariant
  onVariantChange: (variant: LayoutVariant) => void
}) {
  useKeyboard((key) => {
    if (key.name?.toLowerCase() === "f") {
      onVariantChange("fullscreen")
    }

    if (key.name?.toLowerCase() === "s") {
      onVariantChange("sidebar")
    }

    if (key.name?.toLowerCase() === "n") {
      onVariantChange("sidebar-no-footer")
    }
  })

  const demo = demos[variant]

  return (
    <box flexDirection="column" width="100%" height="100%">
      <box height={3} border flexDirection="column">
        <box height={1} paddingX={1}>
          <text>Layer 2 Layouts | {demo.title} | {demo.summary}</text>
        </box>
        <box height={1} />
      </box>
      <box flexGrow={1}>{demo.layout}</box>
    </box>
  )
}

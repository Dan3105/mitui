# Layouts

Layer 2 layouts live in `packages/layouts` and are exported from `@path/layouts`.

Use these components as layout blueprints. They define regions and sizing only. Fill each region by passing `ReactNode` props.

Rules:
- use plain region props like `main`, `sidebar`, and `footer`
- build the layout shell with `FullscreenLayout` or `SidebarLayout`
- put real UI components inside those regions
- keep plugin registries, adapters, and data fetching out of this layer
- when a screen needs more structure, nest another layout or split inside `main`

## Import

```tsx
import { FullscreenLayout, SidebarLayout } from "@path/layouts"
```

## FullscreenLayout

Purpose: one full-screen main region with an optional one-line footer.

Props:
- `main: ReactNode`
- `footer?: ReactNode`

Behavior:
- root uses column layout
- `main` grows to fill available space
- `footer` is rendered only when provided
- when `footer` is absent, the footer region collapses completely

Example:

```tsx
import { Panel, StatusBar } from "@path/core"
import { FullscreenLayout } from "@path/layouts"

export function ChatScreen() {
  return (
    <FullscreenLayout
      main={
        <Panel title="Chat" flexGrow={1}>
          <text>Conversation goes here</text>
        </Panel>
      }
      footer={
        <box height={1} paddingX={1} backgroundColor="#1f2937">
          <text>footer | Ctrl+C quit</text>
        </box>
      }
    />
  )
}
```

## SidebarLayout

Purpose: fixed-width left sidebar, flexible main region, optional one-line footer.

Props:
- `sidebar: ReactNode`
- `main: ReactNode`
- `footer?: ReactNode`
- `sidebarWidth?: number`

Behavior:
- root uses column layout
- content row uses row layout
- `sidebarWidth` is a fixed column count
- default `sidebarWidth` is `40`
- `main` grows to fill remaining space
- `footer` is rendered only when provided

Example:

```tsx
import { Tree, CodeBlock } from "@path/core"
import { SidebarLayout } from "@path/layouts"

export function WorkspaceScreen({ syntaxStyle }: { syntaxStyle: SyntaxStyle }) {
  return (
    <SidebarLayout
      sidebarWidth={32}
      sidebar={
        <box border paddingX={1} paddingY={1}>
          <Tree nodes={nodes} activeId="current-file" height={12} />
        </box>
      }
      main={
        <box paddingX={1} paddingY={1}>
          <CodeBlock
            content={content}
            filetype="typescript"
            syntaxStyle={syntaxStyle}
            height="100%"
          />
        </box>
      }
      footer={
        <box height={1} paddingX={1} backgroundColor="#1f2937">
          <text>footer | F file | D diff</text>
        </box>
      }
    />
  )
}
```

## Footer Guidance

`footer` is a layout region name, not a component name.

Use `footer` for:
- a one-line keybinding strip
- a compact metric strip
- a simple status line

Do not assume the existing `StatusBar` core component fits this region. `StatusBar` currently renders as a taller bordered component, so a layout footer should usually use a dedicated one-line `<box>` instead.

## Nesting

If a screen needs more complexity:
- keep `FullscreenLayout` or `SidebarLayout` as the outer shell
- place a second layout, split, or custom box composition inside `main`

Do not add new top-level layouts for every screen variation.

## Do / Don't

Do:
- pass required regions explicitly
- keep layout components stateless and presentational
- keep footer optional
- override `sidebarWidth` only when a screen genuinely needs a different fixed width

Don't:
- add plugin slot registries to `packages/layouts`
- fetch data or import SDKs in layout components
- use wrapper components to define the outer layout skeleton
- rename `footer` to `statusbar`

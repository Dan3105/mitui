import type { DiffProps, ScrollBoxProps } from "@opentui/react"

type FileDiffRenderProps = Pick<
  DiffProps,
  "conceal" | "fg" | "filetype" | "showLineNumbers" | "syncScroll" | "syntaxStyle" | "view" | "wrapMode"
>

export interface FileDiffProps extends Omit<ScrollBoxProps, "children">, FileDiffRenderProps {
  diff: string
  diffProps?: Omit<DiffProps, "diff">
}

export function FileDiff({
  diff,
  diffProps,
  conceal,
  fg,
  filetype,
  view = "unified",
  showLineNumbers = true,
  syncScroll = true,
  syntaxStyle,
  wrapMode,
  ...scrollProps
}: FileDiffProps) {
  return (
    <scrollbox scrollY scrollX {...scrollProps}>
      <diff
        width="100%"
        diff={diff}
        {...diffProps}
        conceal={conceal}
        fg={fg}
        filetype={filetype}
        showLineNumbers={showLineNumbers}
        syncScroll={syncScroll}
        syntaxStyle={syntaxStyle}
        view={view}
        wrapMode={wrapMode}
      />
    </scrollbox>
  )
}

import type { BoxProps } from "@opentui/react"

export type PanelProps = Omit<BoxProps, "border" | "shouldFill">

export function Panel({
  children,
  title,
  titleAlignment = "left",
  ...props
}: PanelProps) {
  return (
    <box border shouldFill title={title} titleAlignment={titleAlignment} {...props}>
      {children}
    </box>
  )
}

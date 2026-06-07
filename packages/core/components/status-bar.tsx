import type { BoxProps } from "@opentui/react"

export interface StatusBarKeybinding {
  key: string
  label: string
}

export interface StatusBarProps extends Omit<BoxProps, "children"> {
  mode: string
  context?: string
  keybindings?: StatusBarKeybinding[]
}

export function StatusBar({
  mode,
  context,
  keybindings = [],
  backgroundColor = "#1f2937",
  borderColor = "#374151",
  ...props
}: StatusBarProps) {
  const keybindingText = keybindings
    .map((binding) => `${binding.key} ${binding.label}`)
    .join("  ")

  return (
    <box
      border
      height={3}
      paddingX={1}
      backgroundColor={backgroundColor}
      borderColor={borderColor}
      {...props}
    >
      <text>
        {mode}
        {context ? ` | ${context}` : ""}
        {keybindingText ? ` | ${keybindingText}` : ""}
      </text>
    </box>
  )
}

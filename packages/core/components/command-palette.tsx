import type { InputProps, ScrollBoxProps } from "@opentui/react"

export interface CommandPaletteItem {
  id: string
  label: string
  description?: string
}

export interface CommandPaletteProps extends Omit<ScrollBoxProps, "children"> {
  commands: CommandPaletteItem[]
  query?: string
  activeId?: string
  inputProps?: Omit<InputProps, "value">
}

export function CommandPalette({
  commands,
  query = "",
  activeId,
  inputProps,
  borderColor = "#475569",
  ...props
}: CommandPaletteProps) {
  const normalizedQuery = query.trim().toLowerCase()
  const visibleCommands = normalizedQuery
    ? commands.filter((command) =>
      `${command.label} ${command.description ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery),
    )
    : commands

  return (
    <scrollbox border padding={0} borderColor={borderColor} {...props}>
      <input value={query} placeholder="Search commands" {...inputProps} />
      {visibleCommands.map((command) => (
        <text key={command.id}>
          {command.id === activeId ? "> " : "  "}
          {command.label}
          {command.description ? ` - ${command.description}` : ""}
        </text>
      ))}
    </scrollbox>
  )
}

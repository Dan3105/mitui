import type { TextProps } from "@opentui/react"

export interface MetricBarProps extends Omit<TextProps, "children" | "content"> {
  label: string
  value: string | number
  unit?: string
  status?: "ok" | "warn" | "critical"
}

const statusColor = {
  ok: "#22c55e",
  warn: "#f59e0b",
  critical: "#ef4444",
} satisfies Record<NonNullable<MetricBarProps["status"]>, string>

export function MetricBar({ label, value, unit = "", status = "ok", fg, ...props }: MetricBarProps) {
  return (
    <text fg={fg ?? statusColor[status]} {...props}>
      {label}: {value}
      {unit}
    </text>
  )
}

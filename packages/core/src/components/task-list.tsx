import type { ScrollBoxProps } from "@opentui/react"

export interface TaskItem {
  id: string
  label: string
  done: boolean
  tags?: string[]
}

export interface TaskListProps extends Omit<ScrollBoxProps, "children"> {
  tasks: TaskItem[]
  activeId?: string
}

export function TaskList({ tasks, activeId, borderColor = "#475569", ...props }: TaskListProps) {
  return (
    <scrollbox border padding={1} borderColor={borderColor} {...props}>
      {tasks.map((task) => (
        <text key={task.id}>
          {task.id === activeId ? "> " : "  "}
          [{task.done ? "x" : " "}] {task.label}
          {task.tags?.length ? ` ${task.tags.join(" ")}` : ""}
        </text>
      ))}
    </scrollbox>
  )
}

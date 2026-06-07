import type { MarkdownProps, ScrollBoxProps } from "@opentui/react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
}

export type ChatStatus = "idle" | "streaming"

export interface ChatThreadProps extends Omit<ScrollBoxProps, "children"> {
  messages: ChatMessage[]
  status: ChatStatus
  markdownProps: Pick<MarkdownProps, "syntaxStyle"> & Partial<Omit<MarkdownProps, "content" | "streaming">>
  borderColor?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ChatThread - scrollable conversation renderer.
 *
 * Behavior:
 * - Renders all messages in order, role label above each message content.
 * - The last message receives `streaming={true}` when status === "streaming".
 *   All other messages always receive `streaming={false}`.
 * - stickyScroll + stickyStart="bottom" keeps the view pinned to the latest
 *   message as tokens arrive. Scrolling up pauses sticky; scrolling back to
 *   bottom resumes it through OpenTUI native behavior.
 * - `streaming` is never part of ChatMessage. The component derives it from
 *   status + position. The parent owns only data and status.
 */
export function ChatThread({
  messages,
  status,
  markdownProps,
  borderColor = "#475569",
  ...scrollBoxProps
}: ChatThreadProps) {
  return (
    <scrollbox
      border
      padding={1}
      stickyScroll
      stickyStart="bottom"
      borderColor={borderColor}
      {...scrollBoxProps}
    >
      {messages.map((message, index) => {
        const isLast = index === messages.length - 1
        const isStreaming = isLast && status === "streaming"

        return (
          <box key={message.id} marginBottom={1} flexDirection="column">
            <text fg={message.role === "user" ? "#7aa2f7" : "#9ece6a"}>{message.role}</text>
            <markdown {...markdownProps} content={message.content} streaming={isStreaming} />
          </box>
        )
      })}
    </scrollbox>
  )
}

import { RGBA, SyntaxStyle } from "@opentui/core"
import { useKeyboard } from "@opentui/react"
import { useCallback, useRef, useState } from "react"
import { ChatThread, Panel, StatusBar, type ChatMessage, type ChatStatus } from "@path/core"

type LLMRole = Exclude<ChatMessage["role"], "system">

interface LLMMessage {
  role: LLMRole
  content: string
}

interface LLMAdapter {
  stream(messages: LLMMessage[], options?: { signal?: AbortSignal }): AsyncIterable<string>
}

const syntaxStyle = SyntaxStyle.fromStyles({
  "markup.heading.1": { fg: RGBA.fromHex("#58A6FF"), bold: true },
  "markup.list": { fg: RGBA.fromHex("#FF7B72") },
  "markup.raw": { fg: RGBA.fromHex("#A5D6FF") },
  default: { fg: RGBA.fromHex("#E6EDF3") },
})

const demoPrompts = [
  "Show the static ChatThread contract.",
  "Stream a short implementation note.",
  "Explain how abort finalizes status.",
]

const mockAdapter: LLMAdapter = {
  async *stream(messages, options) {
    const lastUserMessage = messages.findLast((message) => message.role === "user")
    const chunks = [
      "# ", "Chat", "Thread", " ", "streaming", "\n", "\n",
      "- ", "Append ", "an", " ", "empty ", "assistant", " ", "message ", "before ", "streaming", ".\n",
      "- ", "Keep ", "`", "streaming", "`", " ", "out ", "of ", "each ", "message ", "object", ".\n",
      "- ", "Set ", "`", "status", "`", " ", "back ", "to ", "`", "idle", "`", " ", "in ", "`", "finally", "`", ".\n", "\n",
      "Prompt ", "received", ": ", `${lastUserMessage?.content ?? "none"}`, "\n",
    ]

    for (const chunk of chunks) {
      await sleep(50, options?.signal)
      yield chunk
    }
  },
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("The operation was aborted.", "AbortError"))
      return
    }

    const timeout = setTimeout(resolve, ms)
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout)
        reject(new DOMException("The operation was aborted.", "AbortError"))
      },
      { once: true },
    )
  })
}

export function LayerOneChatDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "static-user", role: "user", content: "What is Bun?" },
    { id: "static-assistant", role: "assistant", content: "Bun is a fast JavaScript runtime." },
  ])
  const [status, setStatus] = useState<ChatStatus>("idle")
  const [promptIndex, setPromptIndex] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const send = useCallback(async () => {
    if (status === "streaming") {
      return
    }

    const userInput = demoPrompts[promptIndex] ?? demoPrompts[0] ?? "Run the chat demo."
    const userId = crypto.randomUUID()
    const assistantId = crypto.randomUUID()

    const nextMessages: ChatMessage[] = [
      ...messages,
      { id: userId, role: "user", content: userInput },
      { id: assistantId, role: "assistant", content: "" },
    ]

    const controller = new AbortController()
    let accumulated = ""

    abortRef.current = controller
    setMessages(nextMessages)
    setStatus("streaming")

    try {
      const history = nextMessages
        .slice(0, -1)
        .filter((message): message is ChatMessage & { role: LLMRole } => message.role !== "system")
        .map((message) => ({ role: message.role, content: message.content }))

      for await (const chunk of mockAdapter.stream(history, { signal: controller.signal })) {
        accumulated += chunk
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === assistantId ? { ...message, content: accumulated } : message,
          ),
        )
      }
    } catch (error) {
      if (!(error instanceof Error) || error.name !== "AbortError") {
        throw error
      }
    } finally {
      abortRef.current = null
      setStatus("idle")
    }
  }, [messages, promptIndex, status])

  useKeyboard((key) => {
    if (key.name === "s") {
      void send()
    }

    if (key.name === "x") {
      stop()
    }

    if (key.name === "tab" && status === "idle") {
      setPromptIndex((currentIndex) => (currentIndex + 1) % demoPrompts.length)
    }
  })

  return (
    <box flexDirection="column" width="100%" height="100%" backgroundColor="#020617">
      <box flexDirection="row" flexGrow={1}>
        <box flexDirection="column" width="30%" margin={1}>
          <Panel title="StaticExample" height={11} marginBottom={1}>
            <ChatThread
              messages={[
                { id: "1", role: "user", content: "What is Bun?" },
                { id: "2", role: "assistant", content: "Bun is a fast JavaScript runtime." },
              ]}
              status="idle"
              markdownProps={{ syntaxStyle }}
              height="100%"
            />
          </Panel>

          <Panel title="Controls" flexGrow={1}>
            <text fg="#94a3b8">Prompt</text>
            <text>{demoPrompts[promptIndex]}</text>
            <box
              border
              height={3}
              marginTop={1}
              paddingX={1}
              borderColor={status === "streaming" ? "#f59e0b" : "#22c55e"}
              onMouseDown={() => void send()}
            >
              <text>{status === "streaming" ? "Streaming..." : "Start stream"}</text>
            </box>
            <box border height={3} marginTop={1} paddingX={1} borderColor="#ef4444" onMouseDown={stop}>
              <text fg="#ef4444">Stop</text>
            </box>
          </Panel>
        </box>

        <Panel title="StreamingExample + Abort" flexGrow={1} margin={1}>
          <ChatThread messages={messages} status={status} markdownProps={{ syntaxStyle }} height="100%" />
        </Panel>
      </box>

      <StatusBar
        mode="DEV"
        context="Layer 1 ChatThread - part 2"
        keybindings={[
          { key: "1", label: "component demo" },
          { key: "S", label: "stream" },
          { key: "X", label: "stop" },
          { key: "Tab", label: "prompt" },
          { key: "Ctrl+C", label: "quit" },
        ]}
      />
    </box>
  )
}

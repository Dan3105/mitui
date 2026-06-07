import { useState } from "react"
import { FullscreenLayout } from "@path/core/layouts"
import { AiChatPanel, AiProvider, createAiController, type LLMProvider } from "@path/core/plugins/ai"

const mockProvider: LLMProvider = {
  id: "mock",
  defaultModel: "mock-sonnet",
  async models() {
    return ["mock-sonnet", "mock-haiku", "mock-opus"]
  },
  async *stream(messages, config, options) {
    const lastMessage = messages.findLast((message) => message.role === "user")
    const chunks = [
      "# ", "Mock ", "AI", "\n\n",
      "- ", "Model: ", config.model, "\n",
      "- ", "System prompt: ", config.systemPrompt || "none", "\n",
      "- ", "User message: ", lastMessage?.content ?? "none", "\n\n",
      "Use ", "`/models`", " ", "to ", "open ", "the ", "model ", "palette", ".",
    ]

    for (const chunk of chunks) {
      await sleep(45, options?.signal)
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

export function LayerThreeAiDemo() {
  const [controller] = useState(() => createAiController({ provider: mockProvider }))

  return (
    <AiProvider controller={controller}>
      <FullscreenLayout
        main={<AiChatPanel />}
        footer={
          <box height={1} paddingX={1} backgroundColor="#1f2937">
            <text>AI demo | Enter send | Shift+Enter newline | /models /system /stop | 1/2/3 demos | Ctrl+C quit</text>
          </box>
        }
      />
    </AiProvider>
  )
}

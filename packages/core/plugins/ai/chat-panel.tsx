import { RGBA, SyntaxStyle, type TextareaRenderable } from "@opentui/core"
import { useKeyboard } from "@opentui/react"
import { useMemo, useRef, useState } from "react"
import { ChatThread, CommandPalette } from "../../components"
import { useAiActions, useAiChat, useAiCommands, useAiConfig } from "./provider"

const aiSyntaxStyle = SyntaxStyle.fromStyles({
  "markup.heading.1": { fg: RGBA.fromHex("#93c5fd"), bold: true },
  "markup.heading.2": { fg: RGBA.fromHex("#bfdbfe"), bold: true },
  "markup.list": { fg: RGBA.fromHex("#fbbf24") },
  "markup.raw": { fg: RGBA.fromHex("#86efac") },
  default: { fg: RGBA.fromHex("#e5e7eb") },
})

const chatInputKeyBindings = [
  { name: "return", action: "submit" as const },
  { name: "kpenter", action: "submit" as const },
  { name: "return", shift: true, action: "newline" as const },
  { name: "kpenter", shift: true, action: "newline" as const },
]

function filteredModels(models: string[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return models
  }

  return models.filter((model) => model.toLowerCase().includes(normalizedQuery))
}

export function AiChatPanel() {
  const inputRef = useRef<TextareaRenderable>(null)
  const systemPromptRef = useRef<TextareaRenderable>(null)
  const [inputLineCount, setInputLineCount] = useState(1)
  const { messages, status, error } = useAiChat()
  const { send, stop } = useAiActions()
  const { config, availableModels, modelListStatus } = useAiConfig()
  const {
    activeCommand,
    setModelQuery,
    moveModelSelection,
    chooseSelectedModel,
    closeActiveCommand,
    setSystemPromptDraft,
    submitSystemPromptDraft,
  } = useAiCommands()

  const modelQuery = activeCommand?.type === "model_palette" ? activeCommand.query : ""
  const visibleModels = useMemo(() => filteredModels(availableModels, modelQuery), [availableModels, modelQuery])
  const activeModel = activeCommand?.type === "model_palette"
    ? visibleModels[activeCommand.selectedIndex]
    : undefined
  const inputHeight = Math.min(8, Math.max(3, inputLineCount))

  useKeyboard((key) => {
    if (activeCommand?.type === "model_palette") {
      if (key.name === "up") {
        key.preventDefault()
        moveModelSelection(-1)
      }

      if (key.name === "down") {
        key.preventDefault()
        moveModelSelection(1)
      }

      if (key.name === "return") {
        key.preventDefault()
        chooseSelectedModel()
      }

      if (key.name === "escape") {
        key.preventDefault()
        closeActiveCommand()
      }

      return
    }

    if (activeCommand?.type === "system_prompt" && key.name === "escape") {
      key.preventDefault()
      closeActiveCommand()
      return
    }

    if (status === "streaming" && key.name === "escape") {
      key.preventDefault()
      stop()
    }
  })

  async function submitInput() {
    const input = inputRef.current?.plainText ?? ""
    inputRef.current?.setText("")
    setInputLineCount(1)
    await send(input)
  }

  function submitSystemPrompt() {
    submitSystemPromptDraft()
    systemPromptRef.current?.setText("")
  }

  const modelCommands = availableModels.map((model) => ({
    id: model,
    label: model,
    description: model === config.model ? "current" : undefined,
  }))

  return (
    <box flexDirection="column" width="100%" height="100%" backgroundColor="#0f172a">
      <box height={3} border borderColor="#334155" paddingX={1}>
        <text>
          AI | {config.model} | {status}
          {modelListStatus === "loading" ? " | loading models" : ""}
          {" | /models /model /system /stop"}
        </text>
      </box>

      {error ? (
        <box height={3} border borderColor="#ef4444" paddingX={1}>
          <text fg="#fca5a5">{error}</text>
        </box>
      ) : null}

      {activeCommand?.type === "model_palette" ? (
        <box height={12} border borderColor="#38bdf8" padding={1}>
          <CommandPalette
            commands={modelCommands}
            query={activeCommand.query}
            activeId={activeModel}
            inputProps={{
              placeholder: "Filter models",
              onInput: setModelQuery,
              focused: true,
            }}
            height="100%"
          />
        </box>
      ) : null}

      {activeCommand?.type === "system_prompt" ? (
        <box flexDirection="column" height={8} border borderColor="#fbbf24" padding={1}>
          <text fg="#fde68a">System prompt</text>
          <textarea
            ref={systemPromptRef}
            initialValue={activeCommand.draft}
            placeholder="Describe assistant behavior..."
            focused
            height={4}
            keyBindings={chatInputKeyBindings}
            onContentChange={() => setSystemPromptDraft(systemPromptRef.current?.plainText ?? "")}
            onSubmit={submitSystemPrompt}
          />
        </box>
      ) : null}

      <box flexGrow={1}>
        <ChatThread messages={messages} status={status} markdownProps={{ syntaxStyle: aiSyntaxStyle }} height="100%" />
      </box>

      <box
        flexDirection="row"
        height={inputHeight + 2}
        border
        borderColor={status === "streaming" ? "#f59e0b" : "#22c55e"}
        padding={0}
      >
        <textarea
          ref={inputRef}
          placeholder={status === "streaming" ? "Streaming... use /stop or Escape" : "Enter sends, Shift+Enter adds a line"}
          focused={activeCommand === null}
          flexGrow={1}
          height={inputHeight}
          keyBindings={chatInputKeyBindings}
          wrapMode="word"
          onContentChange={() => {
            const lineCount = (inputRef.current?.plainText.match(/\n/g)?.length ?? 0) + 1
            setInputLineCount(lineCount)
          }}
          onSubmit={() => void submitInput()}
        />
        <box
          width={12}
          marginLeft={1}
          border
          borderColor={status === "streaming" ? "#f59e0b" : "#22c55e"}
          paddingX={1}
          onMouseDown={status === "streaming" ? stop : () => void submitInput()}
        >
          <text>{status === "streaming" ? "Stop" : "Send"}</text>
        </box>
      </box>
    </box>
  )
}

import {
  LLMConfigSchema,
  type AiCommand,
  type AiController,
  type AiState,
  type CreateAiControllerOptions,
  type LLMConfig,
} from "./types"

function createMessageId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError"
}

function normalizeModelList(models: string[], fallback: string) {
  const deduped = Array.from(new Set([fallback, ...models].filter(Boolean)))
  return deduped.length > 0 ? deduped : [fallback]
}

function filterModels(state: AiState) {
  if (state.activeCommand?.type !== "model_palette") {
    return state.availableModels
  }

  const query = state.activeCommand.query.trim().toLowerCase()
  if (!query) {
    return state.availableModels
  }

  return state.availableModels.filter((model) => model.toLowerCase().includes(query))
}

export function createAiController({
  provider,
  initialConfig,
  commands = [],
}: CreateAiControllerOptions): AiController {
  const listeners = new Set<() => void>()
  const customCommands = new Map<string, AiCommand>()
  let abortController: AbortController | null = null
  let providerModelsAreAuthoritative = false

  let state: AiState = {
    messages: [],
    status: "idle",
    config: LLMConfigSchema.parse({
      model: initialConfig?.model ?? provider.defaultModel,
      systemPrompt: initialConfig?.systemPrompt,
      temperature: initialConfig?.temperature,
    }),
    availableModels: [initialConfig?.model ?? provider.defaultModel],
    modelListStatus: provider.models ? "loading" : "idle",
    activeCommand: null,
  }

  function emit() {
    for (const listener of listeners) {
      listener()
    }
  }

  function setState(updater: (current: AiState) => AiState) {
    state = updater(state)
    emit()
  }

  function setError(error: string | undefined) {
    setState((current) => ({ ...current, error }))
  }

  function setConfig(nextConfig: Partial<LLMConfig>) {
    setState((current) => ({
      ...current,
      error: undefined,
      config: LLMConfigSchema.parse({ ...current.config, ...nextConfig }),
    }))
  }

  function setModel(model: string) {
    const nextModel = model.trim()
    if (!nextModel) {
      setError("Model name cannot be empty.")
      return
    }

    if (providerModelsAreAuthoritative && !state.availableModels.includes(nextModel)) {
      setError(`Unknown model: ${nextModel}`)
      return
    }

    setConfig({ model: nextModel })
    setState((current) => ({ ...current, activeCommand: null }))
  }

  function setSystemPrompt(prompt: string) {
    setConfig({ systemPrompt: prompt.trim() || undefined })
    setState((current) => ({ ...current, activeCommand: null }))
  }

  function stop() {
    abortController?.abort()
  }

  async function handleBuiltInCommand(input: string) {
    const [commandName = "", ...rest] = input.slice(1).split(/\s+/)
    const args = rest.join(" ").trim()

    if (commandName === "models") {
      setState((current) => ({
        ...current,
        error: undefined,
        activeCommand: { type: "model_palette", query: "", selectedIndex: 0 },
      }))
      return true
    }

    if (commandName === "model") {
      if (!args) {
        setState((current) => ({
          ...current,
          error: undefined,
          activeCommand: { type: "model_palette", query: "", selectedIndex: 0 },
        }))
        return true
      }

      setModel(args)
      return true
    }

    if (commandName === "system") {
      if (!args) {
        setState((current) => ({
          ...current,
          error: undefined,
          activeCommand: { type: "system_prompt", draft: current.config.systemPrompt ?? "" },
        }))
        return true
      }

      setSystemPrompt(args)
      return true
    }

    if (commandName === "stop") {
      stop()
      return true
    }

    const customCommand = customCommands.get(commandName)
    if (!customCommand) {
      setError(`Unknown command: /${commandName}`)
      return true
    }

    const result = await customCommand.run({ input, args, controller })
    if (result?.message) {
      setError(result.message)
    }

    return result?.handled ?? true
  }

  async function send(input: string) {
    const trimmedInput = input.trim()
    if (!trimmedInput) {
      return
    }

    if (trimmedInput.startsWith("/") && await handleBuiltInCommand(trimmedInput)) {
      return
    }

    if (state.status === "streaming") {
      setError("A response is already streaming.")
      return
    }

    const config = LLMConfigSchema.parse(state.config)
    const userMessage = { id: createMessageId(), role: "user" as const, content: trimmedInput }
    const assistantMessage = { id: createMessageId(), role: "assistant" as const, content: "" }
    const history = [...state.messages, userMessage].map(({ role, content }) => ({ role, content }))
    const controllerForStream = new AbortController()
    let accumulated = ""

    abortController = controllerForStream
    setState((current) => ({
      ...current,
      error: undefined,
      status: "streaming",
      messages: [...current.messages, userMessage, assistantMessage],
    }))

    try {
      for await (const chunk of provider.stream(history, config, { signal: controllerForStream.signal })) {
        accumulated += chunk
        setState((current) => ({
          ...current,
          messages: current.messages.map((message) =>
            message.id === assistantMessage.id ? { ...message, content: accumulated } : message,
          ),
        }))
      }
    } catch (error) {
      if (!isAbortError(error)) {
        setError(error instanceof Error ? error.message : String(error))
      }
    } finally {
      if (abortController === controllerForStream) {
        abortController = null
      }

      setState((current) => ({ ...current, status: "idle" }))
    }
  }

  function registerCommand(command: AiCommand) {
    customCommands.set(command.name, command)
    return () => {
      customCommands.delete(command.name)
    }
  }

  function setModelQuery(query: string) {
    setState((current) => ({
      ...current,
      activeCommand: current.activeCommand?.type === "model_palette"
        ? { ...current.activeCommand, query, selectedIndex: 0 }
        : current.activeCommand,
    }))
  }

  function moveModelSelection(delta: number) {
    setState((current) => {
      if (current.activeCommand?.type !== "model_palette") {
        return current
      }

      const models = filterModels(current)
      if (models.length === 0) {
        return { ...current, activeCommand: { ...current.activeCommand, selectedIndex: 0 } }
      }

      const nextIndex = (current.activeCommand.selectedIndex + delta + models.length) % models.length
      return { ...current, activeCommand: { ...current.activeCommand, selectedIndex: nextIndex } }
    })
  }

  function chooseSelectedModel() {
    const models = filterModels(state)
    const selectedIndex = state.activeCommand?.type === "model_palette" ? state.activeCommand.selectedIndex : 0
    const selectedModel = models[selectedIndex]

    if (selectedModel) {
      setModel(selectedModel)
    }
  }

  function closeActiveCommand() {
    setState((current) => ({ ...current, activeCommand: null }))
  }

  function setSystemPromptDraft(draft: string) {
    setState((current) => ({
      ...current,
      activeCommand: current.activeCommand?.type === "system_prompt"
        ? { ...current.activeCommand, draft }
        : current.activeCommand,
    }))
  }

  function submitSystemPromptDraft() {
    if (state.activeCommand?.type === "system_prompt") {
      setSystemPrompt(state.activeCommand.draft)
    }
  }

  const controller: AiController = {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    send,
    stop,
    setConfig,
    setModel,
    setSystemPrompt,
    registerCommand,
    setModelQuery,
    moveModelSelection,
    chooseSelectedModel,
    closeActiveCommand,
    setSystemPromptDraft,
    submitSystemPromptDraft,
  }

  for (const command of commands) {
    registerCommand(command)
  }

  if (provider.models) {
    void provider.models()
      .then((models) => {
        providerModelsAreAuthoritative = true
        setState((current) => ({
          ...current,
          availableModels: normalizeModelList(models, current.config.model),
          modelListStatus: "loaded",
        }))
      })
      .catch((error: unknown) => {
        setState((current) => ({
          ...current,
          modelListStatus: "error",
          error: error instanceof Error ? error.message : String(error),
        }))
      })
  }

  return controller
}

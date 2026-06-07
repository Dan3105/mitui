import { z } from "zod"

export type LLMRole = "user" | "assistant"

export interface LLMMessage {
  role: LLMRole
  content: string
}

export const LLMConfigSchema = z.object({
  model: z.string().min(1),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
})

export type LLMConfig = z.infer<typeof LLMConfigSchema>

export interface LLMProvider {
  id: string
  defaultModel: string
  stream(
    messages: LLMMessage[],
    config: LLMConfig,
    options?: { signal?: AbortSignal },
  ): AsyncIterable<string>
  models?(): Promise<string[]>
}

export type AiStatus = "idle" | "streaming"

export interface AiChatMessage extends LLMMessage {
  id: string
}

export type AiActiveCommandState =
  | {
    type: "model_palette"
    query: string
    selectedIndex: number
  }
  | {
    type: "system_prompt"
    draft: string
  }
  | null

export type AiModelListStatus = "idle" | "loading" | "loaded" | "error"

export interface AiState {
  messages: AiChatMessage[]
  status: AiStatus
  config: LLMConfig
  availableModels: string[]
  modelListStatus: AiModelListStatus
  error?: string
  activeCommand: AiActiveCommandState
}

export interface AiCommandResult {
  handled: boolean
  message?: string
}

export interface AiCommandContext {
  input: string
  args: string
  controller: AiController
}

export interface AiCommand {
  name: string
  description?: string
  run(context: AiCommandContext): AiCommandResult | void | Promise<AiCommandResult | void>
}

export interface AiController {
  getState(): AiState
  subscribe(listener: () => void): () => void
  send(input: string): Promise<void>
  stop(): void
  setConfig(nextConfig: Partial<LLMConfig>): void
  setModel(model: string): void
  setSystemPrompt(prompt: string): void
  registerCommand(command: AiCommand): () => void
  setModelQuery(query: string): void
  moveModelSelection(delta: number): void
  chooseSelectedModel(): void
  closeActiveCommand(): void
  setSystemPromptDraft(draft: string): void
  submitSystemPromptDraft(): void
}

export interface CreateAiControllerOptions {
  provider: LLMProvider
  initialConfig?: Partial<LLMConfig>
  commands?: AiCommand[]
}

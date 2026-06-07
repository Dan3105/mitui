import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react"
import type { AiCommand, AiController, LLMConfig } from "./types"

const AiControllerContext = createContext<AiController | null>(null)

export interface AiProviderProps {
  controller: AiController
  children: ReactNode
}

export function AiProvider({ controller, children }: AiProviderProps) {
  return (
    <AiControllerContext.Provider value={controller}>
      {children}
    </AiControllerContext.Provider>
  )
}

function useAiController() {
  const controller = useContext(AiControllerContext)
  if (!controller) {
    throw new Error("AI hooks must be used inside AiProvider.")
  }

  return controller
}

export function useAiState() {
  const controller = useAiController()
  return useSyncExternalStore(controller.subscribe, controller.getState, controller.getState)
}

export function useAiChat() {
  const controller = useAiController()
  const state = useAiState()

  return {
    messages: state.messages,
    status: state.status,
    error: state.error,
    send: controller.send,
    stop: controller.stop,
  }
}

export function useAiConfig() {
  const controller = useAiController()
  const state = useAiState()

  return {
    config: state.config,
    availableModels: state.availableModels,
    modelListStatus: state.modelListStatus,
    setConfig: (nextConfig: Partial<LLMConfig>) => controller.setConfig(nextConfig),
    setModel: controller.setModel,
    setSystemPrompt: controller.setSystemPrompt,
  }
}

export function useAiActions() {
  const controller = useAiController()

  return {
    send: controller.send,
    stop: controller.stop,
  }
}

export function useAiCommands() {
  const controller = useAiController()
  const state = useAiState()

  return {
    activeCommand: state.activeCommand,
    registerCommand: (command: AiCommand) => controller.registerCommand(command),
    setModelQuery: controller.setModelQuery,
    moveModelSelection: controller.moveModelSelection,
    chooseSelectedModel: controller.chooseSelectedModel,
    closeActiveCommand: controller.closeActiveCommand,
    setSystemPromptDraft: controller.setSystemPromptDraft,
    submitSystemPromptDraft: controller.submitSystemPromptDraft,
  }
}

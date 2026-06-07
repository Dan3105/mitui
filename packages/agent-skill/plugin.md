# Plugins

Layer 3 plugins live in `packages/core/plugins` and are exported from `@path/core/plugins`.

Plugins provide product capabilities. They should not own the application layout. A product chooses `FullscreenLayout`, `SidebarLayout`, or another shell, then places plugin views inside the regions it controls.

Rules:
- keep layout decisions in the product or app shell
- keep core components presentational
- expose headless state/actions when other layout regions may need plugin context
- pass concrete external providers into plugins instead of importing SDKs inside UI components
- prefer hooks and controller APIs for extension points

## Import

```tsx
import { AiChatPanel, AiProvider, createAiController } from "@path/core/plugins/ai"
```

## ai-plugin

Purpose: headless AI chat capability with a default OpenTUI chat panel.

The ai-plugin owns conversation state, streaming state, config, slash commands, and provider interaction. It does not decide whether the product uses a fullscreen layout, sidebar layout, footer, context panel, or custom shell.

## Public API

Core exports:
- `createAiController(options)`
- `AiProvider`
- `AiChatPanel`
- `useAiState()`
- `useAiChat()`
- `useAiConfig()`
- `useAiActions()`
- `useAiCommands()`

Types:

```ts
interface LLMMessage {
  role: "user" | "assistant"
  content: string
}

interface LLMProvider {
  id: string
  defaultModel: string
  stream(
    messages: LLMMessage[],
    config: LLMConfig,
    options?: { signal?: AbortSignal }
  ): AsyncIterable<string>
  models?(): Promise<string[]>
}
```

`LLMConfig` is validated by `LLMConfigSchema` from `zod`:
- `model: string`
- `systemPrompt?: string`
- `temperature?: number`

## Product-Owned Layout

Wrap the product layout with `AiProvider`, then place AI or product-owned panels wherever they belong.

```tsx
const controller = createAiController({ provider })

<AiProvider controller={controller}>
  <FullscreenLayout
    main={<AiChatPanel />}
    footer={<ProductFooter />}
  />
</AiProvider>
```

With sidebar layout:

```tsx
<AiProvider controller={controller}>
  <SidebarLayout
    sidebar={<ProductContextPanel />}
    main={<AiChatPanel />}
    footer={<ProductStatusFooter />}
  />
</AiProvider>
```

`ProductContextPanel` and `ProductStatusFooter` can consume AI state through hooks because `AiProvider` wraps the whole layout.

## Slash Commands

The default `AiChatPanel` intercepts slash commands before sending input to the provider:
- `/models` opens the model palette
- `/model <name>` switches model directly
- `/system <prompt>` sets the system prompt
- `/system` opens the system prompt editor
- `/stop` aborts the active stream

Chat input behavior:
- `Enter` submits
- `Shift+Enter` inserts a newline
- `Escape` stops streaming or closes an active command UI

## Extension Points

Use custom providers for real model backends:

```ts
const provider: LLMProvider = {
  id: "project-api",
  defaultModel: "default",
  async *stream(messages, config, options) {
    // Call a project backend here and yield token chunks.
  },
}
```

Use hooks to build custom UI instead of `AiChatPanel`:

```tsx
function ProductFooter() {
  const { status } = useAiChat()
  const { config } = useAiConfig()

  return <text>{config.model} | {status}</text>
}
```

Register product-specific commands:

```ts
const controller = createAiController({
  provider,
  commands: [
    {
      name: "context",
      description: "Attach project context",
      run({ args }) {
        // Product-specific behavior.
        return { handled: true, message: `Context: ${args}` }
      },
    },
  ],
})
```

## Do / Don't

Do:
- wrap the app shell with `AiProvider` when sidebar or footer regions need AI state
- keep `AiChatPanel` replaceable
- keep provider implementations outside UI components
- use `LLMProvider` for OpenAI, Anthropic, Ollama, local backends, or mock providers

Don't:
- put layout ownership inside ai-plugin
- create a slot registry just to render ai-plugin
- import vendor LLM SDKs into `AiChatPanel`
- assume conversation memory persists after the controller is recreated

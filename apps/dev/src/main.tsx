import { createCliRenderer } from "@opentui/core"
import { createRoot, useKeyboard } from "@opentui/react"
import { useState } from "react"
import { LayerOneChatDemo } from "./components/layer-one-chat-demo.tsx"
import { LayerOneDemo } from "./components/layer-one-demo.tsx"
import { LayerThreeAiDemo } from "./components/layer-three-ai-demo.tsx"
import { LayerTwoDemo } from "./components/layer-two-demo.tsx"

function DevApp() {
  const [activeDemo, setActiveDemo] = useState<"part-1" | "part-2" | "part-3" | "part-4">("part-1")
  const [layoutVariant, setLayoutVariant] = useState<"fullscreen" | "sidebar" | "sidebar-no-footer">("fullscreen")

  useKeyboard((key) => {
    if (key.name === "1") {
      setActiveDemo("part-1")
    }

    if (key.name === "2") {
      setActiveDemo("part-2")
    }

    if (key.name === "3") {
      setActiveDemo("part-3")
    }

    if (key.name === "4") {
      setActiveDemo("part-4")
    }
  })

  if (activeDemo === "part-1") {
    return <LayerOneDemo />
  }

  if (activeDemo === "part-2") {
    return <LayerOneChatDemo />
  }

  if (activeDemo === "part-3") {
    return <LayerTwoDemo variant={layoutVariant} onVariantChange={setLayoutVariant} />
  }

  return <LayerThreeAiDemo />
}

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  clearOnShutdown: true,
})

createRoot(renderer).render(<DevApp />)

// Keep the event loop alive. exitOnCtrlC will handle termination.
await new Promise(() => { })

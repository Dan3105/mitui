import { createCliRenderer } from "@opentui/core"
import { createRoot, useKeyboard } from "@opentui/react"
import { useState } from "react"
import { LayerOneChatDemo } from "./components/layer-one-chat-demo.tsx"
import { LayerOneDemo } from "./components/layer-one-demo.tsx"

function DevApp() {
  const [activeDemo, setActiveDemo] = useState<"part-1" | "part-2">("part-1")

  useKeyboard((key) => {
    if (key.name === "1") {
      setActiveDemo("part-1")
    }

    if (key.name === "2") {
      setActiveDemo("part-2")
    }
  })

  return activeDemo === "part-1" ? <LayerOneDemo /> : <LayerOneChatDemo />
}

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  clearOnShutdown: true,
})

createRoot(renderer).render(<DevApp />)

// Keep the event loop alive. exitOnCtrlC will handle termination.
await new Promise(() => { })

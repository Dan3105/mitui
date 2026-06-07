import type { ReactNode } from "react"

export interface FullscreenLayoutProps {
  main: ReactNode
  footer?: ReactNode
}

export function FullscreenLayout({ main, footer }: FullscreenLayoutProps) {
  return (
    <box flexDirection="column" width="100%" height="100%">
      <box flexGrow={1}>{main}</box>
      {footer ? <box height={1}>{footer}</box> : null}
    </box>
  )
}

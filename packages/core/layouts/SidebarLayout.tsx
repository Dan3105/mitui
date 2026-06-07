import type { ReactNode } from "react"

export interface SidebarLayoutProps {
  sidebar: ReactNode
  main: ReactNode
  footer?: ReactNode
  sidebarWidth?: number
}

export function SidebarLayout({
  sidebar,
  main,
  footer,
  sidebarWidth = 40,
}: SidebarLayoutProps) {
  return (
    <box flexDirection="column" width="100%" height="100%">
      <box flexDirection="row" flexGrow={1}>
        <box width={sidebarWidth}>{sidebar}</box>
        <box flexGrow={1}>{main}</box>
      </box>
      {footer ? <box height={1}>{footer}</box> : null}
    </box>
  )
}

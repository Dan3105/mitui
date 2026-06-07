import { SyntaxStyle, infoStringToFiletype } from "@opentui/core"
import type { LineNumberProps } from "@opentui/react"

export interface CodeBlockProps extends Omit<LineNumberProps, "children" | "lineNumberOffset" | "showLineNumbers"> {
  content: string
  filetype: string
  syntaxStyle: SyntaxStyle
  showLineNumbers?: boolean
  startLine?: number
}

export function CodeBlock({
  content,
  filetype,
  syntaxStyle,
  showLineNumbers = true,
  startLine = 1,
  ...lineNumberProps
}: CodeBlockProps) {
  const normalizedFiletype = infoStringToFiletype(filetype) ?? filetype

  return (
    <line-number showLineNumbers={showLineNumbers} lineNumberOffset={startLine - 1} {...lineNumberProps}>
      <code content={content} filetype={normalizedFiletype} syntaxStyle={syntaxStyle} width="100%" height="100%" />
    </line-number>
  )
}

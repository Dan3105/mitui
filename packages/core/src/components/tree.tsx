import type { ScrollBoxProps } from "@opentui/react"

export interface TreeNode {
  id: string
  label: string
  type: "file" | "dir"
  children?: TreeNode[]
  expanded?: boolean
}

export interface TreeProps extends Omit<ScrollBoxProps, "children"> {
  nodes: TreeNode[]
  activeId?: string
}

function TreeRow({
  node,
  activeId,
  depth,
}: {
  node: TreeNode
  activeId?: string
  depth: number
}) {
  const marker = node.type === "dir" ? (node.expanded ? "v" : ">") : "-"
  const prefix = `${"  ".repeat(depth)}${marker} `

  return (
    <>
      <text>
        {node.id === activeId ? "* " : "  "}
        {prefix}
        {node.label}
      </text>
      {node.expanded
        ? node.children?.map((child) => (
            <TreeRow key={child.id} node={child} activeId={activeId} depth={depth + 1} />
          ))
        : null}
    </>
  )
}

export function Tree({ nodes, activeId, borderColor = "#475569", ...props }: TreeProps) {
  return (
    <scrollbox border padding={1} borderColor={borderColor} {...props}>
      {nodes.map((node) => (
        <TreeRow key={node.id} node={node} activeId={activeId} depth={0} />
      ))}
    </scrollbox>
  )
}

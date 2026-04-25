'use client'

import { useState } from 'react'
import { ChevronRight, Folder, FileText, Code2, Settings2, FileCode } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TreeNode {
  name: string
  type: 'file' | 'folder'
  children?: TreeNode[]
  selected?: boolean
}

interface TreeViewProps {
  nodes: TreeNode[]
  onSelect?: (node: TreeNode, path: string) => void
}

function getFileIcon(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'tsx':
    case 'ts':
    case 'jsx':
    case 'js':
      return <Code2 className="h-4 w-4 flex-shrink-0 text-amber-400" />
    case 'json':
      return <Settings2 className="h-4 w-4 flex-shrink-0 text-yellow-400" />
    case 'md':
      return <FileCode className="h-4 w-4 flex-shrink-0 text-slate-400" />
    case 'css':
    case 'scss':
      return <FileCode className="h-4 w-4 flex-shrink-0 text-pink-400" />
    default:
      return <FileText className="h-4 w-4 flex-shrink-0 text-gray-400" />
  }
}

export function TreeView({ nodes, onSelect }: TreeViewProps) {
  return (
    <div className="h-full overflow-auto">
      {nodes.map((node) => (
        <TreeNodeComponent key={node.name} node={node} level={0} onSelect={onSelect} path={node.name} />
      ))}
    </div>
  )
}

interface TreeNodeComponentProps {
  node: TreeNode
  level: number
  onSelect?: (node: TreeNode, path: string) => void
  path: string
}

function TreeNodeComponent({ node, level, onSelect, path }: TreeNodeComponentProps) {
  const [isOpen, setIsOpen] = useState(level === 0)
  const hasChildren = node.type === 'folder' && node.children && node.children.length > 0
  const isFile = node.type === 'file'

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-all duration-150',
          'hover:bg-muted/70 active:bg-accent',
          node.selected && 'bg-accent text-accent-foreground font-semibold'
        )}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        onClick={() => {
          if (hasChildren) setIsOpen(!isOpen)
          onSelect?.(node, path)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (hasChildren) setIsOpen(!isOpen)
            onSelect?.(node, path)
          }
        }}
        role="button"
        tabIndex={0}
      >
        {hasChildren && (
          <ChevronRight
            className={cn('h-4 w-4 flex-shrink-0 transition-transform duration-200', isOpen && 'rotate-90')}
          />
        )}
        {!hasChildren && isFile && <div className="h-4 w-4 flex-shrink-0" />}
        
        {node.type === 'folder' ? (
          <Folder className="h-4 w-4 flex-shrink-0 text-blue-400" />
        ) : (
          getFileIcon(node.name)
        )}
        
        <span className="truncate font-medium text-foreground">{node.name}</span>
      </div>

      {hasChildren && isOpen && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeComponent
              key={child.name}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              path={`${path}/${child.name}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

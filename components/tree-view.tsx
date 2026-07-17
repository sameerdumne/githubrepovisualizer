'use client'

import { useState, useCallback } from 'react'
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
  const [openPaths, setOpenPaths] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const node of nodes) {
      initial.add(node.name)
    }
    return initial
  })

  const togglePath = useCallback((path: string) => {
    setOpenPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  return (
    <div className="h-full overflow-auto">
      {nodes.map((node) => (
        <TreeNodeComponent
          key={node.name}
          node={node}
          level={0}
          onSelect={onSelect}
          path={node.name}
          openPaths={openPaths}
          togglePath={togglePath}
        />
      ))}
    </div>
  )
}

interface TreeNodeComponentProps {
  node: TreeNode
  level: number
  onSelect?: (node: TreeNode, path: string) => void
  path: string
  openPaths: Set<string>
  togglePath: (path: string) => void
}

function TreeNodeComponent({ node, level, onSelect, path, openPaths, togglePath }: TreeNodeComponentProps) {
  const hasChildren = node.type === 'folder' && node.children && node.children.length > 0
  const isFile = node.type === 'file'
  const isOpen = openPaths.has(path)

  const handleClick = () => {
    if (hasChildren) {
      togglePath(path)
    }
    onSelect?.(node, path)
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-all duration-150',
          'hover:bg-muted/70 active:bg-accent',
          node.selected && 'bg-accent text-accent-foreground font-semibold'
        )}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
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
              openPaths={openPaths}
              togglePath={togglePath}
            />
          ))}
        </div>
      )}
    </div>
  )
}

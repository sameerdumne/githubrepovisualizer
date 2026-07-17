'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { FileEntry } from '@/lib/api/repository-analysis'
import { computeTreemap, TreemapItem, TreemapRect } from '@/lib/treemap-layout'
import { getFileColor } from '@/lib/build-dependency-graph'
import { Loader2, ChevronRight, Folder, ArrowLeft } from 'lucide-react'

interface TreemapViewProps {
  files: FileEntry[]
  onSelectFile: (path: string) => void
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function getExtension(path: string): string {
  const parts = path.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

function buildTree(files: FileEntry[]): TreemapItem[] {
  const root: TreemapItem[] = []
  const map = new Map<string, TreemapItem>()

  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path))

  for (const file of sorted) {
    const parts = file.path.split('/')
    let currentPath = ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isFile = i === parts.length - 1 && file.type === 'file'

      if (!map.has(currentPath)) {
        const node: TreemapItem = {
          name: part,
          path: currentPath,
          value: isFile ? file.size : 0,
          type: isFile ? 'file' : 'folder',
          extension: isFile ? (file.extension || getExtension(part)) : undefined,
          children: isFile ? undefined : [],
        }
        map.set(currentPath, node)

        if (i === 0) {
          root.push(node)
        } else {
          const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'))
          const parent = map.get(parentPath)
          if (parent?.children) {
            parent.children.push(node)
          }
        }
      }

      if (isFile) {
        const node = map.get(currentPath)!
        node.value = file.size
      }
    }
  }

  function computeFolderSize(item: TreemapItem): number {
    if (item.type === 'file') return item.value
    if (!item.children || item.children.length === 0) return 0
    let total = 0
    for (const child of item.children) {
      total += computeFolderSize(child)
    }
    item.value = total
    return total
  }

  for (const item of root) {
    computeFolderSize(item)
  }

  return root
}

function TreemapTooltip({ rect, containerRef }: { rect: TreemapRect; containerRef: React.RefObject<HTMLDivElement | null> }) {
  const item = rect.item
  const isFile = item.type === 'file'

  return (
    <div
      className="absolute z-50 pointer-events-none rounded-lg border border-border bg-popover px-3 py-2 shadow-lg"
      style={{
        left: Math.min(rect.x + rect.width + 8, (containerRef.current?.clientWidth || 800) - 260),
        top: Math.min(rect.y, (containerRef.current?.clientHeight || 400) - 80),
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        {isFile ? (
          <div
            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: getFileColor(item.path) }}
          />
        ) : (
          <Folder className="h-3 w-3 text-blue-400 flex-shrink-0" />
        )}
        <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
          {item.name}
        </span>
      </div>
      <div className="text-xs text-muted-foreground font-mono truncate max-w-[240px]">
        {item.path}
      </div>
      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
        <span>{formatSize(item.value)}</span>
        {item.extension && <span className="uppercase">{item.extension}</span>}
        {item.children && <span>{item.children.length} items</span>}
      </div>
    </div>
  )
}

export function TreemapView({ files, onSelectFile }: TreemapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 })
  const [hoveredRect, setHoveredRect] = useState<TreemapRect | null>(null)
  const [pathStack, setPathStack] = useState<string[]>([])
  const [isComputing, setIsComputing] = useState(true)

  const tree = useMemo(() => buildTree(files), [files])

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
        }
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setIsComputing(false), 50)
    return () => clearTimeout(timer)
  }, [tree, dimensions])

  const currentNode = useMemo(() => {
    let current = tree
    let node: TreemapItem | null = null

    for (const segment of pathStack) {
      const found = current.find(item => item.name === segment)
      if (found && found.children) {
        node = found
        current = found.children
      } else {
        break
      }
    }

    return { node, children: current }
  }, [tree, pathStack])

  const treemapItems = useMemo(() => {
    return currentNode.children.filter(child => child.value > 0)
  }, [currentNode.children])

  const rects = useMemo(() => {
    return computeTreemap(treemapItems, dimensions.width, dimensions.height)
  }, [treemapItems, dimensions.width, dimensions.height])

  const handleDrillDown = useCallback((item: TreemapItem) => {
    if (item.type === 'folder' && item.children && item.children.length > 0) {
      setPathStack(prev => [...prev, item.name])
      setHoveredRect(null)
    }
  }, [])

  const handleBreadcrumbClick = useCallback((index: number) => {
    setPathStack(prev => prev.slice(0, index))
    setHoveredRect(null)
  }, [])

  const handleRectClick = useCallback((rect: TreemapRect) => {
    if (rect.item.type === 'folder') {
      handleDrillDown(rect.item)
    } else {
      onSelectFile(rect.item.path)
    }
  }, [handleDrillDown, onSelectFile])

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No files to display</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {pathStack.length > 0 && (
        <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/30 text-xs">
          <button
            onClick={() => handleBreadcrumbClick(0)}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            root
          </button>
          {pathStack.map((segment, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
              <button
                onClick={() => handleBreadcrumbClick(i + 1)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {segment}
              </button>
            </span>
          ))}
        </div>
      )}

      {pathStack.length > 0 && (
        <div className="px-3 py-1.5 border-b border-border/50">
          <button
            onClick={() => handleBreadcrumbClick(pathStack.length - 1)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>
        </div>
      )}

      <div ref={containerRef} className="flex-1 relative overflow-hidden min-h-[300px]">
        {isComputing ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Computing layout...
          </div>
        ) : rects.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">No items to display</p>
          </div>
        ) : (
          <svg width={dimensions.width} height={dimensions.height} className="block">
            {rects.map((rect, i) => {
              const isFolder = rect.item.type === 'folder'
              const isHovered = hoveredRect?.item.path === rect.item.path
              const color = isFolder ? '#3b82f6' : getFileColor(rect.item.path)
              const minLabelWidth = 60
              const minLabelHeight = 20
              const showLabel = rect.width > minLabelWidth && rect.height > minLabelHeight

              return (
                <g
                  key={`${rect.item.path}-${i}`}
                  onMouseEnter={() => setHoveredRect(rect)}
                  onMouseLeave={() => setHoveredRect(null)}
                  onClick={() => handleRectClick(rect)}
                  className="cursor-pointer"
                >
                  <rect
                    x={rect.x + 1}
                    y={rect.y + 1}
                    width={Math.max(0, rect.width - 2)}
                    height={Math.max(0, rect.height - 2)}
                    rx={3}
                    fill={color}
                    fillOpacity={isHovered ? 0.9 : 0.7}
                    stroke={isHovered ? 'hsl(var(--foreground))' : 'hsl(var(--border))'}
                    strokeWidth={isHovered ? 1.5 : 0.5}
                    className="transition-opacity duration-150"
                  />
                  {showLabel && (
                    <text
                      x={rect.x + 6}
                      y={rect.y + 16}
                      fill="white"
                      fontSize={11}
                      fontWeight={500}
                      className="pointer-events-none select-none"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {rect.item.name.length > Math.floor(rect.width / 7)
                        ? rect.item.name.slice(0, Math.floor(rect.width / 7) - 2) + '..'
                        : rect.item.name}
                    </text>
                  )}
                  {showLabel && rect.height > 36 && (
                    <text
                      x={rect.x + 6}
                      y={rect.y + 30}
                      fill="white"
                      fontSize={9}
                      fillOpacity={0.7}
                      className="pointer-events-none select-none"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {formatSize(rect.item.value)}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        )}

        {hoveredRect && containerRef.current && (
          <TreemapTooltip rect={hoveredRect} containerRef={containerRef} />
        )}
      </div>
    </div>
  )
}

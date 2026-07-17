'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { RepositoryData } from '@/lib/api/repository-analysis'
import { buildDependencyGraph, GraphNode, GraphEdge } from '@/lib/build-dependency-graph'
import { FileCode, Code2 } from 'lucide-react'

interface DependencyGraphProps {
  repoData: RepositoryData
}

interface Transform {
  x: number
  y: number
  scale: number
}

export function DependencyGraph({ repoData }: DependencyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const nodesRef = useRef<GraphNode[]>([])
  const edgesRef = useRef<GraphEdge[]>([])
  const animFrameRef = useRef<number>(0)
  const [renderTick, setRenderTick] = useState(0)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null)
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1.8 })
  const draggingNode = useRef<string | null>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })
  const panTransformStart = useRef({ x: 0, y: 0 })
  const settledRef = useRef(false)
  const tickCountRef = useRef(0)

  const graphData = useMemo(() => buildDependencyGraph(repoData.files), [repoData])

  const connectedEdges = useMemo(() => {
    if (!hoveredNode) return null
    const connected = new Set<string>()
    connected.add(hoveredNode)
    for (const edge of graphData.edges) {
      if (edge.source === hoveredNode) connected.add(edge.target)
      if (edge.target === hoveredNode) connected.add(edge.source)
    }
    return connected
  }, [hoveredNode, graphData.edges])

  const nodeRadius = useCallback((node: GraphNode) => {
    const connections = node.imports + node.importedBy
    if (connections === 0) return 5
    return Math.min(5 + connections * 2, 16)
  }, [])

  useEffect(() => {
    const nodes = graphData.nodes.map(n => ({ ...n }))
    const edges = graphData.edges

    const centerX = 500
    const centerY = 400
    const spread = Math.min(400, nodes.length * 12)

    for (let i = 0; i < nodes.length; i++) {
      const angle = (i / nodes.length) * Math.PI * 2
      const r = spread * (0.5 + Math.random() * 0.5)
      nodes[i].x = centerX + Math.cos(angle) * r
      nodes[i].y = centerY + Math.sin(angle) * r
      nodes[i].vx = 0
      nodes[i].vy = 0
    }

    nodesRef.current = nodes
    edgesRef.current = edges
    settledRef.current = false
    tickCountRef.current = 0
  }, [graphData])

  useEffect(() => {
    const nodes = nodesRef.current
    const edges = edgesRef.current

    if (nodes.length === 0) return

    const nodeMap = new Map<string, GraphNode>()
    for (const n of nodes) nodeMap.set(n.id, n)

    let iterationCount = 0
    const maxIterations = 300

    const step = () => {
      if (settledRef.current || iterationCount >= maxIterations) {
        animFrameRef.current = requestAnimationFrame(step)
        return
      }

      const dt = 0.3
      const repulsionStrength = 800
      const attractionStrength = 0.005
      const centerStrength = 0.01
      const damping = 0.85

      const centerX = 500
      const centerY = 400

      for (let i = 0; i < nodes.length; i++) {
        let fx = 0
        let fy = 0

        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue
          let dx = nodes[i].x - nodes[j].x
          let dy = nodes[i].y - nodes[j].y
          const distSq = dx * dx + dy * dy
          const dist = Math.sqrt(distSq) || 1
          const force = repulsionStrength / (distSq + 100)
          fx += (dx / dist) * force
          fy += (dy / dist) * force
        }

        for (const edge of edges) {
          let other: GraphNode | null = null
          if (edge.source === nodes[i].id) other = nodeMap.get(edge.target) || null
          else if (edge.target === nodes[i].id) other = nodeMap.get(edge.source) || null

          if (other) {
            const dx = other.x - nodes[i].x
            const dy = other.y - nodes[i].y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const force = attractionStrength * dist
            fx += (dx / dist) * force
            fy += (dy / dist) * force
          }
        }

        const dcx = centerX - nodes[i].x
        const dcy = centerY - nodes[i].y
        fx += dcx * centerStrength
        fy += dcy * centerStrength

        if (draggingNode.current !== nodes[i].id) {
          nodes[i].vx = (nodes[i].vx + fx * dt) * damping
          nodes[i].vy = (nodes[i].vy + fy * dt) * damping
          nodes[i].x += nodes[i].vx * dt
          nodes[i].y += nodes[i].vy * dt
        }
      }

      iterationCount++
      tickCountRef.current++

      if (tickCountRef.current % 3 === 0) {
        setRenderTick(t => t + 1)
      }

      animFrameRef.current = requestAnimationFrame(step)
    }

    animFrameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [graphData])

  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    return {
      x: (clientX - rect.left - transform.x) / transform.scale,
      y: (clientY - rect.top - transform.y) / transform.scale,
    }
  }, [transform])

  const handleMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const node = nodesRef.current.find(n => n.id === nodeId)
    if (!node) return

    draggingNode.current = nodeId
    settledRef.current = false
    tickCountRef.current = 0

    const world = screenToWorld(e.clientX, e.clientY)
    dragOffset.current = { x: world.x - node.x, y: world.y - node.y }
  }, [screenToWorld])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNode.current) {
      const world = screenToWorld(e.clientX, e.clientY)
      const node = nodesRef.current.find(n => n.id === draggingNode.current)
      if (node) {
        node.x = world.x - dragOffset.current.x
        node.y = world.y - dragOffset.current.y
        node.vx = 0
        node.vy = 0
        setRenderTick(t => t + 1)
      }
    } else if (isPanning.current) {
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      setTransform({
        ...transform,
        x: panTransformStart.current.x + dx,
        y: panTransformStart.current.y + dy,
      })
    }
  }, [screenToWorld, transform])

  const handleMouseUp = useCallback(() => {
    draggingNode.current = null
    isPanning.current = false
  }, [])

  const handleBackgroundMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as SVGElement).tagName === 'svg' || (e.target as SVGElement).classList.contains('graph-bg')) {
      isPanning.current = true
      panStart.current = { x: e.clientX, y: e.clientY }
      panTransformStart.current = { x: transform.x, y: transform.y }
      setHoveredNode(null)
      setTooltip(null)
    }
  }, [transform])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const svg = svgRef.current
    if (!svg) return

    const rect = svg.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const factor = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.2, Math.min(5, transform.scale * factor))

    const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale)
    const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale)

    setTransform({ x: newX, y: newY, scale: newScale })
  }, [transform])

  const handleNodeHover = useCallback((nodeId: string | null, e?: React.MouseEvent) => {
    if (draggingNode.current) return

    setHoveredNode(nodeId)

    if (nodeId && e) {
      const node = nodesRef.current.find(n => n.id === nodeId)
      if (node) {
        const rect = svgRef.current?.getBoundingClientRect()
        if (rect) {
          setTooltip({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            node,
          })
        }
      }
    } else {
      setTooltip(null)
    }
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggingNode.current) {
        const world = screenToWorld(e.clientX, e.clientY)
        const node = nodesRef.current.find(n => n.id === draggingNode.current)
        if (node) {
          node.x = world.x - dragOffset.current.x
          node.y = world.y - dragOffset.current.y
          node.vx = 0
          node.vy = 0
          setRenderTick(t => t + 1)
        }

        if (tooltip) {
          const rect = svg.getBoundingClientRect()
          setTooltip(prev => prev ? {
            ...prev,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          } : null)
        }
      } else if (isPanning.current) {
        const dx = e.clientX - panStart.current.x
        const dy = e.clientY - panStart.current.y
        setTransform(prev => ({
          ...prev,
          x: panTransformStart.current.x + dx,
          y: panTransformStart.current.y + dy,
        }))
      }
    }

    const handleGlobalMouseUp = () => {
      draggingNode.current = null
      isPanning.current = false
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [screenToWorld, tooltip, transform])

  const nodes = nodesRef.current
  const edges = edgesRef.current

  const hasData = edges.length > 0

  const edgeOpacity = (edge: GraphEdge) => {
    if (!connectedEdges) return 0.4
    if (connectedEdges.has(edge.source) && connectedEdges.has(edge.target)) return 0.8
    return 0.06
  }

  const nodeOpacity = (node: GraphNode) => {
    if (!connectedEdges) return 1
    return connectedEdges.has(node.id) ? 1 : 0.15
  }

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FileCode className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">No file data available to build dependency graph.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <Code2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {nodes.length} files &middot; {edges.length} dependencies
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#60a5fa]" /> .ts
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a78bfa]" /> .tsx
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" /> .js/.jsx
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#facc15]" /> .json
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f472b6]" /> .css
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]" /> other
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-background/50">
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ minHeight: 400, cursor: isPanning.current ? 'grabbing' : 'grab' }}
          onMouseDown={handleBackgroundMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          <defs>
            <marker
              id="arrowhead"
              viewBox="0 0 10 7"
              refX="10"
              refY="3.5"
              markerWidth="8"
              markerHeight="6"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-muted-foreground/40" />
            </marker>
            <marker
              id="arrowhead-active"
              viewBox="0 0 10 7"
              refX="10"
              refY="3.5"
              markerWidth="8"
              markerHeight="6"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-primary/60" />
            </marker>
          </defs>

          <rect className="graph-bg" width="100%" height="100%" fill="transparent" />

          <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
            <g>
              {edges.map((edge, i) => {
                const sourceNode = nodes.find(n => n.id === edge.source)
                const targetNode = nodes.find(n => n.id === edge.target)
                if (!sourceNode || !targetNode) return null

                const isActive = connectedEdges
                  ? connectedEdges.has(edge.source) && connectedEdges.has(edge.target)
                  : false

                return (
                  <line
                    key={`edge-${i}`}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                    strokeWidth={isActive ? 1.5 : 0.7}
                    strokeOpacity={edgeOpacity(edge)}
                    markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                  />
                )
              })}
            </g>

            <g>
              {nodes.map((node) => {
                const r = nodeRadius(node)
                const opacity = nodeOpacity(node)
                const isHovered = hoveredNode === node.id

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x},${node.y})`}
                    style={{
                      opacity,
                      cursor: 'pointer',
                      transition: draggingNode.current ? 'none' : 'opacity 0.2s ease',
                    }}
                    onMouseDown={(e) => handleMouseDown(node.id, e)}
                    onMouseEnter={(e) => handleNodeHover(node.id, e)}
                    onMouseLeave={() => handleNodeHover(null)}
                  >
                    {isHovered && (
                      <circle
                        r={r + 6}
                        fill="none"
                        stroke={node.color}
                        strokeWidth={1.5}
                        strokeOpacity={0.4}
                      />
                    )}
                    <circle
                      r={r}
                      fill={node.color}
                      stroke={isHovered ? 'hsl(var(--foreground))' : 'none'}
                      strokeWidth={isHovered ? 2 : 0}
                    />
                  </g>
                )
              })}
            </g>
          </g>
        </svg>

        {tooltip && (
          <div
            className="absolute pointer-events-none z-50 rounded-xl bg-card/95 backdrop-blur-md border border-border/50 shadow-xl"
            style={{
              left: tooltip.x + 14,
              top: tooltip.y - 14,
              transform: 'translateY(-100%)',
            }}
          >
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tooltip.node.color }}
                />
                <span className="text-sm font-semibold text-foreground tracking-tight">
                  {tooltip.node.label}
                </span>
              </div>
              <div className="text-xs text-muted-foreground font-mono leading-relaxed">
                {tooltip.node.id}
              </div>
              <div className="flex gap-4 mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                <span>
                  <span className="font-semibold text-foreground">{tooltip.node.imports}</span> imports
                </span>
                <span>
                  <span className="font-semibold text-foreground">{tooltip.node.importedBy}</span> imported by
                </span>
              </div>
            </div>
          </div>
        )}

        {!hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <FileCode className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Import data was not available for the analyzed files.
              <br />
              <span className="text-xs text-muted-foreground/70 mt-1 block">
                The graph shows the repository file structure.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

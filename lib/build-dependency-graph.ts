import { FileEntry } from '@/lib/api/repository-analysis'
import { buildImportGraph, ImportEdge } from '@/lib/parse-imports'

export interface GraphNode {
  id: string
  label: string
  extension: string
  type: 'file' | 'folder'
  color: string
  imports: number
  importedBy: number
  x: number
  y: number
  vx: number
  vy: number
}

export interface GraphEdge {
  source: string
  target: string
  names?: string[]
}

export interface DependencyGraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export const EXTENSION_COLORS: Record<string, string> = {
  tsx: '#a78bfa',
  ts: '#60a5fa',
  jsx: '#c084fc',
  js: '#38bdf8',
  json: '#facc15',
  css: '#f472b6',
  scss: '#f472b6',
  md: '#94a3b8',
  yaml: '#34d399',
  yml: '#34d399',
  svg: '#fb923c',
  html: '#fb923c',
  py: '#60a5fa',
  go: '#38bdf8',
  rs: '#fb923c',
  java: '#f87171',
}

export function getFileColor(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  return EXTENSION_COLORS[ext] || '#94a3b8'
}

function getShortLabel(path: string): string {
  return path.split('/').pop() || path
}

export function buildDependencyGraph(files: FileEntry[]): DependencyGraphData {
  const edges = buildImportGraph(files)

  const nodeMap = new Map<string, GraphNode>()

  for (const file of files) {
    if (file.type !== 'file') continue

    nodeMap.set(file.path, {
      id: file.path,
      label: getShortLabel(file.path),
      extension: file.extension || '',
      type: file.type,
      color: getFileColor(file.path),
      imports: 0,
      importedBy: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    })
  }

  for (const edge of edges) {
    if (!nodeMap.has(edge.to)) {
      nodeMap.set(edge.to, {
        id: edge.to,
        label: getShortLabel(edge.to),
        extension: edge.to.split('.').pop() || '',
        type: 'file',
        color: getFileColor(edge.to),
        imports: 0,
        importedBy: 0,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
      })
    }

    const sourceNode = nodeMap.get(edge.from)
    const targetNode = nodeMap.get(edge.to)
    if (sourceNode) sourceNode.imports++
    if (targetNode) targetNode.importedBy++
  }

  const graphEdges: GraphEdge[] = edges.map(e => ({
    source: e.from,
    target: e.to,
    names: e.names,
  }))

  return {
    nodes: Array.from(nodeMap.values()),
    edges: graphEdges,
  }
}

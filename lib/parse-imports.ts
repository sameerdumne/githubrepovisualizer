const IMPORT_PATTERNS = [
  // import { X, Y } from 'path'
  // import X from 'path'
  // import * as X from 'path'
  /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g,
  // const X = require('path')
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  // import('path')
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
]

const BUILTIN_MODULES = new Set([
  'react', 'react-dom', 'next', 'next/navigation', 'next/link', 'next/image',
  'next/headers', 'next/server', 'next/font',
  'path', 'fs', 'os', 'util', 'stream', 'events', 'http', 'https', 'url',
  'child_process', 'crypto', 'assert', 'buffer', 'net', 'tls', 'zlib',
  'typescript', 'tailwindcss', 'postcss',
])

export interface ParsedImport {
  sourceFile: string
  imports: { path: string; names?: string[] }[]
}

export interface ImportEdge {
  from: string
  to: string
  names?: string[]
}

function resolveImportPath(importPath: string, fromFile: string): string | null {
  if (!importPath.startsWith('.') && !importPath.startsWith('@/') && !importPath.startsWith('~/')) {
    return null
  }

  let resolved = importPath

  if (resolved.startsWith('@/') || resolved.startsWith('~/')) {
    resolved = resolved.slice(2)
  }

  const fromDir = fromFile.includes('/') ? fromFile.slice(0, fromFile.lastIndexOf('/')) : ''

  const parts = fromDir ? [...fromDir.split('/'), ...resolved.split('/')] : resolved.split('/')
  const resolvedParts: string[] = []

  for (const part of parts) {
    if (part === '.' || part === '') continue
    if (part === '..') {
      resolvedParts.pop()
    } else {
      resolvedParts.push(part)
    }
  }

  return resolvedParts.join('/')
}

function stripExtension(path: string): string {
  return path.replace(/\.(tsx?|jsx?|mjs|cjs|json|css|scss|svg)$/, '')
}

function matchFile(target: string, allFiles: Map<string, string>): string | null {
  const stripped = stripExtension(target)

  if (allFiles.has(target)) return target
  if (allFiles.has(stripped)) return stripped

  for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
    if (allFiles.has(stripped + ext)) return stripped + ext
  }

  for (const indexName of ['/index.tsx', '/index.ts', '/index.jsx', '/index.js']) {
    const withIndex = stripped + indexName
    if (allFiles.has(withIndex)) return withIndex
  }

  return null
}

export function parseImports(filePath: string, content: string): { path: string; names?: string[] }[] {
  const results: { path: string; names?: string[] }[] = []
  const seen = new Set<string>()

  for (const pattern of IMPORT_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match: RegExpExecArray | null

    while ((match = regex.exec(content)) !== null) {
      const importPath = match[1]

      if (BUILTIN_MODULES.has(importPath) || importPath.startsWith('node:')) {
        continue
      }

      if (!importPath.startsWith('.') && !importPath.startsWith('@/') && !importPath.startsWith('~/')) {
        continue
      }

      if (seen.has(importPath)) continue
      seen.add(importPath)

      const nameMatch = match[0].match(/import\s+\{([^}]+)\}/)
      const names = nameMatch
        ? nameMatch[1].split(',').map(s => s.trim().split(/\s+as\s+/).pop()!.trim()).filter(Boolean)
        : undefined

      results.push({ path: importPath, names })
    }
  }

  return results
}

export function buildImportGraph(files: { path: string; content?: string }[]): ImportEdge[] {
  const fileSet = new Map<string, string>()
  for (const f of files) {
    fileSet.set(f.path, f.path)
  }

  const edges: ImportEdge[] = []

  for (const file of files) {
    if (!file.content) continue

    const imports = parseImports(file.path, file.content)

    for (const imp of imports) {
      const resolved = resolveImportPath(imp.path, file.path)
      if (!resolved) continue

      const matched = matchFile(resolved, fileSet)
      if (matched && matched !== file.path) {
        edges.push({ from: file.path, to: matched, names: imp.names })
      }
    }
  }

  return edges
}

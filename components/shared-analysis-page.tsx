'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, AlertTriangle, Info, GitBranch, LayoutGrid, List, ExternalLink, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DependencyGraph } from '@/components/dependency-graph'
import { TreeView, TreeNode } from '@/components/tree-view'
import { TreemapView } from '@/components/treemap-view'
import { FilePreviewPanel } from '@/components/file-preview-panel'
import { ExportPanel } from '@/components/export-panel'
import { RepositoryData, AnalysisResult, buildTreeStructure } from '@/lib/api/repository-analysis'
import { cn } from '@/lib/utils'

interface SharedData {
  repoUrl: string
  repoFullName: string
  analysisResult: AnalysisResult
  repoData: RepositoryData
}

function getInsightIcon(type: string) {
  switch (type) {
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case 'info':
      return <Info className="h-5 w-5 text-blue-500" />
    default:
      return <AlertCircle className="h-5 w-5 text-slate-500" />
  }
}

export function SharedAnalysisPage({ shareId }: { shareId: string }) {
  const [data, setData] = useState<SharedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('dependencies')
  const [structureView, setStructureView] = useState<'tree' | 'treemap'>('tree')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    async function fetchShared() {
      try {
        const response = await fetch(`/api/share/${shareId}`)
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('This shared analysis link is invalid or has expired.')
          }
          throw new Error('Failed to load shared analysis')
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load shared analysis')
      } finally {
        setLoading(false)
      }
    }
    fetchShared()
  }, [shareId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading shared analysis...
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Unable to Load</h1>
          <p className="text-muted-foreground">{error || 'Something went wrong'}</p>
        </div>
      </div>
    )
  }

  const { analysisResult, repoData, repoUrl, repoFullName } = data
  const treeStructure = buildTreeStructure(repoData.files)

  const getFileContent = (path: string): string => {
    const file = repoData.files.find(f => f.path === path)
    return file?.content || `// File: ${path}\n// Content not available`
  }

  const handleSelectFile = (node: TreeNode, path: string) => {
    if (node.type === 'file') {
      setSelectedFile(path)
      setShowPreview(true)
    }
  }

  const currentContent = selectedFile ? getFileContent(selectedFile) : ''

  const getInsightIconForType = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-slate-500" />
    }
  }

  const StructureToggle = () => (
    <div className="flex items-center bg-background rounded-md border border-border p-0.5">
      <button
        onClick={() => setStructureView('tree')}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer',
          structureView === 'tree'
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <List className="h-3.5 w-3.5" />
        Tree
      </button>
      <button
        onClick={() => setStructureView('treemap')}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer',
          structureView === 'treemap'
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Treemap
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{repoFullName}</h1>
              <p className="text-sm text-muted-foreground">Shared analysis</p>
            </div>
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              View on GitHub
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Repository Analysis</h2>
          <p className="text-sm text-muted-foreground truncate">{repoUrl}</p>
        </div>

        {repoData.files.length > 0 && (
          structureView === 'tree' ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
              <div className="lg:col-span-2 bg-card rounded-lg border border-border overflow-hidden flex flex-col max-h-[600px]">
                <div className="sticky top-0 bg-gradient-to-r from-muted to-muted/50 border-b border-border px-4 py-3 z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Repository Structure</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {repoData.stats.totalFiles} files • {repoData.stats.totalFolders} folders
                      </p>
                    </div>
                    <StructureToggle />
                  </div>
                </div>
                <TreeView nodes={treeStructure} onSelect={handleSelectFile} />
              </div>

              {showPreview && selectedFile && (
                <FilePreviewPanel
                  selectedFile={selectedFile}
                  content={currentContent}
                  onClose={() => setShowPreview(false)}
                />
              )}
            </div>
          ) : (
            <div className="mb-6">
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="bg-gradient-to-r from-muted to-muted/50 border-b border-border px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Repository Treemap</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {repoData.stats.totalFiles} files • {repoData.stats.totalFolders} folders • {(repoData.stats.totalSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <StructureToggle />
                  </div>
                </div>
                <div className="h-[600px]">
                  <TreemapView
                    files={repoData.files}
                    onSelectFile={(path) => {
                      setSelectedFile(path)
                      setShowPreview(true)
                    }}
                  />
                </div>
              </div>
            </div>
          )
        )}

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent p-0 h-auto gap-0 justify-start">
              <TabsTrigger value="dependencies" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary hover:bg-muted/50 transition-colors duration-200 px-6 py-3">
                <GitBranch className="h-4 w-4 mr-2" />
                Dependencies
              </TabsTrigger>
              <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary hover:bg-muted/50 transition-colors duration-200 px-6 py-3">
                Overview
              </TabsTrigger>
              <TabsTrigger value="insights" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary hover:bg-muted/50 transition-colors duration-200 px-6 py-3">
                AI Insights
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary hover:bg-muted/50 transition-colors duration-200 px-6 py-3">
                Recommendations
              </TabsTrigger>
              <TabsTrigger value="export" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary hover:bg-muted/50 transition-colors duration-200 px-6 py-3">
                Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dependencies" className="flex-1 m-0 overflow-hidden">
              <DependencyGraph repoData={repoData} />
            </TabsContent>

            <TabsContent value="overview" className="flex-1 p-6 m-0 overflow-auto">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Repository Summary</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysisResult.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg p-4 border border-blue-200/20">
                    <h4 className="font-semibold text-foreground mb-2">Architecture</h4>
                    <p className="text-sm text-muted-foreground">{analysisResult.architecture}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg p-4 border border-purple-200/20">
                    <h4 className="font-semibold text-foreground mb-2">Code Quality</h4>
                    <p className="text-sm text-muted-foreground">{analysisResult.codeQuality}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-3">Repository Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg p-4 border border-blue-200/20">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Total Files</div>
                      <div className="text-3xl font-bold text-blue-600">{repoData.stats.totalFiles}</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg p-4 border border-purple-200/20">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Total Folders</div>
                      <div className="text-3xl font-bold text-purple-600">{repoData.stats.totalFolders}</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg p-4 border border-green-200/20">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Max Depth</div>
                      <div className="text-3xl font-bold text-green-600">{repoData.stats.maxDepth}</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-lg p-4 border border-amber-200/20">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Avg File Size</div>
                      <div className="text-3xl font-bold text-amber-600">{(repoData.stats.averageFileSize / 1024).toFixed(1)}KB</div>
                    </div>
                  </div>
                </div>

                {Object.keys(repoData.stats.languages).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Languages Used</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(repoData.stats.languages)
                        .sort(([, a], [, b]) => b - a)
                        .map(([lang, count]) => (
                          <div
                            key={lang}
                            className="px-3 py-1.5 rounded-full bg-muted text-sm font-medium text-foreground"
                          >
                            {lang.toUpperCase()} <span className="text-muted-foreground">({count})</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="flex-1 p-6 m-0 overflow-auto">
              <div className="space-y-3">
                {analysisResult.insights && analysisResult.insights.length > 0 ? (
                  analysisResult.insights.map((insight, index) => (
                    <div
                      key={`insight-${index}`}
                      className="flex gap-4 p-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getInsightIconForType(insight.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground mb-1">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No insights available</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="flex-1 p-6 m-0 overflow-auto">
              <div className="space-y-3">
                {analysisResult.recommendations && analysisResult.recommendations.length > 0 ? (
                  <ol className="space-y-3 list-decimal list-inside">
                    {analysisResult.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-muted-foreground leading-relaxed">
                        {rec}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">No recommendations at this time</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="export" className="flex-1 p-6 m-0 overflow-auto">
              <ExportPanel repoUrl={repoUrl} repoData={repoData} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

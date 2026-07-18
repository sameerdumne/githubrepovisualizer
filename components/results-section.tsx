'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TreeView, TreeNode } from '@/components/tree-view'
import { TreemapView } from '@/components/treemap-view'
import { FilePreviewPanel } from '@/components/file-preview-panel'
import { ExportPanel } from '@/components/export-panel'
import { DependencyGraph } from '@/components/dependency-graph'
import { RepositoryData, AnalysisResult, buildTreeStructure } from '@/lib/api/repository-analysis'
import { AlertCircle, CheckCircle2, AlertTriangle, Info, GitBranch, LayoutGrid, List } from 'lucide-react'
import { SharePanel } from '@/components/share-panel'
import { cn } from '@/lib/utils'

interface ResultsSectionProps {
  repoUrl: string
  repoData: RepositoryData
  analysisResult: AnalysisResult
  onReset: () => void
}

export function ResultsSection({ repoUrl, repoData, analysisResult }: ResultsSectionProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState('dependencies')
  const [structureView, setStructureView] = useState<'tree' | 'treemap'>('tree')

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

  const getInsightIcon = (type: string) => {
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
    <div className="flex items-center bg-background border border-border">
      <button
        onClick={() => setStructureView('tree')}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors cursor-pointer uppercase tracking-widest',
          structureView === 'tree'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <List className="h-3.5 w-3.5" />
        Tree
      </button>
      <button
        onClick={() => setStructureView('treemap')}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors cursor-pointer uppercase tracking-widest',
          structureView === 'treemap'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Treemap
      </button>
    </div>
  )

  const currentView = structureView

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-16 py-8 pt-24">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[32px] font-bold text-primary mb-2 tracking-tight">Repository Analysis</h2>
          <p className="text-[13px] text-muted-foreground truncate font-mono">{repoUrl}</p>
        </div>
        <SharePanel
          repoUrl={repoUrl}
          repoData={repoData}
          analysisResult={analysisResult}
        />
      </div>

      {currentView === 'tree' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          <div className="lg:col-span-2 bg-card border border-border overflow-hidden flex flex-col max-h-[600px]">
            <div className="sticky top-0 bg-secondary border-b border-border px-4 py-3 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-primary"></div>
                    <span className="text-[14px] font-medium uppercase tracking-[0.05em] text-muted-foreground">Explorer</span>
                  </div>
                  <h3 className="text-[24px] font-semibold text-primary">Repository Structure</h3>
                  <p className="text-[13px] text-muted-foreground mt-0.5 font-mono">
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
          <div className="bg-card border border-border overflow-hidden">
            <div className="bg-secondary border-b border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-primary"></div>
                    <span className="text-[14px] font-medium uppercase tracking-[0.05em] text-muted-foreground">Treemap</span>
                  </div>
                  <h3 className="text-[24px] font-semibold text-primary">Repository Treemap</h3>
                  <p className="text-[13px] text-muted-foreground mt-0.5 font-mono">
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
      )}

      <div className="bg-card border border-border overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <TabsList className="w-full rounded-none border-b border-border bg-transparent p-0 h-auto gap-0 justify-start">
            <TabsTrigger value="dependencies" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary hover:bg-muted/50 transition-colors duration-200 px-6 py-3 text-[14px] font-medium uppercase tracking-[0.05em]">
              <GitBranch className="h-4 w-4 mr-2" />
              Dependencies
            </TabsTrigger>
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary hover:bg-muted/50 transition-colors duration-200 px-6 py-3 text-[14px] font-medium uppercase tracking-[0.05em]">
              Overview
            </TabsTrigger>
            <TabsTrigger value="insights" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary hover:bg-muted/50 transition-colors duration-200 px-6 py-3 text-[14px] font-medium uppercase tracking-[0.05em]">
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary hover:bg-muted/50 transition-colors duration-200 px-6 py-3 text-[14px] font-medium uppercase tracking-[0.05em]">
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="export" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary hover:bg-muted/50 transition-colors duration-200 px-6 py-3 text-[14px] font-medium uppercase tracking-[0.05em]">
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dependencies" className="flex-1 m-0 overflow-hidden">
            <DependencyGraph repoData={repoData} />
          </TabsContent>

          <TabsContent value="overview" className="flex-1 p-6 m-0 overflow-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-[32px] font-semibold text-primary mb-3 tracking-tight">Repository Summary</h3>
                <p className="text-[16px] text-muted-foreground leading-[1.6]">
                  {analysisResult.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-secondary/30 border border-border p-6">
                  <span className="text-[13px] text-muted-foreground mb-2 block tracking-widest uppercase">Architecture</span>
                  <p className="text-[16px] text-muted-foreground leading-[1.6]">{analysisResult.architecture}</p>
                </div>
                <div className="bg-secondary/30 border border-border p-6">
                  <span className="text-[13px] text-muted-foreground mb-2 block tracking-widest uppercase">Code Quality</span>
                  <p className="text-[16px] text-muted-foreground leading-[1.6]">{analysisResult.codeQuality}</p>
                </div>
              </div>

              <div>
                <h4 className="text-[14px] font-medium uppercase tracking-[0.05em] text-muted-foreground mb-3">Repository Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="border border-border p-4">
                    <div className="text-[13px] text-muted-foreground mb-1 uppercase tracking-widest">Total Files</div>
                    <div className="text-[32px] font-bold text-primary">{repoData.stats.totalFiles}</div>
                  </div>
                  <div className="border border-border p-4">
                    <div className="text-[13px] text-muted-foreground mb-1 uppercase tracking-widest">Total Folders</div>
                    <div className="text-[32px] font-bold text-primary">{repoData.stats.totalFolders}</div>
                  </div>
                  <div className="border border-border p-4">
                    <div className="text-[13px] text-muted-foreground mb-1 uppercase tracking-widest">Max Depth</div>
                    <div className="text-[32px] font-bold text-primary">{repoData.stats.maxDepth}</div>
                  </div>
                  <div className="border border-border p-4">
                    <div className="text-[13px] text-muted-foreground mb-1 uppercase tracking-widest">Avg File Size</div>
                    <div className="text-[32px] font-bold text-primary">{(repoData.stats.averageFileSize / 1024).toFixed(1)}KB</div>
                  </div>
                </div>
              </div>

              {Object.keys(repoData.stats.languages).length > 0 && (
                <div>
                  <h4 className="text-[14px] font-medium uppercase tracking-[0.05em] text-muted-foreground mb-3">Languages Used</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(repoData.stats.languages)
                      .sort(([, a], [, b]) => b - a)
                      .map(([lang, count]) => (
                        <div
                          key={lang}
                          className="px-3 py-1.5 border border-border text-sm font-medium text-primary"
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
                    className="flex gap-4 p-4 border border-border bg-card/50 hover:bg-card/80 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-primary mb-1">{insight.title}</h4>
                      <p className="text-[16px] text-muted-foreground leading-[1.6]">{insight.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[16px] text-muted-foreground">No insights available</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="flex-1 p-6 m-0 overflow-auto">
            <div className="space-y-3">
              {analysisResult.recommendations && analysisResult.recommendations.length > 0 ? (
                <ol className="space-y-3 list-decimal list-inside">
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={index} className="text-[16px] text-muted-foreground leading-[1.6]">
                      {rec}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[16px] text-muted-foreground">No recommendations at this time</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="export" className="flex-1 p-6 m-0 overflow-auto">
            <ExportPanel repoUrl={repoUrl} repoData={repoData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

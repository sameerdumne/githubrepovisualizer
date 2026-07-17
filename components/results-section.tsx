'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TreeView, TreeNode } from '@/components/tree-view'
import { FilePreviewPanel } from '@/components/file-preview-panel'
import { ExportPanel } from '@/components/export-panel'
import { DependencyGraph } from '@/components/dependency-graph'
import { RepositoryData, AnalysisResult, buildTreeStructure } from '@/lib/api/repository-analysis'
import { AlertCircle, CheckCircle2, AlertTriangle, Info, GitBranch } from 'lucide-react'

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

  const treeStructure = buildTreeStructure(repoData.files)
  
  // Get file content by path
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

  return (
    <div className="mx-auto max-w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Repository Analysis</h2>
        <p className="text-sm text-muted-foreground truncate">{repoUrl}</p>
      </div>

      {/* Tree View and Preview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {/* Left Panel - Directory Tree */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border overflow-hidden flex flex-col max-h-[600px]">
          <div className="sticky top-0 bg-gradient-to-r from-muted to-muted/50 border-b border-border px-4 py-4 z-10">
            <h3 className="text-sm font-semibold text-foreground">📁 Repository Structure</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {repoData.stats.totalFiles} files • {repoData.stats.totalFolders} folders
            </p>
          </div>
          <TreeView nodes={treeStructure} onSelect={handleSelectFile} />
        </div>

        {/* Right Panel - File Preview */}
        {showPreview && selectedFile && (
          <FilePreviewPanel
            selectedFile={selectedFile}
            content={currentContent}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>

      {/* Statistics and Analysis */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <TabsList className="w-full rounded-none border-b border-border bg-transparent p-0 h-auto gap-0 justify-start">
            <TabsTrigger value="dependencies" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary hover:bg-muted/50 transition-colors duration-200 px-6 py-3">
              <GitBranch className="h-4 w-4 mr-2" />
              Dependencies
            </TabsTrigger>
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary hover:bg-muted/50 transition-colors duration-200 px-6 py-3">
              📊 Overview
            </TabsTrigger>
            <TabsTrigger value="insights" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary hover:bg-muted/50 transition-colors duration-200 px-6 py-3">
              💡 AI Insights
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary hover:bg-muted/50 transition-colors duration-200 px-6 py-3">
              🎯 Recommendations
            </TabsTrigger>
            <TabsTrigger value="export" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary hover:bg-muted/50 transition-colors duration-200 px-6 py-3">
              📥 Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dependencies" className="flex-1 m-0 overflow-hidden">
            <DependencyGraph repoData={repoData} />
          </TabsContent>

          <TabsContent value="overview" className="flex-1 p-6 m-0 overflow-auto">
            <div className="space-y-6">
              {/* Summary */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Repository Summary</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysisResult.summary}
                </p>
              </div>

              {/* Architecture and Code Quality */}
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

              {/* Statistics */}
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

              {/* Languages */}
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
                      {getInsightIcon(insight.type)}
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
  )
}

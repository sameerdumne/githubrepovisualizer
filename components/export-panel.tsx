'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, Copy, FileJson, FileText } from 'lucide-react'
import {
  convertToExportFormat,
  downloadJSON,
  exportAsJSON,
  exportAsMarkdown,
  generateSummaryReport,
  ExportedRepository,
} from '@/lib/api/export-repository'
import { RepositoryData } from '@/lib/api/repository-analysis'

interface ExportPanelProps {
  repoUrl: string
  repoData: RepositoryData
}

export function ExportPanel({ repoUrl, repoData }: ExportPanelProps) {
  const [copiedType, setCopiedType] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const exportedRepo = convertToExportFormat(repoData, repoUrl)

  const handleCopyJSON = async (type: 'full' | 'structure' | 'contents') => {
    const data =
      type === 'structure'
        ? { metadata: exportedRepo.metadata, structure: exportedRepo.structure }
        : type === 'contents'
          ? { metadata: exportedRepo.metadata, contents: exportedRepo.contents }
          : exportedRepo

    const jsonString = JSON.stringify(data, null, 2)
    await navigator.clipboard.writeText(jsonString)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  const handleDownload = (type: 'full' | 'structure' | 'contents') => {
    setIsExporting(true)
    try {
      downloadJSON(exportedRepo, type)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadMarkdown = () => {
    setIsExporting(true)
    try {
      const md = exportAsMarkdown(exportedRepo)
      const blob = new Blob([md], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${exportedRepo.metadata.name.replace('/', '-')}-analysis.md`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Report */}
      <Card className="border-border bg-card/50 p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Export & Share</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Export your repository structure and contents as JSON or Markdown files. Perfect for sharing with AI assistants for debugging!
        </p>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-background/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Files</p>
            <p className="text-xl font-bold text-primary">{repoData.stats.totalFiles}</p>
          </div>
          <div className="bg-background/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Folders</p>
            <p className="text-xl font-bold text-primary">{repoData.stats.totalFolders}</p>
          </div>
          <div className="bg-background/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Total Size</p>
            <p className="text-xl font-bold text-primary">
              {(repoData.stats.totalSize / 1024 / 1024).toFixed(2)}MB
            </p>
          </div>
          <div className="bg-background/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Content Files</p>
            <p className="text-xl font-bold text-primary">{exportedRepo.contents.length}</p>
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">Full JSON Export</h4>
                <p className="text-xs text-muted-foreground">Structure + Contents</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyJSON('full')}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copiedType === 'full' ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                size="sm"
                onClick={() => handleDownload('full')}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-amber-500" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">Structure Only</h4>
                <p className="text-xs text-muted-foreground">Folder hierarchy without file contents</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyJSON('structure')}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copiedType === 'structure' ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                size="sm"
                onClick={() => handleDownload('structure')}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">Contents Only</h4>
                <p className="text-xs text-muted-foreground">All file contents with metadata</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyJSON('contents')}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copiedType === 'contents' ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                size="sm"
                onClick={() => handleDownload('contents')}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">Markdown Report</h4>
                <p className="text-xs text-muted-foreground">Human-readable analysis with code blocks</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleDownloadMarkdown}
              disabled={isExporting}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="font-medium text-sm mb-2 text-blue-600">💡 How to Use</h4>
          <ol className="text-xs text-muted-foreground space-y-1 ml-4">
            <li>1. Download the JSON files from above</li>
            <li>2. Upload them to your favorite AI assistant (ChatGPT, Claude, etc.)</li>
            <li>3. Ask the AI to help you debug or understand the code</li>
            <li>4. The AI will have complete context without you needing to copy-paste code</li>
          </ol>
        </div>

        {/* Summary Report */}
        <div className="mt-6 p-4 bg-background/50 rounded-lg border border-border">
          <h4 className="font-medium text-sm mb-3 text-foreground">📊 Analysis Summary</h4>
          <pre className="text-xs text-muted-foreground overflow-auto max-h-64 whitespace-pre-wrap">
            {generateSummaryReport(exportedRepo)}
          </pre>
        </div>
      </Card>
    </div>
  )
}

'use client'

import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface FilePreviewProps {
  fileName: string
  content: string
}

export function FilePreview({ fileName, content }: FilePreviewProps) {
  const [isCopied, setIsCopied] = useState(false)
  const lines = content.split('\n')
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'txt'

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const getLanguageColor = (ext: string) => {
    const colors: Record<string, string> = {
      tsx: 'bg-amber-500/20 text-amber-600 border-amber-200',
      ts: 'bg-blue-500/20 text-blue-600 border-blue-200',
      jsx: 'bg-amber-500/20 text-amber-600 border-amber-200',
      js: 'bg-yellow-500/20 text-yellow-600 border-yellow-200',
      json: 'bg-orange-500/20 text-orange-600 border-orange-200',
      css: 'bg-pink-500/20 text-pink-600 border-pink-200',
      md: 'bg-slate-500/20 text-slate-600 border-slate-200',
    }
    return colors[ext] || 'bg-muted text-muted-foreground border-border'
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground truncate">{fileName}</span>
            <div className={cn('w-fit px-2 py-0.5 rounded text-xs font-medium border', getLanguageColor(fileExtension))}>
              {fileExtension.toUpperCase()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground">{lines.length} lines</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-shrink-0 gap-2"
          >
            {isCopied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 bg-muted/30">
        <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">
          <div className="space-y-0">
            {lines.map((line, index) => (
              <div key={index} className="flex gap-3 hover:bg-muted/50 px-2 py-1 transition-colors">
                <span className="text-muted-foreground/60 text-right select-none" style={{ minWidth: '2.5rem' }}>
                  {index + 1}
                </span>
                <code className="flex-1">{line || ' '}</code>
              </div>
            ))}
          </div>
        </pre>
      </div>
    </div>
  )
}

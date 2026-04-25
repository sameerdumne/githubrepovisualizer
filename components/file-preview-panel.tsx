'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilePreview } from '@/components/file-preview'
import { cn } from '@/lib/utils'

interface FilePreviewPanelProps {
  selectedFile: string | null
  content: string
  onClose: () => void
}

export function FilePreviewPanel({ selectedFile, content, onClose }: FilePreviewPanelProps) {
  if (!selectedFile) return null

  return (
    <div className="lg:col-span-2 bg-card rounded-lg border border-border overflow-hidden flex flex-col h-full shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/50">
        <span className="text-sm font-semibold text-foreground">File Preview</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <FilePreview fileName={selectedFile} content={content} />
      </div>
    </div>
  )
}

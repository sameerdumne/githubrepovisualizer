'use client'

import { useState, useRef, useEffect } from 'react'
import { Share2, Link2, MessageCircle, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnalysisResult, RepositoryData } from '@/lib/api/repository-analysis'

interface SharePanelProps {
  repoUrl: string
  repoData: RepositoryData
  analysisResult: AnalysisResult
}

function formatAnalysisForWhatsApp(repoUrl: string, analysis: AnalysisResult): string {
  const summary = analysis.summary.length > 200
    ? analysis.summary.substring(0, 197) + '...'
    : analysis.summary

  const lines: string[] = []
  lines.push(`*Repository Analysis*`)
  lines.push(repoUrl)
  lines.push('')
  lines.push(summary)

  if (analysis.insights && analysis.insights.length > 0) {
    lines.push('')
    lines.push(`*Key Insights (${analysis.insights.length})*`)
    for (const insight of analysis.insights.slice(0, 3)) {
      const icon = insight.type === 'warning' ? '⚠️' : insight.type === 'success' ? '✅' : 'ℹ️'
      lines.push(`${icon} ${insight.title}`)
    }
  }

  if (analysis.recommendations && analysis.recommendations.length > 0) {
    lines.push('')
    lines.push(`*Recommendations (${analysis.recommendations.length})*`)
    for (const rec of analysis.recommendations.slice(0, 3)) {
      lines.push(`• ${rec}`)
    }
  }

  lines.push('')
  lines.push('Analyzed with RepoViz')

  return lines.join('\n')
}

function copyViaTextarea(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '-9999px'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    // ignore
  }
  document.body.removeChild(textarea)
  return ok
}

export function SharePanel({ repoUrl, repoData, analysisResult }: SharePanelProps) {
  const [open, setOpen] = useState(false)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleWhatsApp = () => {
    const text = formatAnalysisForWhatsApp(repoUrl, analysisResult)
    const encoded = encodeURIComponent(text)
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank')
    setOpen(false)
  }

  const handleCopyLink = async () => {
    setIsGeneratingLink(true)
    setError(null)
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, repoData, analysisResult }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to generate share link')
      }

      const { shareUrl } = await response.json()
      const ok = copyViaTextarea(shareUrl)
      if (ok) {
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 3000)
      } else {
        setError('Copy failed — please copy the URL manually')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate link')
    } finally {
      setIsGeneratingLink(false)
    }
  }

  return (
    <div className="relative">
      <Button ref={buttonRef} variant="outline" size="sm" className="gap-2" onClick={() => setOpen(!open)}>
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 z-50 w-64 rounded-md border border-border bg-popover shadow-md p-1"
        >
          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-3 w-full px-2 py-1.5 rounded-sm text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <MessageCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="flex-1 text-left">Share to WhatsApp</span>
          </button>

          <div className="my-1 h-px bg-border" />

          <button
            onClick={handleCopyLink}
            disabled={isGeneratingLink}
            className="flex items-center gap-3 w-full px-2 py-1.5 rounded-sm text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer disabled:opacity-50"
          >
            {isGeneratingLink ? (
              <Loader2 className="h-4 w-4 text-muted-foreground flex-shrink-0 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
            )}
            <span className="flex-1 text-left">
              {isGeneratingLink ? 'Generating link...' : copiedLink ? 'Link copied!' : 'Copy share link'}
            </span>
            {copiedLink && <Check className="h-3.5 w-3.5 text-green-500" />}
          </button>

          {error && (
            <p className="px-2 py-1.5 text-xs text-destructive">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Calendar, FolderTree, RefreshCw } from 'lucide-react'
import { GitHubIcon } from '@/components/github-icon'
import { useAuth } from '@/contexts/auth-context'

export interface HistoryItem {
  id: string
  repoName: string
  url: string
  analyzedAt: string
  totalFiles: number
  totalFolders: number
  maxDepth: number
  languages: Record<string, number>
}

function formatRelativeDate(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()

  if (Number.isNaN(date.getTime())) {
    return 'Recently'
  }

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function HistoryPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [items, setItems] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = async () => {
    if (!user) {
      setItems([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/history', {
        cache: 'no-store',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load history')
      }

      setItems(data.items || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load history')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadHistory()
    }
  }, [authLoading, user])

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-16 py-16 pt-24">
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-[48px] font-bold text-primary mb-2 tracking-tighter">Analysis History</h1>
          <p className="text-[16px] text-muted-foreground max-w-xl leading-[1.6]">
            Technical audit trail of scanned repositories. Each entry represents a full architecture and security decomposition.
          </p>
        </div>
        {user && (
          <div className="flex gap-4">
            <Button variant="outline" onClick={loadHistory} disabled={isLoading} className="px-6 py-3 text-[14px] font-medium uppercase tracking-[0.05em]">
              Export Report
            </Button>
            <Button onClick={loadHistory} disabled={isLoading} className="px-6 py-3 bg-primary text-primary-foreground text-[14px] font-medium uppercase tracking-[0.05em]">
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {authLoading || isLoading ? (
          <div className="col-span-full text-center py-12">
            <div className="mx-auto mb-4 h-8 w-8 border-2 border-muted border-t-primary animate-spin" />
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        ) : !user ? (
          <div className="col-span-full text-center py-12">
            <div className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50">
              <GitHubIcon size="xl" />
            </div>
            <p className="text-muted-foreground mb-4">Log in to save and reopen repository analyses</p>
            <Button asChild>
              <Link href="/login">Login with GitHub</Link>
            </Button>
          </div>
        ) : error ? (
          <div className="col-span-full border border-destructive/50 bg-destructive/10 p-6">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={loadHistory}>
              Try Again
            </Button>
          </div>
        ) : items.length === 0 ? (
          <>
            {/* Empty State / Add New Card */}
            <div className="border border-dashed border-border h-[400px] flex flex-col items-center justify-center group cursor-pointer hover:border-primary transition-colors">
              <div className="mb-6 w-16 h-16 border border-border flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <span className="text-[32px]">+</span>
              </div>
              <p className="text-[24px] font-semibold text-primary mb-2">Analyze New Repository</p>
              <p className="text-[13px] text-muted-foreground px-12 text-center opacity-60 font-mono">Initialize a fresh deep-scan of local or remote git clusters.</p>
            </div>
          </>
        ) : (
          <>
            {/* Add New Card */}
            <Link href="/" className="border border-dashed border-border h-[400px] flex flex-col items-center justify-center group cursor-pointer hover:border-primary transition-colors">
              <div className="mb-6 w-16 h-16 border border-border flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <span className="text-[32px]">+</span>
              </div>
              <p className="text-[24px] font-semibold text-primary mb-2">Analyze New Repository</p>
              <p className="text-[13px] text-muted-foreground px-12 text-center opacity-60 font-mono">Initialize a fresh deep-scan of local or remote git clusters.</p>
            </Link>

            {items.map((item, index) => (
              <div
                key={item.id}
                className="group border border-border bg-card h-[400px] flex flex-col p-8 hover:border-primary transition-all relative animate-in fade-in slide-in-from-top-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-12">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-primary opacity-40 uppercase tracking-[0.2em] mb-2">Production</span>
                    <h4 className="text-[24px] font-semibold text-primary">{item.repoName}</h4>
                  </div>
                  <div className="w-3 h-3 bg-primary"></div>
                </div>
                <div className="flex-1 space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-[13px] text-muted-foreground font-mono">Total Files</span>
                    <span className="text-[14px] font-medium text-primary">{item.totalFiles.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-[13px] text-muted-foreground font-mono">Folders</span>
                    <span className="text-[14px] font-medium text-primary">{item.totalFolders.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-[13px] text-muted-foreground font-mono">Last Scanned</span>
                    <span className="text-[14px] font-medium text-primary">{formatRelativeDate(item.analyzedAt)}</span>
                  </div>
                </div>
                <div className="mt-8">
                  <Link
                    href={`/?historyId=${encodeURIComponent(item.id)}`}
                    className="w-full py-4 border border-border group-hover:bg-primary group-hover:text-primary-foreground font-medium text-[14px] uppercase tracking-[0.05em] transition-all flex items-center justify-center gap-2"
                  >
                    View Architecture <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

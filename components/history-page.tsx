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
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Analysis History</h1>
          <p className="text-lg text-muted-foreground">Your saved repository analyses</p>
        </div>
        {user && (
          <Button variant="outline" onClick={loadHistory} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {authLoading || isLoading ? (
          <div className="text-center py-12">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        ) : !user ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50">
              <GitHubIcon size="xl" />
            </div>
            <p className="text-muted-foreground mb-4">Log in to save and reopen repository analyses</p>
            <Button asChild>
              <Link href="/login">Login with GitHub</Link>
            </Button>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={loadHistory}>
              Try Again
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50">
              <GitHubIcon size="xl" />
            </div>
            <p className="text-muted-foreground">No repositories analyzed yet</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-lg border border-border bg-card hover:border-primary hover:shadow-lg transition-all duration-200 animate-in fade-in slide-in-from-top-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted flex-shrink-0 group-hover:bg-primary/10 transition-colors duration-200 text-foreground group-hover:text-primary">
                    <GitHubIcon size="lg" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1 truncate">
                      {item.repoName}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2 truncate">{item.url}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatRelativeDate(item.analyzedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <FolderTree className="h-4 w-4" />
                        {item.totalFiles.toLocaleString()} files
                      </div>
                      <div>
                        {item.totalFolders.toLocaleString()} folders
                      </div>
                      <div>
                        depth {item.maxDepth}
                      </div>
                    </div>
                  </div>
                </div>
                <Button asChild variant="outline" className="flex-shrink-0 group-hover:border-primary group-hover:bg-primary/5 transition-all duration-200">
                  <Link href={`/?historyId=${encodeURIComponent(item.id)}`}>
                    View Again
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                </Button>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

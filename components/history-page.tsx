'use client'

import { Button } from '@/components/ui/button'
import { Calendar, ArrowRight } from 'lucide-react'
import { GitHubIcon } from '@/components/github-icon'

export interface HistoryItem {
  id: string
  repoName: string
  url: string
  analyzedDate: string
  stars: number
}

interface HistoryPageProps {
  items?: HistoryItem[]
}

const mockHistory: HistoryItem[] = [
  {
    id: '1',
    repoName: 'vercel/next.js',
    url: 'https://github.com/vercel/next.js',
    analyzedDate: '2 days ago',
    stars: 125000,
  },
  {
    id: '2',
    repoName: 'facebook/react',
    url: 'https://github.com/facebook/react',
    analyzedDate: '1 week ago',
    stars: 215000,
  },
  {
    id: '3',
    repoName: 'tailwindlabs/tailwindcss',
    url: 'https://github.com/tailwindlabs/tailwindcss',
    analyzedDate: '2 weeks ago',
    stars: 80000,
  },
  {
    id: '4',
    repoName: 'shadcn-ui/ui',
    url: 'https://github.com/shadcn-ui/ui',
    analyzedDate: '1 month ago',
    stars: 62000,
  },
]

export function HistoryPage({ items = mockHistory }: HistoryPageProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-2">Analysis History</h1>
        <p className="text-lg text-muted-foreground">Your recently analyzed repositories</p>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
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
                        {item.analyzedDate}
                      </div>
                      <div className="flex items-center gap-1">
                        <span>★</span>
                        {item.stars.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="flex-shrink-0 group-hover:border-primary group-hover:bg-primary/5 transition-all duration-200">
                  View Again
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </div>
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

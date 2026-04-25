'use client'

import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface Insight {
  id: string
  type: 'error' | 'warning' | 'success'
  title: string
  description: string
}

interface InsightsPanelProps {
  insights: Insight[]
  stats?: {
    totalFiles: number
    totalFolders: number
    maxDepth: number
  }
}

export function InsightsPanel({ insights, stats }: InsightsPanelProps) {
  const iconMap = {
    error: <AlertCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    success: <CheckCircle className="h-5 w-5" />,
  }

  const colorMap = {
    error: 'bg-red-500/10 text-red-600 border-red-200',
    warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    success: 'bg-green-500/10 text-green-600 border-green-200',
  }

  const badgeColorMap = {
    error: 'bg-red-500/20 text-red-600 hover:bg-red-500/30',
    warning: 'bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30',
    success: 'bg-green-500/20 text-green-600 hover:bg-green-500/30',
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-auto">
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="text-xs font-medium text-muted-foreground mb-1">Total Files</div>
            <div className="text-2xl font-bold text-foreground">{stats.totalFiles}</div>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="text-xs font-medium text-muted-foreground mb-1">Folders</div>
            <div className="text-2xl font-bold text-foreground">{stats.totalFolders}</div>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="text-xs font-medium text-muted-foreground mb-1">Max Depth</div>
            <div className="text-2xl font-bold text-foreground">{stats.maxDepth}</div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">Insights & Recommendations</h3>
        <div className="space-y-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`rounded-lg border p-4 ${colorMap[insight.type]}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{iconMap[insight.type]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <Badge className={badgeColorMap[insight.type]} variant="outline">
                      {insight.type}
                    </Badge>
                  </div>
                  <p className="text-xs opacity-90">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

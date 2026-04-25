'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GitHubIcon } from '@/components/github-icon'

interface HeroSectionProps {
  onAnalyze: (repoUrl: string) => void
  isLoading?: boolean
}

export function HeroSection({ onAnalyze, isLoading = false }: HeroSectionProps) {
  const [repoUrl, setRepoUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (repoUrl.trim()) {
      onAnalyze(repoUrl)
    }
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-card/50 to-background mx-auto max-w-7xl px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 animate-in fade-in slide-in-from-top-3 duration-500">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 mb-4 text-blue-400">
            <GitHubIcon size="lg" />
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-foreground mb-4 animate-in fade-in slide-in-from-top-4 duration-500" style={{ animationDelay: '100ms' }}>
          <span className="text-balance">Visualize Any GitHub Repository</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl text-pretty animate-in fade-in slide-in-from-top-5 duration-500" style={{ animationDelay: '200ms' }}>
          Understand structure, debug faster, and explore codebases visually
        </p>
        
        <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-3 animate-in fade-in slide-in-from-top-6 duration-500" style={{ animationDelay: '300ms' }}>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <GitHubIcon size="sm" />
              </div>
              <Input
                type="url"
                placeholder="Paste GitHub repo URL (https://github.com/user/repo)"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="pl-10 h-12 text-base transition-all duration-200 focus:border-primary focus:ring-primary/20"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isLoading || !repoUrl.trim()}
              className="h-12 whitespace-nowrap transition-all duration-200 hover:shadow-lg active:scale-95"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Repo'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-12 grid grid-cols-2 gap-6 sm:gap-8 w-full max-w-md text-left animate-in fade-in slide-in-from-top-7 duration-500" style={{ animationDelay: '400ms' }}>
          <div className="flex flex-col gap-2 p-4 rounded-lg bg-card/50 border border-border/50 hover:border-border transition-colors duration-200">
            <div className="text-sm font-medium text-muted-foreground">Total Files</div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">1,247</div>
          </div>
          <div className="flex flex-col gap-2 p-4 rounded-lg bg-card/50 border border-border/50 hover:border-border transition-colors duration-200">
            <div className="text-sm font-medium text-muted-foreground">Max Depth</div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">12</div>
          </div>
        </div>
      </div>
    </div>
  )
}

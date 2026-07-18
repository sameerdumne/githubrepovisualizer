'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
    <div className="relative overflow-hidden mx-auto max-w-[1440px] px-4 sm:px-16 pt-32 pb-64 min-h-screen flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-4xl text-center mb-24">
        <h1 className="text-[40px] sm:text-[64px] leading-[1.1] tracking-tighter font-bold text-primary mb-8">
          Visualize the <span className="block">Architectural Core.</span>
        </h1>
        <p className="text-[18px] text-muted-foreground max-w-2xl mx-auto mb-12 leading-[1.6]">
          Turn complex repositories into actionable insights. Precision engineering for codebase health, contributor velocity, and structural integrity.
        </p>

        {/* Central URL Input */}
        <div className="relative group max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 border border-border focus-within:border-primary transition-all duration-300">
            <div className="flex-grow flex items-center px-4 bg-secondary/50">
              <GitHubIcon size="sm" className="mr-3 text-muted-foreground" />
              <input
                type="url"
                placeholder="https://github.com/organization/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={isLoading}
                className="w-full py-5 bg-transparent border-none focus:ring-0 text-primary placeholder:text-neutral-600 text-[14px]"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !repoUrl.trim()}
              className="bg-primary text-primary-foreground font-bold px-8 py-5 hover:bg-neutral-200 transition-colors active:scale-[0.98] text-[14px] tracking-[0.05em] uppercase"
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
          </form>
          <div className="mt-4 flex justify-center gap-4 text-[12px] text-neutral-500 uppercase tracking-widest">
            <span>Public repositories</span>
            <span className="text-neutral-700">/</span>
            <span>Private access via SSH</span>
          </div>
        </div>
      </section>

      {/* Bento Grid Feature Display */}
      <section className="w-full max-w-[1440px] grid grid-cols-1 md:grid-cols-12 gap-6 mb-32">
        <div className="md:col-span-8 border border-border p-12 relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-[13px] text-muted-foreground mb-4 block tracking-widest uppercase">01 / DISCOVERY</span>
            <h3 className="text-[32px] leading-[1.2] tracking-[-0.02em] font-semibold text-primary mb-4">Deep Structural Mapping</h3>
            <p className="text-muted-foreground max-w-md leading-[1.6]">Automatically generate dependency graphs and identify circular references in monolithic architectures.</p>
          </div>
        </div>

        <div className="md:col-span-4 border border-border p-8 flex flex-col justify-between bg-secondary/30">
          <span className="text-[13px] text-muted-foreground mb-4 block tracking-widest uppercase">02 / VELOCITY</span>
          <div>
            <h3 className="text-[24px] leading-[1.3] tracking-[-0.02em] font-semibold text-primary mb-2">Cycle Time Analysis</h3>
            <p className="text-muted-foreground text-[16px] leading-[1.6]">Measure the time from first commit to production deployment with sub-minute precision.</p>
          </div>
          <div className="mt-8 border-t border-border pt-4">
            <div className="flex justify-between items-end">
              <div className="flex gap-1 h-12 items-end">
                <div className="w-2 bg-neutral-800 h-1/2"></div>
                <div className="w-2 bg-neutral-700 h-3/4"></div>
                <div className="w-2 bg-primary h-full"></div>
                <div className="w-2 bg-neutral-800 h-2/3"></div>
              </div>
              <span className="text-[13px] text-primary">+12.4%</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 border border-border p-8 bg-secondary/30">
          <span className="text-[13px] text-muted-foreground mb-4 block tracking-widest uppercase">03 / HEALTH</span>
          <h3 className="text-[24px] leading-[1.3] tracking-[-0.02em] font-semibold text-primary mb-2">Technical Debt Ledger</h3>
          <p className="text-muted-foreground text-[16px] leading-[1.6]">Automated identification of code smells and outdated dependencies across 40+ languages.</p>
        </div>

        <div className="md:col-span-8 border border-border p-8 flex items-center justify-between group">
          <div>
            <span className="text-[13px] text-muted-foreground mb-4 block tracking-widest uppercase">04 / COLLABORATION</span>
            <h3 className="text-[24px] leading-[1.3] tracking-[-0.02em] font-semibold text-primary mb-2">Team Impact Matrix</h3>
            <p className="text-muted-foreground text-[16px] leading-[1.6]">Visualize knowledge silos and ensure continuity through intelligent contributor heatmaps.</p>
          </div>
          <div className="w-32 h-32 border border-border relative flex items-center justify-center">
            <div className="absolute w-4 h-4 bg-primary animate-pulse"></div>
            <div className="w-full h-px bg-border absolute"></div>
            <div className="h-full w-px bg-border absolute"></div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-primary py-24 px-4 sm:px-16 text-center">
        <h2 className="text-[40px] sm:text-[64px] text-background font-bold tracking-tighter mb-8 leading-[1.1]">
          Ready to see your code differently?
        </h2>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <button className="bg-background text-primary px-12 py-4 font-bold hover:opacity-90 transition-all">
            Get Started Free
          </button>
          <button className="border-2 border-background text-background px-12 py-4 font-bold hover:bg-background/10 transition-all">
            Schedule Demo
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full mt-auto bg-background border-t border-border">
        <div className="flex flex-col sm:flex-row justify-between items-center py-12 px-4 sm:px-16 w-full max-w-[1440px] mx-auto gap-8">
          <div className="flex flex-col items-center sm:items-start gap-4">
            <span className="font-bold text-primary">RepoViz</span>
            <p className="text-[13px] text-muted-foreground">© 2024 RepoViz Inc. Precision Engineering.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a className="text-muted-foreground hover:text-primary underline transition-all text-[13px]" href="#">Documentation</a>
            <a className="text-muted-foreground hover:text-primary underline transition-all text-[13px]" href="#">API</a>
            <a className="text-muted-foreground hover:text-primary underline transition-all text-[13px]" href="#">Privacy</a>
            <a className="text-muted-foreground hover:text-primary underline transition-all text-[13px]" href="#">Status</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

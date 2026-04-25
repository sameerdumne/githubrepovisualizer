'use client'

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/hero-section'
import { ResultsSection } from '@/components/results-section'
import { RepositoryData, AnalysisResult } from '@/lib/api/repository-analysis'

export default function Home() {
  const [showResults, setShowResults] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [repoData, setRepoData] = useState<RepositoryData | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  const handleAnalyze = async (url: string) => {
    setRepoUrl(url)
    setIsLoading(true)
    setError(null)

    try {
      // Call API route which has access to GITHUB_TOKEN
      // Set a 310 second timeout (API has 300 second max)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 310000)

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ repoUrl: url }),
          signal: controller.signal,
        })

        clearTimeout(timeout)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to analyze repository')
        }

        const { repoData: data, analysisResult: analysis } = await response.json()
        setRepoData(data)
        setAnalysisResult(analysis)
        setShowResults(true)
      } catch (fetchError) {
        clearTimeout(timeout)
        throw fetchError
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze repository'
      setError(errorMessage)
      console.error('Analysis error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setShowResults(false)
    setRepoUrl('')
    setIsLoading(false)
    setError(null)
    setRepoData(null)
    setAnalysisResult(null)
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {!showResults ? (
        <>
          <HeroSection onAnalyze={handleAnalyze} isLoading={isLoading} />
          
          {error && (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-300">
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
                <h3 className="text-lg font-semibold text-destructive mb-2">Error Analyzing Repository</h3>
                <p className="text-sm text-destructive/80">{error}</p>
                <button
                  onClick={handleReset}
                  className="mt-4 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 animate-in fade-in duration-300">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 border-3 border-muted rounded-full" />
                  <div className="absolute inset-0 border-3 border-transparent border-t-primary border-r-primary rounded-full animate-spin" />
                </div>
                <p className="text-lg text-muted-foreground font-medium">Analyzing repository...</p>
                <p className="text-sm text-muted-foreground/60 mt-2">Fetching data and running AI analysis</p>
              </div>
            </div>
          )}
        </>
      ) : repoData && analysisResult ? (
        <div className="animate-in fade-in duration-300">
          <ResultsSection 
            repoUrl={repoUrl} 
            repoData={repoData}
            analysisResult={analysisResult}
            onReset={handleReset}
          />
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex justify-center">
            <button
              onClick={handleReset}
              className="px-6 py-2.5 text-sm font-medium rounded-lg border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-200 active:scale-95"
            >
              Analyze Another Repository
            </button>
          </div>
        </div>
      ) : null}
    </main>
  )
}

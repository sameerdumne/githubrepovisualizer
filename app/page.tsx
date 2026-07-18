'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/hero-section'
import { ResultsSection } from '@/components/results-section'
import { RepositoryData, AnalysisResult } from '@/lib/api/repository-analysis'

function HomeContent() {
  const searchParams = useSearchParams()
  const analyzedQueryRepo = useRef<string | null>(null)
  const loadedHistoryItem = useRef<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCachedResult, setIsCachedResult] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [repoData, setRepoData] = useState<RepositoryData | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  const handleAnalyze = async (url: string) => {
    setRepoUrl(url)
    setIsLoading(true)
    setIsCachedResult(false)
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

        const { repoData: data, analysisResult: analysis, cached } = await response.json()
        setRepoData(data)
        setAnalysisResult(analysis)
        setIsCachedResult(Boolean(cached))
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
    setIsCachedResult(false)
    setError(null)
    setRepoData(null)
    setAnalysisResult(null)
  }

  const handleLoadHistoryItem = async (historyId: string) => {
    setIsLoading(true)
    setIsCachedResult(false)
    setError(null)

    try {
      const response = await fetch(`/api/history/${encodeURIComponent(historyId)}`, {
        cache: 'no-store',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load saved analysis')
      }

      setRepoUrl(data.repoUrl)
      setRepoData(data.repoData)
      setAnalysisResult(data.analysisResult)
      setIsCachedResult(true)
      setShowResults(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load saved analysis'
      setError(errorMessage)
      console.error('History load error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const historyId = searchParams.get('historyId')
    if (historyId && loadedHistoryItem.current !== historyId) {
      loadedHistoryItem.current = historyId
      handleLoadHistoryItem(historyId)
      return
    }

    const queryRepoUrl = searchParams.get('repoUrl')
    if (!queryRepoUrl || analyzedQueryRepo.current === queryRepoUrl) {
      return
    }

    analyzedQueryRepo.current = queryRepoUrl
    handleAnalyze(queryRepoUrl)
  }, [searchParams])

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {!showResults ? (
        <>
          <HeroSection onAnalyze={handleAnalyze} isLoading={isLoading} />
          
          {error && (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-300">
              <div className="border border-destructive/50 bg-destructive/10 p-6">
                <h3 className="text-[14px] font-semibold text-destructive mb-2 uppercase tracking-[0.05em]">Error Analyzing Repository</h3>
                <p className="text-[16px] text-destructive/80">{error}</p>
                <button
                  onClick={handleReset}
                  className="mt-4 px-6 py-3 bg-destructive text-destructive-foreground text-[14px] font-medium uppercase tracking-[0.05em] hover:opacity-90 transition-opacity"
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
                  <div className="absolute inset-0 border-3 border-muted" />
                  <div className="absolute inset-0 border-3 border-transparent border-t-primary border-r-primary animate-spin" />
                </div>
                <p className="text-[14px] text-muted-foreground font-medium uppercase tracking-[0.05em]">Analyzing repository...</p>
                <p className="text-[13px] text-muted-foreground/60 mt-2 font-mono">Fetching data and running AI analysis</p>
              </div>
            </div>
          )}
        </>
      ) : repoData && analysisResult ? (
        <div className="animate-in fade-in duration-300">
          {isCachedResult && (
            <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
              <div className="border border-primary/30 bg-primary/10 px-4 py-3 text-[13px] text-primary uppercase tracking-[0.05em]">
                Loaded from your saved analysis history.
              </div>
            </div>
          )}
          <ResultsSection 
            repoUrl={repoUrl} 
            repoData={repoData}
            analysisResult={analysisResult}
            onReset={handleReset}
          />
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex justify-center">
            <button
              onClick={handleReset}
              className="px-6 py-3 text-[14px] font-medium uppercase tracking-[0.05em] border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-200 active:scale-95"
            >
              Analyze Another Repository
            </button>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background"><Navbar /></main>}>
      <HomeContent />
    </Suspense>
  )
}

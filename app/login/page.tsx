"use client"

import { useEffect, useState } from "react"
import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ExternalLink, GitFork, Loader2, Star } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { GitHubIcon } from "@/components/github-icon"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"

interface GitHubRepositorySummary {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  cloneUrl: string;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  updatedAt: string;
  private: boolean;
}

function getErrorMessage(error: string | null) {
  if (!error) {
    return null
  }

  const messages: Record<string, string> = {
    github_config: "GitHub OAuth is not configured on this server.",
    oauth_state: "GitHub login could not be verified. Please try again.",
    oauth_exchange: "GitHub did not return a valid access token. Please try again.",
    github_user: "Could not fetch your GitHub profile. Please try again.",
  }

  return messages[error] || "GitHub login failed. Please try again."
}

function LoginPageContent() {
  const { user, isLoading, loginWithGitHub } = useAuth()
  const searchParams = useSearchParams()
  const [repos, setRepos] = useState<GitHubRepositorySummary[]>([])
  const [reposLoading, setReposLoading] = useState(false)
  const [reposError, setReposError] = useState<string | null>(null)
  const loginError = getErrorMessage(searchParams.get("error"))

  useEffect(() => {
    if (!user) {
      setRepos([])
      return
    }

    let cancelled = false

    async function loadRepos() {
      setReposLoading(true)
      setReposError(null)

      try {
        const response = await fetch("/api/github/repos", {
          cache: "no-store",
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || "Failed to load repositories")
        }

        const data = await response.json()
        if (!cancelled) {
          setRepos(data.repos || [])
        }
      } catch (error) {
        if (!cancelled) {
          setReposError(error instanceof Error ? error.message : "Failed to load repositories")
        }
      } finally {
        if (!cancelled) {
          setReposLoading(false)
        }
      }
    }

    loadRepos()

    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {!user && (
          <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-6 text-center sm:p-8">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-blue-400">
              <GitHubIcon size="lg" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Login with GitHub</h1>
            <p className="mt-3 text-muted-foreground">
              Connect your GitHub account to view and analyze your public repositories.
            </p>

            {loginError && (
              <div className="mt-5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {loginError}
              </div>
            )}

            <Button
              size="lg"
              onClick={loginWithGitHub}
              disabled={isLoading}
              className="mt-6 w-full sm:w-auto"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <span className="mr-2">
                  <GitHubIcon size="sm" />
                </span>
              )}
              Continue with GitHub
            </Button>
          </div>
        )}

        {user && (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Logged in as @{user.login}</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Your public repositories
                </h1>
              </div>
              <Button variant="outline" asChild>
                <a href={user.htmlUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  GitHub profile
                </a>
              </Button>
            </div>

            {reposLoading && (
              <div className="flex items-center justify-center rounded-lg border border-border bg-card py-16 text-muted-foreground">
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Loading repositories...
              </div>
            )}

            {reposError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-5 text-destructive">
                {reposError}
              </div>
            )}

            {!reposLoading && !reposError && repos.length === 0 && (
              <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                No public repositories were found for this GitHub account.
              </div>
            )}

            {!reposLoading && repos.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {repos.map((repo) => (
                  <Card key={repo.id} className="flex flex-col">
                    <CardHeader className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="truncate text-lg">{repo.name}</CardTitle>
                          <CardDescription className="truncate">{repo.fullName}</CardDescription>
                        </div>
                        {repo.language && <Badge variant="secondary">{repo.language}</Badge>}
                      </div>
                      <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
                        {repo.description || "No description provided."}
                      </p>
                    </CardHeader>
                    <CardContent className="mt-auto space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          {repo.stargazersCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <GitFork className="h-4 w-4" />
                          {repo.forksCount}
                        </span>
                        <span>{new Date(repo.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild className="flex-1">
                          <Link href={`/?repoUrl=${encodeURIComponent(repo.htmlUrl)}`}>
                            Analyze
                          </Link>
                        </Button>
                        <Button variant="outline" size="icon" asChild>
                          <a href={repo.htmlUrl} target="_blank" rel="noreferrer" aria-label={`Open ${repo.fullName} on GitHub`}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background"><Navbar /></main>}>
      <LoginPageContent />
    </Suspense>
  )
}

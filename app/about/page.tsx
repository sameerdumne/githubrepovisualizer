'use client'

import { Navbar } from '@/components/navbar'
import { Github, Zap, Eye } from 'lucide-react'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">About RepoViz</h1>
          <p className="text-xl text-muted-foreground">
            A developer tool for understanding and analyzing GitHub repositories visually
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">What is RepoViz?</h2>
            <p className="text-foreground leading-relaxed">
              RepoViz is a modern web application that helps developers understand complex GitHub repositories
              at a glance. Simply paste a repository URL, and we&apos;ll generate an interactive visualization of
              the entire codebase structure, complete with insights about organization, file structure, and
              potential improvements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Why RepoViz?</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Eye className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Visual Understanding</h3>
                  <p className="text-muted-foreground">
                    Quickly grasp the structure and organization of any codebase with an interactive tree view
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Zap className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Smart Insights</h3>
                  <p className="text-muted-foreground">
                    Get recommendations on code organization, file distribution, and structural improvements
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Github className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">GitHub Integration</h3>
                  <p className="text-muted-foreground">
                    Connect directly with GitHub repositories to analyze public and private projects
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Features</h2>
            <ul className="space-y-2 text-foreground">
              <li className="flex items-start gap-3">
                <span className="text-blue-400 font-bold mt-1">•</span>
                <span>Interactive directory tree visualization with expand/collapse functionality</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 font-bold mt-1">•</span>
                <span>Real-time code preview with syntax highlighting</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 font-bold mt-1">•</span>
                <span>Repository statistics (file count, folder depth, structure quality)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 font-bold mt-1">•</span>
                <span>Intelligent insights and warnings about code organization</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 font-bold mt-1">•</span>
                <span>Analysis history to track reviewed repositories</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">How to Use</h2>
            <ol className="space-y-2 text-foreground list-decimal list-inside">
              <li>Paste any GitHub repository URL in the input field</li>
              <li>Click "Analyze Repo" to start the analysis</li>
              <li>Explore the interactive directory tree on the left</li>
              <li>Review insights and recommendations on the right</li>
              <li>Click on files to preview their contents</li>
            </ol>
          </section>
        </div>
      </div>
    </main>
  )
}

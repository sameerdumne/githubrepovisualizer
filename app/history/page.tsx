'use client'

import { Navbar } from '@/components/navbar'
import { HistoryPage } from '@/components/history-page'

export default function HistoryRoute() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HistoryPage />
    </main>
  )
}

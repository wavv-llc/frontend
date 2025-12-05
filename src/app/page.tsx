'use client'

import { useAuth } from '@clerk/nextjs'
import { LandingPage } from '@/components/landing/LandingPage'
import { DashboardSection } from '@/components/dashboard/DashboardSection'
import { AssistantSection } from '@/components/assistant/AssistantSection'

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <LandingPage />
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex h-screen">

        <div className="w-1/2 bg-background border-r border-border overflow-hidden">
          <DashboardSection />
        </div>

        <div className="w-1/2 bg-background overflow-hidden">
          <AssistantSection />
        </div>
      </div>
    </div>
  )
}

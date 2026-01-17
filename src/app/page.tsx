'use client'

import { useAuth } from '@clerk/nextjs'
import { LandingPage } from '@/components/landing/LandingPage'
import { AssistantSection } from '@/components/assistant/AssistantSection'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

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
    <DashboardLayout>
      <AssistantSection />
    </DashboardLayout>
  )
}

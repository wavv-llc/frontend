'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { LandingPage } from '@/components/landing/LandingPage'
import { DashboardSection } from '@/components/dashboard/DashboardSection'
import { AssistantSection } from '@/components/assistant/AssistantSection'
import { AppSidebar } from '@/components/assistant/AppSidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { userApi } from '@/lib/api'

export default function Home() {
  const { isSignedIn, isLoaded, getToken } = useAuth()

  // Sync user to database after sign-in and check onboarding status
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    const syncUser = async () => {
      try {
        const token = await getToken()
        if (!token) return

        // This call creates/updates the user in the database
        const response = await userApi.getMe(token)
        
        // Check if user has completed onboarding
        if (response.data && !response.data.hasCompletedOnboarding) {
          // Redirect to onboarding if not completed
          window.location.href = '/onboarding'
          return
        }
      } catch (error) {
        console.error('Error syncing user to database:', error)
      }
    }

    syncUser()
  }, [isLoaded, isSignedIn, getToken])

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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-screen flex-col">
          <div className="flex-1 overflow-hidden">
            <AssistantSection />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

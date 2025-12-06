'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { LandingPage } from '@/components/landing/LandingPage'
import { AssistantSection } from '@/components/assistant/AssistantSection'
import { AppSidebar } from '@/components/assistant/AppSidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { userApi } from '@/lib/api'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { isSignedIn, isLoaded, getToken } = useAuth()
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setCheckingOnboarding(false)
      return
    }

    const checkOnboarding = async () => {
      try {
        const token = await getToken()
        if (!token) {
          setCheckingOnboarding(false)
          return
        }

        const response = await userApi.getMe(token)
        if (response.success && response.data) {
          const user = response.data
          
          // Check if user needs to complete onboarding
          if (!user.firstName || !user.lastName) {
            router.push('/onboarding/name')
            return
          }
        }
      } catch (err) {
        console.error('Error checking onboarding:', err)
      } finally {
        setCheckingOnboarding(false)
      }
    }

    checkOnboarding()
  }, [isLoaded, isSignedIn, getToken, router])

  if (!isLoaded || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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

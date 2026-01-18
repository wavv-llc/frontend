'use client'

import { useAuth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { LandingPage } from '@/components/landing/LandingPage'

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (isSignedIn) {
    redirect('/home')
  }

  return <LandingPage />
}

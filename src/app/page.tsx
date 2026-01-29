'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { LandingPage } from '@/components/landing/LandingPage'

export default function Home() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/home')
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return <LandingPage />
}

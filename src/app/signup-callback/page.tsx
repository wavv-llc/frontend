'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { userApi } from '@/lib/api'
import { toast } from 'sonner'

export default function SignupCallbackPage() {
  const { isLoaded, isSignedIn, getToken, userId } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const hasCalledApi = useRef(false)

  useEffect(() => {
    // Only proceed when Clerk is loaded and user is signed in
    if (!isLoaded || !isSignedIn || !userId) {
      return
    }

    // Prevent multiple calls using ref (survives re-renders and strict mode)
    if (hasCalledApi.current) {
      return
    }

    const createUserInCoreAPI = async () => {
      try {
        hasCalledApi.current = true

        // Get the authentication token
        const token = await getToken()
        if (!token) {
          throw new Error('Failed to get authentication token')
        }

        // Create user in Core API with Clerk ID
        console.log('Creating user in Core API with Clerk ID:', userId)
        await userApi.createUser(token, userId)

        console.log('User created successfully, redirecting to onboarding...')
        // Redirect to onboarding page
        router.push('/onboarding')
      } catch (err) {
        console.error('Error creating user in Core API:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to create user account'
        setError(errorMessage)
        toast.error(errorMessage)

        // If user creation fails, still redirect to onboarding after a delay
        // The onboarding page will retry fetching user info
        setTimeout(() => {
          router.push('/onboarding')
        }, 3000)
      }
    }

    createUserInCoreAPI()
  }, [isLoaded, isSignedIn, userId, getToken, router])

  // Show loading state while waiting for Clerk or creating user
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      {error ? (
        <>
          <div className="text-destructive text-center">
            <p className="font-semibold">Error creating account</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </>
      ) : (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="font-medium">Setting up your account...</p>
            <p className="text-sm text-muted-foreground mt-1">Please wait while we create your profile</p>
          </div>
        </>
      )}
    </div>
  )
}

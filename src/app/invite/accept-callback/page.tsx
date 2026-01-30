'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import { userApi, accessLinkApi } from '@/lib/api'
import { toast } from 'sonner'

export default function InviteAcceptCallbackPage() {
  const { isLoaded, isSignedIn, getToken, userId } = useAuth()
  const { user } = useUser()
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('Processing invitation...')
  const hasCalledApi = useRef(false)
  const isRedirecting = useRef(false)

  const redirect = useCallback((path: string) => {
    if (isRedirecting.current) return
    isRedirecting.current = true
    window.location.href = path
  }, [])

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || !user) {
      return
    }

    if (hasCalledApi.current) {
      return
    }

    hasCalledApi.current = true

    const handleInviteAccept = async () => {
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('Failed to get authentication token')
        }

        const pendingAccessLinkId = sessionStorage.getItem('pendingAccessLinkId')
        const pendingAccessLinkEmail = sessionStorage.getItem('pendingAccessLinkEmail')

        if (!pendingAccessLinkId) {
          setError('No pending invitation found.')
          toast.error('No pending invitation found.')
          setTimeout(() => redirect('/home'), 3000)
          return
        }

        // Validate email matches
        if (pendingAccessLinkEmail) {
          const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase()
          const inviteEmail = pendingAccessLinkEmail.toLowerCase()

          if (userEmail !== inviteEmail) {
            sessionStorage.removeItem('pendingAccessLinkId')
            sessionStorage.removeItem('pendingAccessLinkEmail')

            const errorMsg = `You signed in with ${userEmail}, but the invite was sent to ${inviteEmail}. Please sign in with the correct email address.`
            setError(errorMsg)
            toast.error(errorMsg)

            setTimeout(() => redirect('/sign-in'), 5000)
            return
          }
        }

        // Check if user exists, create if not
        setStatusMessage('Setting up your account...')
        let userExists = false

        try {
          const existingUser = await userApi.getMe(token)
          if (existingUser.data) {
            userExists = true
          }
        } catch {
          console.log('User not found in Core API, will create new user')
        }

        if (!userExists) {
          setStatusMessage('Creating your account...')
          await userApi.createUser(token, userId)
        }

        // Accept the invitation
        setStatusMessage('Accepting invitation...')
        await accessLinkApi.acceptAccessLink(token, pendingAccessLinkId, {
          email: user.primaryEmailAddress?.emailAddress || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          clerkId: userId,
        })

        // Clear session storage
        sessionStorage.removeItem('pendingAccessLinkId')
        sessionStorage.removeItem('pendingAccessLinkEmail')

        toast.success('Invitation accepted successfully!')
        redirect('/home')
      } catch (err) {
        console.error('Error accepting invitation:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to accept invitation'
        setError(errorMessage)
        toast.error(errorMessage)
        setTimeout(() => redirect('/home'), 3000)
      }
    }

    handleInviteAccept()
  }, [isLoaded, isSignedIn, userId, user, getToken, redirect])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      {error ? (
        <div className="text-center">
          <div className="text-destructive">
            <p className="font-semibold">Error accepting invitation</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <p className="text-sm text-muted-foreground mt-4">Redirecting...</p>
        </div>
      ) : (
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="font-medium mt-4">{statusMessage}</p>
          <p className="text-sm text-muted-foreground mt-1">Please wait while we process your invitation</p>
        </div>
      )}
    </div>
  )
}

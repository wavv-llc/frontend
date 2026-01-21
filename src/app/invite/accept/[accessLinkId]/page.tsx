'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth, useUser, SignUp } from '@clerk/nextjs'
import { Loader2, AlertCircle, CheckCircle2, Mail } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AppBar } from '@/components/AppBar'
import { accessLinkApi, AccessLink } from '@/lib/api'
import { toast } from 'sonner'

type InviteStatus = 'loading' | 'valid' | 'invalid' | 'expired' | 'already_used' | 'error'

export default function InviteAcceptPage() {
  const params = useParams()
  const router = useRouter()
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user } = useUser()

  const accessLinkId = params.accessLinkId as string

  const [status, setStatus] = useState<InviteStatus>('loading')
  const [accessLink, setAccessLink] = useState<AccessLink | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isAccepting, setIsAccepting] = useState(false)

  // Validate access link on mount
  useEffect(() => {
    const validateAccessLink = async () => {
      try {
        const response = await accessLinkApi.getAccessLink(accessLinkId)

        if (!response.data) {
          setStatus('invalid')
          setErrorMessage('This invite link is invalid.')
          return
        }

        const link = response.data
        setAccessLink(link)

        // Check if link is active
        if (!link.active) {
          setStatus('already_used')
          setErrorMessage('This invite link has already been used.')
          return
        }

        // Check if link has expired
        if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
          setStatus('expired')
          setErrorMessage('This invite link has expired.')
          return
        }

        setStatus('valid')

        // Store accessLinkId for the callback to use
        sessionStorage.setItem('pendingAccessLinkId', accessLinkId)
        sessionStorage.setItem('pendingAccessLinkEmail', link.email)
      } catch (err) {
        console.error('Error validating access link:', err)
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : 'Failed to validate invite link.')
      }
    }

    validateAccessLink()
  }, [accessLinkId])

  // Handle case where user is already signed in
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || status !== 'valid' || !accessLink) {
      return
    }

    // Check if the signed-in user's email matches the invite email
    const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase()
    const inviteEmail = accessLink.email.toLowerCase()

    if (userEmail !== inviteEmail) {
      toast.error(`You must sign in with ${accessLink.email} to accept this invite.`)
      return
    }

    // Auto-accept the invite for already signed-in users
    const acceptInvite = async () => {
      setIsAccepting(true)
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('Failed to get authentication token')
        }

        await accessLinkApi.acceptAccessLink(token, accessLinkId)

        // Clear the stored access link data
        sessionStorage.removeItem('pendingAccessLinkId')
        sessionStorage.removeItem('pendingAccessLinkEmail')

        toast.success('Invite accepted successfully!')
        router.push('/dashboard')
      } catch (err) {
        console.error('Error accepting invite:', err)
        toast.error(err instanceof Error ? err.message : 'Failed to accept invite')
        setIsAccepting(false)
      }
    }

    acceptInvite()
  }, [isLoaded, isSignedIn, user, status, accessLink, accessLinkId, getToken, router])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Validating invite...</p>
      </div>
    )
  }

  // Error states
  if (status !== 'valid') {
    return (
      <div className="bg-background text-foreground" style={{ backgroundColor: 'hsl(42, 50%, 88%)', minHeight: '100vh' }}>
        <AppBar navItems={[]} showLoginLink={false} showContactButton={false} />

        <section className="relative w-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
          <div className="max-w-md mx-auto px-4 w-full py-12">
            <Card className="bg-background border-border shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <AlertCircle className="h-16 w-16 text-destructive" />
                </div>
                <h1 className="font-serif text-2xl font-bold text-foreground mb-2">
                  {status === 'invalid' && 'Invalid Invite'}
                  {status === 'expired' && 'Invite Expired'}
                  {status === 'already_used' && 'Invite Already Used'}
                  {status === 'error' && 'Something Went Wrong'}
                </h1>
                <p className="text-muted-foreground mb-6">{errorMessage}</p>
                <button
                  onClick={() => router.push('/')}
                  className="bg-[#3b4a5f] hover:bg-[#3b4a5f]/90 text-white px-6 py-2 rounded-md transition-colors"
                >
                  Go to Homepage
                </button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    )
  }

  // If user is signed in and accepting invite
  if (isSignedIn && isAccepting) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Accepting invite...</p>
      </div>
    )
  }

  // If user is signed in but email doesn't match
  if (isSignedIn && user) {
    const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase()
    const inviteEmail = accessLink?.email.toLowerCase()

    if (userEmail !== inviteEmail) {
      return (
        <div className="bg-background text-foreground" style={{ backgroundColor: 'hsl(42, 50%, 88%)', minHeight: '100vh' }}>
          <AppBar navItems={[]} showLoginLink={false} showContactButton={false} />

          <section className="relative w-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
            <div className="max-w-md mx-auto px-4 w-full py-12">
              <Card className="bg-background border-border shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <AlertCircle className="h-16 w-16 text-amber-500" />
                  </div>
                  <h1 className="font-serif text-2xl font-bold text-foreground mb-2">
                    Email Mismatch
                  </h1>
                  <p className="text-muted-foreground mb-4">
                    You are currently signed in as <strong>{userEmail}</strong>.
                  </p>
                  <p className="text-muted-foreground mb-6">
                    This invite was sent to <strong>{accessLink?.email}</strong>. Please sign out and sign in with the correct account.
                  </p>
                  <button
                    onClick={() => router.push('/sign-in')}
                    className="bg-[#3b4a5f] hover:bg-[#3b4a5f]/90 text-white px-6 py-2 rounded-md transition-colors"
                  >
                    Sign In with Correct Account
                  </button>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      )
    }
  }

  // Valid invite - show sign up form
  return (
    <div className="bg-background text-foreground selection:bg-primary/20 selection:text-primary-foreground" style={{ backgroundColor: 'hsl(42, 50%, 88%)', minHeight: '100vh' }}>
      <AppBar navItems={[]} showLoginLink={false} showContactButton={false} />

      <section className="relative w-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 w-full py-12">
          {/* Invite Info Card */}
          <Card className="bg-background border-border shadow-lg mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <h2 className="font-serif text-xl font-bold text-foreground">
                  You&apos;re Invited!
                </h2>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Invite sent to: <strong className="text-foreground">{accessLink?.email}</strong></span>
                </div>
                {accessLink?.project && (
                  <div className="text-muted-foreground">
                    Project: <strong className="text-foreground">{accessLink.project.name}</strong>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-amber-800 text-sm">
                  <strong>Important:</strong> You must sign up using a Microsoft account with the email address <strong>{accessLink?.email}</strong>.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sign Up Card */}
          <Card className="bg-background border-border shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="mb-4 text-center">
                <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
                  Accept Invitation
                </h1>
                <p className="font-sans text-sm text-muted-foreground">
                  Sign up with Microsoft to join
                </p>
              </div>
              <div className="flex justify-center">
                <SignUp
                  forceRedirectUrl="/signup-callback"
                  initialValues={{
                    emailAddress: accessLink?.email || '',
                  }}
                  appearance={{
                    elements: {
                      rootBox: "w-full flex justify-center",
                      card: "!shadow-none !border-none !bg-transparent !w-full !max-w-none !p-0",
                      cardBox: "!bg-transparent w-full flex justify-center",
                      header: "hidden",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      main: "!bg-transparent w-full flex justify-center",
                      main__body: "!bg-transparent w-full flex flex-col items-center !mt-0",
                      formButtonPrimary: "bg-[#3b4a5f] hover:bg-[#3b4a5f]/90 text-white shadow-sm hover:shadow-md transition-all !border-none w-full",
                      socialButtonsBlockButton: "border-border hover:bg-muted/30 transition-colors !bg-background w-full !mt-0",
                      socialButtons: "!mt-0 w-full",
                      socialButtonsBlockButtonText: "text-foreground",
                      formFieldInput: "border-border focus:border-[#1e293b] focus:ring-[#1e293b] !bg-background w-full",
                      formFieldLabel: "text-foreground font-medium",
                      formField: "w-full",
                      form: "w-full flex flex-col items-center",
                      identityPreview: "!bg-transparent border-border w-full",
                      identityPreviewText: "text-foreground",
                      identityPreviewEditButton: "text-[#1e293b] hover:text-[#1e293b]/80",
                      footerAction: "hidden",
                      footerActionLink: "hidden",
                      footerActionText: "hidden",
                      dividerLine: "bg-border",
                      dividerText: "text-muted-foreground text-xs",
                      formResendCodeLink: "text-[#1e293b] hover:text-[#1e293b]/80",
                      alertText: "text-foreground",
                      formHeaderTitle: "font-serif text-2xl font-bold text-foreground",
                      formHeaderSubtitle: "font-sans text-sm text-muted-foreground",
                      footer: "hidden",
                      footerPages: "hidden",
                      footerPagesLink: "hidden",
                      formFieldInputShowPasswordButton: "text-[#1e293b] hover:text-[#1e293b]/80"
                    },
                    layout: {
                      socialButtonsPlacement: "top",
                      showOptionalFields: false
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

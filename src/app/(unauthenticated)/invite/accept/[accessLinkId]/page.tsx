'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth, useUser, SignUp } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, CheckCircle2, Mail, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { accessLinkApi, AccessLink } from '@/lib/api'
import { toast } from 'sonner'
import { InviteSkeleton } from '@/components/skeletons/InviteSkeleton'

type InviteStatus = 'loading' | 'valid' | 'invalid' | 'expired' | 'already_used' | 'error'

function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-serif italic text-lg pr-0.5">w</span>
          </div>
          wavv
        </Link>
      </div>
    </nav>
  )
}

function BackgroundMesh() {
  return (
    <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/30 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
      <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-muted/20 rounded-full blur-[100px] animate-pulse-slow delay-700" />
    </div>
  )
}

export default function InviteAcceptPage() {
  const params = useParams()
  const router = useRouter()
  const { isLoaded, isSignedIn, getToken, userId } = useAuth()
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
        console.log('🔍 GET /api/v1/access-links - Request:', {
          accessLinkId,
          endpoint: `/api/v1/access-links/${accessLinkId}`
        })

        const response = await accessLinkApi.getAccessLink(accessLinkId)

        console.log('✅ GET /api/v1/access-links - Response:', response)

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
        console.error('❌ GET /api/v1/access-links - Error:', err)
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

        const requestData = {
          email: user.primaryEmailAddress?.emailAddress || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          clerkId: userId!,
        }

        console.log('📤 POST /api/v1/access-links/accept - Request:', {
          endpoint: `/api/v1/access-links/${accessLinkId}/accept`,
          data: requestData,
          hasToken: !!token
        })

        const response = await accessLinkApi.acceptAccessLink(token, accessLinkId, requestData)

        console.log('✅ POST /api/v1/access-links/accept - Response:', response)

        // Clear the stored access link data
        sessionStorage.removeItem('pendingAccessLinkId')
        sessionStorage.removeItem('pendingAccessLinkEmail')

        toast.success('Invite accepted successfully!')
        router.push('/home')
      } catch (err) {
        console.error('❌ POST /api/v1/access-links/accept - Error:', err)
        toast.error(err instanceof Error ? err.message : 'Failed to accept invite')
        setIsAccepting(false)
      }
    }

    acceptInvite()
  }, [isLoaded, isSignedIn, user, status, accessLink, accessLinkId, getToken, router, userId])

  // Loading state
  if (status === 'loading' || (isSignedIn && isAccepting)) {
    return <InviteSkeleton />
  }

  // Error states
  if (status !== 'valid') {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
        <BackgroundMesh />
        <Navigation />

        <section className="relative z-10 pt-32 pb-20 min-h-screen flex items-center justify-center">
          <div className="max-w-xl mx-auto px-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-destructive/10 blur-[60px] rounded-full" />
              <div className="relative bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-10 md:p-12 text-center shadow-xl">
                <div className="flex justify-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-4">
                  {status === 'invalid' && 'Invalid Invite'}
                  {status === 'expired' && 'Invite Expired'}
                  {status === 'already_used' && 'Invite Already Used'}
                  {status === 'error' && 'Something Went Wrong'}
                </h1>
                <p className="text-muted-foreground text-lg mb-10">{errorMessage}</p>
                <Link href="/">
                  <Button className="rounded-full h-11 px-8 shadow-lg">
                    Go to Homepage
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    )
  }

  // If user is signed in but email doesn't match
  if (isSignedIn && user) {
    const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase()
    const inviteEmail = accessLink?.email.toLowerCase()

    if (userEmail !== inviteEmail) {
      return (
        <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
          <BackgroundMesh />
          <Navigation />

          <section className="relative z-10 pt-32 pb-20 min-h-screen flex items-center justify-center">
            <div className="max-w-xl mx-auto px-6 w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-amber-500/10 blur-[60px] rounded-full" />
                <div className="relative bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-10 md:p-12 text-center shadow-xl">
                  <div className="flex justify-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <AlertCircle className="h-10 w-10 text-amber-500" />
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-4">
                    Email Mismatch
                  </h1>
                  <p className="text-muted-foreground text-lg mb-2">
                    You are currently signed in as
                  </p>
                  <p className="text-foreground font-semibold text-lg mb-5">{userEmail}</p>
                  <p className="text-muted-foreground text-lg mb-2">
                    This invite was sent to
                  </p>
                  <p className="text-foreground font-semibold text-lg mb-6">{accessLink?.email}</p>
                  <p className="text-muted-foreground mb-10">
                    Please sign out and sign in with the correct account.
                  </p>
                  <Link href="/sign-in">
                    <Button className="rounded-full h-11 px-8 shadow-lg">
                      Sign In with Correct Account
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>
        </div>
      )
    }
  }

  // Valid invite - show sign up form
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 font-sans overflow-x-hidden">
      <BackgroundMesh />
      <Navigation />

      <section className="relative z-10 pt-32 pb-20 min-h-screen flex items-center justify-center">
        <div className="max-w-xl mx-auto px-6 w-full">
          {/* Invite Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-8 md:p-10 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Valid Invite</span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    You&apos;re Invited!
                  </h2>
                </div>
              </div>

              <div className="space-y-4 text-base">
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

              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-amber-600 dark:text-amber-400 text-sm leading-relaxed">
                  <strong>Important:</strong> You must sign up using a Microsoft account with the email address <strong>{accessLink?.email}</strong>.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Sign Up Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-primary/10 blur-[60px] rounded-full" />
            <div className="relative bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-8 md:p-12 shadow-xl">
              <div className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                  Accept Invitation
                </h1>
              </div>
              <div className="flex justify-center">
                <SignUp
                  forceRedirectUrl="/invite/callback"
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
                      formButtonPrimary: "!bg-primary hover:!bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all !border-none w-full !rounded-full !h-11",
                      socialButtonsBlockButton: "border-border hover:bg-muted/30 transition-colors !bg-background/50 w-full !mt-0 !rounded-full !h-11",
                      // Hide non-Microsoft OAuth providers for invite flow
                      socialButtonsBlockButton__google: "!hidden",
                      socialButtonsBlockButton__apple: "!hidden",
                      socialButtonsBlockButton__github: "!hidden",
                      socialButtonsBlockButton__facebook: "!hidden",
                      socialButtonsBlockButton__twitter: "!hidden",
                      socialButtonsBlockButton__linkedin: "!hidden",
                      socialButtons: "!mt-0 w-full",
                      socialButtonsBlockButtonText: "text-foreground",
                      formFieldInput: "border-border focus:border-primary focus:ring-primary !bg-background/50 w-full !rounded-xl",
                      formFieldLabel: "text-foreground font-medium",
                      formField: "w-full",
                      form: "w-full flex flex-col items-center",
                      identityPreview: "!bg-transparent border-border w-full",
                      identityPreviewText: "text-foreground",
                      identityPreviewEditButton: "text-primary hover:text-primary/80",
                      footerAction: "hidden",
                      footerActionLink: "hidden",
                      footerActionText: "hidden",
                      dividerLine: "bg-border",
                      dividerText: "text-muted-foreground text-xs",
                      formResendCodeLink: "text-primary hover:text-primary/80",
                      alertText: "text-foreground",
                      formHeaderTitle: "text-2xl font-bold text-foreground",
                      formHeaderSubtitle: "text-sm text-muted-foreground",
                      footer: "hidden",
                      footerPages: "hidden",
                      footerPagesLink: "hidden",
                      formFieldInputShowPasswordButton: "text-primary hover:text-primary/80"
                    },
                    layout: {
                      socialButtonsPlacement: "top",
                      showOptionalFields: false
                    }
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

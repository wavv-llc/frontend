'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { userApi, connectionApi } from '@/lib/api'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

export default function OnboardingConnectionsPage() {
  const router = useRouter()
  const { getToken, isLoaded } = useAuth()
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [hasSharePoint, setHasSharePoint] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    const checkConnections = async () => {
      try {
        const token = await getToken()
        if (!token) {
          router.push('/')
          return
        }

        const response = await connectionApi.getConnections(token)
        if (response.success && response.data) {
          const sharepointConnection = response.data.find(
            (conn) => conn.type === 'SHAREPOINT' && conn.isActive
          )
          setHasSharePoint(!!sharepointConnection)
        }
      } catch (err) {
        console.error('Error checking connections:', err)
      } finally {
        setLoading(false)
      }
    }

    checkConnections()
  }, [isLoaded, getToken, router])

  const handleConnectSharePoint = async () => {
    setConnecting(true)
    setConnectionStatus('idle')

    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Open SharePoint OAuth in popup
      const width = 600
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      const popup = window.open(
        '/api/auth/sharepoint',
        'SharePoint Auth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      )

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.')
      }

      // Listen for message from popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return

        if (event.data.type === 'SHAREPOINT_AUTH_SUCCESS') {
          setConnectionStatus('success')
          setHasSharePoint(true)
          popup.close()
          window.removeEventListener('message', messageListener)

          // Redirect after 2 seconds
          setTimeout(() => {
            router.push('/')
          }, 2000)
        } else if (event.data.type === 'SHAREPOINT_AUTH_ERROR') {
          setConnectionStatus('error')
          popup.close()
          window.removeEventListener('message', messageListener)
        }
      }

      window.addEventListener('message', messageListener)

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', messageListener)
          if (connectionStatus === 'idle') {
            setConnecting(false)
          }
        }
      }, 500)
    } catch (err) {
      setConnectionStatus('error')
      setConnecting(false)
    }
  }

  const handleSkip = () => {
    router.push('/')
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Add a Connection</h1>
          <p className="text-sm text-muted-foreground">
            Connect your services to get started. You can always add more later.
          </p>
        </div>

        <div className="space-y-4">
          {/* SharePoint Connection */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">SharePoint</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your SharePoint account
                </p>
              </div>
              {hasSharePoint && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>

            {connectionStatus === 'success' && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
                <CheckCircle2 className="h-4 w-4" />
                <span>Successfully connected! Redirecting...</span>
              </div>
            )}

            {connectionStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                <XCircle className="h-4 w-4" />
                <span>Connection failed. Please try again.</span>
              </div>
            )}

            {!hasSharePoint && (
              <Button
                onClick={handleConnectSharePoint}
                disabled={connecting}
                className="w-full"
                variant={hasSharePoint ? 'outline' : 'default'}
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect SharePoint'
                )}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSkip}
              variant="outline"
              className="flex-1"
              disabled={connecting}
            >
              Skip for now
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}


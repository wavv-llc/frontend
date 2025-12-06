'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { connectionApi } from '@/lib/api'
import { Loader2, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { AppSidebar } from '@/components/assistant/AppSidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

interface Connection {
  id: string
  type: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function SettingsPage() {
  const { getToken, isLoaded } = useAuth()
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (!isLoaded) return

    const loadConnections = async () => {
      try {
        const token = await getToken()
        if (!token) return

        const response = await connectionApi.getConnections(token)
        if (response.success && response.data) {
          setConnections(response.data)
        }
      } catch (err) {
        console.error('Error loading connections:', err)
      } finally {
        setLoading(false)
      }
    }

    loadConnections()
  }, [isLoaded, getToken])

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this connection?')) {
      return
    }

    setDeleting(connectionId)

    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      await connectionApi.deleteConnection(token, connectionId)
      
      // Remove from local state
      setConnections(connections.filter((conn) => conn.id !== connectionId))
    } catch (err) {
      console.error('Error deleting connection:', err)
      alert('Failed to delete connection')
    } finally {
      setDeleting(null)
    }
  }

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
          popup.close()
          window.removeEventListener('message', messageListener)

          // Reload connections
          const loadConnections = async () => {
            try {
              const token = await getToken()
              if (!token) return

              const response = await connectionApi.getConnections(token)
              if (response.success && response.data) {
                setConnections(response.data)
              }
            } catch (err) {
              console.error('Error loading connections:', err)
            }
          }
          loadConnections()
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

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const sharepointConnection = connections.find(
    (conn) => conn.type === 'SHAREPOINT' && conn.isActive
  )

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-screen flex-col">
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-semibold">Settings</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your account and connections
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Connections</CardTitle>
                  <CardDescription>
                    Connect your services to access your data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* SharePoint Connection */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">SharePoint</h3>
                        <p className="text-sm text-muted-foreground">
                          Connect your SharePoint account to access files
                        </p>
                      </div>
                      {sharepointConnection ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    {connectionStatus === 'success' && (
                      <div className="mb-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Successfully connected!</span>
                      </div>
                    )}

                    {connectionStatus === 'error' && (
                      <div className="mb-3 flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                        <XCircle className="h-4 w-4" />
                        <span>Connection failed. Please try again.</span>
                      </div>
                    )}

                    {sharepointConnection ? (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Connected as: {sharepointConnection.name}
                        </div>
                        <Button
                          onClick={() => handleDeleteConnection(sharepointConnection.id)}
                          variant="outline"
                          size="sm"
                          disabled={deleting === sharepointConnection.id}
                        >
                          {deleting === sharepointConnection.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Disconnecting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Disconnect
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={handleConnectSharePoint}
                        disabled={connecting}
                        className="w-full"
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}


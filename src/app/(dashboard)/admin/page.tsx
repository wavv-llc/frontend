'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { signupRequestApi } from '@/lib/api'

interface SignUpRequest {
  id: string
  name: string
  email: string
  organization: string
  message?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  updatedAt: string
}

export default function AdminPage() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<SignUpRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    loadRequests()
  }, [isLoaded, isSignedIn, router])

  const loadRequests = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await signupRequestApi.getAllRequests(token)
      if (response.data?.requests) {
        setRequests(response.data.requests)
      }
    } catch (err) {
      console.error('Error loading sign-up requests:', err)
      setError(err instanceof Error ? err.message : 'Failed to load sign-up requests')
    } finally {
      setIsLoading(false)
    }
  }

  const updateRequestStatus = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      setUpdatingId(requestId)
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      await signupRequestApi.updateRequestStatus(token, requestId, status)

      // Reload requests
      await loadRequests()
    } catch (err) {
      console.error('Error updating request status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update request status')
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium'
    switch (status) {
      case 'APPROVED':
        return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>Approved</span>
      case 'REJECTED':
        return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`}>Rejected</span>
      default:
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`}>Pending</span>
    }
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING')
  const otherRequests = requests.filter(r => r.status !== 'PENDING')

  return (

    <div className="h-full overflow-auto p-6 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage sign-up requests from potential users
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {requests.length} total request{requests.length !== 1 ? 's' : ''} • {pendingRequests.length} pending
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadRequests}
            disabled={isLoading}
          >
            <Loader2 className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Pending Requests</h2>
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{request.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {request.email} • {request.organization}
                        </CardDescription>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {request.message && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {request.message}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, 'REJECTED')}
                          disabled={updatingId === request.id}
                        >
                          {updatingId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Reject'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, 'APPROVED')}
                          disabled={updatingId === request.id}
                        >
                          {updatingId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Approve'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Other Requests */}
        {otherRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Processed Requests</h2>
            <div className="grid gap-4">
              {otherRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{request.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {request.email} • {request.organization}
                        </CardDescription>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {request.message && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {request.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {request.status === 'APPROVED' ? 'Approved' : 'Rejected'} on{' '}
                      {new Date(request.updatedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {requests.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No sign-up requests yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>

  )
}



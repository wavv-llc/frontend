'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { userApi } from '@/lib/api'

export default function OnboardingNamePage() {
  const router = useRouter()
  const { getToken, isLoaded } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!firstName.trim() || !lastName.trim()) {
      setError('Both first name and last name are required')
      return
    }

    setLoading(true)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Not authenticated')
      }

      await userApi.updateProfile(token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })

      // Redirect to connections page
      router.push('/onboarding/connections')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save name')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Add Your Name</h1>
          <p className="text-sm text-muted-foreground">
            Please provide your full name to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="firstName" className="text-sm font-medium">
              First Name
            </label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="lastName" className="text-sm font-medium">
              Last Name
            </label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !firstName.trim() || !lastName.trim()}
          >
            {loading ? 'Saving...' : 'Continue'}
          </Button>
        </form>
      </Card>
    </div>
  )
}


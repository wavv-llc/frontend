'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { sharepointApi, userApi } from '@/lib/api'

interface SharePointSite {
  id: string
  name: string
  displayName: string
  webUrl: string
  description?: string
}

export default function OnboardingPage() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const router = useRouter()
  const [sites, setSites] = useState<SharePointSite[]>([])
  const [selectedSiteIds, setSelectedSiteIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    // Check if user has already completed onboarding
    const checkOnboardingStatus = async () => {
      try {
        const token = await getToken()
        if (!token) return

        const response = await userApi.getMe(token)
        if (response.data?.hasCompletedOnboarding) {
          router.push('/')
          return
        }

        loadSites()
      } catch (err) {
        console.error('Error checking onboarding status:', err)
        loadSites()
      }
    }

    checkOnboardingStatus()
  }, [isLoaded, isSignedIn, router, getToken])

  const loadSites = async () => {
    try {
      setIsLoading(true)
      const token = await getToken()
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await sharepointApi.getSites(token)
      if (response.data?.sites) {
        setSites(response.data.sites)
      }
    } catch (err) {
      console.error('Error loading SharePoint sites:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to load SharePoint sites')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSite = (siteId: string) => {
    const newSelected = new Set(selectedSiteIds)
    if (newSelected.has(siteId)) {
      newSelected.delete(siteId)
    } else {
      newSelected.add(siteId)
    }
    setSelectedSiteIds(newSelected)
  }

  const handleFinish = async () => {
    if (selectedSiteIds.size === 0) {
      toast.error('Please select at least one SharePoint site')
      return
    }

    // Prevent double-clicks
    if (isSaving) {
      return
    }

    try {
      setIsSaving(true)
      const token = await getToken()
      if (!token) {
        toast.error('Authentication required')
        setIsSaving(false)
        return
      }

      const selectedSites = sites
        .filter(site => selectedSiteIds.has(site.id))
        .map(site => ({
          id: site.id,
          name: site.displayName || site.name,
          webUrl: site.webUrl,
        }))

      await sharepointApi.saveSelectedSites(token, selectedSites)

      // Mark onboarding as complete
      await userApi.completeOnboarding(token)

      // Redirect to dashboard - don't reset isSaving since we're leaving the page
      router.push('/')
    } catch (err) {
      console.error('Error saving selected sites:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to save selected sites')
      setIsSaving(false)
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Welcome to Wavv</h1>
            <p className="text-xl text-muted-foreground">
              Let's set up your SharePoint sites for AI auditing
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Select SharePoint Sites</CardTitle>
              <CardDescription>
                Choose the SharePoint sites you want to be audited by our AI agent.
                You can manage these later in your settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No SharePoint sites found. Make sure you have access to SharePoint sites.</p>
                  <Button
                    variant="outline"
                    onClick={loadSites}
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="max-h-[500px] overflow-y-auto space-y-2">
                    {sites.map((site) => {
                      const isSelected = selectedSiteIds.has(site.id)
                      return (
                        <div
                          key={site.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-input hover:bg-accent'
                          }`}
                          onClick={() => toggleSite(site.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {isSelected ? (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">
                                {site.displayName || site.name}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {site.webUrl}
                              </p>
                              {site.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {site.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {selectedSiteIds.size} site{selectedSiteIds.size !== 1 ? 's' : ''} selected
                    </p>
                    <Button
                      onClick={handleFinish}
                      disabled={isSaving || selectedSiteIds.size === 0}
                      size="lg"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Finish Setup'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


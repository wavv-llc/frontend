'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { UserProfile } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Settings as SettingsIcon, CheckCircle2, RefreshCw } from 'lucide-react'
import { AppSidebar } from '@/components/assistant/AppSidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { sharepointApi } from '@/lib/api'

interface SharePointSite {
  id: string
  name: string
  displayName: string
  webUrl: string
  description?: string
}

interface SelectedSite {
  id: string
  siteId: string
  siteName: string
  webUrl: string
}

export default function SettingsPage() {
  const { isLoaded, getToken } = useAuth()
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [sites, setSites] = useState<SharePointSite[]>([])
  const [selectedSites, setSelectedSites] = useState<SelectedSite[]>([])
  const [selectedSiteIds, setSelectedSiteIds] = useState<Set<string>>(new Set())
  const [isLoadingSites, setIsLoadingSites] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded) {
      loadSharePointData()
    }
  }, [isLoaded, getToken])

  const loadSharePointData = async () => {
    try {
      setIsLoadingSites(true)
      setError(null)
      const token = await getToken()
      if (!token) return

      // Load available sites and selected sites in parallel
      const [sitesResponse, selectedResponse] = await Promise.all([
        sharepointApi.getSites(token).catch(() => ({ data: { sites: [] } })),
        sharepointApi.getSelectedSites(token).catch(() => ({ data: { selectedSites: [] } })),
      ])

      if (sitesResponse.data?.sites) {
        setSites(sitesResponse.data.sites)
      }

      if (selectedResponse.data?.selectedSites) {
        setSelectedSites(selectedResponse.data.selectedSites)
        setSelectedSiteIds(new Set(selectedResponse.data.selectedSites.map(s => s.siteId)))
      }
    } catch (err) {
      console.error('Error loading SharePoint data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load SharePoint data')
    } finally {
      setIsLoadingSites(false)
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

  const handleSaveSites = async () => {
    try {
      setIsSaving(true)
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const sitesToSave = sites
        .filter(site => selectedSiteIds.has(site.id))
        .map(site => ({
          id: site.id,
          name: site.displayName || site.name,
          webUrl: site.webUrl,
        }))

      await sharepointApi.saveSelectedSites(token, sitesToSave)

      // Reload selected sites
      const selectedResponse = await sharepointApi.getSelectedSites(token)
      if (selectedResponse.data?.selectedSites) {
        setSelectedSites(selectedResponse.data.selectedSites)
      }
    } catch (err) {
      console.error('Error saving selected sites:', err)
      setError(err instanceof Error ? err.message : 'Failed to save selected sites')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-screen flex-col">
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-semibold flex items-center gap-2">
                  <SettingsIcon className="h-8 w-8" />
                  Settings
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage your account settings
                </p>
              </div>

              {/* Account Settings with Clerk UserProfile */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Profile Management</p>
                        <p className="text-sm text-muted-foreground">
                          Update your name, email, and account settings
                        </p>
                      </div>
                      <Button
                        onClick={() => setShowUserProfile(!showUserProfile)}
                        variant={showUserProfile ? 'outline' : 'default'}
                      >
                        {showUserProfile ? 'Hide Profile' : 'Manage Profile'}
                      </Button>
                    </div>
                    {showUserProfile && (
                      <div className="border rounded-lg p-4">
                        <UserProfile />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SharePoint Sites Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>SharePoint Sites</CardTitle>
                      <CardDescription>
                        Manage which SharePoint sites are selected for AI auditing
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadSharePointData}
                      disabled={isLoadingSites}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingSites ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                      {error}
                    </div>
                  )}

                  {isLoadingSites ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : sites.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No SharePoint sites found. Make sure you have access to SharePoint sites.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="max-h-[400px] overflow-y-auto space-y-2">
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
                          onClick={handleSaveSites}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
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
      </SidebarInset>
    </SidebarProvider>
  )
}


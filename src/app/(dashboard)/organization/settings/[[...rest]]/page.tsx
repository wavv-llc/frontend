'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Settings as SettingsIcon, CheckCircle2, RefreshCw, UserPlus, Mail } from 'lucide-react'
import { sharepointApi, organizationApi, userApi } from '@/lib/api'
import { SettingsSkeleton } from '@/components/skeletons/SettingsSkeleton'

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
  const [sites, setSites] = useState<SharePointSite[]>([])
  const [, setSelectedSites] = useState<SelectedSite[]>([])
  const [selectedSiteIds, setSelectedSiteIds] = useState<Set<string>>(new Set())
  const [isLoadingSites, setIsLoadingSites] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Invite member state
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded) {
      loadSharePointData()
      loadUserData()
    }
  }, [isLoaded, getToken])

  const loadUserData = async () => {
    try {
      const token = await getToken()
      if (!token) return

      const response = await userApi.getMe(token)
      if (response.data?.organizationId) {
        setOrganizationId(response.data.organizationId)
      }
    } catch (err) {
      console.error('Error loading user data:', err)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !organizationId) return

    try {
      setIsInviting(true)
      setInviteError(null)
      setInviteSuccess(null)

      const token = await getToken()
      if (!token) {
        setInviteError('Authentication required')
        return
      }

      await organizationApi.inviteMember(token, organizationId, inviteEmail.trim())
      setInviteSuccess(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
    } catch (err) {
      console.error('Error inviting member:', err)
      setInviteError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setIsInviting(false)
    }
  }

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
    return <SettingsSkeleton />
  }

  return (
    <div className="h-full overflow-auto p-6 pb-12 animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Organization Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization settings
          </p>
        </div>

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
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-input hover:bg-accent'
                          }`}
                        onClick={() => toggleSite(site.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center shrink-0">
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

        {/* Invite Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              <div>
                <CardTitle>Invite Members</CardTitle>
                <CardDescription>
                  Invite new members to join your organization
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {inviteError && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {inviteError}
              </div>
            )}

            {inviteSuccess && (
              <div className="mb-4 p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {inviteSuccess}
              </div>
            )}

            {!organizationId ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>Unable to load organization information.</p>
              </div>
            ) : (
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email Address</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="colleague@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={isInviting || !inviteEmail.trim()}>
                      {isInviting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Invite'
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  An invitation link will be sent to the email address provided.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

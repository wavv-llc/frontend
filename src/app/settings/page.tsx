'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { UserProfile } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Settings as SettingsIcon } from 'lucide-react'
import { AppSidebar } from '@/components/assistant/AppSidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

export default function SettingsPage() {
  const { isLoaded } = useAuth()
  const [showUserProfile, setShowUserProfile] = useState(false)

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
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}


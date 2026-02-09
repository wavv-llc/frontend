'use client'

import { UserProfile } from '@clerk/nextjs'
import { User } from 'lucide-react'

export default function UserSettingsPage() {
  return (
    <div className="h-full overflow-auto p-6 pb-12 animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-semibold flex items-center gap-2">
            <User className="h-8 w-8" />
            User Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal account settings
          </p>
        </div>

        <div className="[&_.cl-rootBox]:w-full [&_.cl-card]:shadow-none [&_.cl-card]:border [&_.cl-card]:border-border [&_.cl-navbar]:hidden [&_.cl-pageScrollBox]:p-0">
          <UserProfile
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border border-border rounded-lg",
                navbar: "hidden",
                pageScrollBox: "p-0",
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

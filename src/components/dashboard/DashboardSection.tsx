'use client'

import { useUser } from '@clerk/nextjs'
import { UserButton } from '@clerk/nextjs'
import { ActivityLog } from './ActivityLog'

export function DashboardSection() {
  const { user } = useUser()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.firstName || 'user'}</h1>
          </div>
          <UserButton />
        </div>

        <ActivityLog />
      </div>

    </div>
  )
}


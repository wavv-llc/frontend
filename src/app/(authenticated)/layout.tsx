'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { userApi } from '@/lib/api'
import { AuthenticatedSkeleton } from '@/components/skeletons/AuthenticatedSkeleton'

const EXCLUDED_PATHS = ['/onboarding', '/auth/callback', '/member-setup', '/invite/callback']
const ONBOARDING_CACHE_KEY = 'wavv_onboarding_completed'

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isLoaded, isSignedIn, getToken, userId } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const hasCheckedRef = useRef(false)

    useEffect(() => {
        if (!isLoaded) return

        if (!isSignedIn) {
            // Middleware should handle this, but client-side redirect for safety
            return
        }

        // Prevent duplicate checks on same mount
        if (hasCheckedRef.current && isAuthorized) {
            return
        }

        const checkOnboardingStatus = async () => {
            const isExcluded = EXCLUDED_PATHS.some(path => pathname?.startsWith(path))

            // Check sessionStorage cache first (faster, prevents flicker)
            const cachedStatus = sessionStorage.getItem(ONBOARDING_CACHE_KEY)
            const cachedUserId = sessionStorage.getItem('wavv_cached_user_id')

            // If we're on an excluded path, always allow and skip API check
            if (isExcluded) {
                setIsAuthorized(true)
                hasCheckedRef.current = true
                return
            }

            // If we have a valid cache for this user, use it
            if (cachedStatus === 'true' && cachedUserId === userId) {
                // User has completed onboarding (cached)
                if (pathname?.startsWith('/onboarding')) {
                    router.replace('/home')
                    return
                }
                setIsAuthorized(true)
                hasCheckedRef.current = true
                return
            }

            try {
                const token = await getToken()
                if (!token) return

                // Fetch user data
                let hasCompleted = false
                let userOrgId: string | null = null

                try {
                    const response = await userApi.getMe(token)
                    hasCompleted = response.data?.hasCompletedOnboarding ?? false
                    userOrgId = response.data?.organization?.id ?? null

                    // Cache the result for this user
                    if (hasCompleted) {
                        sessionStorage.setItem(ONBOARDING_CACHE_KEY, 'true')
                        sessionStorage.setItem('wavv_cached_user_id', userId || '')
                    }
                } catch (error) {
                    console.warn("User not found or error fetching me:", error)
                    // If user doesn't exist, they need to go through auth callback first
                    // Don't immediately redirect to onboarding - let them continue to auth callback
                    if (isExcluded) {
                        setIsAuthorized(true)
                        hasCheckedRef.current = true
                        return
                    }
                    // For non-excluded paths, redirect to auth callback to sync user
                    router.replace('/auth/callback')
                    return
                }

                if (hasCompleted) {
                    // User has completed onboarding
                    if (pathname?.startsWith('/onboarding')) {
                        // If trying to access onboarding again, redirect to home
                        router.replace('/home')
                        return
                    }
                } else {
                    // User has NOT completed onboarding
                    // Check if they have an organization - if so, they're an invited member
                    // Invited members should NOT go through onboarding
                    if (userOrgId) {
                        // User is part of an org but hasn't "completed onboarding"
                        // This likely means they were invited - mark them as complete and continue
                        try {
                            await userApi.completeOnboarding(token)
                            sessionStorage.setItem(ONBOARDING_CACHE_KEY, 'true')
                            sessionStorage.setItem('wavv_cached_user_id', userId || '')
                        } catch (e) {
                            console.warn('Could not auto-complete onboarding for invited user:', e)
                        }
                    } else {
                        // No org - this is a new admin user, redirect to onboarding
                        router.replace('/onboarding')
                        return
                    }
                }

                setIsAuthorized(true)
                hasCheckedRef.current = true

            } catch (err) {
                console.error('Error in AuthenticatedLayout:', err)
                // On API error, allow access to prevent lockout
                // The individual pages can handle errors gracefully
                setIsAuthorized(true)
                hasCheckedRef.current = true
            }
        }

        checkOnboardingStatus()
    }, [isLoaded, isSignedIn, getToken, pathname, router, userId, isAuthorized])

    if (!isLoaded || !isSignedIn) {
        return <AuthenticatedSkeleton />
    }

    // If checking authorization/onboarding
    if (!isAuthorized) {
        return <AuthenticatedSkeleton />
    }

    return <>{children}</>
}

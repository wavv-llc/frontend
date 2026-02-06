'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { userApi } from '@/lib/api'
import { AuthenticatedSkeleton } from '@/components/skeletons/AuthenticatedSkeleton'
import { UserProvider, useUser } from '@/contexts/UserContext'

const EXCLUDED_PATHS = ['/onboarding', '/auth/callback', '/member-setup', '/invite/callback']
const ONBOARDING_CACHE_KEY = 'wavv_onboarding_completed'

function AuthenticatedGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading, error } = useUser()
    const { isLoaded, isSignedIn, getToken, userId } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const hasCheckedRef = useRef(false)

    useEffect(() => {
        if (!isLoaded) return

        if (!isSignedIn) {
            return
        }

        const checkStatus = async () => {
            if (hasCheckedRef.current && isAuthorized) return

            const isExcluded = EXCLUDED_PATHS.some(path => pathname?.startsWith(path))

            // 1. Check Cache first
            const cachedStatus = sessionStorage.getItem(ONBOARDING_CACHE_KEY)
            const cachedUserId = sessionStorage.getItem('wavv_cached_user_id')

            if (isExcluded) {
                setIsAuthorized(true)
                hasCheckedRef.current = true
                return
            }

            if (cachedStatus === 'true' && cachedUserId === userId) {
                if (pathname?.startsWith('/onboarding')) {
                    router.replace('/home')
                    return
                }
                setIsAuthorized(true)
                hasCheckedRef.current = true
                return
            }

            // 2. Wait for User from Context
            if (isLoading) return

            // 3. Handle Error (User not found)
            if (error || !user) {
                if (isExcluded) {
                    setIsAuthorized(true)
                    hasCheckedRef.current = true
                    return
                }
                // Redirect to auth callback to sync user
                router.replace('/auth/callback')
                return
            }

            // 4. Check Onboarding Status from User data
            const hasCompleted = user.hasCompletedOnboarding
            const userOrgId = user.organization?.id

            if (hasCompleted) {
                sessionStorage.setItem(ONBOARDING_CACHE_KEY, 'true')
                sessionStorage.setItem('wavv_cached_user_id', userId || '')

                if (pathname?.startsWith('/onboarding')) {
                    router.replace('/home')
                    return
                }
            } else {
                // User has NOT completed onboarding
                if (userOrgId) {
                    // Invited member -> Auto-complete
                    try {
                        const token = await getToken()
                        if (token) {
                            await userApi.completeOnboarding(token)
                            sessionStorage.setItem(ONBOARDING_CACHE_KEY, 'true')
                            sessionStorage.setItem('wavv_cached_user_id', userId || '')
                        }
                    } catch (e) {
                        console.warn('Could not auto-complete onboarding:', e)
                    }
                } else {
                    // New Admin -> go to onboarding
                    if (!isExcluded) {
                        router.replace('/onboarding')
                        return
                    }
                }
            }

            setIsAuthorized(true)
            hasCheckedRef.current = true
        }

        checkStatus()
    }, [isLoaded, isSignedIn, isLoading, user, error, pathname, router, userId, isAuthorized, getToken])

    if (!isLoaded || !isSignedIn) {
        return <AuthenticatedSkeleton />
    }

    // While loading user data (if not cached/excluded handled above)
    // Actually, checkStatus handles the logic. If isLoading is true, we return Skeleton?
    // But checkStatus returns early if isLoading is true. 
    // And isAuthorized defaults to false.
    // So if isAuthorized is false, we show Skeleton.

    if (!isAuthorized) {
        return <AuthenticatedSkeleton />
    }

    return <>{children}</>
}

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <UserProvider>
            <AuthenticatedGuard>
                {children}
            </AuthenticatedGuard>
        </UserProvider>
    )
}

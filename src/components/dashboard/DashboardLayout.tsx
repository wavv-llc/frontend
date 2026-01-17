'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { userApi } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import { AppSidebar } from '@/components/assistant/AppSidebar'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'

interface DashboardLayoutProps {
    children: React.ReactNode
}

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { isOpen } = useSidebar()

    return (
        <div className="flex h-screen w-full bg-background">
            <AppSidebar />
            <main
                className={`flex-1 transition-all duration-300 ${isOpen ? 'md:ml-[260px]' : 'md:ml-[60px]'
                    }`}
            >
                {children}
            </main>
        </div>
    )
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { isLoaded, isSignedIn, getToken } = useAuth()
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        if (!isLoaded) return

        if (!isSignedIn) {
            // Let Clerk middleware or page-level redirects handle sign-in redirection ideally, 
            // but we can enforce it here too.
            // If we are on a public page that uses this layout (unlikely), this might be an issue.
            // Assuming DashboardLayout is ONLY for protected pages.
            setIsChecking(false)
            return
        }

        const checkOnboarding = async () => {
            try {
                const token = await getToken()
                if (!token) {
                    setIsChecking(false)
                    return
                }

                const response = await userApi.getMe(token)

                if (response.data && !response.data.hasCompletedOnboarding) {
                    router.push('/onboarding')
                    return
                }
            } catch (error) {
                console.error('Error checking onboarding status:', error)
                // If error (e.g. network), we probably shouldn't block access indefinitely, 
                // or maybe we should? For now, let's allow access but log error.
            } finally {
                setIsChecking(false)
            }
        }

        checkOnboarding()
    }, [isLoaded, isSignedIn, getToken, router])

    if (!isLoaded || (isSignedIn && isChecking)) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <SidebarProvider>
            <DashboardContent>{children}</DashboardContent>
        </SidebarProvider>
    )
}

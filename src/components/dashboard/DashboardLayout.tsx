'use client'

import { AppSidebar } from '@/components/assistant/AppSidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <div className="flex h-screen flex-col">
                    <div className="flex-1 overflow-hidden">
                        {children}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

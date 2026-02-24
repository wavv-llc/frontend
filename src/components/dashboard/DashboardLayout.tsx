'use client';

import { AppSidebar } from '@/components/assistant/AppSidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { KnockClientProvider } from '@/components/providers/KnockClientProvider';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { isOpen } = useSidebar();

    return (
        <div className="flex h-screen w-full bg-[var(--dashboard-bg)]">
            {/* Spacer to account for fixed sidebar - automatically matches sidebar width */}
            <div
                className={`hidden md:block flex-shrink-0 transition-all duration-300 ease-in-out ${
                    isOpen ? 'w-[240px]' : 'w-[56px]'
                }`}
            />
            <AppSidebar />
            {/* Main content now automatically takes remaining space */}
            <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
        </div>
    );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <KnockClientProvider>
            <SidebarProvider>
                <DashboardContent>{children}</DashboardContent>
            </SidebarProvider>
        </KnockClientProvider>
    );
}

'use client';

import { AppSidebar } from '@/components/assistant/AppSidebar';
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { SidebarRefreshProvider } from '@/contexts/SidebarContext';
import { KnockClientProvider } from '@/components/providers/KnockClientProvider';
import { UniversalSearch } from '@/components/search/UniversalSearch';
import { ChatPanelProvider } from '@/contexts/ChatPanelContext';
import {
    GlobalChatFab,
    GlobalChatPanel,
} from '@/components/chat/GlobalChatPanel';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <KnockClientProvider>
            <ChatPanelProvider>
                <SidebarProvider>
                    <SidebarRefreshProvider>
                        <AppSidebar />
                        <SidebarInset className="min-w-0 overflow-hidden bg-dashboard-bg h-svh flex flex-col">
                            {/* Mobile sidebar trigger — fixed top-left, desktop hidden */}
                            <div className="md:hidden fixed left-3 top-3 z-40">
                                <SidebarTrigger className="h-8 w-8 text-dashboard-text-primary hover:bg-accent-hover rounded-lg" />
                            </div>
                            <UniversalSearch />
                            {children}
                        </SidebarInset>
                        <GlobalChatFab />
                        <GlobalChatPanel />
                    </SidebarRefreshProvider>
                </SidebarProvider>
            </ChatPanelProvider>
        </KnockClientProvider>
    );
}

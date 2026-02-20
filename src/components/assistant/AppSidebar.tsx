'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import {
    Plus,
    Menu,
    Settings,
    LogOut,
    User,
    Briefcase,
    Home,
    MessageSquare,
    ArrowLeft,
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import {
    workspaceApi,
    userApi,
    chatApi,
    permissionUtils,
    type Workspace,
    type UserPermissions,
    type Chat,
} from '@/lib/api';

// Sidebar Content Component
interface SidebarContentProps {
    showToggle?: boolean;
    onToggleSidebar?: () => void;
    isCompressed?: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
    onToggleSidebar,
    isCompressed = false,
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const { getToken, signOut } = useAuth();
    const { user } = useUser();
    const { refreshTrigger } = useSidebar();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);
    const [userPermissions, setUserPermissions] = useState<
        UserPermissions | undefined
    >(undefined);
    const [organizationId, setOrganizationId] = useState<string | null>(null);
    const [organization, setOrganization] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [chats, setChats] = useState<Chat[]>([]);
    const [chatsLoading, setChatsLoading] = useState(true);
    const [sidebarView, setSidebarView] = useState<'main' | 'chat-history'>(
        'main',
    );

    // Fetch workspaces and their projects
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await getToken();
                if (!token) return;

                // Fetch user data with permissions
                const userResponse = await userApi.getMe(token);
                if (userResponse.data) {
                    setUserPermissions(userResponse.data.permissions);
                    if (userResponse.data.organization) {
                        setOrganizationId(userResponse.data.organization.id);
                        setOrganization(userResponse.data.organization);
                    }
                }

                // Fetch workspaces
                const workspacesResponse =
                    await workspaceApi.getWorkspaces(token);
                const workspacesData = workspacesResponse.data || [];
                setWorkspaces(workspacesData);
            } catch (error) {
                console.error('Failed to fetch workspaces:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [getToken, refreshTrigger]); // Added refreshTrigger to dependencies

    // Fetch chats
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const token = await getToken();
                if (!token) return;

                const response = await chatApi.getChats(token);
                setChats(response.data || []);
            } catch (error) {
                console.error('Failed to fetch chats:', error);
            } finally {
                setChatsLoading(false);
            }
        };

        fetchChats();
    }, [getToken, refreshTrigger]);

    const handleChatClick = (chatId: string) => {
        router.push(`/chats/${chatId}`);
    };

    const handleNewChat = () => {
        router.push('/chats/new');
        setSidebarView('main');
    };

    const handleWorkspaceClick = (workspaceId: string) => {
        router.push(`/workspaces/${workspaceId}`);
    };

    const handleHomeClick = () => {
        router.push('/home');
    };

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    // Check if user can access organization settings
    const canAccessOrgSettings = organizationId
        ? permissionUtils.hasAnyOrgPermission(userPermissions, organizationId, [
              'ORG_EDIT',
              'ORG_DELETE',
              'ORG_MANAGE_MEMBERS',
          ])
        : false;

    const handleSettings = () => {
        // Navigate to organization settings if user has permissions, otherwise to user settings
        if (canAccessOrgSettings) {
            router.push('/organization/settings');
        } else {
            router.push('/user/settings');
        }
    };

    return (
        <div className="flex h-full flex-col bg-[var(--dashboard-surface)]">
            {/* Header with Brand and Collapse Button */}
            {!isCompressed && sidebarView === 'main' && (
                <div className="px-4 pt-4 pb-4 border-b border-[var(--dashboard-border)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div
                                className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: '#1e293b' }}
                            >
                                <span className="text-white font-serif italic text-sm">
                                    w
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[13px] text-[var(--dashboard-text-primary)] tracking-tight leading-tight truncate">
                                    {user?.firstName && user?.lastName
                                        ? `${user.firstName} ${user.lastName}`
                                        : user?.firstName || 'User'}
                                </div>
                                <div className="text-[10px] text-[var(--dashboard-text-muted)] font-normal tracking-tight leading-tight truncate mt-0.5">
                                    {organization?.name || 'Tax Professional'}
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggleSidebar}
                            className="h-7 w-7 text-[var(--dashboard-text-faint)] hover:text-[var(--dashboard-text-primary)] hover:bg-transparent transition-colors rounded-sm cursor-pointer flex-shrink-0"
                        >
                            <PanelLeftClose className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Collapsed State Brand */}
            {isCompressed && (
                <div className="px-2 pt-4 pb-4 border-b border-[var(--dashboard-border)] flex flex-col items-center gap-3">
                    <div
                        className="w-8 h-8 rounded flex items-center justify-center"
                        style={{ backgroundColor: '#1e293b' }}
                    >
                        <span className="text-white font-serif italic text-base">
                            w
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleSidebar}
                        className="h-7 w-7 text-[var(--dashboard-text-faint)] hover:text-[var(--dashboard-text-primary)] hover:bg-transparent transition-colors rounded-sm cursor-pointer"
                    >
                        <PanelLeftOpen className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 px-3 py-4">
                {sidebarView === 'main' ? (
                    // Main Sidebar Content
                    <div className="space-y-6">
                        {/* Navigation Group */}
                        <nav className="space-y-1">
                            {/* Home Link */}
                            <div>
                                {!isCompressed ? (
                                    <Button
                                        variant="ghost"
                                        onClick={handleHomeClick}
                                        className={cn(
                                            'w-full justify-start gap-3 px-3 py-2 text-[13px] font-normal transition-colors rounded-sm cursor-pointer relative',
                                            pathname === '/home'
                                                ? 'text-[var(--dashboard-text-primary)] bg-[var(--dashboard-bg)] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-5 before:bg-[var(--accent)] before:rounded-r'
                                                : 'text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text-primary)] hover:bg-[var(--dashboard-bg)]',
                                        )}
                                    >
                                        <Home className="h-[16px] w-[16px] flex-shrink-0" />
                                        <span className="tracking-tight">
                                            Home
                                        </span>
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleHomeClick}
                                        className={cn(
                                            'w-full h-10 transition-colors rounded-sm cursor-pointer relative',
                                            pathname === '/home'
                                                ? 'text-[var(--dashboard-text-primary)] bg-[var(--dashboard-bg)] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-6 before:bg-[var(--accent)] before:rounded-r'
                                                : 'text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text-primary)] hover:bg-[var(--dashboard-bg)]',
                                        )}
                                    >
                                        <Home className="h-[18px] w-[18px]" />
                                    </Button>
                                )}
                            </div>

                            {/* Conversations Link */}
                            <div>
                                {!isCompressed ? (
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            setSidebarView('chat-history')
                                        }
                                        className={cn(
                                            'w-full justify-start gap-3 px-3 py-2 text-[13px] font-normal transition-colors rounded-sm cursor-pointer relative',
                                            pathname?.startsWith('/chats')
                                                ? 'text-[var(--dashboard-text-primary)] bg-[var(--dashboard-bg)] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-5 before:bg-[var(--accent)] before:rounded-r'
                                                : 'text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text-primary)] hover:bg-[var(--dashboard-bg)]',
                                        )}
                                    >
                                        <MessageSquare className="h-[16px] w-[16px] flex-shrink-0" />
                                        <span className="tracking-tight">
                                            Conversations
                                        </span>
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            setSidebarView('chat-history')
                                        }
                                        className={cn(
                                            'w-full h-10 transition-colors rounded-sm cursor-pointer relative',
                                            pathname?.startsWith('/chats')
                                                ? 'text-[var(--dashboard-text-primary)] bg-[var(--dashboard-bg)] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-6 before:bg-[var(--accent)] before:rounded-r'
                                                : 'text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text-primary)] hover:bg-[var(--dashboard-bg)]',
                                        )}
                                    >
                                        <MessageSquare className="h-[18px] w-[18px]" />
                                    </Button>
                                )}
                            </div>

                            {/* Settings Link */}
                            <div>
                                {!isCompressed ? (
                                    <Button
                                        variant="ghost"
                                        onClick={handleSettings}
                                        className={cn(
                                            'w-full justify-start gap-3 px-3 py-2 text-[13px] font-normal transition-colors rounded-sm cursor-pointer relative',
                                            pathname?.startsWith(
                                                '/user/settings',
                                            ) ||
                                                pathname?.startsWith(
                                                    '/organization/settings',
                                                )
                                                ? 'text-[var(--dashboard-text-primary)] bg-[var(--dashboard-bg)] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-5 before:bg-[var(--accent)] before:rounded-r'
                                                : 'text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text-primary)] hover:bg-[var(--dashboard-bg)]',
                                        )}
                                    >
                                        <Settings className="h-[16px] w-[16px] flex-shrink-0" />
                                        <span className="tracking-tight">
                                            Settings
                                        </span>
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleSettings}
                                        className={cn(
                                            'w-full h-10 transition-colors rounded-sm cursor-pointer relative',
                                            pathname?.startsWith(
                                                '/user/settings',
                                            ) ||
                                                pathname?.startsWith(
                                                    '/organization/settings',
                                                )
                                                ? 'text-[var(--dashboard-text-primary)] bg-[var(--dashboard-bg)] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-6 before:bg-[var(--accent)] before:rounded-r'
                                                : 'text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text-primary)] hover:bg-[var(--dashboard-bg)]',
                                        )}
                                    >
                                        <Settings className="h-[18px] w-[18px]" />
                                    </Button>
                                )}
                            </div>
                        </nav>

                        {/* Workspaces Section */}
                        <div className="space-y-1">
                            {!isCompressed && (
                                <div className="border-t border-[var(--dashboard-border-light)] pt-4 pb-2">
                                    <div className="px-3 flex items-center gap-2">
                                        <div className="h-px flex-1 bg-[var(--dashboard-border-light)]" />
                                        <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--dashboard-text-faint)]">
                                            Workspaces
                                        </span>
                                        <div className="h-px flex-1 bg-[var(--dashboard-border-light)]" />
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1">
                                {loading
                                    ? !isCompressed && (
                                          <div className="space-y-2 px-3 py-1">
                                              {[1, 2].map((i) => (
                                                  <div
                                                      key={i}
                                                      className="flex items-center gap-2 animate-pulse"
                                                  >
                                                      <Skeleton className="h-2 w-2 rounded-full" />
                                                      <Skeleton className="h-3.5 flex-1 rounded-sm" />
                                                  </div>
                                              ))}
                                          </div>
                                      )
                                    : workspaces.length > 0
                                      ? workspaces.map((workspace) => (
                                            <div key={workspace.id}>
                                                {!isCompressed ? (
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() =>
                                                            handleWorkspaceClick(
                                                                workspace.id,
                                                            )
                                                        }
                                                        className={cn(
                                                            'w-full justify-start gap-3 px-3 py-2 text-[12.5px] font-normal transition-colors rounded-sm cursor-pointer relative',
                                                            pathname?.includes(
                                                                `/workspaces/${workspace.id}`,
                                                            )
                                                                ? 'text-[var(--dashboard-text-primary)] bg-[var(--dashboard-bg)] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-5 before:bg-[var(--accent)] before:rounded-r'
                                                                : 'text-[var(--dashboard-text-body)] hover:text-[var(--dashboard-text-primary)] hover:bg-[var(--dashboard-bg)]',
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                'h-1.5 w-1.5 rounded-full flex-shrink-0 transition-colors',
                                                                pathname?.includes(
                                                                    `/workspaces/${workspace.id}`,
                                                                )
                                                                    ? 'bg-[var(--accent)]'
                                                                    : 'bg-[var(--dashboard-border)]',
                                                            )}
                                                        />
                                                        <span className="truncate tracking-tight">
                                                            {workspace.name}
                                                        </span>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleWorkspaceClick(
                                                                workspace.id,
                                                            )
                                                        }
                                                        className={cn(
                                                            'w-full h-10 transition-colors rounded-sm cursor-pointer relative',
                                                            pathname?.includes(
                                                                `/workspaces/${workspace.id}`,
                                                            )
                                                                ? 'text-[var(--dashboard-text-primary)] bg-[var(--dashboard-bg)] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-6 before:bg-[var(--accent)] before:rounded-r'
                                                                : 'text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text-primary)] hover:bg-[var(--dashboard-bg)]',
                                                        )}
                                                    >
                                                        <Briefcase className="h-[18px] w-[18px]" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))
                                      : !isCompressed && (
                                            <p className="px-3 py-3 text-[11px] text-[var(--dashboard-text-faint)] text-center">
                                                No workspaces
                                            </p>
                                        )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Chat History Content
                    <div className="space-y-4">
                        {/* Back Button */}
                        {!isCompressed && (
                            <Button
                                variant="ghost"
                                onClick={() => setSidebarView('main')}
                                className="w-full justify-start gap-3 px-3 py-2 text-[13px] font-normal text-[var(--dashboard-text-muted)] hover:bg-[var(--dashboard-bg)] hover:text-[var(--dashboard-text-primary)] transition-colors rounded-sm cursor-pointer"
                            >
                                <ArrowLeft className="h-4 w-4 flex-shrink-0" />
                                <span className="tracking-tight">
                                    Back to menu
                                </span>
                            </Button>
                        )}

                        {/* New Chat Button */}
                        {!isCompressed ? (
                            <Button
                                variant="default"
                                onClick={handleNewChat}
                                className="w-full justify-center gap-2 px-3 py-2.5 text-[13px] font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-all rounded-md cursor-pointer shadow-sm"
                            >
                                <Plus className="h-4 w-4 flex-shrink-0" />
                                <span className="tracking-tight">New Chat</span>
                            </Button>
                        ) : (
                            <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="default"
                                            size="icon"
                                            onClick={handleNewChat}
                                            className="w-full h-10 bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-all rounded-sm cursor-pointer shadow-sm"
                                        >
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="right"
                                        sideOffset={5}
                                        className="bg-popover text-popover-foreground border-border"
                                    >
                                        <p>New Chat</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}

                        {chatsLoading ? (
                            <div className="space-y-2 px-3 py-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 animate-pulse"
                                    >
                                        <Skeleton className="h-3.5 flex-1 rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : chats.length > 0 ? (
                            <div className="space-y-1">
                                {chats.map((chat) => (
                                    <div key={chat.id}>
                                        {!isCompressed ? (
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    handleChatClick(chat.id);
                                                    setSidebarView('main');
                                                }}
                                                className={cn(
                                                    'w-full justify-start gap-3 px-3 py-2 text-[12.5px] font-normal transition-colors rounded-sm cursor-pointer relative',
                                                    pathname ===
                                                        `/chats/${chat.id}`
                                                        ? 'text-[var(--dashboard-text-primary)] bg-[var(--dashboard-bg)] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-5 before:bg-[var(--accent)] before:rounded-r'
                                                        : 'text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text-primary)] hover:bg-[var(--dashboard-bg)]',
                                                )}
                                            >
                                                <MessageSquare className="h-[15px] w-[15px] flex-shrink-0" />
                                                <span className="flex-1 truncate text-left tracking-tight">
                                                    {chat.message.length > 30
                                                        ? chat.message.slice(
                                                              0,
                                                              30,
                                                          ) + '...'
                                                        : chat.message}
                                                </span>
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    handleChatClick(chat.id);
                                                    setSidebarView('main');
                                                }}
                                                className={cn(
                                                    'w-full h-10 transition-colors rounded-sm cursor-pointer relative',
                                                    pathname ===
                                                        `/chats/${chat.id}`
                                                        ? 'text-[var(--dashboard-text-primary)] bg-[var(--dashboard-bg)] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-6 before:bg-[var(--accent)] before:rounded-r'
                                                        : 'text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text-primary)] hover:bg-[var(--dashboard-bg)]',
                                                )}
                                            >
                                                <MessageSquare className="h-[18px] w-[18px]" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="px-4 py-16 text-center">
                                <MessageSquare className="h-10 w-10 mx-auto mb-4 text-[var(--dashboard-border)] opacity-50" />
                                <p className="text-[12px] text-[var(--dashboard-text-muted)] font-medium">
                                    No conversations
                                </p>
                                <p className="text-[11px] text-[var(--dashboard-text-faint)] mt-1.5">
                                    Start a new conversation to begin
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>

            {/* Footer - User Profile */}
            <div className="p-3 mt-auto border-t border-[var(--dashboard-border)]">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        {!isCompressed ? (
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2.5 px-2 py-2 hover:bg-[var(--dashboard-bg)] rounded-sm transition-colors cursor-pointer h-auto"
                            >
                                <div className="h-8 w-8 rounded-md bg-gradient-to-br from-[#3d4a52] to-[#2e3b44] flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0 shadow-sm">
                                    {user?.firstName?.[0] ||
                                        user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ||
                                        'U'}
                                </div>
                                <div className="flex flex-col items-start overflow-hidden flex-1 min-w-0">
                                    <span className="font-medium text-[11.5px] truncate w-full text-[var(--dashboard-text-primary)] tracking-tight">
                                        {user?.firstName && user?.lastName
                                            ? `${user.firstName} ${user.lastName}`
                                            : user?.firstName ||
                                              user?.emailAddresses?.[0]
                                                  ?.emailAddress ||
                                              'User'}
                                    </span>
                                    <span className="text-[10px] text-[var(--dashboard-text-muted)] truncate w-full font-normal tracking-tight">
                                        {organization?.name ||
                                            'Tax Professional'}
                                    </span>
                                </div>
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 hover:bg-[var(--dashboard-bg)] cursor-pointer rounded-sm transition-colors"
                                title={user?.firstName || 'User'}
                            >
                                <div className="h-8 w-8 rounded-md bg-gradient-to-br from-[#3d4a52] to-[#2e3b44] flex items-center justify-center text-[11px] font-semibold text-white shadow-sm">
                                    {user?.firstName?.[0] ||
                                        user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ||
                                        'U'}
                                </div>
                            </Button>
                        )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-52 bg-popover border-border text-popover-foreground"
                    >
                        <DropdownMenuItem
                            className="cursor-pointer focus:bg-[var(--dashboard-bg)] focus:text-foreground transition-colors text-[13px] py-2.5"
                            onClick={() => router.push('/user/settings')}
                        >
                            <User className="mr-2.5 h-4 w-4" />
                            <span>Profile Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[var(--dashboard-border-light)]" />
                        <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive focus:bg-red-50 transition-colors text-[13px] py-2.5"
                            onClick={handleSignOut}
                        >
                            <LogOut className="mr-2.5 h-4 w-4" />
                            <span>Sign Out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

// Main AppSidebar Component
export const AppSidebar: React.FC = () => {
    const { isOpen, toggle } = useSidebar();

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    'hidden md:block fixed left-0 top-0 z-40 h-screen bg-[var(--dashboard-surface)] border-r border-[var(--dashboard-border)] shadow-sm overflow-hidden',
                    'transition-[width] duration-300 ease-in-out will-change-[width]',
                    isOpen ? 'w-[240px]' : 'w-[56px]',
                )}
                style={{ transitionProperty: 'width' }}
            >
                <div
                    className={cn(
                        'h-full transition-[width] duration-300 ease-in-out',
                        isOpen ? 'w-[240px]' : 'w-[56px]',
                    )}
                >
                    <SidebarContent
                        onToggleSidebar={toggle}
                        isCompressed={!isOpen}
                    />
                </div>
            </aside>

            {/* Mobile Sidebar (Sheet) */}
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="fixed left-3 top-3 z-40 h-8 w-8 text-[var(--dashboard-text-primary)] hover:bg-[var(--accent-hover)] cursor-pointer rounded-lg"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="w-[240px] p-0 bg-[var(--dashboard-surface)] border-[var(--dashboard-border)]"
                    >
                        <SidebarContent showToggle={false} />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
};

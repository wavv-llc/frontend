'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Empty } from '@/components/ui/empty';

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await getToken();
                if (!token) return;

                const userResponse = await userApi.getMe(token);
                if (userResponse.data) {
                    setUserPermissions(userResponse.data.permissions);
                    if (userResponse.data.organization) {
                        setOrganizationId(userResponse.data.organization.id);
                        setOrganization(userResponse.data.organization);
                    }
                }

                const workspacesResponse =
                    await workspaceApi.getWorkspaces(token);
                setWorkspaces(workspacesResponse.data || []);
            } catch (error) {
                console.error('Failed to fetch workspaces:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [getToken, refreshTrigger]);

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

    const handleChatClick = (chatId: string) => router.push(`/chats/${chatId}`);
    const handleNewChat = () => {
        router.push('/chats/new');
        setSidebarView('main');
    };
    const handleWorkspaceClick = (id: string) =>
        router.push(`/workspaces/${id}`);
    const handleHomeClick = () => router.push('/home');
    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    const canAccessOrgSettings = organizationId
        ? permissionUtils.hasAnyOrgPermission(userPermissions, organizationId, [
              'ORG_EDIT',
              'ORG_DELETE',
              'ORG_MANAGE_MEMBERS',
          ])
        : false;

    const handleSettings = () => {
        if (canAccessOrgSettings) {
            router.push('/organization/settings');
        } else {
            router.push('/user/settings');
        }
    };

    const userInitial =
        user?.firstName?.[0] ||
        user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ||
        'U';

    const userDisplayName =
        user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : user?.firstName ||
              user?.emailAddresses?.[0]?.emailAddress ||
              'User';

    const navItems = [
        {
            icon: Home,
            label: 'Home',
            onClick: handleHomeClick,
            isActive: pathname === '/home',
        },
        {
            icon: MessageSquare,
            label: 'Conversations',
            onClick: () => setSidebarView('chat-history'),
            isActive: pathname?.startsWith('/chats'),
        },
        {
            icon: Settings,
            label: 'Settings',
            onClick: handleSettings,
            isActive:
                pathname?.startsWith('/user/settings') ||
                pathname?.startsWith('/organization/settings'),
        },
    ];

    return (
        <div className="flex h-full flex-col bg-dashboard-surface">
            {/* Header */}
            {!isCompressed && sidebarView === 'main' && (
                <div className="px-4 pt-4 pb-4 border-b border-dashboard-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="w-7 h-7 rounded flex items-center justify-center shrink-0 bg-steel-800">
                                <span className="text-white font-serif italic text-sm">
                                    w
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[13px] text-dashboard-text-primary tracking-tight leading-tight truncate">
                                    {userDisplayName}
                                </div>
                                <div className="text-[10px] text-dashboard-text-muted font-normal tracking-tight leading-tight truncate mt-0.5">
                                    {organization?.name || 'Tax Professional'}
                                </div>
                            </div>
                        </div>
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onToggleSidebar}
                                        className="h-7 w-7 text-dashboard-text-faint hover:text-dashboard-text-primary hover:bg-transparent transition-colors rounded-sm cursor-pointer shrink-0"
                                    >
                                        <PanelLeftClose className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p>Collapse sidebar</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            )}

            {isCompressed && (
                <div className="px-2 pt-4 pb-4 border-b border-dashboard-border flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded flex items-center justify-center bg-steel-800">
                        <span className="text-white font-serif italic text-base">
                            w
                        </span>
                    </div>
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onToggleSidebar}
                                    className="h-7 w-7 text-dashboard-text-faint hover:text-dashboard-text-primary hover:bg-transparent transition-colors rounded-sm cursor-pointer"
                                >
                                    <PanelLeftOpen className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>Expand sidebar</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )}

            <ScrollArea className="flex-1 px-3 py-4">
                {sidebarView === 'main' ? (
                    <div className="space-y-6">
                        <nav className="space-y-1">
                            {navItems.map(
                                ({ icon: Icon, label, onClick, isActive }) =>
                                    !isCompressed ? (
                                        <Button
                                            key={label}
                                            variant="ghost"
                                            onClick={onClick}
                                            className={cn(
                                                'w-full justify-start gap-3 px-3 py-2 text-[13px] font-normal transition-colors rounded-sm cursor-pointer relative',
                                                isActive
                                                    ? 'text-dashboard-text-primary bg-dashboard-bg before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-5 before:bg-(--accent) before:rounded-r'
                                                    : 'text-dashboard-text-muted hover:text-dashboard-text-primary hover:bg-dashboard-bg',
                                            )}
                                        >
                                            <Icon className="h-[16px] w-[16px] shrink-0" />
                                            <span className="tracking-tight">
                                                {label}
                                            </span>
                                        </Button>
                                    ) : (
                                        <TooltipProvider
                                            key={label}
                                            delayDuration={300}
                                        >
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={onClick}
                                                        className={cn(
                                                            'w-full h-10 transition-colors rounded-sm cursor-pointer relative',
                                                            isActive
                                                                ? 'text-dashboard-text-primary bg-dashboard-bg before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-6 before:bg-(--accent) before:rounded-r'
                                                                : 'text-dashboard-text-muted hover:text-dashboard-text-primary hover:bg-dashboard-bg',
                                                        )}
                                                    >
                                                        <Icon className="h-4.5 w-4.5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="right">
                                                    <p>{label}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ),
                            )}
                        </nav>

                        <div className="space-y-1">
                            {!isCompressed && (
                                <div className="pt-4 pb-2">
                                    <div className="px-3 flex items-center gap-2">
                                        <Separator className="flex-1 bg-dashboard-border-light" />
                                        <span className="text-[10px] font-medium uppercase tracking-widest text-dashboard-text-faint">
                                            Workspaces
                                        </span>
                                        <Separator className="flex-1 bg-dashboard-border-light" />
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1">
                                {!loading && workspaces.length > 0
                                    ? workspaces.map((workspace) =>
                                          !isCompressed ? (
                                              <Button
                                                  key={workspace.id}
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
                                                          ? 'text-dashboard-text-primary bg-dashboard-bg before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-5 before:bg-(--accent) before:rounded-r'
                                                          : 'text-dashboard-text-body hover:text-dashboard-text-primary hover:bg-dashboard-bg',
                                                  )}
                                              >
                                                  <div
                                                      className={cn(
                                                          'h-1.5 w-1.5 rounded-full shrink-0 transition-colors',
                                                          pathname?.includes(
                                                              `/workspaces/${workspace.id}`,
                                                          )
                                                              ? 'bg-(--accent)'
                                                              : 'bg-dashboard-border',
                                                      )}
                                                  />
                                                  <span className="truncate tracking-tight">
                                                      {workspace.name}
                                                  </span>
                                              </Button>
                                          ) : (
                                              <TooltipProvider
                                                  key={workspace.id}
                                                  delayDuration={300}
                                              >
                                                  <Tooltip>
                                                      <TooltipTrigger asChild>
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
                                                                      ? 'text-dashboard-text-primary bg-dashboard-bg before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-6 before:bg-(--accent) before:rounded-r'
                                                                      : 'text-dashboard-text-muted hover:text-dashboard-text-primary hover:bg-dashboard-bg',
                                                              )}
                                                          >
                                                              <Briefcase className="h-4.5 w-4.5" />
                                                          </Button>
                                                      </TooltipTrigger>
                                                      <TooltipContent side="right">
                                                          <p>
                                                              {workspace.name}
                                                          </p>
                                                      </TooltipContent>
                                                  </Tooltip>
                                              </TooltipProvider>
                                          ),
                                      )
                                    : !isCompressed && (
                                          <Empty
                                              icon={
                                                  <Briefcase className="h-5 w-5" />
                                              }
                                              title="No workspaces"
                                              className="py-6"
                                          />
                                      )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {!isCompressed && (
                            <Button
                                variant="ghost"
                                onClick={() => setSidebarView('main')}
                                className="w-full justify-start gap-3 px-3 py-2 text-[13px] font-normal text-dashboard-text-muted hover:bg-dashboard-bg hover:text-dashboard-text-primary transition-colors rounded-sm cursor-pointer"
                            >
                                <ArrowLeft className="h-4 w-4 shrink-0" />
                                <span className="tracking-tight">
                                    Back to menu
                                </span>
                            </Button>
                        )}

                        {!isCompressed ? (
                            <Button
                                variant="default"
                                onClick={handleNewChat}
                                className="w-full justify-center gap-2 px-3 py-2.5 text-[13px] font-medium bg-(--accent) text-white hover:bg-(--accent)/90 transition-all rounded-md cursor-pointer shadow-sm"
                            >
                                <Plus className="h-4 w-4 shrink-0" />
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
                                            className="w-full h-10 bg-(--accent) text-white hover:bg-(--accent)/90 transition-all rounded-sm cursor-pointer shadow-sm"
                                        >
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" sideOffset={5}>
                                        <p>New Chat</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}

                        {chatsLoading ? null : chats.length > 0 ? (
                            <div className="space-y-1">
                                {chats.map((chat) =>
                                    !isCompressed ? (
                                        <Button
                                            key={chat.id}
                                            variant="ghost"
                                            onClick={() => {
                                                handleChatClick(chat.id);
                                                setSidebarView('main');
                                            }}
                                            className={cn(
                                                'w-full justify-start gap-3 px-3 py-2 text-[12.5px] font-normal transition-colors rounded-sm cursor-pointer relative',
                                                pathname === `/chats/${chat.id}`
                                                    ? 'text-dashboard-text-primary bg-dashboard-bg before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-5 before:bg-(--accent) before:rounded-r'
                                                    : 'text-dashboard-text-muted hover:text-dashboard-text-primary hover:bg-dashboard-bg',
                                            )}
                                        >
                                            <MessageSquare className="h-3.75 w-3.75 shrink-0" />
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
                                        <TooltipProvider
                                            key={chat.id}
                                            delayDuration={300}
                                        >
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            handleChatClick(
                                                                chat.id,
                                                            );
                                                            setSidebarView(
                                                                'main',
                                                            );
                                                        }}
                                                        className={cn(
                                                            'w-full h-10 transition-colors rounded-sm cursor-pointer relative',
                                                            pathname ===
                                                                `/chats/${chat.id}`
                                                                ? 'text-dashboard-text-primary bg-dashboard-bg before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-6 before:bg-(--accent) before:rounded-r'
                                                                : 'text-dashboard-text-muted hover:text-dashboard-text-primary hover:bg-dashboard-bg',
                                                        )}
                                                    >
                                                        <MessageSquare className="h-4.5 w-4.5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="right">
                                                    <p>
                                                        {chat.message.slice(
                                                            0,
                                                            40,
                                                        )}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ),
                                )}
                            </div>
                        ) : (
                            <Empty
                                icon={<MessageSquare className="h-10 w-10" />}
                                title="No conversations"
                                description="Start a new conversation to begin"
                                className="py-16"
                            />
                        )}
                    </div>
                )}
            </ScrollArea>

            {/* Footer — User Profile */}
            <div className="p-3 mt-auto border-t border-dashboard-border">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        {!isCompressed ? (
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2.5 px-2 py-2 hover:bg-dashboard-bg rounded-sm transition-colors cursor-pointer h-auto"
                            >
                                <Avatar className="h-8 w-8 rounded-md shrink-0">
                                    <AvatarFallback className="rounded-md bg-linear-to-br from-[#3d4a52] to-[#2e3b44] text-[11px] font-semibold text-white shadow-sm">
                                        {userInitial}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start overflow-hidden flex-1 min-w-0">
                                    <span className="font-medium text-[11.5px] truncate w-full text-dashboard-text-primary tracking-tight">
                                        {userDisplayName}
                                    </span>
                                    <span className="text-[10px] text-dashboard-text-muted truncate w-full font-normal tracking-tight">
                                        {organization?.name ||
                                            'Tax Professional'}
                                    </span>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className="text-[9px] px-1.5 py-0 h-4 font-normal shrink-0"
                                >
                                    Pro
                                </Badge>
                            </Button>
                        ) : (
                            <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 hover:bg-dashboard-bg cursor-pointer rounded-sm transition-colors"
                                        >
                                            <Avatar className="h-8 w-8 rounded-md">
                                                <AvatarFallback className="rounded-md bg-linear-to-br from-[#3d4a52] to-[#2e3b44] text-[11px] font-semibold text-white shadow-sm">
                                                    {userInitial}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        <p>{userDisplayName}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-52 bg-popover border-border text-popover-foreground"
                    >
                        <DropdownMenuItem
                            className="cursor-pointer focus:bg-dashboard-bg focus:text-foreground transition-colors text-[13px] py-2.5"
                            onClick={() => router.push('/user/settings')}
                        >
                            <User className="mr-2.5 h-4 w-4" />
                            <span>Profile Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-dashboard-border-light" />
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

export const AppSidebar: React.FC = () => {
    const { isOpen, toggle } = useSidebar();

    return (
        <>
            <aside
                className={cn(
                    'hidden md:block fixed left-0 top-0 z-40 h-screen bg-dashboard-surface border-r border-dashboard-border shadow-sm overflow-hidden',
                    'transition-[width] duration-300 ease-in-out will-change-[width]',
                    isOpen ? 'w-60' : 'w-[56px]',
                )}
                style={{ transitionProperty: 'width' }}
            >
                <div
                    className={cn(
                        'h-full transition-[width] duration-300 ease-in-out',
                        isOpen ? 'w-60' : 'w-[56px]',
                    )}
                >
                    <SidebarContent
                        onToggleSidebar={toggle}
                        isCompressed={!isOpen}
                    />
                </div>
            </aside>

            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="fixed left-3 top-3 z-40 h-8 w-8 text-dashboard-text-primary hover:bg-[var(--accent-hover)] cursor-pointer rounded-lg"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="w-60 p-0 bg-dashboard-surface border-dashboard-border"
                    >
                        <SidebarContent showToggle={false} />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
};

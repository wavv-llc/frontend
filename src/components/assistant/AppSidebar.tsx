'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useUser as useDbUser } from '@/contexts/UserContext';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Empty } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';

import {
    Plus,
    Settings,
    LogOut,
    User,
    Home,
    MessageSquare,
    ArrowLeft,
    Folder,
} from 'lucide-react';
import { useSidebarRefresh } from '@/contexts/SidebarContext';
import { workspaceApi, chatApi, type Workspace, type Chat } from '@/lib/api';

export function AppSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { getToken, signOut } = useAuth();
    const { user: dbUser } = useDbUser();
    const { refreshTrigger } = useSidebarRefresh();

    // Clerk's getToken is not referentially stable — keep it in a ref so it
    // never appears in effect dep arrays (which would re-fire fetches spuriously).
    const getTokenRef = useRef(getToken);
    getTokenRef.current = getToken;
    useSidebar();

    const isAdmin = dbUser?.organizationRole === 'ADMIN';
    const organization = dbUser?.organization ?? null;

    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);
    const [chats, setChats] = useState<Chat[]>([]);
    const [chatsLoading, setChatsLoading] = useState(true);
    const [sidebarView, setSidebarView] = useState<'main' | 'chat-history'>(
        'main',
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await getTokenRef.current();
                if (!token) return;

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
    }, [refreshTrigger]);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const token = await getTokenRef.current();
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
    }, [refreshTrigger]);

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

    const canAccessOrgSettings = !!organization?.id && isAdmin;

    const handleSettings = () => {
        if (canAccessOrgSettings) {
            router.push('/organization/settings');
        } else {
            router.push('/user/settings');
        }
    };

    const userInitial =
        dbUser?.firstName?.[0]?.toUpperCase() ||
        dbUser?.email?.[0]?.toUpperCase() ||
        'U';

    const userDisplayName =
        dbUser?.firstName && dbUser?.lastName
            ? `${dbUser.firstName} ${dbUser.lastName}`
            : dbUser?.firstName || dbUser?.email || 'User';

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
        <Sidebar collapsible="icon">
            {/* Header */}
            <SidebarHeader className="border-b border-sidebar-border px-2 py-3">
                {/* Expanded layout: logo + name/org + trigger */}
                <div className="flex items-center gap-2.5 px-1 group-data-[collapsible=icon]:hidden">
                    <div className="w-7 h-7 rounded flex items-center justify-center shrink-0 bg-steel-800">
                        <span className="text-white font-serif italic text-sm">
                            w
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[13px] text-sidebar-foreground tracking-tight leading-tight truncate">
                            {userDisplayName}
                        </div>
                        <div className="text-[10px] text-sidebar-foreground/60 font-normal tracking-tight leading-tight truncate mt-0.5">
                            {organization?.name || 'Tax Professional'}
                        </div>
                    </div>
                    <SidebarTrigger className="h-7 w-7 shrink-0 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-transparent" />
                </div>

                {/* Collapsed layout: just the expand trigger, centered */}
                <div className="hidden group-data-[collapsible=icon]:flex justify-center">
                    <SidebarTrigger className="h-7 w-7 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-transparent" />
                </div>
            </SidebarHeader>

            {/* Content */}
            <SidebarContent>
                {sidebarView === 'main' ? (
                    <>
                        {/* Primary nav */}
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {navItems.map(
                                        ({
                                            icon: Icon,
                                            label,
                                            onClick,
                                            isActive,
                                        }) => (
                                            <SidebarMenuItem key={label}>
                                                <SidebarMenuButton
                                                    onClick={onClick}
                                                    isActive={isActive}
                                                    tooltip={label}
                                                    className="text-[13px] font-normal cursor-pointer rounded-sm"
                                                >
                                                    <Icon className="h-4 w-4 shrink-0" />
                                                    <span className="tracking-tight">
                                                        {label}
                                                    </span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ),
                                    )}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        {/* Workspaces — hidden entirely in icon mode */}
                        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
                            <SidebarGroupLabel className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/40 h-auto py-2">
                                Workspaces
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {loading ? (
                                        [1, 2, 3].map((i) => (
                                            <SidebarMenuItem key={i}>
                                                <div className="flex items-center gap-2 px-2 py-1.5">
                                                    <Skeleton className="h-3.5 w-3.5 rounded-sm shrink-0" />
                                                    <Skeleton className="h-3 flex-1 rounded-sm" />
                                                </div>
                                            </SidebarMenuItem>
                                        ))
                                    ) : workspaces.length > 0 ? (
                                        workspaces.map((workspace) => (
                                            <SidebarMenuItem key={workspace.id}>
                                                <SidebarMenuButton
                                                    onClick={() =>
                                                        handleWorkspaceClick(
                                                            workspace.id,
                                                        )
                                                    }
                                                    isActive={pathname?.includes(
                                                        `/workspaces/${workspace.id}`,
                                                    )}
                                                    className="text-[12.5px] font-normal cursor-pointer rounded-sm"
                                                >
                                                    <Folder className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40" />
                                                    <span className="truncate tracking-tight">
                                                        {workspace.name}
                                                    </span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))
                                    ) : (
                                        <Empty
                                            icon={
                                                <Folder className="h-5 w-5" />
                                            }
                                            title="No workspaces"
                                            className="py-6"
                                        />
                                    )}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                ) : (
                    /* Chat History View */
                    <SidebarGroup>
                        <SidebarGroupContent>
                            {/* Back + New Chat — hidden in icon mode */}
                            <div className="space-y-2 mb-2 group-data-[collapsible=icon]:hidden">
                                <Button
                                    variant="ghost"
                                    onClick={() => setSidebarView('main')}
                                    className="w-full justify-start gap-3 px-3 py-2 text-[13px] font-normal text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors rounded-sm cursor-pointer"
                                >
                                    <ArrowLeft className="h-4 w-4 shrink-0" />
                                    <span className="tracking-tight">
                                        Back to menu
                                    </span>
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={handleNewChat}
                                    className="w-full justify-center gap-2 px-3 py-2.5 text-[13px] font-medium bg-(--accent) text-white hover:bg-(--accent)/90 transition-all rounded-md cursor-pointer shadow-sm"
                                >
                                    <Plus className="h-4 w-4 shrink-0" />
                                    <span className="tracking-tight">
                                        New Chat
                                    </span>
                                </Button>
                            </div>

                            {/* Icon mode: new chat only */}
                            <SidebarMenu>
                                <SidebarMenuItem className="hidden group-data-[collapsible=icon]:block">
                                    <SidebarMenuButton
                                        onClick={handleNewChat}
                                        tooltip="New Chat"
                                        className="cursor-pointer"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>New Chat</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>

                            {/* Chat list */}
                            <SidebarMenu className="mt-1">
                                {!chatsLoading &&
                                    chats.map((chat) => (
                                        <SidebarMenuItem key={chat.id}>
                                            <SidebarMenuButton
                                                onClick={() => {
                                                    handleChatClick(chat.id);
                                                    setSidebarView('main');
                                                }}
                                                isActive={
                                                    pathname ===
                                                    `/chats/${chat.id}`
                                                }
                                                tooltip={chat.message.slice(
                                                    0,
                                                    40,
                                                )}
                                                className="text-[12.5px] font-normal cursor-pointer rounded-sm"
                                            >
                                                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                                                <span className="truncate tracking-tight">
                                                    {chat.message.length > 30
                                                        ? chat.message.slice(
                                                              0,
                                                              30,
                                                          ) + '...'
                                                        : chat.message}
                                                </span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                {!chatsLoading && chats.length === 0 && (
                                    <div className="group-data-[collapsible=icon]:hidden">
                                        <Empty
                                            icon={
                                                <MessageSquare className="h-10 w-10" />
                                            }
                                            title="No conversations"
                                            description="Start a new conversation to begin"
                                            className="py-16"
                                        />
                                    </div>
                                )}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            {/* Footer — user profile dropdown */}
            <SidebarFooter className="border-t border-sidebar-border p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="cursor-pointer rounded-sm h-auto py-2"
                                    tooltip={userDisplayName}
                                >
                                    <Avatar className="h-8 w-8 rounded-md shrink-0">
                                        <AvatarFallback className="rounded-md bg-linear-to-br from-[#3d4a52] to-[#2e3b44] text-[11px] font-semibold text-white shadow-sm">
                                            {userInitial}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-start overflow-hidden group-data-[collapsible=icon]:hidden">
                                        <span className="font-medium text-[11.5px] truncate w-full text-sidebar-foreground tracking-tight whitespace-nowrap">
                                            {userDisplayName}
                                        </span>
                                        <span className="text-[10px] text-sidebar-foreground/60 truncate w-full font-normal tracking-tight whitespace-nowrap">
                                            {organization?.name ||
                                                'Tax Professional'}
                                        </span>
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="text-[9px] px-1.5 py-0 h-4 font-normal shrink-0 group-data-[collapsible=icon]:hidden"
                                    >
                                        Pro
                                    </Badge>
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-52 bg-popover border-border text-popover-foreground"
                            >
                                <DropdownMenuItem
                                    className="cursor-pointer focus:bg-sidebar-accent focus:text-foreground transition-colors text-[13px] py-2.5"
                                    onClick={() =>
                                        router.push('/user/settings')
                                    }
                                >
                                    <User className="mr-2.5 h-4 w-4" />
                                    <span>Profile Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-sidebar-border" />
                                <DropdownMenuItem
                                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-red-50 transition-colors text-[13px] py-2.5"
                                    onClick={handleSignOut}
                                >
                                    <LogOut className="mr-2.5 h-4 w-4" />
                                    <span>Sign Out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            {/* Clickable rail for expand/collapse */}
            <SidebarRail />
        </Sidebar>
    );
}

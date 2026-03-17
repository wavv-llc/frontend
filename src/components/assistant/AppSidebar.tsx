'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useUser as useDbUser } from '@/contexts/UserContext';
import { useRouter, usePathname } from 'next/navigation';

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
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CreateProjectDialog } from '@/components/dialogs/CreateProjectDialog';

import {
    Plus,
    Settings,
    LogOut,
    User,
    Home,
    MessageSquare,
    Folder,
    ChevronRight,
    LayoutList,
    GripVertical,
    Archive,
    SquarePen,
} from 'lucide-react';
import { useSidebarRefresh } from '@/contexts/SidebarContext';
import {
    workspaceApi,
    chatApi,
    projectApi,
    workspaceUrlSegment,
    type Workspace,
    type Chat,
    type Project,
} from '@/lib/api';

function SortableWorkspaceItem({
    id,
    children,
}: {
    id: string;
    children: (
        dragHandleProps: React.HTMLAttributes<HTMLButtonElement>,
        isDragging: boolean,
    ) => React.ReactNode;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
    };
    return (
        <div ref={setNodeRef} style={style}>
            {children(
                {
                    ...(attributes as React.HTMLAttributes<HTMLButtonElement>),
                    ...(listeners as React.HTMLAttributes<HTMLButtonElement>),
                },
                isDragging,
            )}
        </div>
    );
}

function SortableProjectItem({
    id,
    children,
}: {
    id: string;
    children: (
        dragHandleProps: React.HTMLAttributes<HTMLButtonElement>,
        isDragging: boolean,
    ) => React.ReactNode;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
    };
    return (
        <div ref={setNodeRef} style={style}>
            {children(
                {
                    ...(attributes as React.HTMLAttributes<HTMLButtonElement>),
                    ...(listeners as React.HTMLAttributes<HTMLButtonElement>),
                },
                isDragging,
            )}
        </div>
    );
}

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
    const isGuest = dbUser?.organizationRole === 'GUEST';
    const organization = dbUser?.organization ?? null;

    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);
    const [chats, setChats] = useState<Chat[]>([]);
    const [chatsLoading, setChatsLoading] = useState(true);
    const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
        new Set(),
    );
    const [workspaceProjects, setWorkspaceProjects] = useState<
        Record<string, Project[]>
    >({});
    const [loadingProjects, setLoadingProjects] = useState<Set<string>>(
        new Set(),
    );
    const [createProjectWorkspaceId, setCreateProjectWorkspaceId] = useState<
        string | null
    >(null);
    const [chatsExpanded, setChatsExpanded] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await getTokenRef.current();
                if (!token) return;

                const workspacesResponse =
                    await workspaceApi.getWorkspaces(token);
                const fetched = workspacesResponse.data || [];
                setWorkspaces(fetched);

                // Auto-expand the workspace that's currently active in the URL
                const activeWorkspaceId = fetched.find((ws) =>
                    pathname?.includes(
                        `/workspaces/${workspaceUrlSegment(ws)}`,
                    ),
                )?.id;
                if (activeWorkspaceId) {
                    setExpandedWorkspaces(new Set([activeWorkspaceId]));
                    // Eagerly fetch its projects
                    try {
                        const projRes = await projectApi.getProjectsByWorkspace(
                            token,
                            activeWorkspaceId,
                        );
                        setWorkspaceProjects((prev) => ({
                            ...prev,
                            [activeWorkspaceId]: projRes.data || [],
                        }));
                    } catch {
                        // ignore
                    }
                }
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
    };
    const handleWorkspaceClick = (id: string) =>
        router.push(`/workspaces/${id}`);

    const handleToggleWorkspace = async (workspaceId: string) => {
        const isExpanded = expandedWorkspaces.has(workspaceId);
        setExpandedWorkspaces((prev) => {
            const next = new Set(prev);
            if (isExpanded) {
                next.delete(workspaceId);
            } else {
                next.add(workspaceId);
            }
            return next;
        });

        // Fetch projects if expanding and not yet loaded
        if (!isExpanded && !workspaceProjects[workspaceId]) {
            setLoadingProjects((prev) => new Set(prev).add(workspaceId));
            try {
                const token = await getTokenRef.current();
                if (!token) return;
                const res = await projectApi.getProjectsByWorkspace(
                    token,
                    workspaceId,
                );
                setWorkspaceProjects((prev) => ({
                    ...prev,
                    [workspaceId]: res.data || [],
                }));
            } catch {
                // silently fail — projects just won't show
            } finally {
                setLoadingProjects((prev) => {
                    const next = new Set(prev);
                    next.delete(workspaceId);
                    return next;
                });
            }
        }
    };
    const handleWorkspaceDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            let newOrder: typeof workspaces = [];
            setWorkspaces((prev) => {
                const oldIndex = prev.findIndex((w) => w.id === active.id);
                const newIndex = prev.findIndex((w) => w.id === over.id);
                newOrder = arrayMove(prev, oldIndex, newIndex);
                return newOrder;
            });
            try {
                const token = await getTokenRef.current();
                if (!token) return;
                await Promise.all(
                    newOrder.map((w, idx) =>
                        workspaceApi.updateWorkspace(token, w.id, {
                            order: idx,
                        }),
                    ),
                );
            } catch {
                // silent — order reverts on next page load
            }
        },
        [getTokenRef],
    );

    const handleProjectDragEnd = useCallback(
        async (workspaceId: string, event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            let newOrder: Project[] = [];
            setWorkspaceProjects((prev) => {
                const projects = prev[workspaceId] ?? [];
                const oldIndex = projects.findIndex((p) => p.id === active.id);
                const newIndex = projects.findIndex((p) => p.id === over.id);
                newOrder = arrayMove(projects, oldIndex, newIndex);
                return { ...prev, [workspaceId]: newOrder };
            });
            try {
                const token = await getTokenRef.current();
                if (!token) return;
                await Promise.all(
                    newOrder.map((p, idx) =>
                        projectApi.updateProject(token, p.id, { order: idx }),
                    ),
                );
            } catch {
                // silent — order reverts on next page load
            }
        },
        [getTokenRef],
    );

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
            icon: Archive,
            label: 'Archive',
            onClick: () => router.push('/archive'),
            isActive: pathname === '/archive',
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

    // Group chats by relative date
    const groupChatsByDate = (chatList: Chat[]) => {
        const now = new Date();
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
        );
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const groups: { label: string; chats: Chat[] }[] = [
            { label: 'Today', chats: [] },
            { label: 'Yesterday', chats: [] },
            { label: 'Previous 7 days', chats: [] },
            { label: 'Previous 30 days', chats: [] },
            { label: 'Older', chats: [] },
        ];

        for (const chat of chatList) {
            const date = new Date(chat.updatedAt);
            const dateOnly = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
            );
            if (dateOnly >= today) groups[0].chats.push(chat);
            else if (dateOnly >= yesterday) groups[1].chats.push(chat);
            else if (dateOnly >= sevenDaysAgo) groups[2].chats.push(chat);
            else if (dateOnly >= thirtyDaysAgo) groups[3].chats.push(chat);
            else groups[4].chats.push(chat);
        }

        return groups.filter((g) => g.chats.length > 0);
    };

    const chatGroups = groupChatsByDate(chats);

    return (
        <Sidebar collapsible="icon">
            {/* Header */}
            <SidebarHeader className="border-b border-sidebar-border px-2 py-3">
                {/* Expanded layout: logo + name/org + new-chat + trigger */}
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
                    <button
                        onClick={handleNewChat}
                        title="New chat"
                        className="h-7 w-7 shrink-0 flex items-center justify-center rounded hover:bg-sidebar-accent/60 text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
                    >
                        <SquarePen className="h-4 w-4" />
                    </button>
                    <SidebarTrigger className="h-7 w-7 shrink-0 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-transparent" />
                </div>

                {/* Collapsed layout: new-chat + trigger stacked */}
                <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-1">
                    <SidebarTrigger className="h-7 w-7 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-transparent" />
                    <button
                        onClick={handleNewChat}
                        title="New chat"
                        className="h-7 w-7 flex items-center justify-center rounded hover:bg-sidebar-accent/60 text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
                    >
                        <SquarePen className="h-4 w-4" />
                    </button>
                </div>
            </SidebarHeader>

            {/* Content */}
            <SidebarContent>
                {/* Primary nav */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map(
                                ({ icon: Icon, label, onClick, isActive }) => (
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
                    <SidebarGroupLabel className="h-auto py-2 px-0">
                        <button
                            onClick={() => router.push('/workspaces')}
                            className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors cursor-pointer"
                        >
                            Workspaces
                        </button>
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
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleWorkspaceDragEnd}
                                >
                                    <SortableContext
                                        items={workspaces.map((w) => w.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {workspaces.map((workspace) => {
                                            const isExpanded =
                                                expandedWorkspaces.has(
                                                    workspace.id,
                                                );
                                            const isWorkspaceActive =
                                                pathname?.includes(
                                                    `/workspaces/${workspaceUrlSegment(workspace)}`,
                                                );
                                            const projects =
                                                workspaceProjects[
                                                    workspace.id
                                                ] ?? [];
                                            const isLoadingProj =
                                                loadingProjects.has(
                                                    workspace.id,
                                                );
                                            return (
                                                <SortableWorkspaceItem
                                                    key={workspace.id}
                                                    id={workspace.id}
                                                >
                                                    {(dragHandleProps) => (
                                                        <>
                                                            <SidebarMenuItem>
                                                                <div className="flex items-center gap-0 group/ws">
                                                                    <button
                                                                        {...dragHandleProps}
                                                                        className="shrink-0 h-7 w-4 flex items-center justify-center opacity-0 group-hover/ws:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-sidebar-foreground/30 hover:text-sidebar-foreground/60"
                                                                        title="Drag to reorder"
                                                                    >
                                                                        <GripVertical className="h-3 w-3" />
                                                                    </button>
                                                                    <SidebarMenuButton
                                                                        onClick={() =>
                                                                            handleWorkspaceClick(
                                                                                workspaceUrlSegment(
                                                                                    workspace,
                                                                                ),
                                                                            )
                                                                        }
                                                                        isActive={
                                                                            isWorkspaceActive
                                                                        }
                                                                        className="text-[12.5px] font-normal cursor-pointer rounded-sm flex-1 min-w-0"
                                                                    >
                                                                        <Folder className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40" />
                                                                        <span className="truncate tracking-tight">
                                                                            {
                                                                                workspace.name
                                                                            }
                                                                        </span>
                                                                    </SidebarMenuButton>
                                                                    {!isGuest && (
                                                                        <button
                                                                            onClick={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                setCreateProjectWorkspaceId(
                                                                                    workspace.id,
                                                                                );
                                                                            }}
                                                                            className="shrink-0 h-7 w-6 flex items-center justify-center rounded hover:bg-sidebar-accent/50 transition-colors opacity-0 group-hover/ws:opacity-100"
                                                                            title="Add project"
                                                                        >
                                                                            <Plus className="h-3 w-3 text-sidebar-foreground/50" />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() =>
                                                                            handleToggleWorkspace(
                                                                                workspace.id,
                                                                            )
                                                                        }
                                                                        className="shrink-0 h-7 w-6 flex items-center justify-center rounded hover:bg-sidebar-accent/50 transition-colors mr-1"
                                                                        title={
                                                                            isExpanded
                                                                                ? 'Collapse'
                                                                                : 'Expand projects'
                                                                        }
                                                                    >
                                                                        <ChevronRight
                                                                            className={`h-3 w-3 text-sidebar-foreground/40 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
                                                                        />
                                                                    </button>
                                                                </div>
                                                            </SidebarMenuItem>

                                                            {isExpanded && (
                                                                <>
                                                                    {isLoadingProj ? (
                                                                        [
                                                                            1,
                                                                            2,
                                                                        ].map(
                                                                            (
                                                                                i,
                                                                            ) => (
                                                                                <SidebarMenuItem
                                                                                    key={
                                                                                        i
                                                                                    }
                                                                                >
                                                                                    <div className="flex items-center gap-2 pl-9 pr-2 py-1.5">
                                                                                        <Skeleton className="h-3 w-3 rounded-sm shrink-0" />
                                                                                        <Skeleton className="h-3 flex-1 rounded-sm" />
                                                                                    </div>
                                                                                </SidebarMenuItem>
                                                                            ),
                                                                        )
                                                                    ) : projects.length >
                                                                      0 ? (
                                                                        <DndContext
                                                                            sensors={
                                                                                sensors
                                                                            }
                                                                            collisionDetection={
                                                                                closestCenter
                                                                            }
                                                                            onDragEnd={(
                                                                                e,
                                                                            ) =>
                                                                                handleProjectDragEnd(
                                                                                    workspace.id,
                                                                                    e,
                                                                                )
                                                                            }
                                                                        >
                                                                            <SortableContext
                                                                                items={projects.map(
                                                                                    (
                                                                                        p,
                                                                                    ) =>
                                                                                        p.id,
                                                                                )}
                                                                                strategy={
                                                                                    verticalListSortingStrategy
                                                                                }
                                                                            >
                                                                                {projects.map(
                                                                                    (
                                                                                        project,
                                                                                    ) => (
                                                                                        <SortableProjectItem
                                                                                            key={
                                                                                                project.id
                                                                                            }
                                                                                            id={
                                                                                                project.id
                                                                                            }
                                                                                        >
                                                                                            {(
                                                                                                projDragHandleProps,
                                                                                            ) => (
                                                                                                <SidebarMenuItem>
                                                                                                    <div className="flex items-center group/proj">
                                                                                                        <button
                                                                                                            {...projDragHandleProps}
                                                                                                            className="shrink-0 h-7 w-4 flex items-center justify-center opacity-0 group-hover/proj:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-sidebar-foreground/30 hover:text-sidebar-foreground/60"
                                                                                                            title="Drag to reorder"
                                                                                                        >
                                                                                                            <GripVertical className="h-3 w-3" />
                                                                                                        </button>
                                                                                                        <SidebarMenuButton
                                                                                                            onClick={() =>
                                                                                                                router.push(
                                                                                                                    `/workspaces/${workspaceUrlSegment(workspace)}/projects/${project.slug ?? project.id}`,
                                                                                                                )
                                                                                                            }
                                                                                                            className="text-[12px] font-normal cursor-pointer rounded-sm pl-5 flex-1"
                                                                                                        >
                                                                                                            <LayoutList className="h-3 w-3 shrink-0 text-sidebar-foreground/30" />
                                                                                                            <span className="truncate tracking-tight">
                                                                                                                {
                                                                                                                    project.name
                                                                                                                }
                                                                                                            </span>
                                                                                                        </SidebarMenuButton>
                                                                                                    </div>
                                                                                                </SidebarMenuItem>
                                                                                            )}
                                                                                        </SortableProjectItem>
                                                                                    ),
                                                                                )}
                                                                            </SortableContext>
                                                                        </DndContext>
                                                                    ) : (
                                                                        <SidebarMenuItem>
                                                                            <div className="pl-9 py-1 text-[11px] text-sidebar-foreground/40 italic">
                                                                                No
                                                                                projects
                                                                            </div>
                                                                        </SidebarMenuItem>
                                                                    )}
                                                                    {!isGuest && (
                                                                        <SidebarMenuItem>
                                                                            <button
                                                                                onClick={() =>
                                                                                    setCreateProjectWorkspaceId(
                                                                                        workspace.id,
                                                                                    )
                                                                                }
                                                                                className="flex items-center gap-1.5 pl-9 pr-2 py-1.5 w-full text-[11.5px] text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors rounded-sm hover:bg-sidebar-accent/30"
                                                                            >
                                                                                <Plus className="h-3 w-3 shrink-0" />
                                                                                <span>
                                                                                    Add
                                                                                    project
                                                                                </span>
                                                                            </button>
                                                                        </SidebarMenuItem>
                                                                    )}
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </SortableWorkspaceItem>
                                            );
                                        })}
                                    </SortableContext>
                                </DndContext>
                            ) : (
                                <Empty
                                    icon={<Folder className="h-5 w-5" />}
                                    title="No workspaces"
                                    className="py-6"
                                />
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Conversations — always visible, grouped by date, collapsible */}
                <SidebarGroup className="group-data-[collapsible=icon]:hidden flex-1">
                    <SidebarGroupLabel className="h-auto py-2 px-0">
                        <div className="flex items-center justify-between w-full pr-1">
                            <button
                                onClick={() => setChatsExpanded((v) => !v)}
                                className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors cursor-pointer"
                            >
                                <ChevronRight
                                    className={`h-3 w-3 transition-transform duration-150 ${chatsExpanded ? 'rotate-90' : ''}`}
                                />
                                Conversations
                            </button>
                            <button
                                onClick={handleNewChat}
                                title="New chat"
                                className="h-5 w-5 flex items-center justify-center rounded hover:bg-sidebar-accent/60 text-sidebar-foreground/30 hover:text-sidebar-foreground transition-colors"
                            >
                                <Plus className="h-3 w-3" />
                            </button>
                        </div>
                    </SidebarGroupLabel>
                    {chatsExpanded && (
                        <SidebarGroupContent>
                            {chatsLoading ? (
                                <SidebarMenu>
                                    {[1, 2, 3, 4].map((i) => (
                                        <SidebarMenuItem key={i}>
                                            <div className="flex items-center gap-2 px-2 py-1.5">
                                                <Skeleton className="h-3 flex-1 rounded-sm" />
                                            </div>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            ) : chatGroups.length > 0 ? (
                                <div className="space-y-3">
                                    {chatGroups.map((group) => (
                                        <div key={group.label}>
                                            <div className="px-2 pb-1 text-[10px] font-medium text-sidebar-foreground/30 tracking-tight">
                                                {group.label}
                                            </div>
                                            <SidebarMenu>
                                                {group.chats.map((chat) => {
                                                    const label =
                                                        chat.title ||
                                                        chat.message;
                                                    return (
                                                        <SidebarMenuItem
                                                            key={chat.id}
                                                        >
                                                            <SidebarMenuButton
                                                                onClick={() =>
                                                                    handleChatClick(
                                                                        chat.id,
                                                                    )
                                                                }
                                                                isActive={
                                                                    pathname ===
                                                                    `/chats/${chat.id}`
                                                                }
                                                                tooltip={label.slice(
                                                                    0,
                                                                    40,
                                                                )}
                                                                className="text-[12.5px] font-normal cursor-pointer rounded-sm"
                                                            >
                                                                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                                                                <span className="truncate tracking-tight">
                                                                    {label.length >
                                                                    32
                                                                        ? label.slice(
                                                                              0,
                                                                              32,
                                                                          ) +
                                                                          '…'
                                                                        : label}
                                                                </span>
                                                            </SidebarMenuButton>
                                                        </SidebarMenuItem>
                                                    );
                                                })}
                                            </SidebarMenu>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-2 py-2 text-[11.5px] text-sidebar-foreground/35 italic">
                                    No conversations yet
                                </div>
                            )}
                        </SidebarGroupContent>
                    )}
                </SidebarGroup>

                {/* Icon mode: nav items for chats */}
                <SidebarGroup className="hidden group-data-[collapsible=icon]:block">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {chats.slice(0, 5).map((chat) => {
                                const label = chat.title || chat.message;
                                return (
                                    <SidebarMenuItem key={chat.id}>
                                        <SidebarMenuButton
                                            onClick={() =>
                                                handleChatClick(chat.id)
                                            }
                                            isActive={
                                                pathname === `/chats/${chat.id}`
                                            }
                                            tooltip={label.slice(0, 40)}
                                            className="cursor-pointer"
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            <span className="truncate">
                                                {label}
                                            </span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
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

            {/* Create Project Dialog */}
            {createProjectWorkspaceId && (
                <CreateProjectDialog
                    open={!!createProjectWorkspaceId}
                    onOpenChange={(open) => {
                        if (!open) setCreateProjectWorkspaceId(null);
                    }}
                    workspaceId={createProjectWorkspaceId}
                    onSuccess={async () => {
                        // Refresh projects for this workspace
                        const wsId = createProjectWorkspaceId;
                        if (!wsId) return;
                        try {
                            const token = await getTokenRef.current();
                            if (!token) return;
                            const res = await projectApi.getProjectsByWorkspace(
                                token,
                                wsId,
                            );
                            setWorkspaceProjects((prev) => ({
                                ...prev,
                                [wsId]: res.data || [],
                            }));
                            // Ensure expanded
                            setExpandedWorkspaces((prev) => {
                                const next = new Set(prev);
                                next.add(wsId);
                                return next;
                            });
                        } catch {
                            // ignore
                        }
                    }}
                />
            )}
        </Sidebar>
    );
}

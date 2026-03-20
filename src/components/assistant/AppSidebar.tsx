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
    useDroppable,
    DragOverlay,
    type DragEndEvent,
    type DragStartEvent,
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
    FileSpreadsheet,
    RotateCw,
    Search,
} from 'lucide-react';
import { toast } from 'sonner';
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
    children: (isDragging: boolean) => React.ReactNode;
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
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children(isDragging)}
        </div>
    );
}

function SortableProjectItem({
    id,
    children,
}: {
    id: string;
    children: (isDragging: boolean) => React.ReactNode;
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
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children(isDragging)}
        </div>
    );
}

/** Wrapper that makes a workspace's project list a droppable target for cross-workspace moves */
function DroppableWorkspaceProjects({
    workspaceId,
    children,
}: {
    workspaceId: string;
    children: React.ReactNode;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: `workspace-drop-${workspaceId}`,
        data: { workspaceId },
    });
    return (
        <div
            ref={setNodeRef}
            className={isOver ? 'bg-sidebar-accent/20 rounded-sm' : ''}
        >
            {children}
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
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

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

    /** Build a lookup: projectId → workspaceId */
    const projectToWorkspace = useCallback((): Record<string, string> => {
        const map: Record<string, string> = {};
        for (const [wsId, projects] of Object.entries(workspaceProjects)) {
            for (const p of projects) {
                map[p.id] = wsId;
            }
        }
        return map;
    }, [workspaceProjects]);

    const handleProjectDragStart = useCallback((event: DragStartEvent) => {
        setActiveProjectId(event.active.id as string);
    }, []);

    const handleProjectDragEnd = useCallback(
        async (event: DragEndEvent) => {
            setActiveProjectId(null);
            const { active, over } = event;
            if (!over) return;

            const activeId = active.id as string;
            const overId = over.id as string;
            const lookup = projectToWorkspace();
            const sourceWsId = lookup[activeId];

            // Determine target workspace: if dropped on a workspace droppable, use that;
            // if dropped on another project, use that project's workspace
            let targetWsId: string | undefined;
            if (overId.startsWith('workspace-drop-')) {
                targetWsId = over.data?.current?.workspaceId as
                    | string
                    | undefined;
            } else {
                targetWsId = lookup[overId];
            }

            if (!sourceWsId) return;
            if (!targetWsId) targetWsId = sourceWsId;

            if (sourceWsId === targetWsId) {
                // Same workspace — reorder
                if (activeId === overId) return;
                let newOrder: Project[] = [];
                setWorkspaceProjects((prev) => {
                    const projects = prev[sourceWsId] ?? [];
                    const oldIndex = projects.findIndex(
                        (p) => p.id === activeId,
                    );
                    const newIndex = projects.findIndex((p) => p.id === overId);
                    if (oldIndex === -1 || newIndex === -1) return prev;
                    newOrder = arrayMove(projects, oldIndex, newIndex);
                    return { ...prev, [sourceWsId]: newOrder };
                });
                try {
                    const token = await getTokenRef.current();
                    if (!token) return;
                    await Promise.all(
                        newOrder.map((p, idx) =>
                            projectApi.updateProject(token, p.id, {
                                order: idx,
                            }),
                        ),
                    );
                } catch {
                    // silent — order reverts on next page load
                }
            } else {
                // Cross-workspace move
                let movedProject: Project | undefined;
                let targetProjects: Project[] = [];
                setWorkspaceProjects((prev) => {
                    const sourceProjects = prev[sourceWsId] ?? [];
                    movedProject = sourceProjects.find(
                        (p) => p.id === activeId,
                    );
                    if (!movedProject) return prev;

                    const newSource = sourceProjects.filter(
                        (p) => p.id !== activeId,
                    );
                    const existingTarget = prev[targetWsId!] ?? [];

                    // Determine insert index
                    let insertIdx = existingTarget.length;
                    if (!overId.startsWith('workspace-drop-')) {
                        const overIdx = existingTarget.findIndex(
                            (p) => p.id === overId,
                        );
                        if (overIdx !== -1) insertIdx = overIdx;
                    }

                    const updatedProject = {
                        ...movedProject!,
                        workspaceId: targetWsId!,
                    };
                    targetProjects = [
                        ...existingTarget.slice(0, insertIdx),
                        updatedProject,
                        ...existingTarget.slice(insertIdx),
                    ];

                    return {
                        ...prev,
                        [sourceWsId]: newSource,
                        [targetWsId!]: targetProjects,
                    };
                });

                // Persist cross-workspace move + new order
                try {
                    const token = await getTokenRef.current();
                    if (!token || !movedProject) return;
                    await projectApi.updateProject(token, activeId, {
                        workspaceId: targetWsId,
                    });
                    await Promise.all(
                        targetProjects.map((p, idx) =>
                            projectApi.updateProject(token, p.id, {
                                order: idx,
                            }),
                        ),
                    );
                } catch {
                    // silent — reverts on next page load
                }
            }
        },
        [getTokenRef, projectToWorkspace],
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
                                    onDragStart={handleProjectDragStart}
                                    onDragEnd={(e) => {
                                        // Determine if this is a workspace drag or project drag
                                        const activeId = e.active.id as string;
                                        const isWorkspaceDrag = workspaces.some(
                                            (w) => w.id === activeId,
                                        );
                                        if (isWorkspaceDrag) {
                                            handleWorkspaceDragEnd(e);
                                        } else {
                                            handleProjectDragEnd(e);
                                        }
                                    }}
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
                                                    {() => (
                                                        <>
                                                            <SidebarMenuItem>
                                                                <div className="flex items-center gap-0 group/ws cursor-grab active:cursor-grabbing">
                                                                    <div className="shrink-0 h-7 w-4 flex items-center justify-center opacity-0 group-hover/ws:opacity-100 transition-opacity text-sidebar-foreground/30">
                                                                        <GripVertical className="h-3 w-3" />
                                                                    </div>
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
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger
                                                                                asChild
                                                                            >
                                                                                <button
                                                                                    onClick={(
                                                                                        e,
                                                                                    ) =>
                                                                                        e.stopPropagation()
                                                                                    }
                                                                                    className="shrink-0 h-7 w-6 flex items-center justify-center rounded hover:bg-sidebar-accent/50 transition-colors opacity-0 group-hover/ws:opacity-100"
                                                                                    title="Add project"
                                                                                >
                                                                                    <Plus className="h-3 w-3 text-sidebar-foreground/50" />
                                                                                </button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent
                                                                                side="right"
                                                                                align="start"
                                                                                className="w-52"
                                                                            >
                                                                                <DropdownMenuItem
                                                                                    onClick={() =>
                                                                                        setCreateProjectWorkspaceId(
                                                                                            workspace.id,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <Plus className="h-4 w-4 mr-2" />
                                                                                    Create
                                                                                    New
                                                                                    Project
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem
                                                                                    onClick={() =>
                                                                                        router.push(
                                                                                            '/archive',
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <Search className="h-4 w-4 mr-2" />
                                                                                    Search
                                                                                    Archived
                                                                                    Project
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuSeparator />
                                                                                <DropdownMenuItem
                                                                                    onClick={() =>
                                                                                        toast.info(
                                                                                            'Import from Excel is coming soon',
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                                                                    Import
                                                                                    from
                                                                                    Excel
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem
                                                                                    onClick={() =>
                                                                                        toast.info(
                                                                                            'Recurring Projects is coming soon',
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <RotateCw className="h-4 w-4 mr-2" />
                                                                                    Recurring
                                                                                    Projects
                                                                                </DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
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
                                                                        <DroppableWorkspaceProjects
                                                                            workspaceId={
                                                                                workspace.id
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
                                                                                            {() => (
                                                                                                <SidebarMenuItem>
                                                                                                    <div className="flex items-center group/proj cursor-grab active:cursor-grabbing">
                                                                                                        <div className="shrink-0 h-7 w-4 flex items-center justify-center opacity-0 group-hover/proj:opacity-100 transition-opacity text-sidebar-foreground/30">
                                                                                                            <GripVertical className="h-3 w-3" />
                                                                                                        </div>
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
                                                                        </DroppableWorkspaceProjects>
                                                                    ) : (
                                                                        <DroppableWorkspaceProjects
                                                                            workspaceId={
                                                                                workspace.id
                                                                            }
                                                                        >
                                                                            <SidebarMenuItem>
                                                                                <div className="pl-9 py-1 text-[11px] text-sidebar-foreground/40 italic">
                                                                                    No
                                                                                    projects
                                                                                </div>
                                                                            </SidebarMenuItem>
                                                                        </DroppableWorkspaceProjects>
                                                                    )}
                                                                    {!isGuest && (
                                                                        <SidebarMenuItem>
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger
                                                                                    asChild
                                                                                >
                                                                                    <button className="flex items-center gap-1.5 pl-9 pr-2 py-1.5 w-full text-[11.5px] text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors rounded-sm hover:bg-sidebar-accent/30 cursor-pointer">
                                                                                        <Plus className="h-3 w-3 shrink-0" />
                                                                                        <span>
                                                                                            Add
                                                                                            project
                                                                                        </span>
                                                                                    </button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent
                                                                                    side="right"
                                                                                    align="start"
                                                                                    className="w-52"
                                                                                >
                                                                                    <DropdownMenuItem
                                                                                        onClick={() =>
                                                                                            setCreateProjectWorkspaceId(
                                                                                                workspace.id,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <Plus className="h-4 w-4 mr-2" />
                                                                                        Create
                                                                                        New
                                                                                        Project
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem
                                                                                        onClick={() =>
                                                                                            router.push(
                                                                                                '/archive',
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <Search className="h-4 w-4 mr-2" />
                                                                                        Search
                                                                                        Archived
                                                                                        Project
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuSeparator />
                                                                                    <DropdownMenuItem
                                                                                        onClick={() =>
                                                                                            toast.info(
                                                                                                'Import from Excel is coming soon',
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                                                                                        Import
                                                                                        from
                                                                                        Excel
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem
                                                                                        onClick={() =>
                                                                                            toast.info(
                                                                                                'Recurring Projects is coming soon',
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <RotateCw className="h-4 w-4 mr-2" />
                                                                                        Recurring
                                                                                        Projects
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
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
                                    <DragOverlay>
                                        {activeProjectId
                                            ? (() => {
                                                  const proj = Object.values(
                                                      workspaceProjects,
                                                  )
                                                      .flat()
                                                      .find(
                                                          (p) =>
                                                              p.id ===
                                                              activeProjectId,
                                                      );
                                                  return proj ? (
                                                      <div className="flex items-center gap-1.5 pl-5 py-1 text-[12px] bg-sidebar rounded-sm shadow-md border border-sidebar-border px-2">
                                                          <LayoutList className="h-3 w-3 shrink-0 text-sidebar-foreground/30" />
                                                          <span className="truncate tracking-tight text-sidebar-foreground">
                                                              {proj.name}
                                                          </span>
                                                      </div>
                                                  ) : null;
                                              })()
                                            : null}
                                    </DragOverlay>
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

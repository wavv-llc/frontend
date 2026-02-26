'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    Folder,
    CheckSquare,
    MessageSquare,
    Settings,
    Home,
    Search,
} from 'lucide-react';
import {
    workspaceApi,
    projectApi,
    taskApi,
    chatApi,
    type Workspace,
    type Project,
    type Task,
    type Chat,
} from '@/lib/api';

interface SearchResults {
    workspaces: Workspace[];
    projects: Project[];
    tasks: Task[];
    chats: Chat[];
}

export function UniversalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults>({
        workspaces: [],
        projects: [],
        tasks: [],
        chats: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { getToken } = useAuth();

    // Keyboard shortcut: Cmd+K / Ctrl+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Fetch data when dialog opens or query changes
    const fetchResults = useCallback(
        async (searchQuery: string) => {
            try {
                setIsLoading(true);
                const token = await getToken();
                if (!token) return;

                const [workspacesRes, chatsRes] = await Promise.all([
                    workspaceApi.getWorkspaces(token),
                    chatApi.getChats(token),
                ]);

                const allWorkspaces = workspacesRes.data || [];
                const allChats = chatsRes.data || [];

                // Collect all projects from workspaces
                const allProjects: Project[] = [];
                const allTasks: Task[] = [];

                for (const ws of allWorkspaces) {
                    try {
                        const projRes = await projectApi.getProjectsByWorkspace(
                            token,
                            ws.id,
                        );
                        const projects = projRes.data || [];
                        allProjects.push(...projects);

                        // Collect tasks from each project (limit for perf)
                        for (const proj of projects.slice(0, 5)) {
                            try {
                                const taskRes = await taskApi.getTasksByProject(
                                    token,
                                    proj.id,
                                );
                                allTasks.push(
                                    ...(taskRes.data || []).slice(0, 20),
                                );
                            } catch {
                                // skip project
                            }
                        }
                    } catch {
                        // skip workspace
                    }
                }

                const q = searchQuery.toLowerCase();

                setResults({
                    workspaces: q
                        ? allWorkspaces.filter(
                              (w) =>
                                  w.name.toLowerCase().includes(q) ||
                                  w.description?.toLowerCase().includes(q),
                          )
                        : allWorkspaces.slice(0, 5),
                    projects: q
                        ? allProjects.filter(
                              (p) =>
                                  p.name.toLowerCase().includes(q) ||
                                  p.description?.toLowerCase().includes(q),
                          )
                        : allProjects.slice(0, 5),
                    tasks: q
                        ? allTasks.filter((t) =>
                              t.name.toLowerCase().includes(q),
                          )
                        : [],
                    chats: q
                        ? allChats.filter((c) =>
                              c.message.toLowerCase().includes(q),
                          )
                        : allChats.slice(0, 4),
                });
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsLoading(false);
            }
        },
        [getToken],
    );

    useEffect(() => {
        if (open) {
            fetchResults(query);
        }
    }, [open, query, fetchResults]);

    const navigate = (path: string) => {
        setOpen(false);
        setQuery('');
        router.push(path);
    };

    const hasResults =
        results.workspaces.length > 0 ||
        results.projects.length > 0 ||
        results.tasks.length > 0 ||
        results.chats.length > 0;

    return (
        <>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Search workspaces, projects, tasks..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    {isLoading && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            Searching...
                        </div>
                    )}

                    {!isLoading && !hasResults && query.length > 0 && (
                        <CommandEmpty>
                            No results found for &ldquo;{query}&rdquo;
                        </CommandEmpty>
                    )}

                    {!isLoading && (
                        <>
                            {/* Quick Nav */}
                            {!query && (
                                <CommandGroup heading="Quick Navigation">
                                    <CommandItem
                                        onSelect={() => navigate('/home')}
                                    >
                                        <Home className="mr-2 h-4 w-4 text-muted-foreground" />
                                        Home
                                    </CommandItem>
                                    <CommandItem
                                        onSelect={() => navigate('/workspaces')}
                                    >
                                        <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                                        All Workspaces
                                    </CommandItem>
                                    <CommandItem
                                        onSelect={() => navigate('/chats/new')}
                                    >
                                        <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                                        New Chat
                                    </CommandItem>
                                    <CommandItem
                                        onSelect={() =>
                                            navigate('/user/settings')
                                        }
                                    >
                                        <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                                        Settings
                                    </CommandItem>
                                </CommandGroup>
                            )}

                            {/* Workspaces */}
                            {results.workspaces.length > 0 && (
                                <CommandGroup heading="Workspaces">
                                    {results.workspaces.map((ws) => (
                                        <CommandItem
                                            key={ws.id}
                                            value={`workspace-${ws.id}-${ws.name}`}
                                            onSelect={() =>
                                                navigate(`/workspaces/${ws.id}`)
                                            }
                                        >
                                            <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                                            <span>{ws.name}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {/* Projects */}
                            {results.projects.length > 0 && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup heading="Projects">
                                        {results.projects.map((proj) => (
                                            <CommandItem
                                                key={proj.id}
                                                value={`project-${proj.id}-${proj.name}`}
                                                onSelect={() =>
                                                    navigate(
                                                        `/workspaces/${proj.workspaceId}/projects/${proj.id}`,
                                                    )
                                                }
                                            >
                                                <CheckSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <div className="flex flex-col">
                                                    <span>{proj.name}</span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}

                            {/* Tasks */}
                            {results.tasks.length > 0 && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup heading="Tasks">
                                        {results.tasks
                                            .slice(0, 8)
                                            .map((task) => (
                                                <CommandItem
                                                    key={task.id}
                                                    value={`task-${task.id}-${task.name}`}
                                                    onSelect={() =>
                                                        navigate(
                                                            `?taskId=${task.id}`,
                                                        )
                                                    }
                                                >
                                                    <CheckSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    <span className="truncate">
                                                        {task.name}
                                                    </span>
                                                </CommandItem>
                                            ))}
                                    </CommandGroup>
                                </>
                            )}

                            {/* Chats */}
                            {results.chats.length > 0 && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup heading="Conversations">
                                        {results.chats
                                            .slice(0, 4)
                                            .map((chat) => (
                                                <CommandItem
                                                    key={chat.id}
                                                    value={`chat-${chat.id}-${chat.message}`}
                                                    onSelect={() =>
                                                        navigate(
                                                            `/chats/${chat.id}`,
                                                        )
                                                    }
                                                >
                                                    <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    <span className="truncate max-w-sm">
                                                        {chat.message.length >
                                                        60
                                                            ? chat.message.slice(
                                                                  0,
                                                                  60,
                                                              ) + '...'
                                                            : chat.message}
                                                    </span>
                                                </CommandItem>
                                            ))}
                                    </CommandGroup>
                                </>
                            )}
                        </>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}

export function SearchTrigger() {
    return (
        <button
            onClick={() => {
                const event = new KeyboardEvent('keydown', {
                    key: 'k',
                    metaKey: true,
                    bubbles: true,
                });
                document.dispatchEvent(event);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-dashboard-text-muted bg-dashboard-bg border border-dashboard-border rounded-md hover:bg-dashboard-surface hover:border-accent-blue/30 transition-colors cursor-pointer"
        >
            <Search className="h-3.5 w-3.5" />
            <span>Search</span>
            <span className="flex items-center gap-0.5 text-[10px] text-dashboard-text-faint bg-dashboard-surface border border-dashboard-border rounded px-1 py-0.5 ml-1">
                <span>⌘</span>
                <span>K</span>
            </span>
        </button>
    );
}

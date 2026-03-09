'use client';

import { useState, useEffect, useRef } from 'react';
import {
    useParams,
    notFound,
    useRouter,
    useSearchParams,
} from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { ProjectListView } from '@/components/projects/ProjectListView';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    MoreHorizontal,
    Plus,
    Download,
    Users,
    Edit2,
    Trash2,
} from 'lucide-react';
import Link from 'next/link';
import {
    workspaceApi,
    projectApi,
    taskApi,
    type Workspace,
    type Project,
    type Task,
    type User,
} from '@/lib/api';
import { MemberPickerDialog } from '@/components/dialogs/MemberPickerDialog';
import { getCached, setCached, invalidateCached } from '@/lib/pageCache';
import { Badge } from '@/components/ui/badge';
import { CreateProjectDialog } from '@/components/dialogs/CreateProjectDialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

type WorkspacePageData = {
    workspace: Workspace;
    projects: Project[];
    tasks: Task[];
};

export default function WorkspaceDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { getToken } = useAuth();

    const workspaceId = params.id as string;
    const cacheKey = `workspace:${workspaceId}`;

    const [workspace, setWorkspace] = useState<Workspace | null>(
        () => getCached<WorkspacePageData>(cacheKey)?.workspace ?? null,
    );
    const [projects, setProjects] = useState<Project[]>(
        () => getCached<WorkspacePageData>(cacheKey)?.projects ?? [],
    );
    const [tasks, setTasks] = useState<Task[]>(
        () => getCached<WorkspacePageData>(cacheKey)?.tasks ?? [],
    );
    const [filteredTasks, setFilteredTasks] = useState<Task[]>(
        () => getCached<WorkspacePageData>(cacheKey)?.tasks ?? [],
    );
    const [isLoading, setIsLoading] = useState(() => !getCached(cacheKey));
    const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(
        searchParams.get('createProject') === 'true',
    );
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [membersDialogOpen, setMembersDialogOpen] = useState(false);
    const [memberPickerOpen, setMemberPickerOpen] = useState(false);
    const [editWorkspaceName, setEditWorkspaceName] = useState(
        () => getCached<WorkspacePageData>(cacheKey)?.workspace.name ?? '',
    );
    const [editWorkspaceDescription, setEditWorkspaceDescription] = useState(
        () =>
            getCached<WorkspacePageData>(cacheKey)?.workspace.description ?? '',
    );
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('You must be logged in');
                return;
            }

            // Fetch workspace details
            const workspaceResponse = await workspaceApi.getWorkspace(
                token,
                workspaceId,
            );
            if (!workspaceResponse.data) {
                notFound();
                return;
            }
            const fetchedWorkspace = workspaceResponse.data;
            setWorkspace(fetchedWorkspace);
            setEditWorkspaceName(fetchedWorkspace.name);
            setEditWorkspaceDescription(fetchedWorkspace.description || '');

            // Fetch projects for this workspace
            const projectsResponse = await projectApi.getProjectsByWorkspace(
                token,
                workspaceId,
            );
            const fetchedProjects = projectsResponse.data || [];
            setProjects(fetchedProjects);

            // Fetch tasks for all projects
            const allTasks: Task[] = [];
            for (const project of fetchedProjects) {
                const tasksResponse = await taskApi.getTasksByProject(
                    token,
                    project.id,
                );
                allTasks.push(...(tasksResponse.data || []));
            }
            setTasks(allTasks);
            setFilteredTasks(allTasks);
            setCached(cacheKey, {
                workspace: fetchedWorkspace,
                projects: fetchedProjects,
                tasks: allTasks,
            });
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load workspace data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [workspaceId]);

    const handleCreateProject = () => {
        setShowCreateProjectDialog(true);
    };

    const handleSuccess = () => {
        fetchData();
    };

    const handleInlineSave = async (name: string, description: string) => {
        if (!workspace) return;
        if (
            name.trim() === workspace.name &&
            description === (workspace.description || '')
        )
            return;
        if (!name.trim()) {
            setEditWorkspaceName(workspace.name);
            return;
        }
        try {
            const token = await getToken();
            if (!token) return;
            await workspaceApi.updateWorkspace(token, workspaceId, {
                name: name.trim(),
                description,
            });
            toast.success('Workspace updated');
            fetchData();
        } catch {
            toast.error('Failed to update workspace');
            setEditWorkspaceName(workspace.name);
            setEditWorkspaceDescription(workspace.description || '');
        }
    };

    const handleDeleteWorkspace = async () => {
        if (!workspace) return;

        if (workspace.name === 'My Workspace') {
            toast.error("Cannot delete 'My Workspace'");
            return;
        }

        if (deleteConfirmation !== workspace.name) {
            toast.error('Please type the workspace name exactly to confirm');
            return;
        }

        try {
            setIsSubmitting(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await workspaceApi.deleteWorkspace(token, workspaceId);
            toast.success('Workspace deleted successfully');
            invalidateCached(cacheKey, 'workspaces');
            setDeleteDialogOpen(false);
            router.push('/workspaces');
        } catch (error) {
            console.error('Failed to delete workspace:', error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to delete workspace',
            );
        } finally {
            setIsSubmitting(false);
            setDeleteConfirmation('');
        }
    };

    const handleExportWorkspace = () => {
        toast.info('Export functionality coming soon!');
    };

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-dashboard-bg overflow-hidden">
                {/* Header skeleton */}
                <div className="sticky top-0 z-10 border-b border-dashboard-border px-6 py-4 flex items-center justify-between shrink-0 bg-white/95">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-7 w-52" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
                {/* Toolbar skeleton */}
                <div className="px-6 py-3 flex items-center shrink-0 border-b border-dashboard-border">
                    <Skeleton className="h-8 w-28 rounded-lg" />
                </div>
                {/* Content skeleton */}
                <div className="flex-1 overflow-auto px-6 pb-6 pt-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (!workspace) {
        notFound();
        return null;
    }

    return (
        <>
            <div className="flex flex-col h-full bg-dashboard-bg overflow-hidden animate-in fade-in duration-300">
                {/* Header */}
                <div className="sticky top-0 z-10 border-b border-dashboard-border px-6 py-4 flex items-center justify-between shrink-0 bg-white/95 backdrop-blur-xl">
                    <div className="flex flex-col gap-1 max-w-2xl">
                        <div className="flex items-center gap-2 mb-1">
                            <Link href="/workspaces">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 -ml-1 text-dashboard-text-muted hover:text-dashboard-text-primary cursor-pointer"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <span className="text-sm text-dashboard-text-muted">
                                Workspaces
                            </span>
                            <span className="text-(--dashboard-text-muted)/40 text-sm">
                                /
                            </span>
                        </div>
                        {/* Inline-editable name */}
                        <input
                            ref={nameInputRef}
                            value={editWorkspaceName}
                            onChange={(e) =>
                                setEditWorkspaceName(e.target.value)
                            }
                            onBlur={() =>
                                handleInlineSave(
                                    editWorkspaceName,
                                    editWorkspaceDescription,
                                )
                            }
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur();
                                if (e.key === 'Escape') {
                                    setEditWorkspaceName(workspace.name);
                                    e.currentTarget.blur();
                                }
                            }}
                            className="text-2xl font-serif font-semibold tracking-tight text-dashboard-text-primary bg-transparent border border-transparent hover:bg-muted/30 focus:bg-muted/40 focus:border-dashboard-border focus:outline-none rounded px-1 -mx-1 py-0.5 w-full transition-colors"
                            title="Click to edit workspace name"
                        />
                        {/* Inline-editable description */}
                        <textarea
                            value={editWorkspaceDescription}
                            onChange={(e) =>
                                setEditWorkspaceDescription(e.target.value)
                            }
                            onBlur={() =>
                                handleInlineSave(
                                    editWorkspaceName,
                                    editWorkspaceDescription,
                                )
                            }
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setEditWorkspaceDescription(
                                        workspace.description || '',
                                    );
                                    e.currentTarget.blur();
                                }
                            }}
                            placeholder="Add a description..."
                            rows={1}
                            className="text-sm text-dashboard-text-muted bg-transparent border border-transparent hover:bg-muted/30 focus:bg-muted/40 focus:border-dashboard-border focus:outline-none rounded px-1 -mx-1 py-0.5 w-full resize-none transition-colors placeholder:text-muted-foreground/40 placeholder:italic"
                            title="Click to edit workspace description"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 hover:bg-accent-hover text-dashboard-text-muted hover:text-dashboard-text-primary"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                Options
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => nameInputRef.current?.focus()}
                            >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit Name / Description
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setMembersDialogOpen(true)}
                            >
                                <Users className="mr-2 h-4 w-4" />
                                Manage Members
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportWorkspace}>
                                <Download className="mr-2 h-4 w-4" />
                                Export Data
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setDeleteDialogOpen(true)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Workspace
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 flex items-center justify-between shrink-0 border-b border-dashboard-border bg-dashboard-surface/50">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 h-8 bg-dashboard-surface border-dashboard-border text-dashboard-text-body hover:bg-accent-subtle hover:text-dashboard-text-primary hover:border-accent-blue font-medium transition-all"
                            onClick={handleCreateProject}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            New Project
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto px-6 pb-6 pt-4">
                    <ProjectListView
                        projects={projects}
                        tasks={filteredTasks}
                        allTasks={tasks}
                        onRefresh={handleSuccess}
                    />
                </div>
            </div>

            <CreateProjectDialog
                open={showCreateProjectDialog}
                onOpenChange={setShowCreateProjectDialog}
                workspaceId={workspaceId}
                onSuccess={handleSuccess}
            />

            {/* Members Dialog (#2) */}
            <Dialog
                open={membersDialogOpen}
                onOpenChange={setMembersDialogOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-dashboard-text-muted" />
                            Workspace Members
                        </DialogTitle>
                        <DialogDescription>
                            {workspace.owners.length + workspace.members.length}{' '}
                            member
                            {workspace.owners.length +
                                workspace.members.length !==
                            1
                                ? 's'
                                : ''}{' '}
                            in <strong>{workspace.name}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-90 overflow-y-auto -mx-1 py-2 space-y-1">
                        {(
                            [
                                ...workspace.owners.map((u) => ({
                                    ...u,
                                    role: 'Owner' as const,
                                })),
                                ...workspace.members.map((u) => ({
                                    ...u,
                                    role: 'Member' as const,
                                })),
                            ] as (User & { role: 'Owner' | 'Member' })[]
                        ).map((member) => {
                            const initials = member.firstName
                                ? `${member.firstName[0]}${member.lastName?.[0] ?? ''}`.toUpperCase()
                                : member.email[0].toUpperCase();
                            const displayName = member.firstName
                                ? `${member.firstName} ${member.lastName ?? ''}`.trim()
                                : member.email;
                            return (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-dashboard-surface transition-colors group"
                                >
                                    <div className="h-8 w-8 rounded-full bg-accent-subtle border border-dashboard-border flex items-center justify-center text-xs font-semibold text-accent-blue shrink-0">
                                        {initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-dashboard-text-primary truncate">
                                            {displayName}
                                        </p>
                                        <p className="text-xs text-dashboard-text-muted truncate">
                                            {member.email}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className={
                                            member.role === 'Owner'
                                                ? 'bg-accent-subtle text-accent-blue border-accent-blue/20 text-xs'
                                                : 'bg-dashboard-surface text-dashboard-text-muted border-dashboard-border text-xs'
                                        }
                                    >
                                        {member.role}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 gap-2 border-dashboard-border text-dashboard-text-muted hover:text-dashboard-text-primary hover:border-accent-blue/40"
                            onClick={() => setMemberPickerOpen(true)}
                        >
                            <Users className="h-3.5 w-3.5" />
                            Add Member
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setMembersDialogOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Member Picker Dialog */}
            {workspace && (
                <MemberPickerDialog
                    open={memberPickerOpen}
                    onOpenChange={setMemberPickerOpen}
                    type="workspace"
                    targetId={workspace.id}
                    targetName={workspace.name}
                    existingMembers={[
                        ...workspace.owners,
                        ...workspace.members,
                    ]}
                    onSuccess={fetchData}
                />
            )}

            {/* Delete Workspace Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Workspace</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this workspace? All
                            projects in this workspace will be moved to your
                            &quot;My Workspace&quot;. This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Label>
                            Type{' '}
                            <span className="font-bold">{workspace?.name}</span>{' '}
                            to confirm
                        </Label>
                        <Input
                            value={deleteConfirmation}
                            onChange={(e) =>
                                setDeleteConfirmation(e.target.value)
                            }
                            placeholder="Enter workspace name"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setDeleteConfirmation('');
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteWorkspace}
                            disabled={
                                isSubmitting ||
                                deleteConfirmation !== workspace?.name
                            }
                        >
                            {isSubmitting ? 'Deleting...' : 'Delete Workspace'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

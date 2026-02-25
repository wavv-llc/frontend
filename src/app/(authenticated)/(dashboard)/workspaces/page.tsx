'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    Folder,
    Plus,
    MoreVertical,
    Trash2,
    Search,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { workspaceApi, type Workspace } from '@/lib/api';
import { CreateWorkspaceDialog } from '@/components/dialogs/CreateWorkspaceDialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export default function WorkspacesPage() {
    const { getToken } = useAuth();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [workspaceToDelete, setWorkspaceToDelete] =
        useState<Workspace | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchWorkspaces = async () => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('You must be logged in to view workspaces');
                return;
            }
            const response = await workspaceApi.getWorkspaces(token);
            setWorkspaces(response.data || []);
        } catch (error) {
            console.error('Failed to fetch workspaces:', error);
            toast.error('Failed to load workspaces');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    const handleCreateSuccess = () => {
        fetchWorkspaces();
    };

    const handleDeleteClick = (workspace: Workspace, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (workspace.name === 'My Workspace') {
            toast.error("Cannot delete 'My Workspace'");
            return;
        }
        setDeleteConfirmation('');
        setWorkspaceToDelete(workspace);
    };

    const handleConfirmDelete = async () => {
        if (!workspaceToDelete) return;
        if (workspaceToDelete.name === 'My Workspace') {
            toast.error("Cannot delete 'My Workspace'");
            return;
        }
        if (deleteConfirmation !== workspaceToDelete.name) {
            toast.error('Please type the workspace name exactly to confirm');
            return;
        }

        try {
            setIsDeleting(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }
            await workspaceApi.deleteWorkspace(token, workspaceToDelete.id);
            toast.success('Workspace deleted successfully');
            setWorkspaceToDelete(null);
            fetchWorkspaces();
        } catch (error) {
            console.error('Failed to delete workspace:', error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to delete workspace',
            );
        } finally {
            setIsDeleting(false);
            setDeleteConfirmation('');
        }
    };

    const filteredWorkspaces = workspaces.filter(
        (w) =>
            w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <>
            <div className="flex flex-col h-full bg-dashboard-bg overflow-hidden animate-in fade-in duration-300">
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-dashboard-border px-8 py-4 flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-2xl font-serif font-semibold tracking-tight text-dashboard-text-primary">
                            Workspaces
                        </h1>
                        <p className="text-sm text-dashboard-text-muted mt-0.5">
                            {isLoading
                                ? 'Loading…'
                                : `${workspaces.length} workspace${workspaces.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                    <Button
                        className="bg-accent-blue hover:bg-accent-light text-white gap-1.5 shadow-sm cursor-pointer"
                        onClick={() => setShowCreateDialog(true)}
                    >
                        <Plus className="h-4 w-4" />
                        New Workspace
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="px-8 py-3 border-b border-dashboard-border bg-dashboard-surface/50 shrink-0">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-dashboard-text-muted" />
                        <Input
                            placeholder="Search workspaces…"
                            className="pl-9 bg-dashboard-surface border-dashboard-border text-dashboard-text-body placeholder:text-dashboard-text-muted"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div>
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-4 px-8 py-4 border-b border-dashboard-border"
                                >
                                    <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-72" />
                                    </div>
                                    <Skeleton className="h-2 w-24 rounded-full" />
                                    <Skeleton className="h-3 w-12" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : filteredWorkspaces.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="h-14 w-14 rounded-xl bg-accent-subtle border border-dashboard-border flex items-center justify-center mb-4">
                                <Folder className="h-7 w-7 text-accent-blue" />
                            </div>
                            <p className="text-sm font-medium text-dashboard-text-primary mb-1">
                                {searchQuery
                                    ? 'No workspaces found'
                                    : 'No workspaces yet'}
                            </p>
                            <p className="text-xs text-dashboard-text-muted mb-4">
                                {searchQuery
                                    ? `No results for "${searchQuery}"`
                                    : 'Create your first workspace to get started.'}
                            </p>
                            {!searchQuery && (
                                <Button
                                    size="sm"
                                    className="bg-accent-blue hover:bg-accent-light text-white gap-1.5 cursor-pointer"
                                    onClick={() => setShowCreateDialog(true)}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Create Workspace
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div>
                            {/* Column headers */}
                            <div className="flex items-center gap-4 px-8 py-2 bg-[#f8f9fb] border-b border-dashboard-border">
                                <div className="w-9 shrink-0" />
                                <div className="flex-1 text-[11px] font-medium text-dashboard-text-muted uppercase tracking-wide">
                                    Name
                                </div>
                                <div className="w-36 text-[11px] font-medium text-dashboard-text-muted uppercase tracking-wide shrink-0">
                                    Progress
                                </div>
                                <div className="w-24 text-[11px] font-medium text-dashboard-text-muted uppercase tracking-wide shrink-0">
                                    Members
                                </div>
                                <div className="w-28 text-[11px] font-medium text-dashboard-text-muted uppercase tracking-wide shrink-0">
                                    Created
                                </div>
                                <div className="w-8 shrink-0" />
                            </div>

                            {filteredWorkspaces.map((workspace) => (
                                <Link
                                    key={workspace.id}
                                    href={`/workspaces/${workspace.id}`}
                                    className="block"
                                >
                                    <div className="flex items-center gap-4 px-8 py-3.5 border-b border-dashboard-border hover:bg-accent-subtle/30 transition-colors group cursor-pointer">
                                        {/* Icon */}
                                        <div className="h-9 w-9 rounded-lg bg-accent-subtle border border-dashboard-border flex items-center justify-center shrink-0">
                                            <Folder className="h-4 w-4 text-accent-blue" />
                                        </div>

                                        {/* Name + description */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-dashboard-text-primary group-hover:underline decoration-dashboard-text-muted/40 underline-offset-2 truncate">
                                                {workspace.name}
                                            </p>
                                            <p className="text-xs text-dashboard-text-muted truncate mt-0.5">
                                                {workspace.description ||
                                                    'No description'}
                                            </p>
                                        </div>

                                        {/* Progress */}
                                        <div className="w-36 flex items-center gap-2 shrink-0">
                                            <Progress
                                                value={workspace.progress || 0}
                                                className="h-1.5 flex-1"
                                            />
                                            <span className="text-[11px] text-dashboard-text-muted w-8 text-right tabular-nums">
                                                {workspace.progress || 0}%
                                            </span>
                                        </div>

                                        {/* Members */}
                                        <div className="w-24 flex items-center gap-1.5 text-xs text-dashboard-text-muted shrink-0">
                                            <Users className="h-3.5 w-3.5" />
                                            <span>
                                                {workspace.members.length +
                                                    workspace.owners.length}
                                            </span>
                                        </div>

                                        {/* Created date */}
                                        <div className="w-28 text-xs text-dashboard-text-muted shrink-0">
                                            {new Date(
                                                workspace.createdAt,
                                            ).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </div>

                                        {/* More menu */}
                                        <div className="w-8 shrink-0 flex justify-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-dashboard-text-muted hover:text-dashboard-text-primary cursor-pointer"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                        }}
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={(e) =>
                                                            handleDeleteClick(
                                                                workspace,
                                                                e,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CreateWorkspaceDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={handleCreateSuccess}
            />

            {/* Delete Workspace Dialog */}
            <Dialog
                open={!!workspaceToDelete}
                onOpenChange={(open) => !open && setWorkspaceToDelete(null)}
            >
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
                            <span className="font-bold">
                                {workspaceToDelete?.name}
                            </span>{' '}
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
                            onClick={() => setWorkspaceToDelete(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={
                                isDeleting ||
                                deleteConfirmation !== workspaceToDelete?.name
                            }
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Workspace'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

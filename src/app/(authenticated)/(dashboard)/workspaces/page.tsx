'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Folder, User, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceListSkeleton } from '@/components/skeletons/WorkspaceListSkeleton';
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

export default function WorkspacesPage() {
    const { getToken } = useAuth();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSkeleton, setShowSkeleton] = useState(false);
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

    useEffect(() => {
        const timer = setTimeout(() => setShowSkeleton(true), 150);
        return () => clearTimeout(timer);
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

    return (
        <>
            <div className="h-full bg-background p-8 overflow-y-auto animate-in fade-in duration-300">
                {/* Header */}
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight mb-2">
                                Workspaces
                            </h1>
                            <p className="text-muted-foreground">
                                Manage your tax projects and folders.
                            </p>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading ? (
                        showSkeleton ? (
                            <WorkspaceListSkeleton />
                        ) : null
                    ) : (
                        /* Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {workspaces.map((workspace) => (
                                <Link
                                    key={workspace.id}
                                    href={`/workspaces/${workspace.id}`}
                                    className="block h-full"
                                >
                                    <div className="group relative bg-card border border-border rounded-xl p-6 hover:bg-muted/30 transition-colors cursor-pointer h-full flex flex-col">
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-12 w-12 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                                                <Folder className="h-6 w-6" />
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                        }}
                                                    >
                                                        <MoreVertical className="h-5 w-5" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toast.info(
                                                                'Edit functionality coming soon!',
                                                            );
                                                        }}
                                                    >
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
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

                                        {/* Content */}
                                        <h3 className="font-semibold text-lg mb-2 group-hover:underline decoration-muted-foreground/30 underline-offset-4">
                                            {workspace.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-6 line-clamp-2 flex-1">
                                            {workspace.description ||
                                                'No description'}
                                        </p>

                                        {/* Progress */}
                                        <div className="mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary transition-all duration-500 rounded-full"
                                                        style={{
                                                            width: `${workspace.progress || 0}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground w-10 text-right font-medium">
                                                    {workspace.progress || 0}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <User className="h-4 w-4" />
                                                <span>
                                                    {workspace.members.length}{' '}
                                                    members
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}

                            {/* Create New Card */}
                            <button
                                onClick={() => setShowCreateDialog(true)}
                                className="cursor-pointer flex flex-col items-center justify-center h-full min-h-[280px] rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all group"
                            >
                                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                                    <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                                    Create New Workspace
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <CreateWorkspaceDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={handleCreateSuccess}
            />

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

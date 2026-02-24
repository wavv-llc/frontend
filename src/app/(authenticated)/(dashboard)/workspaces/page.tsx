'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Folder, User, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
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
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Empty } from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { H1 } from '@/components/ui/typography';

export default function WorkspacesPage() {
    const { getToken } = useAuth();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoading, setIsLoading] = useState(true);
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

    return (
        <>
            <div className="h-full bg-dashboard-bg p-8 overflow-y-auto animate-in fade-in duration-300">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <H1 className="text-2xl border-none pb-0 mb-1 text-dashboard-text-primary">
                                Workspaces
                            </H1>
                            <p className="text-sm text-muted-foreground">
                                Manage your tax projects and folders.
                            </p>
                        </div>
                        <Badge variant="secondary" className="mt-1">
                            {isLoading ? '—' : workspaces.length} workspaces
                        </Badge>
                    </div>

                    <Separator className="mb-6" />

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {isLoading ? (
                            [...Array(4)].map((_, i) => (
                                <Card
                                    key={i}
                                    className="flex flex-col gap-3 p-5"
                                >
                                    <div className="flex justify-between items-start">
                                        <Skeleton className="h-11 w-11 rounded-lg" />
                                    </div>
                                    <Skeleton className="h-5 w-3/4 mt-1" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <div className="mt-auto space-y-2 pt-2">
                                        <Skeleton className="h-2 w-full rounded-full" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                </Card>
                            ))
                        ) : workspaces.length === 0 ? (
                            <div className="col-span-full">
                                <Empty
                                    icon={<Folder className="h-7 w-7" />}
                                    title="No workspaces yet"
                                    description="Create your first workspace to start organizing your tax projects."
                                    action={
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                setShowCreateDialog(true)
                                            }
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Workspace
                                        </Button>
                                    }
                                    className="py-24"
                                />
                            </div>
                        ) : (
                            <>
                                {workspaces.map((workspace) => (
                                    <Link
                                        key={workspace.id}
                                        href={`/workspaces/${workspace.id}`}
                                        className="block h-full"
                                    >
                                        <Card className="group relative h-full flex flex-col hover:border-(--accent)/40 hover:shadow-sm transition-all duration-200 cursor-pointer">
                                            <CardHeader className="pb-3">
                                                <div className="flex justify-between items-start">
                                                    <div className="h-11 w-11 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                                                        <Folder className="h-5 w-5" />
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={(
                                                                    e,
                                                                ) => {
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
                                                                onClick={(
                                                                    e,
                                                                ) => {
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
                                                <CardTitle className="text-base font-semibold group-hover:underline decoration-muted-foreground/30 underline-offset-4">
                                                    {workspace.name}
                                                </CardTitle>
                                                <CardDescription className="line-clamp-2 text-xs">
                                                    {workspace.description ||
                                                        'No description'}
                                                </CardDescription>
                                            </CardHeader>

                                            <CardContent className="mt-auto pt-0">
                                                {/* Progress */}
                                                <div className="mb-3">
                                                    <Progress
                                                        value={
                                                            workspace.progress ||
                                                            0
                                                        }
                                                        className="h-1.5"
                                                    />
                                                    <p className="text-[10px] text-muted-foreground mt-1 text-right">
                                                        {workspace.progress ||
                                                            0}
                                                        % complete
                                                    </p>
                                                </div>

                                                <Separator className="mb-3" />

                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <User className="h-3.5 w-3.5" />
                                                    <span>
                                                        {
                                                            workspace.members
                                                                .length
                                                        }{' '}
                                                        members
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}

                                {/* Create New Card */}
                                <button
                                    onClick={() => setShowCreateDialog(true)}
                                    className="cursor-pointer flex flex-col items-center justify-center h-full min-h-48 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all group"
                                >
                                    <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                                        <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                                        Create New Workspace
                                    </span>
                                </button>
                            </>
                        )}
                    </div>
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
                            {isDeleting ? (
                                <span className="flex items-center gap-2">
                                    <Spinner
                                        size="sm"
                                        className="text-current"
                                    />
                                    Deleting...
                                </span>
                            ) : (
                                'Delete Workspace'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

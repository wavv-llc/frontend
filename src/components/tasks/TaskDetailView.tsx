'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    ArrowLeft,
    MoreVertical,
    Upload,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    FileText,
    X,
    Check,
    Edit2,
    Trash2,
    Copy,
    AlignLeft,
    Paperclip,
    Send,
    SmilePlus,
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EditTaskDialog } from '@/components/dialogs/EditTaskDialog';
import { cn } from '@/lib/utils';
import {
    type Task,
    type Comment,
    type User,
    taskApi,
    taskCommentApi,
} from '@/lib/api';
import { format } from 'date-fns';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

interface TaskDetailViewProps {
    task: Task;
    onBack: () => void;
    onUpdate?: () => void;
    onDelete?: () => void;
    workspaceName?: string;
    workspaceId?: string;
    projectName?: string;
    projectId?: string;
}

export function TaskDetailView({
    task,
    onBack,
    onUpdate,
    onDelete,
    workspaceName,
    workspaceId,
    projectName,
    projectId,
}: TaskDetailViewProps) {
    const { getToken } = useAuth();
    // const { user: currentUser } = useUser() - unused
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [newCommentContent, setNewCommentContent] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComposing, setIsComposing] = useState(false);

    const openCommentsCount = comments.filter(
        (c) => c.status !== 'RESOLVED',
    ).length;

    const loadComments = useCallback(
        async (showLoading = false) => {
            try {
                if (showLoading) {
                    setIsLoadingComments(true);
                }
                const token = await getToken();
                if (!token) return;

                const response = await taskCommentApi.getCommentsByTask(
                    token,
                    task.projectId,
                    task.id,
                );

                const commentsData = (response.data ||
                    []) as unknown as CommentResponse[];

                // Transform backend format to frontend format
                interface CommentResponse {
                    id: string;
                    comment?: string;
                    content?: string;
                    postedAt?: string;
                    createdAt: string;
                    updatedAt?: string;
                    postedByUser?: User;
                    user?: User;
                    resolved?: boolean;
                    resolvedBy?: User;
                    reactions?: Array<{
                        id: string;
                        emoji: string;
                        userId: string;
                        user: User;
                        commentId: string;
                        createdAt: string;
                    }>;
                    replies?: CommentResponse[];
                    parentCommentId?: string;
                }
                const transformComment = (c: CommentResponse): Comment => ({
                    id: c.id,
                    content: c.comment || c.content || '',
                    comment: c.comment || c.content || '',
                    createdAt: c.postedAt || c.createdAt,
                    updatedAt: c.updatedAt || c.createdAt,
                    user: c.postedByUser || c.user || { id: '', email: '' },
                    status: (c.resolved ? 'RESOLVED' : 'OPEN') as
                        | 'OPEN'
                        | 'RESOLVED',
                    resolved: c.resolved,
                    resolvedBy: c.resolvedBy,

                    reactions:
                        c.reactions?.map((r) => ({
                            id: r.id,
                            emoji: r.emoji,
                            userId: r.userId,
                            user: r.user,
                            commentId: r.commentId,
                            createdAt: r.createdAt,
                        })) || [],
                    replies: c.replies?.map(transformComment) || [],
                    parentId: c.parentCommentId,
                });

                const transformedComments: Comment[] = Array.isArray(
                    commentsData,
                )
                    ? commentsData.map(transformComment)
                    : [];

                setComments(transformedComments);
            } catch (error) {
                console.error('Failed to load comments:', error);
                // Silently fail - comments are optional
            } finally {
                if (showLoading) {
                    setIsLoadingComments(false);
                }
            }
        },
        [getToken, task.projectId, task.id],
    );

    // Load comments on mount
    useEffect(() => {
        loadComments(true);
    }, [loadComments]);

    const handleDeleteTask = async () => {
        try {
            setIsSubmitting(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await taskApi.deleteTask(token, task.projectId, task.id);
            toast.success('Task deleted successfully');
            setDeleteDialogOpen(false);
            onDelete?.();
            onBack();
        } catch (error) {
            console.error('Failed to delete task:', error);
            toast.error('Failed to delete task');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyTask = async () => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await taskApi.copyTask(token, task.projectId, task.id);
            toast.success('Task copied successfully');
            onUpdate?.();
        } catch (error) {
            console.error('Failed to copy task:', error);
            toast.error('Failed to copy task');
        }
    };

    const handleCreateComment = async () => {
        if (!newCommentContent.trim()) {
            toast.error('Comment cannot be empty');
            return;
        }

        try {
            setIsSubmitting(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await taskCommentApi.createComment(token, task.projectId, task.id, {
                comment: newCommentContent,
            });

            toast.success('Comment added');
            setNewCommentContent('');
            loadComments();
        } catch (error) {
            console.error('Failed to create comment:', error);
            toast.error('Failed to add comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Determine status color using design tokens
    const statusColor =
        task.status === 'COMPLETED'
            ? 'text-status-complete border-status-complete/30 bg-status-complete-bg'
            : task.status === 'IN_REVIEW'
              ? 'text-status-review border-status-review/30 bg-status-review-bg'
              : task.status === 'IN_PROGRESS'
                ? 'text-status-in-progress border-status-in-progress/30 bg-status-in-progress-bg'
                : 'text-status-pending border-dashboard-border bg-status-pending-bg';

    const statusLabel =
        task.status === 'COMPLETED'
            ? 'Completed'
            : task.status === 'IN_REVIEW'
              ? 'In Review'
              : task.status === 'IN_PROGRESS'
                ? 'In Progress'
                : 'Pending';

    return (
        <div className="flex flex-col h-full bg-dashboard-bg animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-dashboard-border px-8 py-4 flex flex-col gap-4 shrink-0">
                {/* Back & Breadcrumbs */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="hover:bg-accent-hover text-dashboard-text-muted hover:text-dashboard-text-primary -ml-2 cursor-pointer"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="text-sm text-dashboard-text-muted flex items-center gap-2">
                        {workspaceId ? (
                            <Link
                                href={`/workspaces/${workspaceId}`}
                                className="hover:text-dashboard-text-primary hover:underline transition-colors cursor-pointer"
                            >
                                {workspaceName || 'Workspace'}
                            </Link>
                        ) : (
                            <span>{workspaceName || 'Workspace'}</span>
                        )}
                        <span className="text-(--dashboard-text-muted)/40">
                            /
                        </span>
                        {workspaceId && (projectId || task.projectId) ? (
                            <Link
                                href={`/workspaces/${workspaceId}/projects/${projectId || task.projectId}`}
                                className="hover:text-dashboard-text-primary hover:underline transition-colors cursor-pointer"
                            >
                                {projectName ||
                                    task.project?.description ||
                                    'Project'}
                            </Link>
                        ) : (
                            <span>
                                {projectName ||
                                    task.project?.description ||
                                    'Project'}
                            </span>
                        )}
                        <span className="text-(--dashboard-text-muted)/40">
                            /
                        </span>
                        <span className="font-medium text-dashboard-text-primary">
                            {task.name}
                        </span>
                    </div>
                </div>

                {/* Title & Meta */}
                <div className="flex items-start justify-between">
                    <h1 className="text-2xl font-serif font-semibold tracking-tight text-dashboard-text-primary">
                        {task.name}
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-lg border border-dashboard-border bg-dashboard-surface shadow-sm flex flex-col items-start min-w-35 transition-colors">
                            <span className="text-[10px] uppercase font-semibold text-dashboard-text-muted tracking-wider mb-0.5">
                                Status
                            </span>
                            <span
                                className={cn(
                                    'font-semibold text-sm',
                                    task.status === 'COMPLETED' &&
                                        'text-status-complete',
                                    task.status === 'IN_PROGRESS' &&
                                        'text-status-in-progress',
                                    task.status === 'IN_REVIEW' &&
                                        'text-status-review',
                                    task.status === 'PENDING' &&
                                        'text-status-pending',
                                )}
                            >
                                {statusLabel}
                            </span>
                        </div>

                        {/* Open Comments Card */}
                        <div className="px-4 py-2 rounded-lg border border-dashboard-border bg-dashboard-surface shadow-sm flex flex-col items-start min-w-35">
                            <span className="text-[10px] uppercase font-semibold text-dashboard-text-muted tracking-wider mb-0.5">
                                To Resolve
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-dashboard-text-body">
                                    {openCommentsCount}{' '}
                                    {openCommentsCount === 1
                                        ? 'Thread'
                                        : 'Threads'}
                                </span>
                            </div>
                        </div>

                        {/* 3-Dot Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 ml-2 cursor-pointer hover:bg-accent-hover"
                                >
                                    <MoreVertical className="h-5 w-5 text-dashboard-text-muted" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => setEditDialogOpen(true)}
                                >
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit Task
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleCopyTask}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Task
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => setDeleteDialogOpen(true)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Task
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Assignees */}
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-dashboard-text-muted">
                            Assigned to:
                        </span>
                        {task.preparers && task.preparers.length > 0 ? (
                            <div className="flex items-center gap-2">
                                {task.preparers.map((u) => (
                                    <span
                                        key={u.id}
                                        className="font-medium text-dashboard-text-primary"
                                    >
                                        {u.firstName} {u.lastName}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-dashboard-text-muted italic">
                                Unassigned
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="w-px h-4 bg-dashboard-border mx-1" />
                        <span className="text-dashboard-text-muted">
                            Reviewer:
                        </span>
                        {task.reviewers && task.reviewers.length > 0 ? (
                            <div className="flex items-center gap-2">
                                {task.reviewers.map((u) => (
                                    <span
                                        key={u.id}
                                        className="font-medium text-dashboard-text-primary"
                                    >
                                        {u.firstName} {u.lastName}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-dashboard-text-muted italic">
                                No Reviewer
                            </span>
                        )}
                    </div>

                    <Badge
                        variant="outline"
                        className={cn(
                            'ml-2 font-normal bg-transparent',
                            statusColor,
                        )}
                    >
                        {statusLabel}
                    </Badge>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col gap-6 p-8 pb-20">
                {/* Description and Files Split Card */}
                <div className="bg-dashboard-surface rounded-xl border border-dashboard-border shadow-sm grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-dashboard-border overflow-hidden">
                    {/* Left Column: Description */}
                    <div className="p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-8 w-8 rounded-lg bg-accent-subtle text-accent-blue flex items-center justify-center border border-dashboard-border">
                                <AlignLeft className="h-4 w-4" />
                            </div>
                            <h3 className="font-serif font-semibold text-lg text-dashboard-text-primary">
                                Description
                            </h3>
                        </div>
                        <p className="text-dashboard-text-muted leading-relaxed whitespace-pre-line text-sm lg:text-base">
                            {task.description || 'No description provided.'}
                        </p>
                    </div>

                    {/* Right Column: Files */}
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-accent-subtle text-accent-blue flex items-center justify-center border border-dashboard-border">
                                    <Paperclip className="h-4 w-4" />
                                </div>
                                <h3 className="font-serif font-semibold text-lg text-dashboard-text-primary">
                                    Attachments
                                </h3>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUploadDialogOpen(true)}
                                className="h-8 border-dashboard-border text-dashboard-text-muted hover:text-dashboard-text-primary hover:border-accent-blue hover:bg-accent-subtle"
                            >
                                <Upload className="h-3.5 w-3.5 mr-2" />
                                Upload
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {task.linkedFiles && task.linkedFiles.length > 0 ? (
                                task.linkedFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className="group flex items-center justify-between p-3 rounded-lg border border-dashboard-border bg-dashboard-surface hover:border-accent-blue/30 hover:bg-accent-hover hover:shadow-sm transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-accent-subtle rounded-lg flex items-center justify-center text-accent-blue transition-colors">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-dashboard-text-body group-hover:text-accent-blue transition-colors">
                                                    {file.originalName}
                                                </p>
                                                <p className="text-[10px] text-dashboard-text-muted uppercase tracking-wider">
                                                    {(
                                                        file.filesize / 1024
                                                    ).toFixed(0)}{' '}
                                                    KB
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center border border-dashed border-dashboard-border rounded-xl bg-accent-subtle/50">
                                    <p className="text-sm text-dashboard-text-muted">
                                        No files attached yet
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="w-full">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-serif font-semibold text-lg text-dashboard-text-primary flex items-center gap-2">
                            <span>Comments</span>
                            <Badge
                                variant="secondary"
                                className="rounded-full px-2 h-5 text-xs bg-accent-subtle text-accent-blue border-dashboard-border"
                            >
                                {comments.length}
                            </Badge>
                        </h3>
                        <Button
                            onClick={() => setIsComposing(!isComposing)}
                            size="sm"
                            variant="outline"
                            className="gap-2 border-dashboard-border text-dashboard-text-muted hover:text-dashboard-text-primary hover:border-accent-blue hover:bg-accent-subtle"
                        >
                            <PlusIcon className="h-4 w-4" />
                            New Comment
                        </Button>
                    </div>

                    {/* New Comment Input */}
                    {isComposing && (
                        <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="rounded-xl border border-dashboard-border bg-dashboard-surface shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-accent-blue transition-all">
                                <Textarea
                                    value={newCommentContent}
                                    onChange={(e) =>
                                        setNewCommentContent(e.target.value)
                                    }
                                    placeholder="Write a new comment..."
                                    className="min-h-[100px] border-none focus-visible:ring-0 resize-none p-4 text-sm text-dashboard-text-body placeholder:text-dashboard-text-muted"
                                    autoFocus
                                />
                                <div className="flex items-center justify-end gap-2 p-2 bg-[#f8f9fa] border-t border-dashboard-border">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-dashboard-text-muted hover:text-dashboard-text-primary"
                                        onClick={() => setIsComposing(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={async () => {
                                            await handleCreateComment();
                                            setIsComposing(false);
                                        }}
                                        disabled={
                                            !newCommentContent.trim() ||
                                            isSubmitting
                                        }
                                        className="gap-2 bg-accent-blue hover:bg-accent-light text-white"
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                        Post Comment
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Thread View */}
                    <div className="space-y-6">
                        {isLoadingComments ? (
                            <div className="space-y-4">
                                {[1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="flex gap-4 animate-pulse"
                                    >
                                        <div className="h-10 w-10 bg-accent-subtle rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-accent-subtle rounded w-1/4" />
                                            <div className="h-20 bg-accent-subtle rounded-xl" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : comments.length === 0 && !isComposing ? (
                            <div className="text-center text-dashboard-text-muted py-12 border border-dashed border-dashboard-border rounded-xl bg-accent-subtle/30">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-dashboard-text-muted opacity-30" />
                                <p className="text-sm">
                                    No comments yet. Start the conversation!
                                </p>
                            </div>
                        ) : (
                            comments.map((comment, index) => (
                                <CommentThread
                                    key={comment.id}
                                    index={index + 1}
                                    comment={comment}
                                    onUpdate={loadComments}
                                    taskId={task.id}
                                    projectId={task.projectId}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Upload Dialog */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload File</DialogTitle>
                        <DialogDescription>
                            File upload functionality coming soon. This feature
                            will allow you to attach documents to tasks.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-8 text-center text-muted-foreground">
                        <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">
                            File upload will be implemented in a future update
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setUploadDialogOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <EditTaskDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                task={task}
                onSuccess={onUpdate || (() => {})}
            />

            {/* Delete Task Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Task</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this task? This
                            action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteTask}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Deleting...' : 'Delete Task'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Define recursive CommentItem component
function CommentItem({
    comment,
    depth = 0,
    onUpdate,
    taskId,
    projectId,
}: {
    comment: Comment;
    depth?: number;
    onUpdate: () => void;
    taskId: string;
    projectId: string;
}) {
    const { getToken, userId } = useAuth();
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Group reactions by emoji
    const reactionGroups =
        comment.reactions?.reduce(
            (acc, reaction) => {
                if (!acc[reaction.emoji]) {
                    acc[reaction.emoji] = [];
                }
                acc[reaction.emoji].push(reaction);
                return acc;
            },
            {} as Record<string, typeof comment.reactions>,
        ) || {};

    const handleReaction = async (emoji: string) => {
        try {
            const token = await getToken();
            if (!token) return;

            await taskCommentApi.toggleReaction(
                token,
                projectId,
                taskId,
                comment.id,
                emoji,
            );
            onUpdate();
        } catch (error) {
            console.error('Failed to toggle reaction:', error);
            toast.error('Failed to update reaction');
        }
    };

    const handleReply = async () => {
        if (!replyContent.trim()) return;

        try {
            setIsSubmitting(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await taskCommentApi.createComment(token, projectId, taskId, {
                comment: replyContent,
                parentId: comment.id,
            });

            toast.success('Reply added');
            setReplyContent('');
            setIsReplying(false);
            onUpdate();
        } catch (error) {
            console.error('Failed to reply:', error);
            toast.error('Failed to add reply');
        } finally {
            setIsSubmitting(false);
        }
    };

    const commentContent = comment.content || comment.comment || '';

    // Different styling for root vs nested comments
    const isRoot = depth === 0;

    return (
        <div
            className={cn(
                'relative',
                !isRoot && 'pl-4 ml-2 border-l-2 border-dashboard-border',
            )}
        >
            {/* Thread line visual connector if not root */}
            {!isRoot && (
                <div className="absolute top-4 left-[-2px] w-4 h-[2px] bg-dashboard-border"></div>
            )}

            <div
                className={cn(
                    'group relative animate-in fade-in slide-in-from-top-1 duration-200',
                    !isRoot && 'py-3',
                )}
            >
                <div className="flex gap-4">
                    <Avatar
                        className={cn(
                            'border border-dashboard-border shrink-0 cursor-default',
                            isRoot ? 'h-10 w-10' : 'h-8 w-8',
                        )}
                    >
                        <AvatarFallback className="bg-accent-subtle text-accent-blue text-xs font-medium">
                            {comment.user.firstName?.[0]}
                            {comment.user.lastName?.[0]}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-dashboard-text-primary truncate">
                                {comment.user.firstName} {comment.user.lastName}
                            </span>
                            <span className="text-xs text-dashboard-text-muted whitespace-nowrap">
                                {format(
                                    new Date(comment.createdAt),
                                    'MMM d, h:mm a',
                                )}
                            </span>
                        </div>

                        {/* Content */}
                        <div className="text-sm text-dashboard-text-body leading-relaxed whitespace-pre-wrap wrap-break-word">
                            {commentContent}
                        </div>

                        {/* Actions (Reactions + Reply) */}
                        <div className="flex items-center flex-wrap gap-2 mt-2">
                            {/* Reactions Logic */}
                            {Object.entries(reactionGroups).map(
                                ([emoji, reactions]) => {
                                    const hasReacted = reactions?.some(
                                        (r) => r.userId === userId,
                                    );
                                    return (
                                        <Button
                                            key={emoji}
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                'h-5 px-1.5 text-[10px] gap-1 rounded-full border border-dashboard-border bg-transparent hover:bg-accent-hover transition-colors',
                                                hasReacted &&
                                                    'bg-accent-subtle border-accent-blue/30 hover:bg-accent-subtle',
                                            )}
                                            onClick={() =>
                                                handleReaction(emoji)
                                            }
                                        >
                                            <span>{emoji}</span>
                                            <span
                                                className={cn(
                                                    'font-medium',
                                                    hasReacted
                                                        ? 'text-accent-blue'
                                                        : 'text-dashboard-text-muted',
                                                )}
                                            >
                                                {reactions?.length}
                                            </span>
                                        </Button>
                                    );
                                },
                            )}

                            {/* Add Reaction Button */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            'h-6 w-6 rounded-full p-0 text-dashboard-text-muted hover:bg-accent-hover transition-all opacity-0 group-hover:opacity-100 focus:opacity-100',
                                            Object.keys(reactionGroups).length >
                                                0 && 'opacity-100',
                                        )}
                                        title="Add reaction"
                                    >
                                        <SmilePlus className="h-3.5 w-3.5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-1"
                                    align="start"
                                    side="top"
                                >
                                    <div className="flex gap-0.5">
                                        {[
                                            '👍',
                                            '👎',
                                            '😄',
                                            '🎉',
                                            '😕',
                                            '❤️',
                                            '🚀',
                                            '👀',
                                        ].map((emoji) => (
                                            <button
                                                key={emoji}
                                                className="p-1.5 hover:bg-accent-hover rounded-md text-lg transition-colors leading-none"
                                                onClick={() =>
                                                    handleReaction(emoji)
                                                }
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Reply Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-dashboard-text-muted hover:text-dashboard-text-primary opacity-0 group-hover:opacity-100 focus:opacity-100 ml-1"
                                onClick={() => setIsReplying(!isReplying)}
                            >
                                Reply
                            </Button>
                        </div>

                        {/* Reply Input */}
                        {isReplying && (
                            <div className="mt-3 mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="rounded-xl border border-dashboard-border bg-dashboard-surface shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-accent-blue transition-all">
                                    <Textarea
                                        value={replyContent}
                                        onChange={(e) =>
                                            setReplyContent(e.target.value)
                                        }
                                        placeholder={`Replying to ${comment.user.firstName}...`}
                                        className="min-h-[60px] text-sm resize-none border-none focus-visible:ring-0 p-3"
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2 p-2 bg-[#f8f9fa] border-t border-dashboard-border">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-dashboard-text-muted hover:text-dashboard-text-primary"
                                            onClick={() => {
                                                setIsReplying(false);
                                                setReplyContent('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-accent-blue hover:bg-accent-light text-white"
                                            onClick={handleReply}
                                            disabled={
                                                !replyContent.trim() ||
                                                isSubmitting
                                            }
                                        >
                                            Reply
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recursively render children */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-1">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            depth={depth + 1}
                            onUpdate={onUpdate}
                            taskId={taskId}
                            projectId={projectId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function CommentThread({
    comment,
    index,
    onUpdate,
    taskId,
    projectId,
}: {
    comment: Comment;
    index: number;
    onUpdate: () => void;
    taskId: string;
    projectId: string;
}) {
    const { getToken } = useAuth();
    const [isOpen, setIsOpen] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReplying, setIsReplying] = useState(false); // Keep for main thread reply if needed
    const [replyContent, setReplyContent] = useState('');

    const isResolved = comment.status === 'RESOLVED';

    const handleResolve = async () => {
        try {
            setIsSubmitting(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await taskCommentApi.resolveComment(
                token,
                projectId,
                taskId,
                comment.id,
            );
            toast.success('Comment resolved');
            setIsOpen(false); // Auto-collapse on approval
            onUpdate();
        } catch (error) {
            console.error('Failed to resolve comment:', error);
            toast.error('Failed to resolve comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReopen = async () => {
        try {
            setIsSubmitting(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await taskCommentApi.reopenComment(
                token,
                projectId,
                taskId,
                comment.id,
            );
            toast.success('Comment reopened');
            onUpdate();
        } catch (error) {
            console.error('Failed to reopen comment:', error);
            toast.error('Failed to reopen comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Main thread reply (can be triggered from footer or header)
    const handleReply = async () => {
        if (!replyContent.trim()) return;

        try {
            setIsSubmitting(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await taskCommentApi.createComment(token, projectId, taskId, {
                comment: replyContent,
                parentId: comment.id, // Becomes a child of this thread root
            });

            toast.success('Reply added');
            setReplyContent('');
            setIsReplying(false);
            onUpdate();
        } catch (error) {
            console.error('Failed to reply:', error);
            toast.error('Failed to add reply');
        } finally {
            setIsSubmitting(false);
        }
    };

    // If resolved, show collapsed view by default
    if (isResolved && !isOpen) {
        return (
            <div className="rounded-xl border border-status-complete/30 bg-status-complete-bg overflow-hidden">
                <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-status-complete-bg/70 transition-colors"
                    onClick={() => setIsOpen(true)}
                >
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-status-complete-bg text-status-complete flex items-center justify-center border border-status-complete/30">
                            <Check className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-dashboard-text-primary">
                                    Comment #{index} - Resolved
                                </h4>
                            </div>
                            <p className="text-xs text-status-complete">
                                {comment.resolvedBy?.firstName
                                    ? `${comment.resolvedBy.firstName} resolved this comment`
                                    : 'Resolved'}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-dashboard-text-muted hover:text-dashboard-text-primary hover:bg-accent-hover"
                    >
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'rounded-xl border overflow-hidden transition-all duration-300',
                isResolved
                    ? 'border-status-complete/30 bg-status-complete-bg/30'
                    : 'border-dashboard-border bg-dashboard-surface',
            )}
        >
            {/* Header */}
            <div
                className={cn(
                    'flex items-center justify-between px-4 py-3 border-b cursor-pointer transition-colors',
                    isResolved
                        ? 'bg-status-complete-bg/50 border-status-complete/20 hover:bg-status-complete-bg/70'
                        : 'bg-accent-subtle border-dashboard-border hover:bg-accent-hover',
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    {/* Icon */}
                    {isResolved ? (
                        <div className="h-6 w-6 rounded-full bg-status-complete-bg text-status-complete flex items-center justify-center border border-status-complete/30">
                            <Check className="h-3.5 w-3.5" />
                        </div>
                    ) : (
                        <div className="h-6 w-6 rounded-full bg-accent-subtle text-accent-blue flex items-center justify-center border border-accent-blue/20">
                            <MessageSquare className="h-3.5 w-3.5" />
                        </div>
                    )}
                    {/* Text */}
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-dashboard-text-primary">
                                Comment #{index} -{' '}
                                {isResolved ? 'Resolved' : 'Open'}
                            </h4>
                        </div>
                        <p className="text-xs text-dashboard-text-muted">
                            {comment.replies?.length || 0} responses •{' '}
                            {isResolved ? 'Resolved' : 'Needs resolution'}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-dashboard-text-muted hover:text-dashboard-text-primary hover:bg-accent-hover opacity-70 hover:opacity-100"
                >
                    {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Content Body */}
            {isOpen && (
                <div className="bg-dashboard-surface">
                    <div className="p-6 pb-2">
                        {/* Render Root Comment Item (which handles its own content and replies recursively) */}
                        <CommentItem
                            comment={comment}
                            depth={0}
                            onUpdate={onUpdate}
                            taskId={taskId}
                            projectId={projectId}
                        />

                        {/* Thread Footer Actions (Resolve/Reopen) */}
                        <div className="flex items-center justify-between pt-4 border-t border-dashboard-border mt-2 mb-2">
                            <div className="flex items-center gap-3">
                                {!isResolved ? (
                                    <Button
                                        size="sm"
                                        className="bg-status-complete text-white hover:bg-status-complete/80 shadow-sm"
                                        onClick={handleResolve}
                                        disabled={isSubmitting}
                                    >
                                        <Check className="h-3.5 w-3.5 mr-2" />
                                        Approve & Resolve
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-dashboard-border text-dashboard-text-muted hover:bg-status-review-bg hover:text-status-review hover:border-status-review/30"
                                        onClick={handleReopen}
                                        disabled={isSubmitting}
                                    >
                                        <X className="h-3.5 w-3.5 mr-2" />
                                        Reopen
                                    </Button>
                                )}
                            </div>

                            {/* Main Reply Button (Alternative to inline) */}
                            {!isReplying && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-dashboard-text-muted hover:text-dashboard-text-primary hover:bg-accent-hover"
                                    onClick={() => setIsReplying(true)}
                                >
                                    Reply to Thread
                                </Button>
                            )}
                        </div>

                        {/* Footer Reply Input Area (If triggered from footer) */}
                        {isReplying && (
                            <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="rounded-xl border border-dashboard-border bg-dashboard-surface shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-accent-blue transition-all">
                                    <Textarea
                                        value={replyContent}
                                        onChange={(e) =>
                                            setReplyContent(e.target.value)
                                        }
                                        placeholder="Write a reply to the thread..."
                                        className="min-h-[80px] text-sm border-none focus-visible:ring-0 p-3 resize-none text-dashboard-text-body placeholder:text-dashboard-text-muted"
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2 p-2 bg-[#f8f9fa] border-t border-dashboard-border">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-dashboard-text-muted hover:text-dashboard-text-primary"
                                            onClick={() => setIsReplying(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-accent-blue hover:bg-accent-light text-white"
                                            onClick={handleReply}
                                            disabled={
                                                !replyContent.trim() ||
                                                isSubmitting
                                            }
                                        >
                                            Reply
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    );
}

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    ArrowLeft,
    MoreVertical,
    Upload,
    MessageSquare,
    FileText,
    Check,
    Edit2,
    Trash2,
    Copy,
    AlignLeft,
    Paperclip,
    SmilePlus,
    SlidersHorizontal,
    ArrowUp,
    CheckCircle2,
    MoreHorizontal,
    RotateCcw,
    UserCheck,
    CircleDot,
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
import Link from 'next/link';

// ─── Helper: compact relative timestamps ──────────────────────────────────────
function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 30) return format(date, 'MMM d');
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'just now';
}

// ─── Props ─────────────────────────────────────────────────────────────────────
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

// ─── TaskDetailView ────────────────────────────────────────────────────────────
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
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [newCommentContent, setNewCommentContent] = useState('');
    const [isCreatingThread, setIsCreatingThread] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const newThreadInputRef = useRef<HTMLInputElement>(null);

    // Description inline edit state
    const [descValue, setDescValue] = useState(task.description || '');
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const descRef = useRef<HTMLTextAreaElement>(null);

    // ── Activity items derived from task data ──────────────────────────────────
    const activityItems = useMemo(() => {
        const items: Array<{
            id: string;
            type: 'created' | 'assigned' | 'field';
            text: string;
            timestamp: string;
        }> = [];

        items.push({
            id: 'created',
            type: 'created',
            text: 'Task was created',
            timestamp: task.createdAt,
        });

        if (task.preparers && task.preparers.length > 0) {
            const names = task.preparers
                .map(
                    (p) =>
                        [p.firstName, p.lastName].filter(Boolean).join(' ') ||
                        p.email,
                )
                .join(', ');
            items.push({
                id: 'preparers',
                type: 'assigned',
                text: `Assigned to ${names}`,
                timestamp: task.createdAt,
            });
        }

        if (task.reviewers && task.reviewers.length > 0) {
            const names = task.reviewers
                .map(
                    (r) =>
                        [r.firstName, r.lastName].filter(Boolean).join(' ') ||
                        r.email,
                )
                .join(', ');
            items.push({
                id: 'reviewers',
                type: 'assigned',
                text: `${names} added as reviewers`,
                timestamp: task.createdAt,
            });
        }

        task.customFieldValues
            ?.filter((cfv) => cfv.value)
            .forEach((cfv) => {
                let displayValue = cfv.value;
                if (cfv.customField.dataType === 'DATE') {
                    try {
                        displayValue = format(
                            new Date(cfv.value),
                            'MMM d, yyyy',
                        );
                    } catch {
                        /* keep as-is */
                    }
                }
                items.push({
                    id: `cfv-${cfv.id}`,
                    type: 'field',
                    text: `Set ${cfv.customField.name} to ${displayValue}`,
                    timestamp: task.updatedAt,
                });
            });

        return items;
    }, [task]);

    const handleSaveDescription = async (value: string) => {
        const trimmed = value.trim();
        if (trimmed === (task.description || '')) {
            setIsEditingDesc(false);
            return;
        }
        try {
            const token = await getToken();
            if (!token) return;
            await taskApi.updateTask(token, task.projectId, task.id, {
                description: trimmed,
            });
            toast.success('Description updated');
            if (onUpdate) onUpdate();
        } catch {
            toast.error('Failed to update description');
            setDescValue(task.description || '');
        } finally {
            setIsEditingDesc(false);
        }
    };

    const openCommentsCount = comments.filter(
        (c) => c.status !== 'RESOLVED',
    ).length;

    const loadComments = useCallback(
        async (showLoading = false) => {
            try {
                if (showLoading) setIsLoadingComments(true);
                const token = await getToken();
                if (!token) return;

                const response = await taskCommentApi.getCommentsByTask(
                    token,
                    task.projectId,
                    task.id,
                );

                const commentsData = (response.data ||
                    []) as unknown as CommentResponse[];

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
            } finally {
                if (showLoading) setIsLoadingComments(false);
            }
        },
        [getToken, task.projectId, task.id],
    );

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
        if (!newCommentContent.trim()) return;

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
            toast.success('Thread started');
            setNewCommentContent('');
            setIsCreatingThread(false);
            loadComments();
        } catch (error) {
            console.error('Failed to create comment:', error);
            toast.error('Failed to start thread');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-dashboard-bg animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* ── Sticky Header ─────────────────────────────────────────────── */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-dashboard-border px-8 py-4 flex flex-col gap-3 shrink-0">
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

                {/* Title & Actions */}
                <div className="flex items-center justify-between gap-4">
                    <h1 className="text-2xl font-serif font-semibold tracking-tight text-dashboard-text-primary leading-tight">
                        {task.name}
                    </h1>
                    <div className="flex items-center gap-2 shrink-0">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 cursor-pointer hover:bg-accent-hover"
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
            </div>

            {/* ── Two-column layout ──────────────────────────────────────────── */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Main scrollable content */}
                <div className="flex-1 min-w-0 overflow-y-auto p-8 flex flex-col gap-6">
                    {/* ── Attachments ──────────────────────────────────────── */}
                    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border shadow-sm">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-dashboard-border">
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-lg bg-accent-subtle text-accent-blue flex items-center justify-center border border-dashboard-border">
                                    <Paperclip className="h-3.5 w-3.5" />
                                </div>
                                <h3 className="font-serif font-semibold text-base text-dashboard-text-primary">
                                    Attachments
                                </h3>
                                {task.linkedFiles &&
                                    task.linkedFiles.length > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="rounded-full px-2 h-5 text-xs bg-accent-subtle text-dashboard-text-muted border-dashboard-border"
                                        >
                                            {task.linkedFiles.length}
                                        </Badge>
                                    )}
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
                        <div className="p-6">
                            {task.linkedFiles && task.linkedFiles.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {task.linkedFiles.map((file) => (
                                        <div
                                            key={file.id}
                                            className="group flex items-center gap-3 p-3 rounded-lg border border-dashboard-border bg-dashboard-surface hover:border-accent-blue/30 hover:bg-accent-hover hover:shadow-sm transition-all cursor-pointer"
                                        >
                                            <div className="h-9 w-9 bg-accent-subtle rounded-lg flex items-center justify-center text-accent-blue shrink-0">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm text-dashboard-text-body group-hover:text-accent-blue transition-colors truncate">
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
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center border border-dashed border-dashboard-border rounded-xl bg-accent-subtle/30">
                                    <Paperclip className="h-8 w-8 mx-auto mb-2 text-dashboard-text-muted opacity-30" />
                                    <p className="text-sm text-dashboard-text-muted">
                                        No files attached yet
                                    </p>
                                    <button
                                        onClick={() =>
                                            setUploadDialogOpen(true)
                                        }
                                        className="mt-2 text-xs text-accent-blue hover:underline"
                                    >
                                        Upload a file
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Activity Log ─────────────────────────────────────── */}
                    {activityItems.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-dashboard-text-muted uppercase tracking-wider mb-3 px-1">
                                Activity
                            </h3>
                            <div className="relative">
                                {/* Vertical line */}
                                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-dashboard-border" />
                                <div className="flex flex-col gap-0">
                                    {activityItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start gap-3 py-2 pl-1"
                                        >
                                            {/* Icon */}
                                            <div
                                                className={cn(
                                                    'relative z-10 mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center rounded-full ring-2 ring-dashboard-bg',
                                                    item.type === 'created' &&
                                                        'bg-accent-blue',
                                                    item.type === 'assigned' &&
                                                        'bg-dashboard-text-muted',
                                                    item.type === 'field' &&
                                                        'bg-dashboard-border border border-dashboard-border bg-dashboard-surface',
                                                )}
                                            >
                                                {item.type === 'created' && (
                                                    <CircleDot className="h-2 w-2 text-white" />
                                                )}
                                                {item.type === 'assigned' && (
                                                    <UserCheck className="h-2 w-2 text-white" />
                                                )}
                                                {item.type === 'field' && (
                                                    <SlidersHorizontal className="h-1.5 w-1.5 text-dashboard-text-muted" />
                                                )}
                                            </div>
                                            {/* Text */}
                                            <p className="text-sm text-dashboard-text-muted leading-relaxed flex-1">
                                                {item.text}
                                                <span className="ml-2 text-xs text-dashboard-text-muted/50">
                                                    {formatRelativeTime(
                                                        new Date(
                                                            item.timestamp,
                                                        ),
                                                    )}
                                                </span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Comments ─────────────────────────────────────────── */}
                    <div>
                        {/* Section header */}
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="font-serif font-semibold text-lg text-dashboard-text-primary flex items-center gap-2">
                                <span>Comments</span>
                                <Badge
                                    variant="secondary"
                                    className="rounded-full px-2 h-5 text-xs bg-accent-subtle text-accent-blue border-dashboard-border"
                                >
                                    {comments.length}
                                </Badge>
                            </h3>
                            {openCommentsCount > 0 && (
                                <Badge
                                    variant="outline"
                                    className="text-xs text-dashboard-text-muted border-dashboard-border font-normal"
                                >
                                    {openCommentsCount} open
                                </Badge>
                            )}
                        </div>

                        {/* Comment container – Linear-style card */}
                        <div className="bg-dashboard-surface rounded-xl border border-dashboard-border shadow-sm overflow-hidden">
                            {/* Thread list */}
                            <div>
                                {isLoadingComments ? (
                                    <div className="p-6 space-y-6">
                                        {[1, 2].map((i) => (
                                            <div
                                                key={i}
                                                className="flex gap-3 animate-pulse"
                                            >
                                                <div className="h-8 w-8 bg-accent-subtle rounded-full shrink-0" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3.5 bg-accent-subtle rounded w-1/4" />
                                                    <div className="h-12 bg-accent-subtle rounded-lg" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="px-6 py-12 text-center">
                                        <MessageSquare className="h-9 w-9 mx-auto mb-3 text-dashboard-text-muted opacity-20" />
                                        <p className="text-sm text-dashboard-text-muted">
                                            No threads yet. Start a conversation
                                            below.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-dashboard-border/50">
                                        {comments.map((comment, index) => (
                                            <div
                                                key={comment.id}
                                                className="px-6 py-1"
                                            >
                                                <CommentThread
                                                    index={index + 1}
                                                    comment={comment}
                                                    onUpdate={loadComments}
                                                    taskId={task.id}
                                                    projectId={task.projectId}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* New thread input */}
                            <div className="border-t border-dashboard-border/60 px-4 py-3 bg-accent-subtle/20">
                                <div
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg border px-3.5 py-2.5 transition-all duration-150',
                                        isCreatingThread
                                            ? 'border-accent-blue/40 ring-1 ring-accent-blue/15 bg-dashboard-surface shadow-sm'
                                            : 'border-dashboard-border bg-dashboard-surface hover:border-accent-blue/25',
                                    )}
                                >
                                    <div className="h-7 w-7 rounded-full bg-accent-subtle border border-dashboard-border flex items-center justify-center shrink-0">
                                        <MessageSquare className="h-3 w-3 text-accent-blue/60" />
                                    </div>
                                    <input
                                        ref={newThreadInputRef}
                                        value={newCommentContent}
                                        onChange={(e) =>
                                            setNewCommentContent(e.target.value)
                                        }
                                        onFocus={() =>
                                            setIsCreatingThread(true)
                                        }
                                        onBlur={() => {
                                            if (!newCommentContent.trim())
                                                setIsCreatingThread(false);
                                        }}
                                        onKeyDown={(e) => {
                                            if (
                                                (e.metaKey || e.ctrlKey) &&
                                                e.key === 'Enter'
                                            ) {
                                                e.preventDefault();
                                                handleCreateComment();
                                            }
                                            if (e.key === 'Escape') {
                                                setNewCommentContent('');
                                                setIsCreatingThread(false);
                                                newThreadInputRef.current?.blur();
                                            }
                                        }}
                                        placeholder="Start a new thread…"
                                        className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-dashboard-text-muted text-dashboard-text-body"
                                    />
                                    {isCreatingThread && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 shrink-0 text-dashboard-text-muted hover:text-dashboard-text-primary"
                                                tabIndex={-1}
                                            >
                                                <Paperclip className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                className="h-7 w-7 shrink-0 bg-accent-blue text-white hover:bg-accent-light disabled:opacity-40"
                                                onClick={handleCreateComment}
                                                disabled={
                                                    !newCommentContent.trim() ||
                                                    isSubmitting
                                                }
                                            >
                                                <ArrowUp className="h-3.5 w-3.5" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right Sidebar ──────────────────────────────────────────── */}
                <div className="w-72 xl:w-80 shrink-0 border-l border-dashboard-border bg-dashboard-surface overflow-y-auto flex flex-col">
                    {/* Description */}
                    <div className="px-5 py-5 border-b border-dashboard-border">
                        <div className="flex items-center gap-2 mb-3">
                            <AlignLeft className="h-3.5 w-3.5 text-dashboard-text-muted" />
                            <h4 className="text-xs font-semibold text-dashboard-text-muted uppercase tracking-wider">
                                Description
                            </h4>
                        </div>
                        {isEditingDesc ? (
                            <textarea
                                ref={descRef}
                                value={descValue}
                                autoFocus
                                onChange={(e) => {
                                    setDescValue(e.target.value);
                                    const el = e.currentTarget;
                                    el.style.height = 'auto';
                                    el.style.height = `${el.scrollHeight}px`;
                                }}
                                onBlur={() => handleSaveDescription(descValue)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setDescValue(task.description || '');
                                        setIsEditingDesc(false);
                                    }
                                }}
                                className="w-full resize-none border-none focus:outline-none bg-accent-subtle/50 rounded px-2 py-1.5 text-sm text-dashboard-text-body leading-relaxed min-h-[80px]"
                            />
                        ) : (
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setIsEditingDesc(true)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setIsEditingDesc(true);
                                    }
                                }}
                                className="cursor-text group"
                                title="Click to edit description"
                            >
                                <p
                                    className={cn(
                                        'text-sm leading-relaxed whitespace-pre-line rounded px-1 py-0.5 -mx-1 transition-colors group-hover:bg-accent-subtle/50',
                                        descValue
                                            ? 'text-dashboard-text-body'
                                            : 'text-dashboard-text-muted/50 italic',
                                    )}
                                >
                                    {descValue || 'Add a description…'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Properties / Custom Fields */}
                    <div className="px-5 py-5 flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <SlidersHorizontal className="h-3.5 w-3.5 text-dashboard-text-muted" />
                            <h4 className="text-xs font-semibold text-dashboard-text-muted uppercase tracking-wider">
                                Properties
                            </h4>
                            {task.customFieldValues &&
                                task.customFieldValues.length > 0 && (
                                    <span className="ml-auto text-xs text-dashboard-text-muted/50">
                                        {task.customFieldValues.length}
                                    </span>
                                )}
                        </div>

                        {task.customFieldValues &&
                        task.customFieldValues.length > 0 ? (
                            <div className="flex flex-col">
                                {task.customFieldValues.map((cfv) => {
                                    const raw = cfv.value;
                                    const isRefType = [
                                        'TASK',
                                        'USER',
                                        'DOCUMENT',
                                    ].includes(cfv.customField.dataType);
                                    let displayValue: string;
                                    if (!raw) {
                                        displayValue = '—';
                                    } else if (
                                        cfv.customField.dataType === 'DATE'
                                    ) {
                                        try {
                                            displayValue = format(
                                                new Date(raw),
                                                'MMM d, yyyy',
                                            );
                                        } catch {
                                            displayValue = raw;
                                        }
                                    } else {
                                        displayValue = raw;
                                    }
                                    return (
                                        <div
                                            key={cfv.id}
                                            className="flex items-start justify-between gap-3 py-3 border-b border-dashboard-border/50 last:border-0"
                                        >
                                            <div className="flex flex-col gap-0.5 min-w-0 shrink-0 max-w-[45%]">
                                                <span className="text-[11px] font-medium text-dashboard-text-muted truncate">
                                                    {cfv.customField.name}
                                                </span>
                                                <span className="text-[10px] text-dashboard-text-muted/50 capitalize">
                                                    {cfv.customField.dataType.toLowerCase()}
                                                </span>
                                            </div>
                                            {isRefType && raw ? (
                                                <span className="text-xs font-mono text-dashboard-text-muted bg-accent-subtle border border-dashboard-border px-1.5 py-0.5 rounded shrink max-w-[50%] truncate">
                                                    {raw}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-dashboard-text-body font-medium text-right max-w-[50%] break-words">
                                                    {displayValue}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-dashboard-text-muted/50 italic">
                                No properties configured
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Upload Dialog ─────────────────────────────────────────────── */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload File</DialogTitle>
                        <DialogDescription>
                            File upload functionality coming soon.
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

// ─── CommentBubble ─────────────────────────────────────────────────────────────
// Renders a single comment (root or reply). Threading / layout is handled by
// CommentThread. Uses Tailwind named-group (group/bubble) so hover on a nested
// bubble does NOT trigger the parent bubble's hover pill.
function CommentBubble({
    comment,
    showThreadLine = false,
    isResolutionTarget = false,
    onUpdate,
    taskId,
    projectId,
    onResolve,
    avatarSizeClass = 'h-8 w-8',
}: {
    comment: Comment;
    showThreadLine?: boolean;
    isResolutionTarget?: boolean;
    onUpdate: () => void;
    taskId: string;
    projectId: string;
    onResolve?: () => void;
    avatarSizeClass?: string;
}) {
    const { getToken, userId } = useAuth();

    const reactionGroups =
        comment.reactions?.reduce(
            (acc, reaction) => {
                if (!acc[reaction.emoji]) acc[reaction.emoji] = [];
                acc[reaction.emoji]!.push(reaction);
                return acc;
            },
            {} as Record<string, typeof comment.reactions>,
        ) ?? {};

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
        } catch {
            toast.error('Failed to update reaction');
        }
    };

    const commentContent = comment.content || comment.comment || '';
    const relativeTime = formatRelativeTime(new Date(comment.createdAt));

    return (
        <div className="group/bubble relative flex gap-3 min-w-0">
            {/* Avatar column with optional thread line */}
            <div className="flex flex-col items-center shrink-0">
                <Avatar
                    className={cn(
                        avatarSizeClass,
                        'border border-dashboard-border shrink-0',
                    )}
                >
                    <AvatarFallback className="bg-accent-subtle text-accent-blue text-xs font-medium">
                        {comment.user.firstName?.[0]}
                        {comment.user.lastName?.[0]}
                    </AvatarFallback>
                </Avatar>
                {showThreadLine && (
                    <div className="w-px flex-1 min-h-5 mt-1 bg-border" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-3">
                {/* Header */}
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="font-medium text-sm text-dashboard-text-primary">
                        {comment.user.firstName} {comment.user.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {relativeTime}
                    </span>
                    {isResolutionTarget && (
                        <Badge
                            className={cn(
                                'h-4 px-1.5 text-[10px] font-medium rounded-sm',
                                'bg-green-50 text-green-700 border-green-200',
                            )}
                            variant="outline"
                        >
                            Resolved this
                        </Badge>
                    )}
                </div>

                {/* Body */}
                <div className="text-sm text-dashboard-text-body leading-relaxed whitespace-pre-wrap wrap-break-word">
                    {commentContent}
                </div>

                {/* Reaction pills */}
                {Object.keys(reactionGroups).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(reactionGroups).map(
                            ([emoji, reactions]) => {
                                const hasReacted = reactions?.some(
                                    (r) => r.userId === userId,
                                );
                                return (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReaction(emoji)}
                                        className={cn(
                                            'inline-flex items-center gap-0.5 h-5 px-1.5 rounded-full text-[11px] border transition-colors cursor-pointer',
                                            hasReacted
                                                ? 'bg-accent-subtle border-accent-blue/30 text-accent-blue'
                                                : 'bg-transparent border-dashboard-border text-dashboard-text-muted hover:bg-accent-hover',
                                        )}
                                    >
                                        <span>{emoji}</span>
                                        <span className="font-medium">
                                            {reactions?.length}
                                        </span>
                                    </button>
                                );
                            },
                        )}
                    </div>
                )}
            </div>

            {/* Hover action pill – absolute, right-aligned, named-group-scoped */}
            <div
                className={cn(
                    'absolute right-0 top-0 z-10',
                    'flex items-center gap-0.5 px-0.5 py-0.5',
                    'bg-background border border-dashboard-border rounded-md shadow-sm',
                    'opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-100',
                )}
            >
                {/* Emoji react */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-dashboard-text-muted hover:text-dashboard-text-primary"
                            title="Add reaction"
                        >
                            <SmilePlus className="h-3.5 w-3.5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto p-1"
                        side="top"
                        align="end"
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
                                    onClick={() => handleReaction(emoji)}
                                    className="p-1.5 hover:bg-accent-hover rounded text-base leading-none transition-colors"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Resolve thread (only on unresolved threads) */}
                {onResolve && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-dashboard-text-muted hover:text-green-600"
                        onClick={onResolve}
                        title="Resolve thread"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                )}

                {/* More options */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-dashboard-text-muted hover:text-dashboard-text-primary"
                        >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem>
                            <Edit2 className="h-3.5 w-3.5 mr-2" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

// ─── CommentThread ─────────────────────────────────────────────────────────────
// Renders a full thread: root comment → replies → resolution log → reply input.
// No card wrapper; thread lines connect avatars visually.
function CommentThread({
    comment,
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
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReplyFocused, setIsReplyFocused] = useState(false);
    const replyInputRef = useRef<HTMLInputElement>(null);

    const isResolved = comment.status === 'RESOLVED';
    const replies = comment.replies ?? [];
    const hasContent = replies.length > 0 || isResolved;

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
            toast.success('Thread resolved');
            onUpdate();
        } catch {
            toast.error('Failed to resolve thread');
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
            toast.success('Thread reopened');
            onUpdate();
        } catch {
            toast.error('Failed to reopen thread');
        } finally {
            setIsSubmitting(false);
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
            setIsReplyFocused(false);
            onUpdate();
        } catch {
            toast.error('Failed to add reply');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative py-3 border-b border-dashboard-border/40 last:border-0">
            {/* Root comment */}
            <CommentBubble
                comment={comment}
                showThreadLine={hasContent || isReplyFocused}
                onUpdate={onUpdate}
                taskId={taskId}
                projectId={projectId}
                onResolve={!isResolved ? handleResolve : undefined}
                avatarSizeClass="h-8 w-8"
            />

            {/* Replies */}
            {replies.map((reply, i) => (
                <CommentBubble
                    key={reply.id}
                    comment={reply}
                    showThreadLine={
                        i < replies.length - 1 ||
                        (!isResolved && isReplyFocused)
                    }
                    isResolutionTarget={isResolved && i === replies.length - 1}
                    onUpdate={onUpdate}
                    taskId={taskId}
                    projectId={projectId}
                    onResolve={!isResolved ? handleResolve : undefined}
                    avatarSizeClass="h-7 w-7"
                />
            ))}

            {/* Resolution log */}
            {isResolved && (
                <div className="flex items-center gap-2 ml-11 py-1.5">
                    <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 text-green-600" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {comment.resolvedBy?.firstName ? (
                            <>
                                <span className="font-medium text-dashboard-text-body">
                                    {comment.resolvedBy.firstName}
                                    {comment.resolvedBy.lastName
                                        ? ` ${comment.resolvedBy.lastName}`
                                        : ''}
                                </span>
                                {' resolved this thread'}
                                {replies.length > 0 && (
                                    <>
                                        {' with '}
                                        <span className="font-medium text-dashboard-text-body">
                                            {
                                                replies[replies.length - 1].user
                                                    .firstName
                                            }
                                            &apos;s
                                        </span>
                                        {' comment'}
                                    </>
                                )}
                            </>
                        ) : (
                            'Thread resolved'
                        )}
                    </p>
                    <button
                        onClick={handleReopen}
                        disabled={isSubmitting}
                        className="ml-auto text-xs text-muted-foreground hover:text-dashboard-text-primary transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                        <RotateCcw className="h-3 w-3" />
                        Reopen
                    </button>
                </div>
            )}

            {/* Inline reply input – always present on open threads, subtle until focused */}
            {!isResolved && (
                <div className="flex items-center gap-3 ml-11 mt-1">
                    <div
                        className={cn(
                            'flex-1 flex items-center gap-2 rounded-lg border px-3 transition-all duration-150',
                            isReplyFocused
                                ? 'border-accent-blue/40 ring-1 ring-accent-blue/15 bg-dashboard-surface'
                                : 'border-transparent bg-muted/40 hover:border-dashboard-border',
                        )}
                    >
                        <input
                            ref={replyInputRef}
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            onFocus={() => setIsReplyFocused(true)}
                            onBlur={() => {
                                if (!replyContent.trim())
                                    setIsReplyFocused(false);
                            }}
                            onKeyDown={(e) => {
                                if (
                                    (e.metaKey || e.ctrlKey) &&
                                    e.key === 'Enter'
                                ) {
                                    e.preventDefault();
                                    handleReply();
                                }
                                if (e.key === 'Escape') {
                                    setReplyContent('');
                                    setIsReplyFocused(false);
                                    replyInputRef.current?.blur();
                                }
                            }}
                            placeholder="Leave a reply…"
                            className="flex-1 text-sm bg-transparent border-none outline-none py-2 placeholder:text-muted-foreground text-dashboard-text-body"
                        />
                        {isReplyFocused && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-dashboard-text-primary"
                                    tabIndex={-1}
                                    title="Attach file"
                                >
                                    <Paperclip className="h-3 w-3" />
                                </Button>
                                <Button
                                    size="icon"
                                    className="h-6 w-6 shrink-0 bg-accent-blue text-white hover:bg-accent-light disabled:opacity-40"
                                    onClick={handleReply}
                                    disabled={
                                        !replyContent.trim() || isSubmitting
                                    }
                                    title="Send reply (⌘↵)"
                                >
                                    <ArrowUp className="h-3 w-3" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

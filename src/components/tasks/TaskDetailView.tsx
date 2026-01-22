'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { EditTaskDialog } from '@/components/dialogs/EditTaskDialog'
import { cn } from '@/lib/utils'
import { type Task, type Comment, taskApi, taskCommentApi } from '@/lib/api'
import { format } from 'date-fns'
import { useAuth, useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

interface TaskDetailViewProps {
    task: Task
    onBack: () => void
    onUpdate?: () => void
    onDelete?: () => void
    workspaceName?: string
    workspaceId?: string
    projectName?: string
    projectId?: string
}

export function TaskDetailView({ task, onBack, onUpdate, onDelete, workspaceName, workspaceId, projectName, projectId }: TaskDetailViewProps) {
    const { getToken } = useAuth()
    const { user: currentUser } = useUser()
    const [comments, setComments] = useState<Comment[]>([])
    const [isLoadingComments, setIsLoadingComments] = useState(false)
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [newCommentContent, setNewCommentContent] = useState('')

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isComposing, setIsComposing] = useState(false)

    const openCommentsCount = comments.filter(c => c.status !== 'RESOLVED').length


    const loadComments = async (showLoading = false) => {
        try {
            if (showLoading) {
                setIsLoadingComments(true)
            }
            const token = await getToken()
            if (!token) return

            const response = await taskCommentApi.getCommentsByTask(token, task.projectId, task.id)
            const commentsData = (response as any).data || (response as unknown as any[])

            // Transform backend format to frontend format
            const transformComment = (c: any): Comment => ({
                id: c.id,
                content: c.comment || c.content,
                comment: c.comment || c.content,
                createdAt: c.postedAt || c.createdAt,
                updatedAt: c.updatedAt,
                user: c.postedByUser || c.user,
                status: (c.resolved ? 'RESOLVED' : 'OPEN') as 'OPEN' | 'RESOLVED',
                resolved: c.resolved,
                resolvedBy: c.resolvedBy,
                reactions: c.reactions?.map((r: any) => ({
                    id: r.id,
                    emoji: r.emoji,
                    userId: r.userId,
                    user: r.user,
                    commentId: r.commentId,
                    createdAt: r.createdAt
                })) || [],
                replies: c.replies?.map(transformComment) || [],
                parentId: c.parentCommentId,
            })

            const transformedComments: Comment[] = Array.isArray(commentsData) ? commentsData.map(transformComment) : []

            setComments(transformedComments)
        } catch (error) {
            console.error('Failed to load comments:', error)
            // Silently fail - comments are optional
        } finally {
            if (showLoading) {
                setIsLoadingComments(false)
            }
        }
    }

    // Load comments on mount
    useEffect(() => {
        loadComments(true)
    }, [task.id])

    const handleStatusChange = async (newStatus: Task['status']) => {
        try {
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await taskApi.changeStatus(token, task.projectId, task.id, newStatus)
            toast.success('Task status updated')
            onUpdate?.()
        } catch (error) {
            console.error('Failed to update status:', error)
            toast.error('Failed to update task status')
        }
    }



    const handleDeleteTask = async () => {
        try {
            setIsSubmitting(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await taskApi.deleteTask(token, task.projectId, task.id)
            toast.success('Task deleted successfully')
            setDeleteDialogOpen(false)
            onDelete?.()
            onBack()
        } catch (error) {
            console.error('Failed to delete task:', error)
            toast.error('Failed to delete task')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCopyTask = async () => {
        try {
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await taskApi.copyTask(token, task.projectId, task.id)
            toast.success('Task copied successfully')
            onUpdate?.()
        } catch (error) {
            console.error('Failed to copy task:', error)
            toast.error('Failed to copy task')
        }
    }

    const handleCreateComment = async () => {
        if (!newCommentContent.trim()) {
            toast.error('Comment cannot be empty')
            return
        }

        try {
            setIsSubmitting(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await taskCommentApi.createComment(token, task.projectId, task.id, {
                comment: newCommentContent
            })

            toast.success('Comment added')
            setNewCommentContent('')
            loadComments()
        } catch (error) {
            console.error('Failed to create comment:', error)
            toast.error('Failed to add comment')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Determine status color
    const statusColor = task.status === 'COMPLETED' ? 'text-emerald-600 border-emerald-200' :
        task.status === 'IN_REVIEW' ? 'text-amber-600 border-amber-200' :
            task.status === 'IN_PROGRESS' ? 'text-blue-600 border-blue-200' :
                'text-muted-foreground border-border'

    const statusLabel = task.status === 'COMPLETED' ? 'Completed' :
        task.status === 'IN_REVIEW' ? 'In Review' :
            task.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending'

    const unresolvedComments = comments.filter(c => c.status === 'OPEN').length

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in slide-in-from-bottom-4 duration-300 p-8">
            {/* Header Section */}
            <div className="flex flex-col gap-6 pb-6 border-b border-border">
                {/* Back & Breadcrumbs */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted -ml-2 cursor-pointer">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                        {workspaceId ? (
                            <Link href={`/workspaces/${workspaceId}`} className="hover:text-foreground hover:underline transition-colors cursor-pointer">
                                {workspaceName || 'Workspace'}
                            </Link>
                        ) : (
                            <span>{workspaceName || 'Workspace'}</span>
                        )}
                        <span className="text-muted-foreground/40">/</span>
                        {workspaceId && (projectId || task.projectId) ? (
                            <Link href={`/workspaces/${workspaceId}/projects/${projectId || task.projectId}`} className="hover:text-foreground hover:underline transition-colors cursor-pointer">
                                {projectName || task.project?.description || 'Project'}
                            </Link>
                        ) : (
                            <span>{projectName || task.project?.description || 'Project'}</span>
                        )}
                        <span className="text-muted-foreground/40">/</span>
                        <span className="font-medium text-foreground">{task.name}</span>
                    </div>
                </div>

                {/* Title & Meta */}
                <div className="flex items-start justify-between">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{task.name}</h1>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-xl border border-border bg-card shadow-sm flex flex-col items-start min-w-[140px] transition-colors">
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-0.5">Status</span>
                            <span className={cn("font-semibold text-sm",
                                task.status === 'COMPLETED' && "text-emerald-600",
                                task.status === 'IN_PROGRESS' && "text-blue-600",
                                task.status === 'IN_REVIEW' && "text-amber-600"
                            )}>
                                {statusLabel}
                            </span>
                        </div>

                        {/* Open Comments Card */}
                        <div className="px-4 py-2 rounded-xl border border-border bg-card shadow-sm flex flex-col items-start min-w-[140px]">
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-0.5">To Resolve</span>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{openCommentsCount} {openCommentsCount === 1 ? 'Thread' : 'Threads'}</span>
                            </div>
                        </div>

                        {/* 3-Dot Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 cursor-pointer">
                                    <MoreVertical className="h-5 w-5 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
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
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                        <span className="text-muted-foreground">Assigned to:</span>
                        {(task.preparers && task.preparers.length > 0) ? (
                            <div className="flex items-center gap-2">
                                {task.preparers.map(u => (
                                    <span key={u.id} className="font-medium text-foreground">{u.firstName} {u.lastName}</span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-muted-foreground italic">Unassigned</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                        <span className="text-muted-foreground w-px h-4 bg-border mx-2" />
                        <span className="text-muted-foreground">Reviewer:</span>
                        {(task.reviewers && task.reviewers.length > 0) ? (
                            <div className="flex items-center gap-2">
                                {task.reviewers.map(u => (
                                    <span key={u.id} className="font-medium text-foreground">{u.firstName} {u.lastName}</span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-muted-foreground italic">No Reviewer</span>
                        )}
                    </div>

                    <Badge variant="outline" className={cn("ml-2 font-normal bg-transparent cursor-pointer hover:bg-muted/50", statusColor)}>
                        {statusLabel}
                    </Badge>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col gap-8 mt-8 pb-20">
                {/* Description and Files Split Card */}
                <div className="bg-card rounded-xl border border-border shadow-sm grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border overflow-hidden">
                    {/* Left Column: Description */}
                    <div className="p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                                <AlignLeft className="h-4 w-4" />
                            </div>
                            <h3 className="font-semibold text-lg">Description</h3>
                        </div>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm lg:text-base">
                            {task.description || "No description provided."}
                        </p>
                    </div>

                    {/* Right Column: Files */}
                    <div className="p-8 bg-muted/5 lg:bg-transparent">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                    <Paperclip className="h-4 w-4" />
                                </div>
                                <h3 className="font-semibold text-lg">Attachments</h3>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)} className="h-8">
                                <Upload className="h-3.5 w-3.5 mr-2" />
                                Upload
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {task.linkedFiles && task.linkedFiles.length > 0 ? (
                                task.linkedFiles.map((file) => (
                                    <div key={file.id} className="group flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{file.originalName}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{(file.filesize / 1024).toFixed(0)} KB</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center border border-dashed border-border rounded-xl bg-muted/30">
                                    <p className="text-sm text-muted-foreground">No files attached yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="w-full">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <span>Comments</span>
                            <Badge variant="secondary" className="rounded-full px-2 h-5 text-xs">
                                {comments.length}
                            </Badge>
                        </h3>
                        <Button onClick={() => setIsComposing(!isComposing)} size="sm" variant="outline" className="gap-2">
                            <PlusIcon className="h-4 w-4" />
                            New Comment
                        </Button>
                    </div>

                    {/* New Comment Input */}
                    {isComposing && (
                        <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="rounded-xl border border-border/30 bg-card shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/3 transition-all">
                                <Textarea
                                    value={newCommentContent}
                                    onChange={(e) => setNewCommentContent(e.target.value)}
                                    placeholder="Write a new comment..."
                                    className="min-h-[100px] border-none focus-visible:ring-0 resize-none p-4 text-sm"
                                    autoFocus
                                />
                                <div className="flex items-center justify-end gap-2 p-2 bg-muted/30 border-t border-border/50">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setIsComposing(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={async () => {
                                            await handleCreateComment()
                                            setIsComposing(false)
                                        }}
                                        disabled={!newCommentContent.trim() || isSubmitting}
                                        className="gap-2"
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
                                {[1, 2].map(i => (
                                    <div key={i} className="flex gap-4 animate-pulse">
                                        <div className="h-10 w-10 bg-muted rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-muted rounded w-1/4" />
                                            <div className="h-20 bg-muted rounded-xl" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : comments.length === 0 && !isComposing ? (
                            <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-xl">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p className="text-sm">No comments yet. Start the conversation!</p>
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
                            File upload functionality coming soon. This feature will allow you to attach documents to tasks.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-8 text-center text-muted-foreground">
                        <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">File upload will be implemented in a future update</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <EditTaskDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                task={task}
                onSuccess={onUpdate || (() => { })}
            />

            {/* Delete Task Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Task</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this task? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteTask} disabled={isSubmitting}>
                            {isSubmitting ? 'Deleting...' : 'Delete Task'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


        </div>
    )
}

// Define recursive CommentItem component
function CommentItem({ comment, depth = 0, onUpdate, taskId, projectId, isLast }: {
    comment: Comment
    depth?: number
    onUpdate: () => void
    taskId: string
    projectId: string
    isLast?: boolean
}) {
    const { getToken, userId } = useAuth()
    const { user } = useUser()
    const [isReplying, setIsReplying] = useState(false)
    const [replyContent, setReplyContent] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Group reactions by emoji
    const reactionGroups = comment.reactions?.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = []
        }
        acc[reaction.emoji].push(reaction)
        return acc
    }, {} as Record<string, typeof comment.reactions>) || {}

    const handleReaction = async (emoji: string) => {
        try {
            const token = await getToken()
            if (!token) return

            await taskCommentApi.toggleReaction(token, projectId, taskId, comment.id, emoji)
            onUpdate()
        } catch (error) {
            console.error('Failed to toggle reaction:', error)
            toast.error('Failed to update reaction')
        }
    }

    const handleReply = async () => {
        if (!replyContent.trim()) return

        try {
            setIsSubmitting(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await taskCommentApi.createComment(token, projectId, taskId, {
                comment: replyContent,
                parentId: comment.id
            })

            toast.success('Reply added')
            setReplyContent('')
            setIsReplying(false)
            onUpdate()
        } catch (error) {
            console.error('Failed to reply:', error)
            toast.error('Failed to add reply')
        } finally {
            setIsSubmitting(false)
        }
    }

    const commentContent = comment.content || comment.comment || ''

    // Different styling for root vs nested comments
    const isRoot = depth === 0

    return (
        <div className={cn(
            "relative",
            !isRoot && "pl-4 ml-2 border-l-2 border-border/50"
        )}>
            {/* Thread line visual connector if not root */}
            {!isRoot && <div className="absolute top-4 left-[-2px] w-4 h-[2px] bg-border/50"></div>}

            <div className={cn(
                "group relative animate-in fade-in slide-in-from-top-1 duration-200",
                !isRoot && "py-3"
            )}>
                <div className="flex gap-4">
                    <Avatar className={cn(
                        "border border-border shrink-0 cursor-default",
                        isRoot ? "h-10 w-10" : "h-8 w-8"
                    )}>
                        <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
                            {comment.user.firstName?.[0]}{comment.user.lastName?.[0]}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm truncate">
                                {comment.user.firstName} {comment.user.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                            </span>
                        </div>

                        {/* Content */}
                        <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                            {commentContent}
                        </div>

                        {/* Actions (Reactions + Reply) */}
                        <div className="flex items-center flex-wrap gap-2 mt-2">
                            {/* Reactions Logic */}
                            {Object.entries(reactionGroups).map(([emoji, reactions]) => {
                                const hasReacted = reactions?.some(r => r.userId === userId)
                                return (
                                    <Button
                                        key={emoji}
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                            "h-5 px-1.5 text-[10px] gap-1 rounded-full border bg-transparent hover:bg-muted/50 transition-colors",
                                            hasReacted && "bg-blue-50 border-blue-200 hover:bg-blue-100"
                                        )}
                                        onClick={() => handleReaction(emoji)}
                                    >
                                        <span>{emoji}</span>
                                        <span className={cn("font-medium", hasReacted ? "text-blue-600" : "text-muted-foreground")}>
                                            {reactions?.length}
                                        </span>
                                    </Button>
                                )
                            })}

                            {/* Add Reaction Button */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-6 w-6 rounded-full p-0 text-muted-foreground hover:bg-muted transition-all opacity-0 group-hover:opacity-100 focus:opacity-100",
                                            Object.keys(reactionGroups).length > 0 && "opacity-100"
                                        )}
                                        title="Add reaction"
                                    >
                                        <SmilePlus className="h-3.5 w-3.5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-1" align="start" side="top">
                                    <div className="flex gap-0.5">
                                        {['👍', '👎', '😄', '🎉', '😕', '❤️', '🚀', '👀'].map(emoji => (
                                            <button
                                                key={emoji}
                                                className="p-1.5 hover:bg-muted rounded-md text-lg transition-colors leading-none"
                                                onClick={() => handleReaction(emoji)}
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
                                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 ml-1"
                                onClick={() => setIsReplying(!isReplying)}
                            >
                                Reply
                            </Button>
                        </div>

                        {/* Reply Input */}
                        {isReplying && (
                            <div className="mt-3 mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="rounded-xl border border-border/30 bg-card shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/3 transition-all">
                                    <Textarea
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder={`Replying to ${comment.user.firstName}...`}
                                        className="min-h-[60px] text-sm resize-none border-none focus-visible:ring-0 p-3"
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2 p-2 bg-muted/30 border-t border-border/30">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setIsReplying(false)
                                                setReplyContent('')
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleReply}
                                            disabled={!replyContent.trim() || isSubmitting}
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
                    {comment.replies.map((reply, idx) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            depth={depth + 1}
                            onUpdate={onUpdate}
                            taskId={taskId}
                            projectId={projectId}
                            isLast={idx === (comment.replies?.length ?? 0) - 1} // Safely access length or default to 0
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function CommentThread({ comment, index, onUpdate, taskId, projectId }: {
    comment: Comment
    index: number
    onUpdate: () => void
    taskId: string
    projectId: string
}) {
    const { getToken, userId } = useAuth()
    const [isOpen, setIsOpen] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isReplying, setIsReplying] = useState(false) // Keep for main thread reply if needed
    const [replyContent, setReplyContent] = useState('')

    const isResolved = comment.status === 'RESOLVED'

    const handleResolve = async () => {
        try {
            setIsSubmitting(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await taskCommentApi.resolveComment(token, projectId, taskId, comment.id)
            toast.success('Comment resolved')
            setIsOpen(false) // Auto-collapse on approval
            onUpdate()
        } catch (error) {
            console.error('Failed to resolve comment:', error)
            toast.error('Failed to resolve comment')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleReopen = async () => {
        try {
            setIsSubmitting(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await taskCommentApi.reopenComment(token, projectId, taskId, comment.id)
            toast.success('Comment reopened')
            onUpdate()
        } catch (error) {
            console.error('Failed to reopen comment:', error)
            toast.error('Failed to reopen comment')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Main thread reply (can be triggered from footer or header)
    const handleReply = async () => {
        if (!replyContent.trim()) return

        try {
            setIsSubmitting(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await taskCommentApi.createComment(token, projectId, taskId, {
                comment: replyContent,
                parentId: comment.id // Becomes a child of this thread root
            })

            toast.success('Reply added')
            setReplyContent('')
            setIsReplying(false)
            onUpdate()
        } catch (error) {
            console.error('Failed to reply:', error)
            toast.error('Failed to add reply')
        } finally {
            setIsSubmitting(false)
        }
    }


    // If resolved, show collapsed view by default
    if (isResolved && !isOpen) {
        return (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 overflow-hidden">
                <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-emerald-50 transition-colors"
                    onClick={() => setIsOpen(true)}
                >
                    <div className="flex items-center gap-3">
                        {/* ... existing resolved header content ... */}
                        <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200">
                            <Check className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-emerald-900">Comment #{index} - Resolved</h4>
                            </div>
                            <p className="text-xs text-emerald-700">
                                {comment.resolvedBy?.firstName ? `${comment.resolvedBy.firstName} resolved this comment` : 'Resolved'}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100">
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className={cn(
            "rounded-xl border overflow-hidden transition-all duration-300",
            isResolved ? "border-emerald-200 bg-emerald-50/30" : "border-blue-200 bg-card"
        )}>
            {/* Header */}
            <div
                className={cn(
                    "flex items-center justify-between px-4 py-3 border-b cursor-pointer transition-colors",
                    isResolved
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-blue-50/50 border-blue-100 hover:bg-blue-50"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    {/* Icon */}
                    {isResolved ? (
                        <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200">
                            <Check className="h-3.5 w-3.5" />
                        </div>
                    ) : (
                        <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border border-blue-200">
                            <MessageSquare className="h-3.5 w-3.5" />
                        </div>
                    )}
                    {/* Text */}
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className={cn("text-sm font-semibold", isResolved ? "text-emerald-900" : "text-blue-900")}>
                                Comment #{index} - {isResolved ? "Resolved" : "Open"}
                            </h4>
                        </div>
                        <p className={cn("text-xs", isResolved ? "text-emerald-700" : "text-blue-700/80")}>
                            {comment.replies?.length || 0} responses • {isResolved ? "Resolved" : "Needs resolution"}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 hover:opacity-100">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
            </div>

            {/* Content Body */}
            {isOpen && (
                <div className="bg-card/50">
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
                        <div className="flex items-center justify-between pt-4 border-t border-border mt-2 mb-2">
                            <div className="flex items-center gap-3">
                                {!isResolved ? (
                                    <Button
                                        size="sm"
                                        className="bg-primary text-primary-foreground hover:bg-primary/50 shadow-sm"
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
                                        className="hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
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
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => setIsReplying(true)}
                                >
                                    Reply to Thread
                                </Button>
                            )}
                        </div>

                        {/* Footer Reply Input Area (If triggered from footer) */}
                        {isReplying && (
                            <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="rounded-xl border border-border/30 bg-card shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/3 transition-all">
                                    <Textarea
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="Write a reply to the thread..."
                                        className="min-h-[80px] text-sm border-none focus-visible:ring-0 p-3 resize-none"
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2 p-2 bg-muted/30 border-t border-border/30">
                                        <Button size="sm" variant="ghost" onClick={() => setIsReplying(false)}>Cancel</Button>
                                        <Button size="sm" onClick={handleReply} disabled={!replyContent.trim() || isSubmitting}>Reply</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
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
    )
}



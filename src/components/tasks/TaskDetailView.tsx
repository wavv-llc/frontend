'use client'

import { useState, useEffect } from 'react'
import {
    ArrowLeft,
    MoreHorizontal,
    Upload,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    FileText,
    X,
    Check,
    Edit2,
    Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { type Task, type Comment, taskApi, taskCommentApi } from '@/lib/api'
import { format } from 'date-fns'
import { useAuth } from '@clerk/nextjs'
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

interface TaskDetailViewProps {
    task: Task
    onBack: () => void
    onUpdate?: () => void
    onDelete?: () => void
}

export function TaskDetailView({ task, onBack, onUpdate, onDelete }: TaskDetailViewProps) {
    const { getToken } = useAuth()
    const [comments, setComments] = useState<Comment[]>([])
    const [isLoadingComments, setIsLoadingComments] = useState(false)
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [newCommentDialogOpen, setNewCommentDialogOpen] = useState(false)
    const [newCommentContent, setNewCommentContent] = useState('')
    const [editTaskName, setEditTaskName] = useState(task.name)
    const [editTaskDescription, setEditTaskDescription] = useState(task.description || '')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const loadComments = async () => {
        try {
            setIsLoadingComments(true)
            const token = await getToken()
            if (!token) return

            const response = await taskCommentApi.getCommentsByTask(token, task.projectId, task.id)
            const commentsData = (response as any).data || (response as unknown as any[])

            // Transform backend format to frontend format
            const transformedComments: Comment[] = Array.isArray(commentsData) ? commentsData.map((c: any) => ({
                id: c.id,
                content: c.comment || c.content,
                comment: c.comment || c.content,
                createdAt: c.postedAt || c.createdAt,
                updatedAt: c.updatedAt,
                user: c.postedByUser || c.user,
                status: (c.resolved ? 'RESOLVED' : 'OPEN') as 'OPEN' | 'RESOLVED',
                resolved: c.resolved,
                resolvedBy: c.resolvedBy,
                replies: c.replies?.map((r: any) => ({
                    id: r.id,
                    content: r.comment || r.content,
                    comment: r.comment || r.content,
                    createdAt: r.postedAt || r.createdAt,
                    updatedAt: r.updatedAt,
                    user: r.postedByUser || r.user,
                    status: (r.resolved ? 'RESOLVED' : 'OPEN') as 'OPEN' | 'RESOLVED',
                    resolved: r.resolved,
                })) || [],
                parentId: c.parentCommentId,
            })) : []

            setComments(transformedComments)
        } catch (error) {
            console.error('Failed to load comments:', error)
            // Silently fail - comments are optional
        } finally {
            setIsLoadingComments(false)
        }
    }

    // Load comments on mount
    useEffect(() => {
        loadComments()
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

    const handleEditTask = async () => {
        try {
            setIsSubmitting(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await taskApi.updateTask(token, task.projectId, task.id, {
                name: editTaskName,
                description: editTaskDescription
            })

            toast.success('Task updated successfully')
            setEditDialogOpen(false)
            onUpdate?.()
        } catch (error) {
            console.error('Failed to update task:', error)
            toast.error('Failed to update task')
        } finally {
            setIsSubmitting(false)
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
            setNewCommentDialogOpen(false)
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
                        <span>{task.project?.description || 'Project'}</span>
                        <span>/</span>
                        <span>Task</span>
                    </div>
                </div>

                {/* Title & Meta */}
                <div className="flex items-start justify-between">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{task.name}</h1>
                    <div className="flex items-center gap-3">
                        {/* Due Date Card */}
                        <div className="px-4 py-2 rounded-xl border border-border bg-card shadow-sm flex flex-col items-start min-w-[140px] cursor-pointer hover:border-primary/20 transition-colors">
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-0.5">Due Date</span>
                            <span className="font-semibold text-sm">
                                {task.dueAt ? format(new Date(task.dueAt), 'MMM d, yyyy') : 'No Due Date'}
                            </span>
                        </div>

                        {/* Status Card with Dropdown */}
                        <Select value={task.status} onValueChange={handleStatusChange}>
                            <SelectTrigger className="px-4 py-2 rounded-xl border border-border bg-card shadow-sm min-w-[200px] h-auto hover:border-primary/20 transition-colors">
                                <div className="flex flex-col items-start w-full">
                                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-0.5">Status</span>
                                    <div className="flex items-center gap-2 w-full">
                                        <span className={cn("font-semibold text-sm", statusColor)}>{statusLabel}</span>
                                    </div>
                                    {unresolvedComments > 0 && (
                                        <span className="text-xs text-muted-foreground font-medium mt-0.5">
                                            • {unresolvedComments} comment{unresolvedComments !== 1 ? 's' : ''} to be resolved
                                        </span>
                                    )}
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* 3-Dot Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 ml-2 border border-border rounded-xl cursor-pointer">
                                    <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit Task
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

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* Left Column: Description */}
                <div className="space-y-8">
                    {/* Description Card */}
                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                        <h3 className="font-semibold text-lg mb-4">Description</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            {task.description || "No description provided."}
                        </p>
                    </div>

                    {/* Files Card */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">Files</h3>
                        </div>
                        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                            {task.linkedFiles && task.linkedFiles.length > 0 ? (
                                <div className="divide-y divide-border">
                                    {task.linkedFiles.map((file) => (
                                        <div key={file.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-foreground">{file.originalName}</p>
                                                    <p className="text-xs text-muted-foreground">{(file.filesize / 1024).toFixed(0)} KB</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-8 cursor-pointer">View</Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <p className="text-sm">No files attached</p>
                                </div>
                            )}
                            <div className="p-4 bg-muted/20 border-t border-border">
                                <Button
                                    variant="outline"
                                    className="w-full gap-2 bg-background hover:bg-muted/50 cursor-pointer"
                                    onClick={() => setUploadDialogOpen(true)}
                                >
                                    <Upload className="h-4 w-4" />
                                    Upload File
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Comments */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Comments</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 cursor-pointer"
                            onClick={() => setNewCommentDialogOpen(true)}
                        >
                            <PlusIcon className="h-4 w-4" />
                            New Comment
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {isLoadingComments ? (
                            <div className="text-center text-muted-foreground py-8">
                                <p className="text-sm">Loading comments...</p>
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                <p className="text-sm">No comments yet</p>
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <CommentThread
                                    key={comment.id}
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

            {/* Edit Task Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                        <DialogDescription>
                            Update the task name and description
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="task-name">Task Name</Label>
                            <Input
                                id="task-name"
                                value={editTaskName}
                                onChange={(e) => setEditTaskName(e.target.value)}
                                placeholder="Enter task name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="task-description">Description</Label>
                            <Textarea
                                id="task-description"
                                value={editTaskDescription}
                                onChange={(e) => setEditTaskDescription(e.target.value)}
                                placeholder="Enter task description"
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditTask} disabled={isSubmitting || !editTaskName.trim()}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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

            {/* New Comment Dialog */}
            <Dialog open={newCommentDialogOpen} onOpenChange={setNewCommentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Comment</DialogTitle>
                        <DialogDescription>
                            Add a comment to this task
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            value={newCommentContent}
                            onChange={(e) => setNewCommentContent(e.target.value)}
                            placeholder="Enter your comment..."
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNewCommentDialogOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateComment} disabled={isSubmitting || !newCommentContent.trim()}>
                            {isSubmitting ? 'Adding...' : 'Add Comment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function CommentThread({ comment, onUpdate, taskId, projectId }: {
    comment: Comment
    onUpdate: () => void
    taskId: string
    projectId: string
}) {
    const { getToken } = useAuth()
    const [isOpen, setIsOpen] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

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

    const commentContent = comment.content || comment.comment || ''

    if (isResolved) {
        return (
            <div className="rounded-xl border border-emerald-200 bg-card shadow-sm overflow-hidden group">
                <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-50/30 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                            <Check className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground text-sm">{commentContent}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                <span className="font-medium text-emerald-600">{comment.resolvedBy?.firstName}</span> resolved this comment
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleReopen()
                            }}
                            disabled={isSubmitting}
                        >
                            <X className="h-3 w-3" />
                            Unresolve
                        </Button>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                </div>

                {isOpen && (
                    <div className="p-6 bg-card border-t border-emerald-100">
                        <div className="flex gap-4">
                            <Avatar className="h-9 w-9 border border-border">
                                <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
                                    {comment.user.firstName?.[0]}{comment.user.lastName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm">{comment.user.firstName} {comment.user.lastName}</span>
                                    <span className="text-xs text-muted-foreground">{format(new Date(comment.createdAt), 'h:mm a')}</span>
                                </div>
                                <p className="text-sm text-foreground leading-relaxed">{commentContent}</p>
                            </div>
                        </div>

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-6 pl-4 border-l-2 border-muted space-y-6">
                                {comment.replies.map((reply) => {
                                    const replyContent = reply.content || reply.comment || ''
                                    return (
                                        <div key={reply.id} className="flex gap-4">
                                            <Avatar className="h-8 w-8 border border-border">
                                                <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                                                    {reply.user.firstName?.[0]}{reply.user.lastName?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-sm">{reply.user.firstName} {reply.user.lastName}</span>
                                                    <span className="text-xs text-muted-foreground">{format(new Date(reply.createdAt), 'h:mm a')}</span>
                                                </div>
                                                <p className="text-sm text-foreground leading-relaxed">{replyContent}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Thread Header */}
            <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <MessageSquare className="h-3.5 w-3.5" />
                </div>
                <span className="font-semibold text-foreground text-sm">Comment #{comment.id.slice(0, 8)}</span>
                <Badge variant="secondary" className="text-xs font-normal">Open</Badge>

                <span className="text-xs text-muted-foreground ml-auto font-medium">
                    {comment.replies?.length || 0} responses • Needs resolution
                </span>
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Main Comment */}
            <div className="p-6 bg-card">
                <div className="flex gap-4">
                    <Avatar className="h-9 w-9 border border-border">
                        <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
                            {comment.user.firstName?.[0]}{comment.user.lastName?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{comment.user.firstName} {comment.user.lastName}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(comment.createdAt), 'h:mm a')}</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{commentContent}</p>
                    </div>
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-6 pl-4 border-l-2 border-muted space-y-6">
                        {comment.replies.map((reply) => {
                            const replyContent = reply.content || reply.comment || ''
                            return (
                                <div key={reply.id} className="flex gap-4">
                                    <Avatar className="h-8 w-8 border border-border">
                                        <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                                            {reply.user.firstName?.[0]}{reply.user.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-sm">{reply.user.firstName} {reply.user.lastName}</span>
                                            <span className="text-xs text-muted-foreground">{format(new Date(reply.createdAt), 'h:mm a')}</span>
                                        </div>
                                        <p className="text-sm text-foreground leading-relaxed">{replyContent}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between">
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        className="h-8 bg-foreground text-background hover:bg-foreground/90 gap-2 text-xs cursor-pointer"
                        onClick={handleResolve}
                        disabled={isSubmitting}
                    >
                        <Check className="h-3.5 w-3.5" />
                        {isSubmitting ? 'Resolving...' : 'Approve & Resolve'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2 text-xs bg-background cursor-pointer"
                        onClick={handleReopen}
                        disabled={isSubmitting}
                    >
                        <X className="h-3.5 w-3.5" />
                        Reopen
                    </Button>
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                    Reply
                </Button>
            </div>
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

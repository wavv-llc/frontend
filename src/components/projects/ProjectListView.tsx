'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import {
    ChevronDown,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Plus,
    Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { type Project, type Task, taskApi } from '@/lib/api'
import { toast } from 'sonner'

interface ProjectListViewProps {
    projects: Project[]
    tasks: Task[]
    onRefresh?: () => void
}

export function ProjectListView({ projects, tasks, onRefresh }: ProjectListViewProps) {
    const { getToken } = useAuth()
    const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({})
    const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set())

    const toggleProject = (id: string) => {
        setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const getTasksForProject = (projectId: string) => {
        return tasks.filter(task => task.projectId === projectId)
    }

    const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
        setUpdatingTasks(prev => new Set(prev).add(task.id))
        try {
            const token = await getToken()
            if (!token) {
                toast.error('You must be logged in')
                return
            }

            await taskApi.changeStatus(token, task.projectId, task.id, newStatus)
            toast.success('Task status updated')
        } catch (error) {
            console.error('Failed to update task status:', error)
            // Still refresh even if there's an error, since the backend might have succeeded
            toast.error(error instanceof Error ? error.message : 'Failed to update task status')
        } finally {
            // Always refresh and clear loading state
            onRefresh?.()
            setUpdatingTasks(prev => {
                const next = new Set(prev)
                next.delete(task.id)
                return next
            })
        }
    }

    const getStatusBadge = (status: Task['status']) => {
        switch (status) {
            case 'COMPLETED':
                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0 shadow-none px-2.5 py-0.5 rounded-full font-medium text-xs">Done</Badge>
            case 'IN_REVIEW':
                return <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 border-0 shadow-none px-2.5 py-0.5 rounded-full font-medium text-xs">Review</Badge>
            case 'IN_PROGRESS':
                return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-0 shadow-none px-2.5 py-0.5 rounded-full font-medium text-xs">In Progress</Badge>
            case 'BLOCKED':
                return <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-0 shadow-none px-2.5 py-0.5 rounded-full font-medium text-xs">Blocked</Badge>
            default:
                return <Badge className="bg-gray-500/15 text-gray-700 dark:text-gray-400 border-0 shadow-none px-2.5 py-0.5 rounded-full font-medium text-xs">Pending</Badge>
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const isOverdue = (dateString?: string) => {
        if (!dateString) return false
        return new Date(dateString) < new Date()
    }

    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-muted-foreground mb-4">No projects yet</p>
                <p className="text-sm text-muted-foreground">Create a project to get started</p>
            </div>
        )
    }

    return (
        <div className="w-full">
            {projects.map((project) => {
                const projectTasks = getTasksForProject(project.id)
                const isExpanded = expandedProjects[project.id] ?? true

                return (
                    <div key={project.id} className="mb-8">
                        {/* Project Header */}
                        <div
                            className="flex items-center gap-2 mb-4 cursor-pointer group"
                            onClick={() => toggleProject(project.id)}
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-primary" />
                            ) : (
                                <ChevronRight className="h-5 w-5 text-primary" />
                            )}
                            <h3 className="text-lg font-medium text-primary group-hover:underline decoration-dashed decoration-1 underline-offset-4">
                                {project.description || `Project ${project.id.slice(0, 8)}`}
                            </h3>
                            <span className="text-sm text-muted-foreground">({projectTasks.length} tasks)</span>
                        </div>

                        {/* Table */}
                        {isExpanded && (
                            <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/40 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <div className="col-span-4 pl-4">Task</div>
                                    <div className="col-span-2">Preparer</div>
                                    <div className="col-span-2">Due Date</div>
                                    <div className="col-span-2">Reviewer</div>
                                    <div className="col-span-2">Status</div>
                                </div>

                                {/* Table Body */}
                                <div className="divide-y divide-border">
                                    {projectTasks.length === 0 ? (
                                        <div className="py-8 flex items-center justify-center text-sm text-muted-foreground font-medium bg-card">
                                            No tasks in this project yet
                                        </div>
                                    ) : (
                                        projectTasks.map((task) => {
                                            const overdue = isOverdue(task.dueAt)
                                            const isUpdating = updatingTasks.has(task.id)

                                            return (
                                                <div key={task.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-muted/30 group text-sm transition-colors">
                                                    {/* Task Name */}
                                                    <div className="col-span-4 flex items-center gap-3 pl-4">
                                                        <Checkbox
                                                            checked={task.status === 'COMPLETED'}
                                                            disabled={isUpdating}
                                                            onCheckedChange={(checked: boolean) => {
                                                                handleStatusChange(task, checked ? 'COMPLETED' : 'PENDING')
                                                            }}
                                                            className="h-4 w-4 flex-shrink-0"
                                                        />
                                                        <span className={cn(
                                                            "font-medium truncate",
                                                            task.status === 'COMPLETED' ? "line-through opacity-60 text-muted-foreground" : "text-foreground"
                                                        )}>
                                                            {task.name}
                                                        </span>
                                                    </div>

                                                    {/* Preparer */}
                                                    <div className="col-span-2 flex items-center gap-2">
                                                        {task.preparers.length > 0 ? (
                                                            <div className="flex items-center gap-1">
                                                                {task.preparers.slice(0, 2).map((preparer) => (
                                                                    <div key={preparer.id} className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shadow-none ring-1 ring-background">
                                                                        {preparer.firstName?.[0] || preparer.email[0].toUpperCase()}
                                                                    </div>
                                                                ))}
                                                                {task.preparers.length > 2 && (
                                                                    <span className="text-xs text-muted-foreground">+{task.preparers.length - 2}</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center border border-dashed border-border hover:border-primary transition-colors cursor-pointer">
                                                                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Due Date */}
                                                    <div className="col-span-2 flex items-center gap-2">
                                                        {overdue && task.status !== 'COMPLETED' && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                                                        {!overdue && task.dueAt && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                                                        <span className={cn(
                                                            "font-medium tabular-nums",
                                                            overdue && task.status !== 'COMPLETED' ? "text-destructive" : "text-foreground"
                                                        )}>
                                                            {formatDate(task.dueAt)}
                                                        </span>
                                                    </div>

                                                    {/* Reviewer */}
                                                    <div className="col-span-2 flex items-center gap-2">
                                                        {task.reviewers.length > 0 ? (
                                                            <div className="flex items-center gap-1">
                                                                {task.reviewers.slice(0, 2).map((reviewer) => (
                                                                    <div key={reviewer.id} className="h-7 w-7 rounded-full bg-chart-3/10 flex items-center justify-center text-xs font-bold text-chart-3 shadow-none ring-1 ring-background">
                                                                        {reviewer.firstName?.[0] || reviewer.email[0].toUpperCase()}
                                                                    </div>
                                                                ))}
                                                                {task.reviewers.length > 2 && (
                                                                    <span className="text-xs text-muted-foreground">+{task.reviewers.length - 2}</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center border border-dashed border-border hover:border-primary cursor-pointer">
                                                                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Status */}
                                                    <div className="col-span-2 flex items-center justify-between pr-2">
                                                        {isUpdating ? (
                                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    const statuses: Task['status'][] = ['PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED']
                                                                    const currentIndex = statuses.indexOf(task.status)
                                                                    const nextStatus = statuses[(currentIndex + 1) % statuses.length]
                                                                    handleStatusChange(task, nextStatus)
                                                                }}
                                                                className="cursor-pointer"
                                                            >
                                                                {getStatusBadge(task.status)}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

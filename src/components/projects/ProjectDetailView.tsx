'use client'

import { useState } from 'react'
import {
    ChevronDown,
    AlertCircle,
    CheckCircle2,
    Plus,
    MoreHorizontal,
    HelpCircle,
    ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FilterSortControls, type TaskFilters, type TaskSort } from '@/components/workspace/FilterSortControls'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { type Project, type Task, taskApi } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@clerk/nextjs'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProjectDetailViewProps {
    project: Project
    tasks: Task[]
    onRefresh?: () => void
    onCreateTask?: () => void
}

export function ProjectDetailView({ project, tasks, onRefresh, onCreateTask }: ProjectDetailViewProps) {
    const router = useRouter()
    const { getToken } = useAuth()
    const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set())
    const [filters, setFilters] = useState<TaskFilters>({
        status: [],
        showOverdue: false,
        showCompleted: true,
    })
    const [sort, setSort] = useState<TaskSort>({
        field: 'createdAt',
        direction: 'desc',
    })

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
            toast.error(error instanceof Error ? error.message : 'Failed to update task status')
        } finally {
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
                return (
                    <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium cursor-pointer flex items-center justify-center w-fit">
                        Complete
                    </div>
                )
            case 'IN_REVIEW':
                return (
                    <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium cursor-pointer flex items-center justify-center w-fit">
                        In Reviewer 1
                    </div>
                )
            case 'IN_PROGRESS':
                return (
                    <div className="bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium cursor-pointer flex items-center justify-center w-fit">
                        In Preparation
                    </div>
                )
            default:
                return (
                    <div className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium cursor-pointer flex items-center justify-center w-fit">
                        Pending
                    </div>
                )
        }
    }

    const formatDate = (dateString?: string, icon = true) => {
        if (!dateString) return <span className="text-muted-foreground">-</span>
        const date = new Date(dateString)
        const isPast = date < new Date()
        const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

        return (
            <div className="flex items-center gap-2">
                {icon && (
                    isPast ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )
                )}
                <span className={cn(isPast ? "text-destructive" : "text-foreground")}>
                    {formatted}
                </span>
            </div>
        )
    }

    // Filter and Sort Logic
    const filteredTasks = tasks.filter(task => {
        // Status filter
        if (filters.status.length > 0 && !filters.status.includes(task.status)) {
            return false
        }

        // Overdue filter
        if (filters.showOverdue) {
            const isOverdue = task.dueAt && new Date(task.dueAt) < new Date() && task.status !== 'COMPLETED'
            if (!isOverdue) return false
        }

        // Completed filter
        if (!filters.showCompleted && task.status === 'COMPLETED') {
            return false
        }

        return true
    })

    const sortedTasks = [...filteredTasks].sort((a, b) => {
        let comparison = 0
        switch (sort.field) {
            case 'name':
                comparison = a.name.localeCompare(b.name)
                break
            case 'dueDate':
                const dateA = a.dueAt ? new Date(a.dueAt).getTime() : 0
                const dateB = b.dueAt ? new Date(b.dueAt).getTime() : 0
                comparison = dateA - dateB
                break
            case 'status':
                comparison = a.status.localeCompare(b.status)
                break
            case 'createdAt':
                const createdA = new Date(a.createdAt).getTime()
                const createdB = new Date(b.createdAt).getTime()
                comparison = createdA - createdB
                break
        }
        return sort.direction === 'asc' ? comparison : -comparison
    })

    return (
        <div className="flex flex-col h-full bg-background no-scrollbar">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 mr-2" onClick={() => router.push(`/workspaces/${project.workspaceId}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="default" size="sm" className="bg-black text-white hover:bg-black/90 h-8 font-medium" onClick={onCreateTask}>
                        New
                        <ChevronDown className="ml-2 h-3 w-3" />
                    </Button>
                    <FilterSortControls
                        onFilterChange={setFilters}
                        onSortChange={setSort}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground font-medium">
                        <MoreHorizontal className="h-4 w-4" />
                        Options
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-6">
                    {/* Project Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <h2 className="text-xl font-semibold text-emerald-600">{project.description || `Project ${project.id.slice(0, 8)}`}</h2>
                            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                    </div>

                    {/* Task Table */}
                    <div className="w-full">
                        {/* Header */}
                        <div className="grid grid-cols-[40px_2fr_1fr_1.5fr_1fr_1.5fr_1.5fr_40px] gap-4 px-4 py-3 border-b text-sm font-medium text-muted-foreground">
                            <div><Checkbox /></div>
                            <div>Task</div>
                            <div>Preparer</div>
                            <div className="flex items-center gap-1">
                                Preparer Due...
                                <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
                            </div>
                            <div>Reviewer 1</div>
                            <div>Reviewer 1 Due Date</div>
                            <div className="flex items-center gap-1">
                                Status
                                <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
                            </div>
                            <div></div>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-border">
                            {sortedTasks.map((task) => (
                                <div key={task.id} className="grid grid-cols-[40px_2fr_1fr_1.5fr_1fr_1.5fr_1.5fr_40px] gap-4 px-4 py-3 items-center hover:bg-muted/30 group transition-colors text-sm">
                                    <div className="flex items-center h-full">
                                        <Checkbox
                                            checked={task.status === 'COMPLETED'}
                                            onCheckedChange={(checked) => handleStatusChange(task, checked ? 'COMPLETED' : 'PENDING')}
                                        />
                                    </div>
                                    <div className="font-medium">{task.name}</div>

                                    {/* Preparer */}
                                    <div>
                                        {task.preparers.length > 0 ? (
                                            <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                                {task.preparers[0].firstName?.[0] || 'P'}
                                            </div>
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                ?
                                            </div>
                                        )}
                                    </div>

                                    {/* Preparer Due Date */}
                                    <div>{formatDate(task.dueAt)}</div>

                                    {/* Reviewer 1 */}
                                    <div>
                                        {task.reviewers.length > 0 ? (
                                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                                                {task.reviewers[0].firstName?.[0] || 'R'}
                                            </div>
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                                ?
                                            </div>
                                        )}
                                    </div>

                                    {/* Reviewer 1 Due Date */}
                                    <div className="text-muted-foreground">-</div>

                                    {/* Status */}
                                    <div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="outline-none">
                                                {getStatusBadge(task.status)}
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleStatusChange(task, 'PENDING')}>
                                                    Pending
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(task, 'IN_PROGRESS')}>
                                                    In Preparation
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(task, 'IN_REVIEW')}>
                                                    In Reviewer 1
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(task, 'COMPLETED')}>
                                                    Complete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer">
                                        <Plus className="h-4 w-4" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Task Row */}
                        <div
                            className="flex items-center gap-2 px-4 py-3 text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted/30 transition-colors border-t"
                            onClick={onCreateTask}
                        >
                            <Plus className="h-4 w-4" />
                            <span className="text-sm font-medium">Add task</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

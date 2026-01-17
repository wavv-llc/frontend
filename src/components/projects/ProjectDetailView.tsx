'use client'

import { useState } from 'react'
import {
    Calendar as CalendarIcon,
    List as ListIcon,
    Plus,
    Calendar,
    Clock,
    MoreVertical,
    CheckCircle2,
    Circle,
    AlertCircle,
    LayoutGrid,
    Search,
    Filter,
    ArrowUpRight,
    ArrowLeft,
    Edit2,
    Trash2,
    X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Project, type Task, projectApi, taskApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ProjectCalendarView } from './ProjectCalendarView'
import { TaskDetailView } from '@/components/tasks/TaskDetailView'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'

interface ProjectDetailViewProps {
    project: Project
    tasks: Task[]
    onRefresh: () => void
    onCreateTask: () => void
}

type ViewMode = 'list' | 'calendar'
type StatusFilter = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED'

export function ProjectDetailView({
    project,
    tasks,
    onRefresh,
    onCreateTask
}: ProjectDetailViewProps) {
    const { getToken } = useAuth()
    const [view, setView] = useState<ViewMode>('list')
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [editProjectName, setEditProjectName] = useState(project.name || project.description || '')
    const [editProjectDescription, setEditProjectDescription] = useState(project.description || '')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleEditProject = async () => {
        try {
            setIsSubmitting(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await projectApi.updateProject(token, project.id, {
                name: editProjectName,
                description: editProjectDescription
            })

            toast.success('Project updated successfully')
            setEditDialogOpen(false)
            onRefresh()
        } catch (error) {
            console.error('Failed to update project:', error)
            toast.error('Failed to update project')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteProject = async () => {
        try {
            setIsSubmitting(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await projectApi.deleteProject(token, project.id)
            toast.success('Project deleted successfully')
            setDeleteDialogOpen(false)
            window.history.back()
        } catch (error) {
            console.error('Failed to delete project:', error)
            toast.error('Failed to delete project')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteTask = async (taskId: string) => {
        try {
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await taskApi.deleteTask(token, project.id, taskId)
            toast.success('Task deleted successfully')
            onRefresh()
        } catch (error) {
            console.error('Failed to delete task:', error)
            toast.error('Failed to delete task')
        }
    }

    const getStatusIcon = (status: Task['status']) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            case 'IN_PROGRESS': return <Circle className="h-4 w-4 text-blue-600" />
            case 'IN_REVIEW': return <AlertCircle className="h-4 w-4 text-amber-600" />
            default: return <Circle className="h-4 w-4 text-muted-foreground/30" />
        }
    }

    const getStatusLabel = (status: Task['status']) => {
        switch (status) {
            case 'COMPLETED': return 'Completed'
            case 'IN_PROGRESS': return 'In Progress'
            case 'IN_REVIEW': return 'In Review'
            default: return 'Pending'
        }
    }

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter
        return matchesSearch && matchesStatus
    })

    // Calculate stats
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length
    const reviewTasks = tasks.filter(t => t.status === 'IN_REVIEW').length

    if (selectedTask) {
        return (
            <TaskDetailView
                task={selectedTask}
                onBack={() => setSelectedTask(null)}
                onUpdate={onRefresh}
                onDelete={() => {
                    setSelectedTask(null)
                    onRefresh()
                }}
            />
        )
    }

    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500 p-8">
            {/* Header Section */}
            <div className="flex flex-col gap-8">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -ml-1 text-muted-foreground hover:text-foreground cursor-pointer"
                                onClick={() => window.history.back()}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{project.workspace.name}</span>
                                <span className="text-muted-foreground/40">/</span>
                                <span>Project</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{project.description || project.name || 'Project Details'}</h1>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Edit Project
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => setDeleteDialogOpen(true)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Project
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white p-1 rounded-lg border border-border shadow-sm">
                            <button
                                onClick={() => setView('list')}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer",
                                    view === 'list'
                                        ? "bg-muted text-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <ListIcon className="h-4 w-4" />
                                List
                            </button>
                            <button
                                onClick={() => setView('calendar')}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer",
                                    view === 'calendar'
                                        ? "bg-muted text-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <CalendarIcon className="h-4 w-4" />
                                Calendar
                            </button>
                        </div>

                        <Button onClick={onCreateTask} className="gap-2 ml-2 shadow-sm hover:shadow-md transition-all cursor-pointer">
                            <Plus className="h-4 w-4" />
                            New Task
                        </Button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-6">
                    <StatCard label="Total Tasks" value={totalTasks} icon={LayoutGrid} />
                    <StatCard label="Completed" value={completedTasks} icon={CheckCircle2} />
                    <StatCard label="In Progress" value={inProgressTasks} icon={Clock} />
                    <StatCard label="In Review" value={reviewTasks} icon={AlertCircle} />
                </div>
            </div>

            {/* Content Controls */}
            {view === 'list' && (
                <div className="flex items-center justify-between pb-2">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-9 bg-white border-border shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {statusFilter !== 'ALL' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-muted-foreground hover:text-foreground cursor-pointer"
                                onClick={() => setStatusFilter('ALL')}
                            >
                                <X className="h-3.5 w-3.5" />
                                Clear Filter
                            </Button>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 text-muted-foreground hover:text-foreground bg-white cursor-pointer">
                                    <Filter className="h-3.5 w-3.5" />
                                    Filter
                                    {statusFilter !== 'ALL' && (
                                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                                            1
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter === 'ALL'}
                                    onCheckedChange={() => setStatusFilter('ALL')}
                                >
                                    All Tasks
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter === 'PENDING'}
                                    onCheckedChange={() => setStatusFilter('PENDING')}
                                >
                                    Pending
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter === 'IN_PROGRESS'}
                                    onCheckedChange={() => setStatusFilter('IN_PROGRESS')}
                                >
                                    In Progress
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter === 'IN_REVIEW'}
                                    onCheckedChange={() => setStatusFilter('IN_REVIEW')}
                                >
                                    In Review
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter === 'COMPLETED'}
                                    onCheckedChange={() => setStatusFilter('COMPLETED')}
                                >
                                    Completed
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 min-h-0 bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                {view === 'calendar' ? (
                    <ProjectCalendarView tasks={tasks} />
                ) : (
                    <div className="flex flex-col h-full">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-border/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-white">
                            <div className="col-span-5">Task Name</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2">Due Date</div>
                            <div className="col-span-2">Assigned To</div>
                            <div className="col-span-1 text-right"></div>
                        </div>

                        {/* Table Body */}
                        <div className="overflow-y-auto flex-1">
                            {filteredTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                                        <Search className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="font-medium text-lg mb-1">No tasks found</h3>
                                    <p className="text-muted-foreground mb-4 max-w-sm text-sm">
                                        {searchQuery || statusFilter !== 'ALL' ? "Try adjusting your search or filters" : "Get started by creating your first task"}
                                    </p>
                                    {!searchQuery && statusFilter === 'ALL' && (
                                        <Button variant="outline" onClick={onCreateTask} className="cursor-pointer">
                                            Create Task
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="divide-y divide-border/60">
                                    {filteredTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            onClick={() => setSelectedTask(task)}
                                            className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-muted/30 transition-all duration-200 group cursor-pointer border-l-2 border-l-transparent hover:border-l-primary"
                                        >
                                            <div className="col-span-5">
                                                <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-3">
                                                    {task.name}
                                                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all text-muted-foreground" />
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    {getStatusIcon(task.status)}
                                                    <span className="text-sm text-muted-foreground">{getStatusLabel(task.status)}</span>
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-2">
                                                {task.dueAt ? (
                                                    <div className={cn(
                                                        "flex items-center gap-1.5",
                                                        new Date(task.dueAt) < new Date() && task.status !== 'COMPLETED' ? "text-destructive font-medium" : ""
                                                    )}>
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {new Date(task.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground/40 text-xs">-</span>
                                                )}
                                            </div>
                                            <div className="col-span-2 flex items-center -space-x-2 pl-2">
                                                {(task.preparers || []).length > 0 ? (
                                                    (task.preparers || []).slice(0, 3).map((user, i) => (
                                                        <Avatar key={i} className="h-7 w-7 border-2 border-white ring-1 ring-border/50 bg-white">
                                                            <AvatarFallback className="text-[10px] bg-muted text-foreground font-medium">
                                                                {user.firstName?.[0] || user.email[0].toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/40 italic">Unassigned</span>
                                                )}
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation()
                                                            setSelectedTask(task)
                                                        }}>
                                                            <Edit2 className="h-4 w-4 mr-2" />
                                                            Edit Task
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteTask(task.id)
                                                            }}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete Task
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Project Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                        <DialogDescription>
                            Update the project name and description
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-name">Project Name</Label>
                            <Input
                                id="project-name"
                                value={editProjectName}
                                onChange={(e) => setEditProjectName(e.target.value)}
                                placeholder="Enter project name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="project-description">Description</Label>
                            <Textarea
                                id="project-description"
                                value={editProjectDescription}
                                onChange={(e) => setEditProjectDescription(e.target.value)}
                                placeholder="Enter project description"
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditProject} disabled={isSubmitting || !editProjectName.trim()}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Project Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Project</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this project? This will also delete all tasks in this project. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteProject} disabled={isSubmitting}>
                            {isSubmitting ? 'Deleting...' : 'Delete Project'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function StatCard({ label, value, icon: Icon }: { label: string, value: number, icon: any }) {
    return (
        <div className="bg-white border border-border rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">{label}</p>
                <p className="text-3xl font-semibold mt-2 text-foreground">{value}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                <Icon className="h-5 w-5" />
            </div>
        </div>
    )
}

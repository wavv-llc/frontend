'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
    X,
    ArrowUp,
    ArrowDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Project, type Task, type Category, projectApi, taskApi, categoryApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ProjectCalendarView } from './ProjectCalendarView'
import { TaskDetailView } from '@/components/tasks/TaskDetailView'
import { TaskRow } from './TaskRow'
import { CreateCategoryDialog } from '@/components/dialogs/CreateCategoryDialog'
import { EditTaskDialog } from '@/components/dialogs/EditTaskDialog'
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
type CategoryFilter = 'ALL' | string // Category ID or 'ALL'

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
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL')
    const [createCategoryOpen, setCreateCategoryOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [editTaskOpen, setEditTaskOpen] = useState(false)
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
    const [editProjectName, setEditProjectName] = useState(project.name || project.description || '')
    const [editProjectDescription, setEditProjectDescription] = useState(project.description || '')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Categories state
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoadingCategories, setIsLoadingCategories] = useState(false)

    const refreshCategories = async () => {
        try {
            setIsLoadingCategories(true)
            const token = await getToken()
            if (token) {
                const response = await categoryApi.getCategoriesByProject(token, project.id)
                if (response.data && Array.isArray(response.data)) {
                    setCategories(response.data)
                }
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error)
            toast.error('Failed to load categories')
        } finally {
            setIsLoadingCategories(false)
        }
    }

    // Fetch categories on mount
    useEffect(() => {
        refreshCategories()
    }, [project.id, getToken])

    const handleCategoryCreated = () => {
        refreshCategories()
    }


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

    const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
        const index = categories.findIndex(c => c.id === categoryId)
        if (index === -1) return

        const newCategories = [...categories]
        const targetIndex = direction === 'up' ? index - 1 : index + 1

        if (targetIndex < 0 || targetIndex >= categories.length) return

        // Swap
        const temp = newCategories[index]
        newCategories[index] = newCategories[targetIndex]
        newCategories[targetIndex] = temp

        // Optimistic update
        setCategories(newCategories)

        try {
            const token = await getToken()
            if (!token) return
            await categoryApi.reorderCategories(token, project.id, newCategories.map(c => c.id))
        } catch (error) {
            console.error('Failed to reorder', error)
            toast.error('Failed to reorder categories')
            refreshCategories() // Revert
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
        const matchesCategory = categoryFilter === 'ALL' || (categoryFilter === 'uncategorized' ? !task.categoryId : task.categoryId === categoryFilter)
        return matchesSearch && matchesStatus && matchesCategory
    })

    // Group tasks by category
    const tasksByCategory = useMemo(() => {
        const grouped: Record<string, Task[]> = {}

        // Initialize with all fetched categories
        categories.forEach(cat => {
            grouped[cat.id] = []
        })

        // Always add uncategorized
        grouped['uncategorized'] = []

        filteredTasks.forEach(task => {
            const catId = task.categoryId || 'uncategorized'
            if (!grouped[catId]) {
                // This might happen if a task has a categoryId that is not in the fetched categories list (e.g. deleted category)
                grouped[catId] = []
            }
            grouped[catId].push(task)
        })

        return grouped
    }, [filteredTasks, categories])

    // Calculate stats
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length
    const reviewTasks = tasks.filter(t => t.status === 'IN_REVIEW').length

    const router = useRouter()
    const searchParams = useSearchParams()

    // Sync URL with selected task
    useEffect(() => {
        const taskId = searchParams.get('taskId')
        if (taskId && tasks.length > 0) {
            const task = tasks.find(t => t.id === taskId)
            if (task) {
                setSelectedTask(task)
            } else {
                // Task in URL not found in current list (maybe separate fetch needed if pagination, but likely just wait for tasks)
                // If tasks are loaded and task not found, maybe clear param?
                // For now, let's trust tasks list is complete for the project
            }
        } else if (!taskId) {
            setSelectedTask(null)
        }
    }, [searchParams, tasks])

    const handleTaskSelect = (task: Task) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('taskId', task.id)
        router.push(`?${params.toString()}`, { scroll: false })
    }

    const handleTaskClose = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('taskId')
        router.push(`?${params.toString()}`, { scroll: false })
    }

    // Refresh handler that keeps task selected
    const handleRefresh = async () => {
        await onRefresh()
        // If selected task exists, checking for updates is handled by task list update
        // But if we need to update the detail view specifically, that's done inside TaskDetailView via its own refresh
    }

    if (selectedTask) {
        return (
            <TaskDetailView
                task={selectedTask}
                onBack={handleTaskClose}
                onUpdate={handleRefresh}
                onDelete={() => {
                    handleTaskClose()
                    handleRefresh()
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
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white p-1 rounded-lg border border-border shadow-sm mr-2">
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

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 bg-white border-border hover:bg-muted shadow-sm cursor-pointer"
                            onClick={() => setCreateCategoryOpen(true)}
                            title="Add Category"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 bg-white border-border hover:bg-muted shadow-sm cursor-pointer"
                            onClick={() => setEditDialogOpen(true)}
                            title="Edit Project"
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 bg-white border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 shadow-sm cursor-pointer"
                            onClick={() => setDeleteDialogOpen(true)}
                            title="Delete Project"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-6 bg-border mx-1" />
                        <Button onClick={onCreateTask} className="gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer">
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
                        {/* Category Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 text-muted-foreground hover:text-foreground bg-white cursor-pointer">
                                    <Filter className="h-3.5 w-3.5" />
                                    Category
                                    {categoryFilter !== 'ALL' && (
                                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                                            1
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                    checked={categoryFilter === 'ALL'}
                                    onCheckedChange={() => setCategoryFilter('ALL')}
                                >
                                    All Categories
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={categoryFilter === 'uncategorized'}
                                    onCheckedChange={() => setCategoryFilter('uncategorized')}
                                >
                                    Uncategorized
                                </DropdownMenuCheckboxItem>
                                {categories.map(category => (
                                    <DropdownMenuCheckboxItem
                                        key={category.id}
                                        checked={categoryFilter === category.id}
                                        onCheckedChange={() => setCategoryFilter(category.id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {category.color && (
                                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                                            )}
                                            {category.name}
                                        </div>
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

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
                                    Status
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
                        <div className="overflow-y-auto flex-1 pb-10">
                            {filteredTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                                        <Search className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="font-medium text-lg mb-1">No tasks found</h3>
                                    <p className="text-muted-foreground mb-4 max-w-sm text-sm">
                                        {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL' ? "Try adjusting your search or filters" : "Get started by creating your first task"}
                                    </p>
                                    {!searchQuery && statusFilter === 'ALL' && categoryFilter === 'ALL' && (
                                        <Button variant="outline" onClick={onCreateTask} className="cursor-pointer">
                                            Create Task
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="divide-y divide-border/60">
                                    {/* Render categories */}
                                    {categories.map((category, index) => {
                                        const tasks = tasksByCategory[category.id] || []
                                        if (tasks.length === 0 && categoryFilter !== 'ALL' && categoryFilter !== category.id) return null
                                        if (categoryFilter !== 'ALL' && categoryFilter !== category.id) return null

                                        return (
                                            <div key={category.id} className="bg-white group/category">
                                                <div className="px-8 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20 border-y border-border/20 sticky top-0 backdrop-blur-sm z-10 flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color || '#94a3b8' }}></div>
                                                    {category.name}
                                                    <span className="ml-2 px-1.5 py-0.5 bg-muted rounded text-[10px]">{tasks.length}</span>

                                                    {/* Reorder buttons */}
                                                    <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/category:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleMoveCategory(category.id, 'up')
                                                            }}
                                                            disabled={index === 0}
                                                            title="Move Up"
                                                        >
                                                            <ArrowUp className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleMoveCategory(category.id, 'down')
                                                            }}
                                                            disabled={index === categories.length - 1}
                                                            title="Move Down"
                                                        >
                                                            <ArrowDown className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                {tasks.length > 0 ? (
                                                    tasks.map(task => (
                                                        <TaskRow
                                                            key={task.id}
                                                            task={task}
                                                            onClick={() => handleTaskSelect(task)}
                                                            onEdit={(task) => {
                                                                setTaskToEdit(task)
                                                                setEditTaskOpen(true)
                                                            }}
                                                            onDelete={handleDeleteTask}
                                                        />
                                                    ))
                                                ) : (
                                                    <div className="px-8 py-6 text-center text-sm text-muted-foreground italic border-b border-border/60">
                                                        No tasks in this category
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}

                                    {/* Render uncategorized tasks LAST */}
                                    {tasksByCategory['uncategorized'] && tasksByCategory['uncategorized'].length > 0 && (categoryFilter === 'ALL' || categoryFilter === 'uncategorized') && (
                                        <div className="bg-muted/10">
                                            <div className="px-8 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20 border-y border-border/20 sticky top-0 backdrop-blur-sm z-10 flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                                                Uncategorized
                                                <span className="ml-2 px-1.5 py-0.5 bg-muted rounded text-[10px]">{tasksByCategory['uncategorized'].length}</span>
                                            </div>
                                            {tasksByCategory['uncategorized'].map(task => (
                                                <TaskRow
                                                    key={task.id}
                                                    task={task}
                                                    onClick={() => handleTaskSelect(task)}
                                                    onEdit={(task) => {
                                                        setTaskToEdit(task)
                                                        setEditTaskOpen(true)
                                                    }}
                                                    onDelete={handleDeleteTask}
                                                />
                                            ))}
                                        </div>
                                    )}
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

            <CreateCategoryDialog
                open={createCategoryOpen}
                onOpenChange={setCreateCategoryOpen}
                projectId={project.id}
                onSuccess={refreshCategories}
            />

            {
                taskToEdit && (
                    <EditTaskDialog
                        open={editTaskOpen}
                        onOpenChange={setEditTaskOpen}
                        task={taskToEdit}
                        onSuccess={onRefresh}
                    />
                )
            }
        </div >
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




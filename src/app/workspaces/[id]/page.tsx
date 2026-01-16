'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ProjectListView } from '@/components/projects/ProjectListView'
import { ProjectCalendarView } from '@/components/projects/ProjectCalendarView'
import { Button } from '@/components/ui/button'
import {
    ArrowLeft,
    MoreHorizontal,
    Plus,
    Filter,
    ArrowUpDown,
    ChevronDown,
    Loader2,
    Settings,
    Download,
    Users
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { workspaceApi, projectApi, taskApi, type Workspace, type Project, type Task } from '@/lib/api'
import { CreateProjectDialog } from '@/components/dialogs/CreateProjectDialog'
import { CreateTaskDialog } from '@/components/dialogs/CreateTaskDialog'
import { FilterSortControls, type TaskFilters, type TaskSort } from '@/components/workspace/FilterSortControls'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

export default function WorkspaceDetailsPage() {
    const params = useParams()
    const { getToken } = useAuth()
    const [view, setView] = useState<'list' | 'calendar'>('list')
    const [workspace, setWorkspace] = useState<Workspace | null>(null)
    const [projects, setProjects] = useState<Project[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false)
    const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState<string>('')

    const workspaceId = params.id as string

    const fetchData = async () => {
        try {
            const token = await getToken()
            if (!token) {
                toast.error('You must be logged in')
                return
            }

            // Fetch workspace details
            const workspaceResponse = await workspaceApi.getWorkspace(token, workspaceId)
            if (!workspaceResponse.data) {
                notFound()
                return
            }
            setWorkspace(workspaceResponse.data)

            // Fetch projects for this workspace
            const projectsResponse = await projectApi.getProjectsByWorkspace(token, workspaceId)
            const fetchedProjects = projectsResponse.data || []
            setProjects(fetchedProjects)

            // Fetch tasks for all projects
            const allTasks: Task[] = []
            for (const project of fetchedProjects) {
                const tasksResponse = await taskApi.getTasksByProject(token, project.id)
                allTasks.push(...(tasksResponse.data || []))
            }
            setTasks(allTasks)
            setFilteredTasks(allTasks)
        } catch (error) {
            console.error('Failed to fetch data:', error)
            toast.error('Failed to load workspace data')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [workspaceId])

    const handleCreateProject = () => {
        setShowCreateProjectDialog(true)
    }

    const handleCreateTask = () => {
        // Use the first project if available, otherwise show error
        if (projects.length === 0) {
            toast.error('Please create a project first')
            return
        }
        setSelectedProjectId(projects[0].id)
        setShowCreateTaskDialog(true)
    }

    const handleSuccess = () => {
        fetchData()
    }

    const handleFilterChange = (filters: TaskFilters) => {
        let filtered = [...tasks]

        // Filter by status
        if (filters.status.length > 0) {
            filtered = filtered.filter(task => filters.status.includes(task.status))
        }

        // Filter by overdue
        if (filters.showOverdue) {
            filtered = filtered.filter(task => {
                if (!task.dueAt) return false
                return new Date(task.dueAt) < new Date() && task.status !== 'COMPLETED'
            })
        }

        // Filter by completed
        if (!filters.showCompleted) {
            filtered = filtered.filter(task => task.status !== 'COMPLETED')
        }

        setFilteredTasks(filtered)
    }

    const handleSortChange = (sort: TaskSort) => {
        const sorted = [...filteredTasks].sort((a, b) => {
            let comparison = 0

            switch (sort.field) {
                case 'name':
                    comparison = a.name.localeCompare(b.name)
                    break
                case 'dueDate':
                    const aDate = a.dueAt ? new Date(a.dueAt).getTime() : 0
                    const bDate = b.dueAt ? new Date(b.dueAt).getTime() : 0
                    comparison = aDate - bDate
                    break
                case 'status':
                    comparison = a.status.localeCompare(b.status)
                    break
                case 'createdAt':
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    break
            }

            return sort.direction === 'asc' ? comparison : -comparison
        })

        setFilteredTasks(sorted)
    }

    const handleExportWorkspace = () => {
        toast.info('Export functionality coming soon!')
    }

    const handleWorkspaceSettings = () => {
        toast.info('Workspace settings coming soon!')
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        )
    }

    if (!workspace) {
        notFound()
        return null
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-background overflow-hidden">
                {/* Header */}
                <div className="border-b px-6 py-4 flex items-center justify-between shrink-0 bg-background z-10 px-6">
                    <div className="flex items-center gap-4">
                        <Link href="/workspaces">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="text-xl font-semibold tracking-tight">{workspace.name}</h1>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4" />
                                Options
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleWorkspaceSettings}>
                                <Settings className="mr-2 h-4 w-4" />
                                Workspace Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportWorkspace}>
                                <Download className="mr-2 h-4 w-4" />
                                Export Data
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-muted-foreground">
                                <Users className="mr-2 h-4 w-4" />
                                Manage Members
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center p-1 bg-muted rounded-lg border border-border/10 mr-2">
                            <Button
                                onClick={() => setView('list')}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "h-7 px-3 text-xs font-medium rounded-md transition-all",
                                    view === 'list'
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                                )}
                            >
                                List
                            </Button>
                            <Button
                                onClick={() => setView('calendar')}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "h-7 px-3 text-xs font-medium rounded-md transition-all",
                                    view === 'calendar'
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                                )}
                            >
                                Calendar
                            </Button>
                        </div>

                        {view === 'list' && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 h-8 bg-background hover:bg-muted font-medium transition-all"
                                    onClick={handleCreateProject}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    New Project
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 h-8 bg-background hover:bg-muted font-medium transition-all"
                                    onClick={handleCreateTask}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    New Task
                                </Button>
                                <FilterSortControls
                                    onFilterChange={handleFilterChange}
                                    onSortChange={handleSortChange}
                                />
                            </>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4" />
                                View Options
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toast.info('Customize columns coming soon!')}>
                                <Settings className="mr-2 h-4 w-4" />
                                Customize Columns
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info('Export view coming soon!')}>
                                <Download className="mr-2 h-4 w-4" />
                                Export View
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto px-6 pb-6">
                    {view === 'list' ? (
                        <ProjectListView projects={projects} tasks={filteredTasks} allTasks={tasks} onRefresh={handleSuccess} />
                    ) : (
                        <ProjectCalendarView tasks={filteredTasks} />
                    )}
                </div>
            </div>

            <CreateProjectDialog
                open={showCreateProjectDialog}
                onOpenChange={setShowCreateProjectDialog}
                workspaceId={workspaceId}
                onSuccess={handleSuccess}
            />

            <CreateTaskDialog
                open={showCreateTaskDialog}
                onOpenChange={setShowCreateTaskDialog}
                projectId={selectedProjectId}
                onSuccess={handleSuccess}
            />
        </DashboardLayout>
    )
}

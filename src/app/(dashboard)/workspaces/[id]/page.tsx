'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
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
    Users,
    Edit2,
    Trash2
} from 'lucide-react'
import { WorkspaceDetailSkeleton } from '@/components/skeletons/WorkspaceDetailSkeleton'
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function WorkspaceDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { getToken } = useAuth()
    const [view, setView] = useState<'list' | 'calendar'>('list')
    const [workspace, setWorkspace] = useState<Workspace | null>(null)
    const [projects, setProjects] = useState<Project[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showSkeleton, setShowSkeleton] = useState(false)
    const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false)
    const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState<string>('')
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [editWorkspaceName, setEditWorkspaceName] = useState('')
    const [editWorkspaceDescription, setEditWorkspaceDescription] = useState('')
    const [deleteConfirmation, setDeleteConfirmation] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

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
            setEditWorkspaceName(workspaceResponse.data.name)
            setEditWorkspaceDescription(workspaceResponse.data.description || '')

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

    useEffect(() => {
        const timer = setTimeout(() => setShowSkeleton(true), 150)
        return () => clearTimeout(timer)
    }, [])

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

    const handleEditWorkspace = async () => {
        try {
            setIsSubmitting(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await workspaceApi.updateWorkspace(token, workspaceId, {
                name: editWorkspaceName,
                description: editWorkspaceDescription
            })

            toast.success('Workspace updated successfully')
            setEditDialogOpen(false)
            fetchData()
        } catch (error) {
            console.error('Failed to update workspace:', error)
            toast.error('Failed to update workspace')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteWorkspace = async () => {
        if (!workspace) return

        if (workspace.name === 'My Workspace') {
            toast.error("Cannot delete 'My Workspace'")
            return
        }

        if (deleteConfirmation !== workspace.name) {
            toast.error('Please type the workspace name exactly to confirm')
            return
        }

        try {
            setIsSubmitting(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await workspaceApi.deleteWorkspace(token, workspaceId)
            toast.success('Workspace deleted successfully')
            setDeleteDialogOpen(false)
            router.push('/workspaces')
        } catch (error) {
            console.error('Failed to delete workspace:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to delete workspace')
        } finally {
            setIsSubmitting(false)
            setDeleteConfirmation('')
        }
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
        if (!showSkeleton) return null
        return <WorkspaceDetailSkeleton />
    }

    if (!workspace) {
        notFound()
        return null
    }

    return (
        <>
            <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in duration-300">
                {/* Header */}
                <div className="border-b px-6 py-4 flex items-center justify-between shrink-0 bg-background z-10">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Link href="/workspaces">
                                <Button variant="ghost" size="icon" className="h-6 w-6 -ml-1 text-muted-foreground hover:text-foreground cursor-pointer">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Link href={`/workspaces/${workspaceId}`} className="hover:text-foreground hover:underline transition-colors cursor-pointer">
                                    {workspace.name}
                                </Link>
                                <span className="text-muted-foreground/40">/</span>
                            </div>
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{workspace.name}</h1>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4" />
                                Options
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit Workspace
                            </DropdownMenuItem>
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setDeleteDialogOpen(true)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Workspace
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
                            </>
                        )}
                    </div>
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

            {/* Edit Workspace Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Workspace</DialogTitle>
                        <DialogDescription>
                            Update the workspace name and description
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="workspace-name">Workspace Name</Label>
                            <Input
                                id="workspace-name"
                                value={editWorkspaceName}
                                onChange={(e) => setEditWorkspaceName(e.target.value)}
                                placeholder="Enter workspace name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="workspace-description">Description</Label>
                            <Textarea
                                id="workspace-description"
                                value={editWorkspaceDescription}
                                onChange={(e) => setEditWorkspaceDescription(e.target.value)}
                                placeholder="Enter workspace description"
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditWorkspace} disabled={isSubmitting || !editWorkspaceName.trim()}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Workspace Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Workspace</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this workspace? All projects in this workspace will be moved to your &quot;My Workspace&quot;. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Label>Type <span className="font-bold">{workspace?.name}</span> to confirm</Label>
                        <Input
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="Enter workspace name"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setDeleteDialogOpen(false)
                            setDeleteConfirmation('')
                        }} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteWorkspace}
                            disabled={isSubmitting || deleteConfirmation !== workspace?.name}
                        >
                            {isSubmitting ? 'Deleting...' : 'Delete Workspace'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

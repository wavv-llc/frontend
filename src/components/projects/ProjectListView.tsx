'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import {
    ChevronRight,
    MoreVertical,
    FolderInput,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Project, type Task, type Workspace, workspaceApi, projectApi } from '@/lib/api'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useSidebar } from '@/contexts/SidebarContext'

interface ProjectListViewProps {
    projects: Project[]
    tasks: Task[]
    allTasks?: Task[]
    onRefresh?: () => void
}

export function ProjectListView({ projects, tasks, allTasks, onRefresh }: ProjectListViewProps) {
    const router = useRouter()
    const { getToken } = useAuth()
    const { triggerRefresh } = useSidebar()
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])

    // Fetch all workspaces for the move menu
    useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                const token = await getToken()
                if (!token) return

                const response = await workspaceApi.getWorkspaces(token)
                setWorkspaces(response.data || [])
            } catch (error) {
                console.error('Failed to fetch workspaces:', error)
            }
        }

        fetchWorkspaces()
    }, [getToken])

    const handleMoveProject = async (projectId: string, targetWorkspaceId: string, currentWorkspaceId: string) => {
        console.log('🔄 Moving project:', { projectId, targetWorkspaceId, currentWorkspaceId });

        if (targetWorkspaceId === currentWorkspaceId) {
            toast.info('Project is already in this workspace')
            return
        }

        try {
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            console.log('🔄 Calling API to move project...');
            await projectApi.updateProject(token, projectId, {
                workspaceId: targetWorkspaceId,
            })

            console.log('✅ Project moved successfully');
            toast.success('Project moved successfully')
            triggerRefresh() // Refresh sidebar
            onRefresh?.() // Refresh workspace view
        } catch (error) {
            console.error('❌ Failed to move project:', error)
            toast.error('Failed to move project')
        }
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
            {/* Projects Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/20 rounded-t-lg">
                <div className="col-span-5 pl-2">Project Name</div>
                <div className="col-span-3">Progress</div>
                <div className="col-span-2">Due Date</div>
                <div className="col-span-2">Owner</div>
            </div>

            <div className="border-x border-b border-border rounded-b-lg divide-y divide-border bg-card">
                {projects.map((project) => {
                    // Use allTasks for stats if available, otherwise use displayed tasks
                    const statsTasks = (allTasks || tasks).filter(task => task.projectId === project.id)

                    const totalTasks = statsTasks.length
                    const completedTasks = statsTasks.filter(t => t.status === 'COMPLETED').length
                    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

                    // Derive due date (latest task due date)
                    const dueDates = statsTasks
                        .map(t => t.dueAt ? new Date(t.dueAt).getTime() : 0)
                        .filter(d => d > 0)
                    const latestDueDate = dueDates.length > 0 ? new Date(Math.max(...dueDates)) : null

                    // Get owner
                    const owner = project.owners[0]

                    // Get other workspaces for move menu
                    const otherWorkspaces = workspaces.filter(w => w.id !== project.workspaceId)

                    return (
                        <div
                            key={project.id}
                            className="group transition-all duration-200"
                        >
                            {/* Project Row */}
                            <div className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-muted/50 transition-colors">
                                {/* Project Name */}
                                <div
                                    className="col-span-5 flex items-center gap-3 cursor-pointer"
                                    onClick={() => router.push(`/workspaces/${project.workspaceId}/projects/${project.id}`)}
                                >
                                    <div className="transition-transform duration-200 text-muted-foreground group-hover:translate-x-1">
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                                            {project.name || `Project ${project.id.slice(0, 8)}`}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {completedTasks} of {totalTasks} tasks completed
                                        </div>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="col-span-3 pr-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-500 rounded-full"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-muted-foreground w-9 text-right">{progress}%</span>
                                    </div>
                                </div>

                                {/* Due Date */}
                                <div className="col-span-2 text-sm text-muted-foreground">
                                    {latestDueDate ? latestDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                </div>

                                {/* Owner & Options */}
                                <div className="col-span-2 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        {owner ? (
                                            <>
                                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary ring-1 ring-background">
                                                    {owner.firstName?.[0] || owner.email[0].toUpperCase()}
                                                </div>
                                                <span className="text-sm text-muted-foreground truncate">
                                                    {owner.firstName ? `${owner.firstName} ${owner.lastName || ''}` : owner.email}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                        )}
                                    </div>

                                    {/* Options Menu */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>
                                                    <FolderInput className="h-4 w-4 mr-2" />
                                                    Move to Workspace
                                                </DropdownMenuSubTrigger>
                                                <DropdownMenuSubContent>
                                                    {otherWorkspaces.length > 0 ? (
                                                        otherWorkspaces.map((workspace) => (
                                                            <DropdownMenuItem
                                                                key={workspace.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleMoveProject(project.id, workspace.id, project.workspaceId)
                                                                }}
                                                            >
                                                                {workspace.name}
                                                            </DropdownMenuItem>
                                                        ))
                                                    ) : (
                                                        <DropdownMenuItem disabled>
                                                            No other workspaces available
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuSubContent>
                                            </DropdownMenuSub>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

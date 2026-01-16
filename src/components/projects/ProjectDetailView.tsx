'use client'

import { useState } from 'react'
import {
    Calendar as CalendarIcon,
    List as ListIcon,
    Plus,
    Calendar,
    Clock,
    User as UserIcon,
    MoreVertical,
    CheckCircle2,
    Circle,
    HelpCircle,
    AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Project, type Task } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ProjectCalendarView } from './ProjectCalendarView'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProjectDetailViewProps {
    project: Project
    tasks: Task[]
    onRefresh: () => void
    onCreateTask: () => void
}

type ViewMode = 'list' | 'calendar'

export function ProjectDetailView({
    project,
    tasks,
    onRefresh,
    onCreateTask
}: ProjectDetailViewProps) {
    const [view, setView] = useState<ViewMode>('list')

    const getStatusIcon = (status: Task['status']) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            case 'IN_PROGRESS': return <Circle className="h-4 w-4 text-blue-500 fill-blue-500/20" />
            case 'IN_REVIEW': return <AlertCircle className="h-4 w-4 text-orange-500" />
            default: return <Circle className="h-4 w-4 text-muted-foreground" />
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

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{project.description || 'Project Details'}</h1>
                    <p className="text-muted-foreground mt-1">
                        Workspace: <span className="font-medium text-foreground">{project.workspace.name}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border/50">
                        <button
                            onClick={() => setView('list')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                view === 'list'
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <ListIcon className="h-4 w-4" />
                            List
                        </button>
                        <button
                            onClick={() => setView('calendar')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                view === 'calendar'
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <CalendarIcon className="h-4 w-4" />
                            Calendar
                        </button>
                    </div>

                    <Button onClick={onCreateTask} className="gap-2 ml-2">
                        <Plus className="h-4 w-4" />
                        New Task
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0">
                {view === 'calendar' ? (
                    <ProjectCalendarView tasks={tasks} />
                ) : (
                    <div className="w-full border border-border rounded-xl bg-card shadow-sm overflow-hidden flex flex-col h-full">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/20">
                            <div className="col-span-5">Task Name</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2">Due Date</div>
                            <div className="col-span-2">Assigned To</div>
                            <div className="col-span-1 text-right">Actions</div>
                        </div>

                        {/* Table Body */}
                        <div className="overflow-y-auto flex-1">
                            {tasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                        <ListIcon className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-1">No tasks yet</h3>
                                    <p className="text-muted-foreground mb-4 max-w-sm">
                                        Get started by creating your first task for this project.
                                    </p>
                                    <Button variant="outline" onClick={onCreateTask}>
                                        Create Task
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-muted/50 transition-colors group"
                                        >
                                            <div className="col-span-5 font-medium text-sm text-foreground">
                                                {task.name}
                                            </div>
                                            <div className="col-span-2">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    {getStatusIcon(task.status)}
                                                    <span>{getStatusLabel(task.status)}</span>
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-2">
                                                {task.dueAt ? (
                                                    <>
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {new Date(task.dueAt).toLocaleDateString()}
                                                    </>
                                                ) : (
                                                    <span className="text-muted-foreground/50">-</span>
                                                )}
                                            </div>
                                            <div className="col-span-2 flex items-center -space-x-2">
                                                {(task.preparers || []).length > 0 ? (
                                                    (task.preparers || []).slice(0, 3).map((user, i) => (
                                                        <Avatar key={i} className="h-6 w-6 border-2 border-background ring-1 ring-border">
                                                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                                {user.firstName?.[0] || user.email[0].toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-muted-foreground/50 pl-2">Unassigned</span>
                                                )}
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>Edit Task</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">Delete Task</DropdownMenuItem>
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
        </div>
    )
}

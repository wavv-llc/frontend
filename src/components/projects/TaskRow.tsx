'use client'

import {
    MoreVertical,
    CheckCircle2,
    Circle,
    AlertCircle,
    ArrowUpRight,
    Edit2,
    Trash2,
    Calendar,
    Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Task } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export function TaskRow({
    task,
    onClick,
    onEdit,
    onDelete,
    onCopy
}: {
    task: Task,
    onClick: () => void,
    onEdit: (task: Task) => void
    onDelete: (id: string) => void
    onCopy: (task: Task) => void
}) {
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

    return (
        <div
            onClick={onClick}
            className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-muted/30 transition-all duration-200 group cursor-pointer border-l-2 border-l-transparent hover:border-l-primary"
        >
            <div className="col-span-7">
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
                            onEdit(task)
                        }}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            onCopy(task)
                        }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Task
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete(task.id)
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
    )
}

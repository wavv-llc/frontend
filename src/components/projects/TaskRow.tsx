'use client';

import {
    MoreVertical,
    CheckCircle2,
    Circle,
    AlertCircle,
    ArrowUpRight,
    Edit2,
    Trash2,
    Copy,
} from 'lucide-react';
import { type Task, type CustomField } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function TaskRow({
    task,
    customFields = [],
    onClick,
    onEdit,
    onDelete,
    onCopy,
}: {
    task: Task;
    customFields?: CustomField[];
    onClick: () => void;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
    onCopy: (task: Task) => void;
}) {
    const getStatusIcon = (status: Task['status']) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
            case 'IN_PROGRESS':
                return <Circle className="h-4 w-4 text-blue-600" />;
            case 'IN_REVIEW':
                return <AlertCircle className="h-4 w-4 text-amber-600" />;
            default:
                return <Circle className="h-4 w-4 text-muted-foreground/30" />;
        }
    };

    const getStatusLabel = (status: Task['status']) => {
        switch (status) {
            case 'COMPLETED':
                return 'Completed';
            case 'IN_PROGRESS':
                return 'In Progress';
            case 'IN_REVIEW':
                return 'In Review';
            default:
                return 'Pending';
        }
    };

    // Get custom field value for this task (placeholder - would need task.customFieldValues from API)
    const getCustomFieldValue = () => {
        // TODO: Once Task type includes customFieldValues, access it here
        // For now return empty/placeholder
        return '-';
    };

    return (
        <div
            onClick={onClick}
            className="flex items-center gap-4 px-8 py-5 hover:bg-muted/30 transition-all duration-200 group cursor-pointer border-l-2 border-l-transparent hover:border-l-primary min-w-max"
        >
            <div className="w-[300px] flex-shrink-0">
                <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-3">
                    {task.name}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all text-muted-foreground" />
                </div>
            </div>
            <div className="w-[120px] flex-shrink-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {getStatusIcon(task.status)}
                    <span className="text-sm text-muted-foreground">
                        {getStatusLabel(task.status)}
                    </span>
                </div>
            </div>

            <div className="w-[120px] flex-shrink-0 flex items-center -space-x-2">
                {(task.preparers || []).length > 0 ? (
                    (task.preparers || []).slice(0, 3).map((user, i) => (
                        <Avatar
                            key={i}
                            className="h-7 w-7 border-2 border-white ring-1 ring-border/50 bg-white"
                        >
                            <AvatarFallback className="text-[10px] bg-muted text-foreground font-medium">
                                {user.firstName?.[0] ||
                                    user.email[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    ))
                ) : (
                    <span className="text-xs text-muted-foreground/40 italic">
                        Unassigned
                    </span>
                )}
            </div>

            {/* Custom Field Values */}
            {customFields.map((field) => (
                <div
                    key={field.id}
                    className="w-[120px] flex-shrink-0 text-sm text-muted-foreground truncate"
                >
                    {getCustomFieldValue()}
                </div>
            ))}

            {/* Spacer for add column button */}
            <div className="w-[120px] flex-shrink-0"></div>

            <div className="w-10 flex-shrink-0 flex justify-end">
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
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(task);
                            }}
                        >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation();
                                onCopy(task);
                            }}
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Task
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(task.id);
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
    );
}

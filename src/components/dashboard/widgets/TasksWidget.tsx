'use client';

import { useState, useMemo } from 'react';
import {
    CheckCircle2,
    FolderOpen,
    Calendar as CalendarIcon,
    ArrowUpRight,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type DashboardTask } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusIcon } from '../shared';

export function TasksWidget({
    tasks,
    isLoading,
    onTaskClick,
}: {
    tasks: DashboardTask[];
    isLoading: boolean;
    onTaskClick: (task: DashboardTask) => void;
}) {
    const [activeTab, setActiveTab] = useState<'todo' | 'done'>('todo');

    // Memoized filters
    const displayTasks = useMemo(() => {
        if (activeTab === 'done') {
            return tasks.filter((t) => t.status === 'COMPLETED');
        }
        return tasks
            .filter((t) => t.status !== 'COMPLETED')
            .sort((a, b) => {
                if (!a.dueAt) return 1;
                if (!b.dueAt) return -1;
                return (
                    new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
                );
            });
    }, [tasks, activeTab]);

    if (isLoading) {
        return <Skeleton className="h-full w-full rounded-xl" />;
    }

    return (
        <Card className="h-full bg-background/60 backdrop-blur-xl border-border/50 shadow-sm flex flex-col overflow-hidden">
            <CardHeader className="pb-0 border-b border-border/40 bg-muted/20 py-3 px-4 mb-0 shrink-0 cursor-move">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-serif font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        My Tasks
                    </CardTitle>
                    <div
                        className="flex p-0.5 bg-muted/50 rounded-lg border border-border/20"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setActiveTab('todo')}
                            className={cn(
                                'text-[10px] font-medium px-2 py-1 rounded-sm transition-all',
                                activeTab === 'todo'
                                    ? 'bg-background shadow-sm text-primary'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            To Do
                        </button>
                        <button
                            onClick={() => setActiveTab('done')}
                            className={cn(
                                'text-[10px] font-medium px-2 py-1 rounded-sm transition-all',
                                activeTab === 'done'
                                    ? 'bg-background shadow-sm text-primary'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </CardHeader>
            <ScrollArea className="flex-1">
                <div className="p-0 space-y-0 divide-y divide-border/20">
                    {displayTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <Sparkles className="w-10 h-10 mb-3 opacity-20 text-primary" />
                            <p className="text-sm font-medium">
                                All caught up!
                            </p>
                            <p className="text-xs opacity-70">
                                No tasks on your plate right now.
                            </p>
                        </div>
                    ) : (
                        displayTasks.map((task) => {
                            const dueDate = task.dueAt
                                ? new Date(task.dueAt)
                                : null;
                            const isOverdue =
                                dueDate &&
                                dueDate < new Date() &&
                                task.status !== 'COMPLETED';

                            return (
                                <button
                                    key={task.id}
                                    onClick={() => onTaskClick(task)}
                                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-all group text-left relative"
                                >
                                    <div className="shrink-0">
                                        <StatusIcon status={task.status} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span
                                            className={cn(
                                                'text-sm font-medium truncate block transition-colors',
                                                task.status === 'COMPLETED'
                                                    ? 'text-muted-foreground line-through'
                                                    : 'text-foreground group-hover:text-primary',
                                            )}
                                        >
                                            {task.name}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                                        <span className="flex items-center gap-1.5 opacity-70">
                                            <FolderOpen className="w-3 h-3" />
                                            <span className="truncate max-w-[100px]">
                                                {task.project.name}
                                            </span>
                                        </span>

                                        {dueDate && (
                                            <span
                                                className={cn(
                                                    'flex items-center gap-1.5 transition-colors',
                                                    isOverdue
                                                        ? 'text-red-500 font-medium'
                                                        : 'opacity-70',
                                                )}
                                            >
                                                <CalendarIcon className="w-3 h-3" />
                                                {dueDate.toLocaleDateString(
                                                    undefined,
                                                    {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    },
                                                )}
                                            </span>
                                        )}
                                    </div>

                                    <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                                        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
}

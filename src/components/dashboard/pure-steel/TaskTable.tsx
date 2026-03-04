'use client';

import React, { useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Minus, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge, type Status } from './StatusBadge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty } from '@/components/ui/empty';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip';

export interface Task {
    id: string;
    clientName: string;
    formType: string;
    priority: 'high' | 'medium' | 'low';
    status: Status;
    dueDate: Date;
}

interface TaskTableProps {
    tasks: Task[];
    onTaskClick?: (task: Task) => void;
    className?: string;
    isLoading?: boolean;
}

type TabType = 'all' | 'my-tasks' | 'overdue';

const PRIORITY_CONFIG = {
    high: {
        icon: ArrowUp,
        color: 'text-[#e05252]',
        label: 'High',
    },
    medium: {
        icon: Minus,
        color: 'text-[#b5880a]',
        label: 'Medium',
    },
    low: {
        icon: ArrowDown,
        color: 'text-(--dashboard-text-steel-alt-800aint)',
        label: 'Low',
    },
};

function formatDueDate(date: Date): string {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return `${Math.abs(diffDays)}d overdue`;
    } else if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Tomorrow';
    } else if (diffDays <= 7) {
        return `${diffDays}d`;
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    }
}

function formatFullDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function TaskTable({
    tasks,
    onTaskClick,
    className,
    isLoading = false,
}: TaskTableProps) {
    const [activeTab, setActiveTab] = useState<TabType>('all');

    // Filter tasks based on active tab
    const filteredTasks = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        switch (activeTab) {
            case 'my-tasks':
                // TODO: Filter by assigned user when user data is available
                return tasks;
            case 'overdue':
                return tasks.filter((task) => task.dueDate < now);
            case 'all':
            default:
                return tasks;
        }
    }, [tasks, activeTab]);

    // Sort by due date (closest first)
    const sortedTasks = useMemo(() => {
        return [...filteredTasks].sort(
            (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
        );
    }, [filteredTasks]);

    const triggerClass = cn(
        'relative px-3 py-1.5 font-sans text-xs rounded-none border-0 h-auto',
        'data-[state=active]:bg-transparent data-[state=active]:text-(--accent) data-[state=active]:font-medium',
        'data-[state=inactive]:text-dashboard-text-muted data-[state=inactive]:font-normal',
        'hover:text-(--dashboard-text-steel-alt-800ody)',
        'after:bg-[#6A9AB8] after:h-[1.5px] after:bottom-0',
    );

    return (
        <div
            className={cn(
                'bg-[var(--dashboard-surface)] rounded-xl border border-dashboard-border',
                'overflow-hidden flex flex-col',
                'transition-shadow duration-200 hover:shadow-[0_2px_16px_rgba(90,127,154,0.05)]',
                className,
            )}
        >
            <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as TabType)}
                className="flex flex-col flex-1 min-h-0 gap-0"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4.5 py-3 border-b border-dashboard-border">
                    {/* Title */}
                    <h2 className="font-serif text-[14px] font-semibold tracking-tight text-dashboard-text-primary">
                        Tasks
                    </h2>

                    {/* Tabs */}
                    <TabsList
                        variant="line"
                        className="h-auto p-0 bg-transparent border-b border-dashboard-border rounded-none gap-0"
                    >
                        <TabsTrigger value="all" className={triggerClass}>
                            All Tasks
                        </TabsTrigger>
                        <TabsTrigger value="my-tasks" className={triggerClass}>
                            My Tasks
                        </TabsTrigger>
                        <TabsTrigger value="overdue" className={triggerClass}>
                            Overdue
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Shared content across all tabs */}
                {(['all', 'my-tasks', 'overdue'] as TabType[]).map((tab) => (
                    <TabsContent
                        key={tab}
                        value={tab}
                        className="flex-1 min-h-0 mt-0 overflow-hidden flex flex-col"
                    >
                        <Table className="table-fixed">
                            <TableHeader>
                                <TableRow className="border-b border-dashboard-border-light hover:bg-transparent">
                                    <TableHead className="px-4.5 py-2 h-auto font-sans text-[8px] font-semibold uppercase tracking-wider text-dashboard-text-muted w-auto">
                                        Client &amp; Form
                                    </TableHead>
                                    <TableHead className="px-0 py-2 h-auto font-sans text-[8px] font-semibold uppercase tracking-wider text-dashboard-text-muted w-18">
                                        Priority
                                    </TableHead>
                                    <TableHead className="px-0 py-2 h-auto font-sans text-[8px] font-semibold uppercase tracking-wider text-dashboard-text-muted w-20.25">
                                        Due Date
                                    </TableHead>
                                    <TableHead className="px-0 py-2 h-auto font-sans text-[8px] font-semibold uppercase tracking-wider text-dashboard-text-muted w-27">
                                        Status
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <TableRow
                                            key={i}
                                            className="border-b border-dashboard-border-light hover:bg-transparent"
                                        >
                                            <TableCell className="px-4.5 py-2">
                                                <div className="flex flex-col gap-1 justify-center">
                                                    <Skeleton className="h-3 w-28 bg-dashboard-border" />
                                                    <Skeleton className="h-2.5 w-14 bg-dashboard-border" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-0 py-2">
                                                <Skeleton className="h-2.5 w-2.5 bg-dashboard-border" />
                                            </TableCell>
                                            <TableCell className="px-0 py-2">
                                                <Skeleton className="h-2.5 w-10 bg-dashboard-border" />
                                            </TableCell>
                                            <TableCell className="px-0 py-2">
                                                <Skeleton className="h-4 w-16 rounded-full bg-dashboard-border" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : sortedTasks.length === 0 ? (
                                    <TableRow className="hover:bg-transparent border-0">
                                        <TableCell colSpan={4} className="p-0">
                                            <Empty
                                                icon={
                                                    <ClipboardList className="w-5 h-5" />
                                                }
                                                title="No tasks found"
                                                description="Tasks will appear here once assigned."
                                                className="py-10"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedTasks.map((task) => {
                                        const PriorityIcon =
                                            PRIORITY_CONFIG[task.priority].icon;
                                        const isOverdue =
                                            task.dueDate < new Date();

                                        return (
                                            <Tooltip key={task.id}>
                                                <TooltipTrigger asChild>
                                                    <TableRow
                                                        onClick={() =>
                                                            onTaskClick?.(task)
                                                        }
                                                        className={cn(
                                                            'border-b border-dashboard-border-light last:border-0',
                                                            'transition-colors duration-150',
                                                            'hover:bg-accent-row-hover',
                                                            'cursor-pointer',
                                                        )}
                                                    >
                                                        {/* Client & Form */}
                                                        <TableCell className="px-4.5 py-2">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-sans text-[12px] font-[450] text-dashboard-text-primary">
                                                                    {
                                                                        task.clientName
                                                                    }
                                                                </span>
                                                                <span className="font-sans text-[10px] font-normal text-dashboard-text-muted">
                                                                    {
                                                                        task.formType
                                                                    }
                                                                </span>
                                                            </div>
                                                        </TableCell>

                                                        {/* Priority */}
                                                        <TableCell className="px-0 py-2">
                                                            <PriorityIcon
                                                                className={cn(
                                                                    'w-2.5 h-2.5',
                                                                    PRIORITY_CONFIG[
                                                                        task
                                                                            .priority
                                                                    ].color,
                                                                )}
                                                                strokeWidth={3}
                                                            />
                                                        </TableCell>

                                                        {/* Due Date */}
                                                        <TableCell className="px-0 py-2">
                                                            <span
                                                                className={cn(
                                                                    'font-sans text-[10px] font-light',
                                                                    isOverdue
                                                                        ? 'text-status-urgent'
                                                                        : 'text-dashboard-text-muted',
                                                                )}
                                                            >
                                                                {formatDueDate(
                                                                    task.dueDate,
                                                                )}
                                                            </span>
                                                        </TableCell>

                                                        {/* Status */}
                                                        <TableCell className="px-0 py-2">
                                                            <StatusBadge
                                                                status={
                                                                    task.status
                                                                }
                                                                size="sm"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                </TooltipTrigger>
                                                <TooltipContent
                                                    side="top"
                                                    className="font-sans text-xs"
                                                >
                                                    <span className="font-medium">
                                                        Due:
                                                    </span>{' '}
                                                    {formatFullDate(
                                                        task.dueDate,
                                                    )}
                                                    {isOverdue && (
                                                        <span className="ml-1 text-[#e05252]">
                                                            (overdue)
                                                        </span>
                                                    )}
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

'use client';

import React, { useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge, type Status } from './StatusBadge';

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
}

type TabType = 'all' | 'my-tasks' | 'overdue';

const TABS: { key: TabType; label: string }[] = [
    { key: 'all', label: 'All Tasks' },
    { key: 'my-tasks', label: 'My Tasks' },
    { key: 'overdue', label: 'Overdue' },
];

const PRIORITY_CONFIG = {
    high: {
        icon: ArrowUp,
        color: 'text-[#E05252]',
        label: 'High',
    },
    medium: {
        icon: Minus,
        color: 'text-[#B5880A]',
        label: 'Medium',
    },
    low: {
        icon: ArrowDown,
        color: 'text-[var(--dashboard-text-faint)]',
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

export function TaskTable({ tasks, onTaskClick, className }: TaskTableProps) {
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

    return (
        <div
            className={cn(
                'bg-[var(--dashboard-surface)] rounded-xl border border-[var(--dashboard-border)]',
                'overflow-hidden',
                'transition-shadow duration-200 hover:shadow-[0_2px_16px_rgba(90,127,154,0.05)]',
                className,
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-[18px] py-3 border-b border-[var(--dashboard-border)]">
                {/* Title */}
                <h2 className="font-serif text-[14px] font-semibold tracking-tight text-[var(--dashboard-text-primary)]">
                    Tasks
                </h2>

                {/* Tabs */}
                <div className="relative flex items-center gap-1 border-b border-[var(--dashboard-border)]">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                'relative px-3 py-1.5 font-sans text-xs transition-colors cursor-pointer',
                                activeTab === tab.key
                                    ? 'text-[var(--accent)] font-medium'
                                    : 'text-[var(--dashboard-text-muted)] font-normal hover:text-[var(--dashboard-text-body)]',
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.key && (
                                <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#6A9AB8]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Column Headers */}
            <div
                className={cn(
                    'grid px-[18px] py-2',
                    'border-b border-[var(--dashboard-border-light)]',
                    'grid-cols-[1fr_72px_81px_108px]',
                )}
            >
                <div className="font-sans text-[8px] font-semibold uppercase tracking-wider text-[var(--dashboard-text-muted)]">
                    Client & Form
                </div>
                <div className="font-sans text-[8px] font-semibold uppercase tracking-wider text-[var(--dashboard-text-muted)]">
                    Priority
                </div>
                <div className="font-sans text-[8px] font-semibold uppercase tracking-wider text-[var(--dashboard-text-muted)]">
                    Due Date
                </div>
                <div className="font-sans text-[8px] font-semibold uppercase tracking-wider text-[var(--dashboard-text-muted)]">
                    Status
                </div>
            </div>

            {/* Task Rows */}
            <div className="max-h-[360px] overflow-y-auto">
                {sortedTasks.length === 0 ? (
                    <div className="py-10 text-center">
                        <p className="font-sans text-[12px] text-[var(--dashboard-text-muted)]">
                            No tasks found
                        </p>
                    </div>
                ) : (
                    sortedTasks.map((task) => {
                        const PriorityIcon =
                            PRIORITY_CONFIG[task.priority].icon;
                        const isOverdue = task.dueDate < new Date();

                        return (
                            <button
                                key={task.id}
                                onClick={() => onTaskClick?.(task)}
                                className={cn(
                                    'grid w-full px-[18px] py-2',
                                    'grid-cols-[1fr_72px_81px_108px]',
                                    'border-b border-[var(--dashboard-border-light)] last:border-0',
                                    'transition-colors duration-150',
                                    'hover:bg-[var(--accent-row-hover)]',
                                    'text-left',
                                )}
                            >
                                {/* Client & Form */}
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-sans text-[12px] font-[450] text-[var(--dashboard-text-primary)]">
                                        {task.clientName}
                                    </span>
                                    <span className="font-sans text-[10px] font-normal text-[var(--dashboard-text-muted)]">
                                        {task.formType}
                                    </span>
                                </div>

                                {/* Priority */}
                                <div className="flex items-center">
                                    <PriorityIcon
                                        className={cn(
                                            'w-2.5 h-2.5',
                                            PRIORITY_CONFIG[task.priority]
                                                .color,
                                        )}
                                        strokeWidth={3}
                                    />
                                </div>

                                {/* Due Date */}
                                <div className="flex items-center">
                                    <span
                                        className={cn(
                                            'font-sans text-[10px] font-light',
                                            isOverdue
                                                ? 'text-[var(--status-urgent)]'
                                                : 'text-[var(--dashboard-text-muted)]',
                                        )}
                                    >
                                        {formatDueDate(task.dueDate)}
                                    </span>
                                </div>

                                {/* Status */}
                                <div className="flex items-center">
                                    <StatusBadge
                                        status={task.status}
                                        size="sm"
                                    />
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

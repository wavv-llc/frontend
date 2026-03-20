'use client';

import { useMemo, useState } from 'react';
import { cn, parseDateOnly } from '@/lib/utils';
import { type Task } from '@/lib/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectCalendarViewProps {
    tasks: Task[];
    compact?: boolean; // When true, uses a simplified layout without task name column
    currentUserId?: string; // For "My Tasks" filter
}

type ViewMode = 'week' | 'month';

/** Determine Gantt-style progress status for a task */
function getProgressStatus(
    task: Task,
    now: Date,
): 'complete' | 'in-progress' | 'behind' {
    if (task.approvalStatus === 'COMPLETED') return 'complete';
    if (task.dueAt) {
        const due = parseDateOnly(task.dueAt);
        due.setHours(23, 59, 59, 999);
        if (now > due) return 'behind';
    }
    return 'in-progress';
}

const PROGRESS_COLORS = {
    complete: {
        bg: 'bg-emerald-500',
        bgLight: 'bg-emerald-50',
        border: 'border-emerald-500/30',
        text: 'text-emerald-700',
        hex: '#10b981',
    },
    'in-progress': {
        bg: 'bg-blue-500',
        bgLight: 'bg-blue-50',
        border: 'border-blue-500/30',
        text: 'text-blue-700',
        hex: '#3b82f6',
    },
    behind: {
        bg: 'bg-red-500',
        bgLight: 'bg-red-50',
        border: 'border-red-500/30',
        text: 'text-red-700',
        hex: '#ef4444',
    },
} as const;

const PROGRESS_LABELS = {
    complete: 'Complete',
    'in-progress': 'In Progress',
    behind: 'Behind Schedule',
} as const;

/** Check if a task is assigned to a specific user via approvalChain */
function isAssignedToUser(task: Task, userId: string): boolean {
    if (!task.approvalChain) return false;
    return task.approvalChain.some((e) => e.user?.id === userId);
}

export function ProjectCalendarView({
    tasks,
    compact = false,
    currentUserId,
}: ProjectCalendarViewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [myTasksOnly, setMyTasksOnly] = useState(false);

    const now = useMemo(() => new Date(), []);

    // Filter tasks: only those with due dates, optionally filtered by current user
    const filteredTasks = useMemo(() => {
        let result = tasks.filter((task) => task.dueAt);
        if (myTasksOnly && currentUserId) {
            result = result.filter((task) =>
                isAssignedToUser(task, currentUserId),
            );
        }
        return result;
    }, [tasks, myTasksOnly, currentUserId]);

    // Generate current week dates
    const weekDates = useMemo(() => {
        const currentDay = currentDate.getDay();
        const monday = new Date(currentDate);
        monday.setDate(
            currentDate.getDate() - (currentDay === 0 ? 6 : currentDay - 1),
        );

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            return date;
        });
    }, [currentDate]);

    // Generate month dates (including padding days from previous/next month)
    const monthDates = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay();
        const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - offset);

        return Array.from({ length: 42 }, (_, i) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            return date;
        });
    }, [currentDate]);

    const weeks = useMemo(() => {
        const chunks = [];
        for (let i = 0; i < monthDates.length; i += 7) {
            chunks.push(monthDates.slice(i, i + 7));
        }
        return chunks;
    }, [monthDates]);

    const getWeekLayout = (weekDates: Date[]) => {
        const weekStart = new Date(weekDates[0]);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekDates[6]);
        weekEnd.setHours(23, 59, 59, 999);

        // Filter tasks visible in this week
        const weekTasks = filteredTasks.filter((task) => {
            if (!task.dueAt) return false;
            const taskStart = new Date(task.createdAt);
            const taskEnd = parseDateOnly(task.dueAt);

            taskStart.setHours(0, 0, 0, 0);
            taskEnd.setHours(23, 59, 59, 999);
            if (taskStart > taskEnd) taskStart.setTime(taskEnd.getTime());

            return taskEnd >= weekStart && taskStart <= weekEnd;
        });

        // Sort: earlier start => top, longer => top
        weekTasks.sort((a, b) => {
            const startA = new Date(a.createdAt).getTime();
            const startB = new Date(b.createdAt).getTime();
            if (startA !== startB) return startA - startB;
            return 0;
        });

        const slots: string[][] = [];
        const layout: {
            task: Task;
            startIdx: number;
            span: number;
            rowIndex: number;
        }[] = [];

        weekTasks.forEach((task) => {
            const taskStart = new Date(task.createdAt);
            const taskEnd = parseDateOnly(task.dueAt!);
            taskStart.setHours(0, 0, 0, 0);
            taskEnd.setHours(23, 59, 59, 999);
            if (taskStart > taskEnd) taskStart.setTime(taskEnd.getTime());

            let startIdx = 0;
            if (taskStart >= weekStart) {
                const diff = Math.floor(
                    (taskStart.getTime() - weekStart.getTime()) /
                        (24 * 3600 * 1000),
                );
                startIdx = Math.max(0, diff);
            }

            let endIdx = 6;
            if (taskEnd <= weekEnd) {
                const diff = Math.floor(
                    (taskEnd.getTime() - weekStart.getTime()) /
                        (24 * 3600 * 1000),
                );
                endIdx = Math.min(6, diff);
            }

            let rowIndex = 0;
            while (true) {
                if (!slots[rowIndex]) slots[rowIndex] = new Array(7).fill(null);

                let collision = false;
                for (let c = startIdx; c <= endIdx; c++) {
                    if (slots[rowIndex][c]) {
                        collision = true;
                        break;
                    }
                }

                if (!collision) {
                    for (let c = startIdx; c <= endIdx; c++) {
                        slots[rowIndex][c] = task.id;
                    }
                    layout.push({
                        task,
                        startIdx,
                        span: endIdx - startIdx + 1,
                        rowIndex,
                    });
                    break;
                }
                rowIndex++;
            }
        });

        return { layout, maxRows: slots.length };
    };

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();

    const getTaskPosition = (task: Task) => {
        if (!task.dueAt) return null;

        const startDate = new Date(task.createdAt);
        const dueDate = parseDateOnly(task.dueAt);

        startDate.setHours(0, 0, 0, 0);
        dueDate.setHours(23, 59, 59, 999);

        if (startDate > dueDate) {
            startDate.setTime(dueDate.getTime());
            startDate.setHours(0, 0, 0, 0);
        }

        const startOfWeek = new Date(weekDates[0]);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(weekDates[6]);
        endOfWeek.setHours(23, 59, 59, 999);

        if (dueDate < startOfWeek || startDate > endOfWeek) return null;

        const visualStart = startDate < startOfWeek ? startOfWeek : startDate;
        const visualEnd = dueDate > endOfWeek ? endOfWeek : dueDate;

        const visualEndNormalized = new Date(visualEnd);
        visualEndNormalized.setHours(0, 0, 0, 0);

        const dayMs = 24 * 60 * 60 * 1000;
        const startIdx = Math.max(
            0,
            Math.floor((visualStart.getTime() - startOfWeek.getTime()) / dayMs),
        );
        const endIdx = Math.min(
            6,
            Math.floor(
                (visualEndNormalized.getTime() - startOfWeek.getTime()) / dayMs,
            ),
        );

        const span = endIdx - startIdx + 1;

        return {
            left: `${(startIdx * 100) / 7 + 0.5}%`,
            width: `${(span * 100) / 7 - 1}%`,
        };
    };

    const isToday = (date: Date) => {
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const isCurrentMonth = (date: Date) => {
        return (
            date.getMonth() === currentDate.getMonth() &&
            date.getFullYear() === currentDate.getFullYear()
        );
    };

    return (
        <div className="w-full h-full border-none rounded-none bg-transparent shadow-none overflow-hidden flex flex-col">
            {/* Header Controls */}
            <div className="px-0 py-2 flex items-center justify-between bg-transparent shrink-0">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            const newDate = new Date(currentDate);
                            if (viewMode === 'week') {
                                newDate.setDate(newDate.getDate() - 7);
                            } else {
                                newDate.setMonth(newDate.getMonth() - 1);
                            }
                            setCurrentDate(newDate);
                        }}
                        className="h-8 w-8 hover:bg-accent-hover text-dashboard-text-muted"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="font-semibold text-lg text-dashboard-text-primary min-w-35 text-center font-serif">
                        {viewMode === 'week'
                            ? weekDates[0].toLocaleDateString('en-US', {
                                  month: 'long',
                                  year: 'numeric',
                              })
                            : currentDate.toLocaleDateString('en-US', {
                                  month: 'long',
                                  year: 'numeric',
                              })}
                    </span>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            const newDate = new Date(currentDate);
                            if (viewMode === 'week') {
                                newDate.setDate(newDate.getDate() + 7);
                            } else {
                                newDate.setMonth(newDate.getMonth() + 1);
                            }
                            setCurrentDate(newDate);
                        }}
                        className="h-8 w-8 hover:bg-accent-hover text-dashboard-text-muted"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Legend */}
                    <div className="hidden md:flex items-center gap-3 mr-2">
                        {(
                            Object.keys(PROGRESS_COLORS) as Array<
                                keyof typeof PROGRESS_COLORS
                            >
                        ).map((key) => (
                            <div
                                key={key}
                                className="flex items-center gap-1.5"
                            >
                                <div
                                    className="w-3 h-2 rounded-sm"
                                    style={{
                                        backgroundColor:
                                            PROGRESS_COLORS[key].hex,
                                    }}
                                />
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                    {PROGRESS_LABELS[key]}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* My Tasks toggle */}
                    {currentUserId && (
                        <Button
                            variant={myTasksOnly ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setMyTasksOnly((v) => !v)}
                            className={cn(
                                'h-8 gap-1.5 text-xs',
                                myTasksOnly
                                    ? 'bg-accent-blue hover:bg-accent-blue/90 text-white border-accent-blue'
                                    : 'border-dashboard-border text-dashboard-text-muted hover:text-dashboard-text-primary hover:border-accent-blue hover:bg-accent-subtle',
                            )}
                        >
                            <User className="h-3 w-3" />
                            My Tasks
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(new Date())}
                        className="h-8 border-dashboard-border text-dashboard-text-muted hover:text-dashboard-text-primary hover:border-accent-blue hover:bg-accent-subtle"
                    >
                        Today
                    </Button>
                    <div className="flex items-center bg-dashboard-surface rounded-lg border border-dashboard-border overflow-hidden">
                        <button
                            onClick={() => setViewMode('week')}
                            className={cn(
                                'px-3 h-8 text-sm font-medium transition-colors',
                                viewMode === 'week'
                                    ? 'bg-accent-blue text-white'
                                    : 'text-dashboard-text-muted hover:text-dashboard-text-primary hover:bg-accent-hover',
                            )}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={cn(
                                'px-3 h-8 text-sm font-medium transition-colors',
                                viewMode === 'month'
                                    ? 'bg-accent-blue text-white'
                                    : 'text-dashboard-text-muted hover:text-dashboard-text-primary hover:bg-accent-hover',
                            )}
                        >
                            Month
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Legend (shown below header on small screens) */}
            <div className="flex md:hidden items-center gap-3 px-1 pb-2 shrink-0">
                {(
                    Object.keys(PROGRESS_COLORS) as Array<
                        keyof typeof PROGRESS_COLORS
                    >
                ).map((key) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <div
                            className="w-3 h-2 rounded-sm"
                            style={{
                                backgroundColor: PROGRESS_COLORS[key].hex,
                            }}
                        />
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {PROGRESS_LABELS[key]}
                        </span>
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="relative flex-1 overflow-y-auto">
                {viewMode === 'week' ? (
                    <>
                        {/* Week View - Timeline Header */}
                        <div
                            className={cn(
                                'border-b border-dashboard-border sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-sm',
                                compact
                                    ? 'grid grid-cols-7'
                                    : 'grid grid-cols-[250px_1fr]',
                            )}
                        >
                            {!compact && (
                                <div className="p-4 flex items-end font-medium text-xs text-dashboard-text-muted uppercase tracking-wider border-r border-dashboard-border">
                                    Task Name
                                </div>
                            )}
                            <div
                                className={cn(
                                    compact
                                        ? 'contents'
                                        : 'grid grid-cols-7 flex-1',
                                )}
                            >
                                {weekDates.map((date, i) => {
                                    const isTodayDate = isToday(date);
                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                'flex flex-col items-center justify-center py-4 px-2 border-r border-border/40 text-sm last:border-0 relative min-w-0',
                                                (i === 5 || i === 6) &&
                                                    'bg-muted/5',
                                                isTodayDate && 'bg-primary/5',
                                            )}
                                        >
                                            {isTodayDate && (
                                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
                                            )}
                                            <span
                                                className={cn(
                                                    'text-xs font-medium mb-1 whitespace-nowrap',
                                                    isTodayDate
                                                        ? 'text-primary'
                                                        : 'text-muted-foreground',
                                                )}
                                            >
                                                {days[i]}
                                            </span>
                                            <div
                                                className={cn(
                                                    'h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                                                    isTodayDate
                                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                                        : 'text-foreground',
                                                )}
                                            >
                                                {date.getDate()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Week View - Task Rows */}
                        <div className="divide-y divide-border/40 relative bg-background/30 min-h-[300px]">
                            {/* Background Grid Lines */}
                            <div
                                className={cn(
                                    'absolute inset-0 pointer-events-none z-0',
                                    compact
                                        ? 'grid grid-cols-7'
                                        : 'grid grid-cols-[250px_1fr]',
                                )}
                            >
                                {!compact && (
                                    <div className="border-r border-border/40 h-full bg-muted/5" />
                                )}
                                <div
                                    className={cn(
                                        compact
                                            ? 'contents'
                                            : 'grid grid-cols-7 h-full flex-1',
                                    )}
                                >
                                    {weekDates.map((date, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                'border-r border-border/40 h-full last:border-0',
                                                (i === 5 || i === 6) &&
                                                    'bg-muted/5',
                                                isToday(date) && 'bg-primary/5',
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>

                            {filteredTasks.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground z-10">
                                    <p className="mb-2">
                                        {myTasksOnly
                                            ? 'No tasks assigned to you'
                                            : 'No tasks with due dates'}
                                    </p>
                                    <p className="text-xs opacity-60">
                                        Tasks with due dates will appear here
                                    </p>
                                </div>
                            ) : (
                                <div className="relative z-10">
                                    {filteredTasks.map((task) => {
                                        const position = getTaskPosition(task);
                                        if (!position) return null;
                                        const status = getProgressStatus(
                                            task,
                                            now,
                                        );
                                        const colors = PROGRESS_COLORS[status];

                                        return (
                                            <div
                                                key={task.id}
                                                className={cn(
                                                    'min-h-[56px] relative group hover:bg-muted/30 transition-colors border-b border-border/40 last:border-0',
                                                    compact
                                                        ? 'grid grid-cols-7'
                                                        : 'grid grid-cols-[250px_1fr]',
                                                )}
                                            >
                                                {!compact && (
                                                    <div className="px-4 py-3 flex flex-col justify-center border-r border-border/40 bg-background/40 backdrop-blur-[1px]">
                                                        <span className="font-medium text-sm text-foreground truncate">
                                                            {task.name}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <div className="flex -space-x-2">
                                                                            {(
                                                                                task.approvalChain ??
                                                                                []
                                                                            )
                                                                                .filter(
                                                                                    (
                                                                                        e,
                                                                                    ) =>
                                                                                        e.role ===
                                                                                            'PREPARER' &&
                                                                                        e.user,
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        e,
                                                                                    ) =>
                                                                                        e.user!,
                                                                                )
                                                                                .slice(
                                                                                    0,
                                                                                    3,
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        user,
                                                                                        i,
                                                                                    ) => (
                                                                                        <Avatar
                                                                                            key={
                                                                                                i
                                                                                            }
                                                                                            className="h-5 w-5 border-2 border-background ring-1 ring-border/50"
                                                                                        >
                                                                                            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                                                                                {user
                                                                                                    .firstName?.[0] ||
                                                                                                    user.email[0].toUpperCase()}
                                                                                            </AvatarFallback>
                                                                                        </Avatar>
                                                                                    ),
                                                                                )}
                                                                            {(
                                                                                task.approvalChain ??
                                                                                []
                                                                            ).filter(
                                                                                (
                                                                                    e,
                                                                                ) =>
                                                                                    e.role ===
                                                                                        'PREPARER' &&
                                                                                    e.user,
                                                                            )
                                                                                .length ===
                                                                                0 && (
                                                                                <div className="h-5 w-5 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] text-muted-foreground">
                                                                                    ?
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>
                                                                            Assigned
                                                                            to:{' '}
                                                                            {(
                                                                                task.approvalChain ??
                                                                                []
                                                                            )
                                                                                .filter(
                                                                                    (
                                                                                        e,
                                                                                    ) =>
                                                                                        e.role ===
                                                                                            'PREPARER' &&
                                                                                        e.user,
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        e,
                                                                                    ) =>
                                                                                        e
                                                                                            .user!
                                                                                            .firstName,
                                                                                )
                                                                                .join(
                                                                                    ', ',
                                                                                ) ||
                                                                                'Unassigned'}
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                            <span
                                                                className={cn(
                                                                    'text-[10px] font-medium px-1.5 py-0.5 rounded',
                                                                    colors.bgLight,
                                                                    colors.text,
                                                                )}
                                                            >
                                                                {
                                                                    PROGRESS_LABELS[
                                                                        status
                                                                    ]
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                <div
                                                    className={cn(
                                                        'relative h-full w-full py-2',
                                                        compact && 'col-span-7',
                                                    )}
                                                >
                                                    {/* Task Bar */}
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <div
                                                                    className="absolute top-1/2 -translate-y-1/2 h-9 rounded-md flex items-center shadow-sm cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md ring-1 ring-black/5 group-hover:z-10"
                                                                    style={{
                                                                        ...position,
                                                                        backgroundColor: `${colors.hex}20`,
                                                                        borderLeft: `3px solid ${colors.hex}`,
                                                                    }}
                                                                >
                                                                    <div className="px-3 flex items-center gap-1.5 w-full overflow-hidden">
                                                                        <div
                                                                            className="w-1.5 h-1.5 rounded-full shrink-0"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    colors.hex,
                                                                            }}
                                                                        />
                                                                        <span
                                                                            className="text-xs font-semibold truncate relative z-10"
                                                                            style={{
                                                                                color: colors.hex,
                                                                            }}
                                                                        >
                                                                            {
                                                                                task.name
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div className="text-xs">
                                                                    <p className="font-semibold mb-1">
                                                                        {
                                                                            task.name
                                                                        }
                                                                    </p>
                                                                    <p className="text-muted-foreground">
                                                                        Status:{' '}
                                                                        {
                                                                            PROGRESS_LABELS[
                                                                                status
                                                                            ]
                                                                        }
                                                                    </p>
                                                                    <p className="text-muted-foreground">
                                                                        Due:{' '}
                                                                        {parseDateOnly(
                                                                            task.dueAt!,
                                                                        ).toLocaleDateString()}
                                                                    </p>
                                                                    {task
                                                                        .project
                                                                        ?.description && (
                                                                        <p className="text-muted-foreground">
                                                                            Project:{' '}
                                                                            {
                                                                                task
                                                                                    .project
                                                                                    .description
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Month View */}
                        <div className="h-full">
                            {/* Month View Header - Days of Week */}
                            <div className="grid grid-cols-7 border-b border-border/50 sticky top-0 z-20 bg-background/95 backdrop-blur-sm shadow-sm">
                                {[
                                    'Mon',
                                    'Tue',
                                    'Wed',
                                    'Thu',
                                    'Fri',
                                    'Sat',
                                    'Sun',
                                ].map((day, i) => (
                                    <div
                                        key={i}
                                        className="py-3 px-2 text-center"
                                    >
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            {day}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Month View Grid */}
                            <div className="flex flex-col">
                                {weeks.map((week, weekIndex) => {
                                    const { layout, maxRows } =
                                        getWeekLayout(week);
                                    const minHeight = Math.max(
                                        160,
                                        48 + maxRows * 30 + 10,
                                    );

                                    return (
                                        <div
                                            key={weekIndex}
                                            className="relative border-b border-border/30 flex-1 w-full"
                                            style={{
                                                minHeight: `${minHeight}px`,
                                            }}
                                        >
                                            {/* Grid Background (Days) */}
                                            <div className="absolute inset-0 grid grid-cols-7 z-0 pointer-events-none">
                                                {week.map((date, i) => {
                                                    const isCurrentMonthDay =
                                                        isCurrentMonth(date);
                                                    const isTodayDate =
                                                        isToday(date);
                                                    const isWeekend =
                                                        date.getDay() === 0 ||
                                                        date.getDay() === 6;

                                                    return (
                                                        <div
                                                            key={i}
                                                            className={cn(
                                                                'border-r border-border/30 h-full p-3 last:border-r-0 transition-colors',
                                                                !isCurrentMonthDay
                                                                    ? 'bg-muted/5 opacity-50 text-muted-foreground'
                                                                    : 'bg-transparent',
                                                                isWeekend &&
                                                                    isCurrentMonthDay &&
                                                                    'bg-muted/5',
                                                            )}
                                                            style={
                                                                isWeekend &&
                                                                isCurrentMonthDay
                                                                    ? {
                                                                          backgroundImage:
                                                                              'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.02) 20px)',
                                                                      }
                                                                    : {}
                                                            }
                                                        >
                                                            <div className="flex justify-start">
                                                                <div
                                                                    className={cn(
                                                                        'h-7 w-7 rounded-sm flex items-center justify-start pl-1 text-sm font-medium transition-colors date-number',
                                                                        isTodayDate &&
                                                                            'text-primary font-bold',
                                                                        !isTodayDate &&
                                                                            isCurrentMonthDay &&
                                                                            'text-foreground',
                                                                        !isTodayDate &&
                                                                            !isCurrentMonthDay &&
                                                                            'text-muted-foreground/50',
                                                                        isTodayDate &&
                                                                            "relative after:content-[''] after:absolute after:-bottom-1 after:left-1 after:w-full after:h-0.5 after:bg-primary",
                                                                    )}
                                                                >
                                                                    {date.getDate()}
                                                                </div>
                                                            </div>
                                                            {isTodayDate && (
                                                                <div className="absolute inset-0 border-2 border-primary/20 pointer-events-none rounded-sm" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Tasks Layer */}
                                            <div className="relative z-10 w-full mt-10 pb-2">
                                                {layout.map(
                                                    ({
                                                        task,
                                                        startIdx,
                                                        span,
                                                        rowIndex,
                                                    }) => {
                                                        const status =
                                                            getProgressStatus(
                                                                task,
                                                                now,
                                                            );
                                                        const colors =
                                                            PROGRESS_COLORS[
                                                                status
                                                            ];
                                                        return (
                                                            <div
                                                                key={`${task.id}-${weekIndex}`}
                                                                className="absolute h-[26px] transition-all hover:z-20 group"
                                                                style={{
                                                                    left: `${(startIdx * 100) / 7}%`,
                                                                    width: `${(span * 100) / 7}%`,
                                                                    top: `${rowIndex * 30}px`,
                                                                }}
                                                            >
                                                                <div className="px-1 h-full w-full">
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger
                                                                                asChild
                                                                            >
                                                                                <div
                                                                                    className="h-full w-full rounded-[4px] px-2 flex items-center shadow-sm cursor-pointer hover:shadow-md transition-all border overflow-hidden bg-card/80 backdrop-blur-sm border-l-4"
                                                                                    style={{
                                                                                        borderLeftColor:
                                                                                            colors.hex,
                                                                                    }}
                                                                                >
                                                                                    <span className="text-[11px] font-medium truncate text-foreground/90 flex items-center gap-1.5">
                                                                                        <div
                                                                                            className="w-1.5 h-1.5 rounded-full shrink-0"
                                                                                            style={{
                                                                                                backgroundColor:
                                                                                                    colors.hex,
                                                                                            }}
                                                                                        />
                                                                                        {
                                                                                            task.name
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <div className="text-xs">
                                                                                    <p className="font-semibold mb-1">
                                                                                        {
                                                                                            task.name
                                                                                        }
                                                                                    </p>
                                                                                    <p className="text-muted-foreground">
                                                                                        Status:{' '}
                                                                                        {
                                                                                            PROGRESS_LABELS[
                                                                                                status
                                                                                            ]
                                                                                        }
                                                                                    </p>
                                                                                    <p className="text-muted-foreground">
                                                                                        Due:{' '}
                                                                                        {parseDateOnly(
                                                                                            task.dueAt!,
                                                                                        ).toLocaleDateString()}
                                                                                    </p>
                                                                                    {task
                                                                                        .project
                                                                                        ?.description && (
                                                                                        <p className="text-muted-foreground">
                                                                                            Project:{' '}
                                                                                            {
                                                                                                task
                                                                                                    .project
                                                                                                    .description
                                                                                            }
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                </div>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

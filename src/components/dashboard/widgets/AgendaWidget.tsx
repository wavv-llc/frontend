'use client';

import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type DashboardTask } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusIcon } from '../shared';

function groupTasksByDay(tasks: DashboardTask[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const thisWeekEnd = new Date(today);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);

    const groups: { label: string; tasks: DashboardTask[] }[] = [
        { label: 'Today', tasks: [] },
        { label: 'Tomorrow', tasks: [] },
        { label: 'This Week', tasks: [] },
        { label: 'Later', tasks: [] },
    ];

    const sorted = [...tasks]
        .filter((t) => t.dueAt && t.approvalStatus !== 'COMPLETED')
        .sort(
            (a, b) =>
                new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime(),
        );

    for (const task of sorted) {
        const due = new Date(task.dueAt!);
        due.setHours(0, 0, 0, 0);
        if (due.getTime() === today.getTime()) {
            groups[0].tasks.push(task);
        } else if (due.getTime() === tomorrow.getTime()) {
            groups[1].tasks.push(task);
        } else if (due < thisWeekEnd) {
            groups[2].tasks.push(task);
        } else {
            groups[3].tasks.push(task);
        }
    }

    return groups.filter((g) => g.tasks.length > 0);
}

export function AgendaWidget({
    tasks,
    isLoading,
    onTaskClick,
}: {
    tasks: DashboardTask[];
    isLoading: boolean;
    onTaskClick: (task: DashboardTask) => void;
}) {
    const groups = groupTasksByDay(tasks);

    if (isLoading) return null;

    return (
        <Card className="h-full bg-background/60 backdrop-blur-xl border-border/50 shadow-sm flex flex-col overflow-hidden">
            <CardHeader className="pb-0 border-b border-border/40 bg-muted/20 py-3 px-4 mb-0 shrink-0 cursor-move">
                <CardTitle className="text-sm font-serif font-semibold flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    My Agenda
                </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-5">
                    {groups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                            <CalendarDays className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm font-medium">
                                Nothing coming up
                            </p>
                            <p className="text-xs opacity-60">
                                Your schedule is clear.
                            </p>
                        </div>
                    ) : (
                        groups.map((group) => (
                            <div key={group.label}>
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                                    {group.label}
                                </div>
                                <div className="space-y-1">
                                    {group.tasks.map((task) => {
                                        const due = task.dueAt
                                            ? new Date(task.dueAt)
                                            : null;
                                        const isOverdue =
                                            due &&
                                            due < new Date() &&
                                            group.label !== 'Today';

                                        return (
                                            <button
                                                key={task.id}
                                                onClick={() =>
                                                    onTaskClick(task)
                                                }
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-all group text-left cursor-pointer"
                                            >
                                                <div className="shrink-0">
                                                    <StatusIcon
                                                        status={
                                                            task.approvalStatus
                                                        }
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-medium truncate block group-hover:text-primary transition-colors">
                                                        {task.name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        {task.project.name}
                                                    </span>
                                                </div>
                                                {due && (
                                                    <span
                                                        className={cn(
                                                            'text-[10px] shrink-0',
                                                            isOverdue
                                                                ? 'text-red-500 font-medium'
                                                                : 'text-muted-foreground',
                                                        )}
                                                    >
                                                        {due.toLocaleDateString(
                                                            undefined,
                                                            {
                                                                month: 'short',
                                                                day: 'numeric',
                                                            },
                                                        )}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
}

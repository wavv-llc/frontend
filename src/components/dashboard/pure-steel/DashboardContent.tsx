'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { DashboardHeader } from './DashboardHeader';
import { CalendarSection, type CalendarEvent } from './CalendarSection';
import { TaskTable, type Task } from './TaskTable';
import {
    ActivityFeed,
    type ActivityItem,
    type ActivityStat,
} from './ActivityFeed';

interface DashboardContentProps {
    userName: string;
    tasks: Task[];
    events: CalendarEvent[];
    activities: ActivityItem[];
    stats: ActivityStat[];
    onTaskClick?: (task: Task) => void;
    onEventClick?: (event: CalendarEvent) => void;
    className?: string;
}

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setDate(diff));
}

export function DashboardContent({
    userName,
    tasks,
    events,
    activities,
    stats,
    onTaskClick,
    onEventClick,
    className,
}: DashboardContentProps) {
    const [currentWeekStart, setCurrentWeekStart] = useState(() =>
        getWeekStart(new Date()),
    );

    const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
        if (direction === 'today') {
            setCurrentWeekStart(getWeekStart(new Date()));
        } else if (direction === 'prev') {
            const newDate = new Date(currentWeekStart);
            newDate.setDate(newDate.getDate() - 7);
            setCurrentWeekStart(newDate);
        } else {
            const newDate = new Date(currentWeekStart);
            newDate.setDate(newDate.getDate() + 7);
            setCurrentWeekStart(newDate);
        }
    };

    return (
        <div className={cn('min-h-screen bg-[var(--dashboard-bg)]', className)}>
            {/* Header - Sticky */}
            <DashboardHeader userName={userName} className="animate-fade-up" />

            {/* Main Content Area */}
            <main className="px-8 py-6">
                {/* Calendar - Full Width */}
                <CalendarSection
                    events={events}
                    currentWeekStart={currentWeekStart}
                    onNavigate={handleNavigate}
                    onEventClick={onEventClick}
                    className="animate-fade-up animate-delay-100"
                />

                {/* Bottom Row - Tasks + Activity */}
                <div className="mt-4 grid grid-cols-1 gap-3.5 lg:grid-cols-[1fr_340px]">
                    <TaskTable
                        tasks={tasks}
                        onTaskClick={onTaskClick}
                        className="animate-fade-up animate-delay-140"
                    />
                    <ActivityFeed
                        activities={activities}
                        stats={stats}
                        className="animate-fade-up animate-delay-160"
                    />
                </div>
            </main>
        </div>
    );
}

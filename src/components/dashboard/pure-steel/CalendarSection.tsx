'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CalendarEvent {
    id: string;
    title: string;
    startTime?: string;
    endTime?: string;
    date: Date;
    type: 'deadline' | 'task' | 'meeting' | 'internal';
    status?: 'review' | 'pending' | 'in-progress' | 'complete' | 'urgent';
}

interface CalendarSectionProps {
    events: CalendarEvent[];
    currentWeekStart: Date;
    onNavigate: (direction: 'prev' | 'next' | 'today') => void;
    onEventClick?: (event: CalendarEvent) => void;
    className?: string;
}

const EVENT_TYPE_COLORS: Record<
    CalendarEvent['type'],
    { bg: string; text: string }
> = {
    deadline: {
        bg: 'bg-[rgba(224,82,82,0.07)]',
        text: 'text-[#E05252]',
    },
    task: {
        bg: 'bg-[rgba(94,142,173,0.07)]',
        text: 'text-[#5E8EAD]',
    },
    meeting: {
        bg: 'bg-[rgba(181,136,10,0.07)]',
        text: 'text-[#B5880A]',
    },
    internal: {
        bg: 'bg-[rgba(132,148,164,0.07)]',
        text: 'text-[#8494A4]',
    },
};

const DAY_NAMES = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
];

function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
    );
}

function getWeekDays(weekStart: Date): Date[] {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        days.push(day);
    }
    return days;
}

export function CalendarSection({
    events,
    currentWeekStart,
    onNavigate,
    onEventClick,
    className,
}: CalendarSectionProps) {
    const today = useMemo(() => new Date(), []);
    const weekDays = useMemo(
        () => getWeekDays(currentWeekStart),
        [currentWeekStart],
    );

    // Group events by date
    const eventsByDate = useMemo(() => {
        const grouped = new Map<string, CalendarEvent[]>();
        events.forEach((event) => {
            const dateKey = event.date.toDateString();
            if (!grouped.has(dateKey)) {
                grouped.set(dateKey, []);
            }
            grouped.get(dateKey)!.push(event);
        });
        return grouped;
    }, [events]);

    // Check if a date has deadline events
    const hasDeadline = (date: Date): boolean => {
        const dateEvents = eventsByDate.get(date.toDateString()) || [];
        return dateEvents.some((event) => event.type === 'deadline');
    };

    return (
        <div
            className={cn(
                'bg-[var(--dashboard-surface)] rounded-xl border border-[var(--dashboard-border)]',
                'transition-shadow duration-200 hover:shadow-[0_2px_16px_rgba(90,127,154,0.05)]',
                className,
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-[var(--dashboard-border)]">
                {/* Title */}
                <h2 className="font-serif text-sm font-semibold tracking-tight text-[var(--dashboard-text-primary)]">
                    Calendar
                </h2>

                {/* Right: Legend + Navigation */}
                <div className="flex items-center gap-3.5">
                    {/* Legend */}
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-sm bg-[rgba(90,127,154,0.15)] border-[1.5px] border-[var(--accent)]" />
                            <span className="font-sans text-[9px] text-[var(--dashboard-text-faint)]">
                                Today
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-[#E05252]" />
                            <span className="font-sans text-[9px] text-[var(--dashboard-text-faint)]">
                                Deadline
                            </span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onNavigate('prev')}
                            className={cn(
                                'px-2 py-1 rounded-md',
                                'border border-[var(--dashboard-border)]',
                                'bg-[var(--dashboard-surface)]',
                                'text-[var(--dashboard-text-muted)]',
                                'text-[10px] font-sans',
                                'transition-colors hover:bg-[var(--accent-hover)]',
                            )}
                        >
                            <ChevronLeft className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() => onNavigate('today')}
                            className={cn(
                                'px-2.5 py-1 rounded-md',
                                'border border-[var(--dashboard-border)]',
                                'bg-[var(--dashboard-surface)]',
                                'text-[var(--dashboard-text-muted)]',
                                'text-[10px] font-sans font-medium',
                                'transition-colors hover:bg-[var(--accent-hover)]',
                            )}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => onNavigate('next')}
                            className={cn(
                                'px-2 py-1 rounded-md',
                                'border border-[var(--dashboard-border)]',
                                'bg-[var(--dashboard-surface)]',
                                'text-[var(--dashboard-text-muted)]',
                                'text-[10px] font-sans',
                                'transition-colors hover:bg-[var(--accent-hover)]',
                            )}
                        >
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-3.5">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {DAY_NAMES.map((dayName) => (
                        <div
                            key={dayName}
                            className="pb-2 border-b border-[var(--dashboard-border-light)]"
                        >
                            <span className="font-sans text-[9px] font-medium text-[var(--dashboard-text-faint)] tracking-wider">
                                {dayName}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Week Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((date) => {
                        const isToday = isSameDay(date, today);
                        const dateEvents =
                            eventsByDate.get(date.toDateString()) || [];
                        const visibleEvents = dateEvents.slice(0, 3);
                        const moreCount = dateEvents.length - 3;
                        const deadline = hasDeadline(date);

                        return (
                            <div
                                key={date.toISOString()}
                                className={cn(
                                    'relative min-h-[50px] p-2 rounded-lg',
                                    'border transition-all duration-150 cursor-pointer',
                                    isToday
                                        ? 'border-[1.5px] border-[var(--accent)] bg-[rgba(90,127,154,0.06)]'
                                        : 'border-transparent hover:bg-[var(--accent-hover)]',
                                )}
                            >
                                {/* Day Number */}
                                <div className="mb-1.5">
                                    <span
                                        className={cn(
                                            'font-sans text-[11px]',
                                            isToday
                                                ? 'font-semibold text-[var(--accent)]'
                                                : deadline
                                                  ? 'font-normal text-[var(--status-urgent-text)]'
                                                  : 'font-normal text-[var(--dashboard-text-body)]',
                                        )}
                                    >
                                        {date.getDate()}
                                    </span>
                                </div>

                                {/* Event Chips */}
                                <div className="flex flex-col gap-1">
                                    {visibleEvents.map((event) => {
                                        const colors =
                                            EVENT_TYPE_COLORS[event.type];
                                        return (
                                            <button
                                                key={event.id}
                                                onClick={() =>
                                                    onEventClick?.(event)
                                                }
                                                className={cn(
                                                    'text-left px-1 py-0.5 rounded-sm',
                                                    'text-[8px] font-sans font-medium',
                                                    'truncate',
                                                    'transition-opacity hover:opacity-80',
                                                    colors.bg,
                                                    colors.text,
                                                )}
                                            >
                                                {event.startTime && (
                                                    <span className="font-sans mr-1">
                                                        {event.startTime}
                                                    </span>
                                                )}
                                                {event.title}
                                            </button>
                                        );
                                    })}
                                    {moreCount > 0 && (
                                        <span className="text-[8px] font-sans text-[var(--dashboard-text-faint)] px-1">
                                            +{moreCount} more
                                        </span>
                                    )}
                                </div>

                                {/* Deadline Dot */}
                                {deadline && (
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                                        <div className="w-1 h-1 rounded-full bg-[#E05252]" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

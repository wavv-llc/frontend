'use client';

import React, { useMemo, useState } from 'react';
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

type ViewMode = 'week' | 'month';

const EVENT_TYPE_COLORS: Record<
    CalendarEvent['type'],
    { bg: string; text: string; dot: string }
> = {
    deadline: {
        bg: 'bg-[rgba(224,82,82,0.07)]',
        text: 'text-[#e05252]',
        dot: 'bg-[#e05252]',
    },
    task: {
        bg: 'bg-[rgba(94,142,173,0.07)]',
        text: 'text-[#5e8ead]',
        dot: 'bg-[#5e8ead]',
    },
    meeting: {
        bg: 'bg-[rgba(181,136,10,0.07)]',
        text: 'text-[#b5880a]',
        dot: 'bg-[#b5880a]',
    },
    internal: {
        bg: 'bg-[rgba(132,148,164,0.07)]',
        text: 'text-[#8494a4]',
        dot: 'bg-[#8494a4]',
    },
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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

function getMonthDates(date: Date): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    // Sunday-first: getDay() returns 0 for Sunday, so offset is already correct
    const offset = firstDayOfWeek;
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - offset);
    return Array.from({ length: 42 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        return d;
    });
}

export function CalendarSection({
    events,
    currentWeekStart,
    onNavigate,
    onEventClick,
    className,
}: CalendarSectionProps) {
    const today = useMemo(() => new Date(), []);
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        try {
            return (
                (localStorage.getItem('wavv_calendar_view') as ViewMode) ||
                'week'
            );
        } catch {
            return 'week';
        }
    });

    const handleSetViewMode = (mode: ViewMode) => {
        setViewMode(mode);
        try {
            localStorage.setItem('wavv_calendar_view', mode);
        } catch {} // eslint-disable-line no-empty
    };
    // Month view manages its own date; week view uses external prop
    const [monthDate, setMonthDate] = useState(() => new Date());

    const weekDays = useMemo(
        () => getWeekDays(currentWeekStart),
        [currentWeekStart],
    );

    const monthDates = useMemo(() => getMonthDates(monthDate), [monthDate]);

    // Group events by date key
    const eventsByDate = useMemo(() => {
        const grouped = new Map<string, CalendarEvent[]>();
        events.forEach((event) => {
            const key = event.date.toDateString();
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(event);
        });
        return grouped;
    }, [events]);

    const hasDeadline = (date: Date) =>
        (eventsByDate.get(date.toDateString()) || []).some(
            (e) => e.type === 'deadline',
        );

    // Unified navigate handler
    const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
        if (viewMode === 'month') {
            setMonthDate((prev) => {
                const d = new Date(prev);
                if (direction === 'today') return new Date();
                d.setMonth(d.getMonth() + (direction === 'prev' ? -1 : 1));
                return d;
            });
        } else {
            onNavigate(direction);
        }
    };

    // Display label for header
    const headerLabel =
        viewMode === 'week'
            ? weekDays[0].toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
              })
            : monthDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
              });

    return (
        <div
            className={cn(
                'bg-[var(--dashboard-surface)] rounded-xl border border-[var(--dashboard-border)]',
                'transition-shadow duration-200 hover:shadow-[0_2px_16px_rgba(90,127,154,0.05)]',
                className,
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-[18px] py-3 border-b border-[var(--dashboard-border)]">
                <div className="flex items-center gap-3">
                    <h2 className="font-serif text-sm font-semibold tracking-tight text-[var(--dashboard-text-primary)]">
                        Calendar
                    </h2>
                    {/* Week / Month toggle */}
                    <div className="flex items-center bg-muted/40 rounded-md p-0.5 gap-0.5">
                        <button
                            onClick={() => handleSetViewMode('week')}
                            className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer',
                                viewMode === 'week'
                                    ? 'bg-background shadow-sm text-[var(--dashboard-text-primary)]'
                                    : 'text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text-primary)]',
                            )}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => handleSetViewMode('month')}
                            className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer',
                                viewMode === 'month'
                                    ? 'bg-background shadow-sm text-[var(--dashboard-text-primary)]'
                                    : 'text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text-primary)]',
                            )}
                        >
                            Month
                        </button>
                    </div>
                </div>

                {/* Right: Legend + Navigation */}
                <div className="flex items-center gap-3">
                    {/* Legend */}
                    <div className="hidden sm:flex items-center gap-2.5">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-sm bg-[rgba(90,127,154,0.15)] border-[1.5px] border-[var(--accent)]" />
                            <span className="font-sans text-[9px] text-[var(--dashboard-text-muted)]">
                                Today
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#e05252]" />
                            <span className="font-sans text-[9px] text-[var(--dashboard-text-muted)]">
                                Deadline
                            </span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => handleNavigate('prev')}
                            className={cn(
                                'p-1 rounded-md border border-[var(--dashboard-border)]',
                                'bg-[var(--dashboard-surface)] text-[var(--dashboard-text-muted)]',
                                'transition-colors hover:bg-[var(--accent-hover)] cursor-pointer',
                            )}
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => handleNavigate('today')}
                            className={cn(
                                'px-2.5 py-1 rounded-md border border-[var(--dashboard-border)]',
                                'bg-[var(--dashboard-surface)] text-[var(--dashboard-text-muted)]',
                                'text-[10px] font-sans font-medium',
                                'transition-colors hover:bg-[var(--accent-hover)] cursor-pointer',
                            )}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => handleNavigate('next')}
                            className={cn(
                                'p-1 rounded-md border border-[var(--dashboard-border)]',
                                'bg-[var(--dashboard-surface)] text-[var(--dashboard-text-muted)]',
                                'transition-colors hover:bg-[var(--accent-hover)] cursor-pointer',
                            )}
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'week' ? (
                /* ── Week View ─────────────────────────────────────────────── */
                <div className="p-3.5">
                    {/* Date range label */}
                    <div className="text-[10px] text-[var(--dashboard-text-muted)] mb-2.5 font-medium">
                        {headerLabel}
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAY_NAMES.map((dayName, _i) => (
                            <div
                                key={dayName}
                                className="pb-2 border-b border-[var(--dashboard-border-light)]"
                            >
                                <span className="font-sans text-[9px] font-medium text-[var(--dashboard-text-muted)] tracking-wider">
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
                                        'relative min-h-[52px] p-1.5 rounded-lg',
                                        'border transition-all duration-150 cursor-pointer',
                                        isToday
                                            ? 'border-[1.5px] border-[var(--accent)] bg-[rgba(90,127,154,0.06)]'
                                            : 'border-transparent hover:bg-[var(--accent-hover)]',
                                    )}
                                >
                                    <div className="mb-1">
                                        <span
                                            className={cn(
                                                'font-sans text-[11px]',
                                                isToday
                                                    ? 'font-semibold text-[var(--accent)]'
                                                    : deadline
                                                      ? 'font-normal text-[#e05252]'
                                                      : 'font-normal text-[var(--dashboard-text-body)]',
                                            )}
                                        >
                                            {date.getDate()}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-0.5">
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
                                                        'text-[8px] font-sans font-medium truncate',
                                                        'transition-opacity hover:opacity-80 cursor-pointer',
                                                        colors.bg,
                                                        colors.text,
                                                    )}
                                                >
                                                    {event.startTime && (
                                                        <span className="mr-1">
                                                            {event.startTime}
                                                        </span>
                                                    )}
                                                    {event.title}
                                                </button>
                                            );
                                        })}
                                        {moreCount > 0 && (
                                            <span className="text-[8px] font-sans text-[var(--dashboard-text-muted)] px-1">
                                                +{moreCount} more
                                            </span>
                                        )}
                                    </div>

                                    {deadline && (
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">
                                            <div className="w-1 h-1 rounded-full bg-[#e05252]" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* ── Month View ────────────────────────────────────────────── */
                <div className="p-3.5">
                    {/* Month label */}
                    <div className="text-[10px] text-[var(--dashboard-text-muted)] mb-2.5 font-medium">
                        {headerLabel}
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                        {DAY_NAMES_SHORT.map((d, i) => (
                            <div
                                key={i}
                                className="pb-1 border-b border-[var(--dashboard-border-light)] text-center"
                            >
                                <span className="font-sans text-[9px] font-medium text-[var(--dashboard-text-muted)]">
                                    {d}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Month grid */}
                    <div className="grid grid-cols-7 gap-0.5">
                        {monthDates.map((date, i) => {
                            const isToday = isSameDay(date, today);
                            const isCurrentMonth =
                                date.getMonth() === monthDate.getMonth();
                            const dateEvents =
                                eventsByDate.get(date.toDateString()) || [];
                            const deadline = hasDeadline(date);

                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        'relative p-1 rounded-md min-h-[36px] transition-all',
                                        'border cursor-pointer',
                                        isToday
                                            ? 'border-[1.5px] border-[var(--accent)] bg-[rgba(90,127,154,0.06)]'
                                            : 'border-transparent hover:bg-[var(--accent-hover)]',
                                        !isCurrentMonth && 'opacity-30',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'font-sans text-[10px] block leading-none',
                                            isToday
                                                ? 'font-semibold text-[var(--accent)]'
                                                : 'font-normal text-[var(--dashboard-text-body)]',
                                        )}
                                    >
                                        {date.getDate()}
                                    </span>

                                    {/* Event dots */}
                                    {dateEvents.length > 0 && (
                                        <div className="flex flex-wrap gap-0.5 mt-0.5">
                                            {dateEvents
                                                .slice(0, 3)
                                                .map((e, _idx) => (
                                                    <button
                                                        key={e.id}
                                                        onClick={() =>
                                                            onEventClick?.(e)
                                                        }
                                                        className={cn(
                                                            'w-1 h-1 rounded-full cursor-pointer transition-opacity hover:opacity-70',
                                                            EVENT_TYPE_COLORS[
                                                                e.type
                                                            ].dot,
                                                        )}
                                                        title={e.title}
                                                    />
                                                ))}
                                        </div>
                                    )}

                                    {deadline && (
                                        <div className="absolute bottom-0.5 right-0.5">
                                            <div className="w-1 h-1 rounded-full bg-[#e05252]" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

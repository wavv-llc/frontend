'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface CalendarProps {
    mode?: 'single' | 'range';
    selected?: Date | { from: Date; to?: Date };
    onSelect?: (date: Date | { from: Date; to?: Date } | undefined) => void;
    className?: string;
    disabled?: (date: Date) => boolean;
    fromDate?: Date;
    toDate?: Date;
}

function Calendar({
    mode = 'single',
    selected,
    onSelect,
    className,
    disabled,
    fromDate,
    toDate,
}: CalendarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(() => {
        if (mode === 'single' && selected instanceof Date) {
            return new Date(selected.getFullYear(), selected.getMonth(), 1);
        }
        return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    });

    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    // Generate calendar days
    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const days: (Date | null)[] = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const prevMonthDay = new Date(
                year,
                month,
                -startingDayOfWeek + i + 1,
            );
            days.push(prevMonthDay);
        }

        // Add days of the current month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        // Add days from next month to complete the grid
        const remainingCells = 42 - days.length; // 6 rows * 7 days
        for (let i = 1; i <= remainingCells; i++) {
            days.push(new Date(year, month + 1, i));
        }

        return days;
    };

    const days = generateCalendarDays();

    const isToday = (date: Date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const isSelected = (date: Date) => {
        if (mode === 'single' && selected instanceof Date) {
            return (
                date.getDate() === selected.getDate() &&
                date.getMonth() === selected.getMonth() &&
                date.getFullYear() === selected.getFullYear()
            );
        }
        if (
            mode === 'range' &&
            selected &&
            typeof selected === 'object' &&
            'from' in selected
        ) {
            const { from, to } = selected;
            if (!to) {
                return (
                    date.getDate() === from.getDate() &&
                    date.getMonth() === from.getMonth() &&
                    date.getFullYear() === from.getFullYear()
                );
            }
            return date >= from && date <= to;
        }
        return false;
    };

    const isInCurrentMonth = (date: Date) => {
        return date.getMonth() === currentMonth.getMonth();
    };

    const isDisabled = (date: Date) => {
        if (disabled && disabled(date)) return true;
        if (fromDate && date < fromDate) return true;
        if (toDate && date > toDate) return true;
        return false;
    };

    const handleDateClick = (date: Date) => {
        if (isDisabled(date)) return;

        if (mode === 'single') {
            onSelect?.(date);
        } else if (mode === 'range') {
            if (
                !selected ||
                typeof selected !== 'object' ||
                !('from' in selected)
            ) {
                onSelect?.({ from: date });
            } else {
                const { from, to } = selected;
                if (to || date < from) {
                    onSelect?.({ from: date });
                } else {
                    onSelect?.({ from, to: date });
                }
            }
        }
    };

    const goToPreviousMonth = () => {
        setCurrentMonth(
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1,
            ),
        );
    };

    const goToNextMonth = () => {
        setCurrentMonth(
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1,
            ),
        );
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        if (mode === 'single') {
            onSelect?.(today);
        }
    };

    return (
        <div
            className={cn(
                'p-4 bg-background rounded-lg border border-border shadow-lg',
                className,
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToPreviousMonth}
                    className="h-8 w-8 hover:bg-muted"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                        {monthNames[currentMonth.getMonth()]}{' '}
                        {currentMonth.getFullYear()}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToToday}
                        className="h-7 px-2 text-xs hover:bg-muted"
                    >
                        Today
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToNextMonth}
                    className="h-8 w-8 hover:bg-muted"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map((day) => (
                    <div
                        key={day}
                        className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((date, index) => {
                    if (!date) return <div key={index} className="h-9" />;

                    const today = isToday(date);
                    const selectedDay = isSelected(date);
                    const currentMonth = isInCurrentMonth(date);
                    const disabledDay = isDisabled(date);

                    return (
                        <button
                            key={index}
                            onClick={() => handleDateClick(date)}
                            disabled={disabledDay}
                            className={cn(
                                'h-9 w-full rounded-md text-sm font-normal transition-all relative',
                                'hover:bg-accent hover:text-accent-foreground',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                !currentMonth && 'text-muted-foreground/40',
                                today &&
                                    !selectedDay &&
                                    'bg-accent/50 font-semibold border border-primary/20',
                                selectedDay &&
                                    'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-semibold shadow-sm',
                                disabledDay &&
                                    'opacity-50 cursor-not-allowed hover:bg-transparent',
                            )}
                        >
                            {date.getDate()}
                            {today && !selectedDay && (
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

Calendar.displayName = 'Calendar';

export { Calendar };

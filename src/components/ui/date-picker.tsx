'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
    date?: Date;
    setDate: (date: Date | undefined) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    fromDate?: Date;
    toDate?: Date;
    disabledDates?: (date: Date) => boolean;
}

export function DatePicker({
    date,
    setDate,
    className,
    placeholder = 'Pick a date',
    disabled,
    fromDate,
    toDate,
    disabledDates,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (
        selectedDate: Date | { from: Date; to?: Date } | undefined,
    ) => {
        if (selectedDate instanceof Date) {
            setDate(selectedDate);
            setOpen(false);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDate(undefined);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'w-full justify-start text-left font-normal transition-all',
                        !date && 'text-muted-foreground',
                        'hover:bg-accent hover:text-accent-foreground',
                        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        className,
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">
                        {date ? format(date, 'PPP') : placeholder}
                    </span>
                    {date && !disabled && (
                        <X
                            className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                            onClick={handleClear}
                        />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0 shadow-xl border-border/50"
                align="start"
                sideOffset={4}
            >
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleSelect}
                    disabled={disabledDates}
                    fromDate={fromDate}
                    toDate={toDate}
                />
            </PopoverContent>
        </Popover>
    );
}

interface DateRangePickerProps {
    dateRange?: { from: Date; to?: Date };
    setDateRange: (range: { from: Date; to?: Date } | undefined) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    fromDate?: Date;
    toDate?: Date;
    disabledDates?: (date: Date) => boolean;
}

export function DateRangePicker({
    dateRange,
    setDateRange,
    className,
    placeholder = 'Pick a date range',
    disabled,
    fromDate,
    toDate,
    disabledDates,
}: DateRangePickerProps) {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (
        selectedDate: Date | { from: Date; to?: Date } | undefined,
    ) => {
        if (
            selectedDate &&
            typeof selectedDate === 'object' &&
            'from' in selectedDate
        ) {
            setDateRange(selectedDate);
            // Close popover when range is complete
            if (selectedDate.to) {
                setOpen(false);
            }
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDateRange(undefined);
    };

    const formatDateRange = () => {
        if (!dateRange?.from) return placeholder;
        if (!dateRange.to) return format(dateRange.from, 'PPP');
        return `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'w-full justify-start text-left font-normal transition-all',
                        !dateRange?.from && 'text-muted-foreground',
                        'hover:bg-accent hover:text-accent-foreground',
                        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        className,
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{formatDateRange()}</span>
                    {dateRange?.from && !disabled && (
                        <X
                            className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                            onClick={handleClear}
                        />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0 shadow-xl border-border/50"
                align="start"
                sideOffset={4}
            >
                <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={handleSelect}
                    disabled={disabledDates}
                    fromDate={fromDate}
                    toDate={toDate}
                />
            </PopoverContent>
        </Popover>
    );
}

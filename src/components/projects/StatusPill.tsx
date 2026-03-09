'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Check } from 'lucide-react';

// Color map for well-known status values (case-insensitive match)
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> =
    {
        'not started': {
            bg: 'bg-slate-100 hover:bg-slate-200',
            text: 'text-slate-600',
            dot: 'bg-slate-400',
        },
        'in progress': {
            bg: 'bg-blue-50 hover:bg-blue-100',
            text: 'text-blue-700',
            dot: 'bg-blue-500',
        },
        'in review': {
            bg: 'bg-amber-50 hover:bg-amber-100',
            text: 'text-amber-700',
            dot: 'bg-amber-500',
        },
        complete: {
            bg: 'bg-green-50 hover:bg-green-100',
            text: 'text-green-700',
            dot: 'bg-green-500',
        },
        done: {
            bg: 'bg-green-50 hover:bg-green-100',
            text: 'text-green-700',
            dot: 'bg-green-500',
        },
        blocked: {
            bg: 'bg-red-50 hover:bg-red-100',
            text: 'text-red-700',
            dot: 'bg-red-500',
        },
        todo: {
            bg: 'bg-slate-100 hover:bg-slate-200',
            text: 'text-slate-600',
            dot: 'bg-slate-400',
        },
    };

const FALLBACK_COLORS = {
    bg: 'bg-purple-50 hover:bg-purple-100',
    text: 'text-purple-700',
    dot: 'bg-purple-400',
};

function getStatusColors(value: string | null) {
    if (!value) return null;
    return STATUS_COLORS[value.toLowerCase()] ?? FALLBACK_COLORS;
}

interface StatusPillProps {
    value: string | null;
    options: string[];
    onChange: (val: string) => void;
    readOnly?: boolean;
    compact?: boolean;
}

export function StatusPill({
    value,
    options,
    onChange,
    readOnly = false,
    compact = false,
}: StatusPillProps) {
    const [open, setOpen] = useState(false);
    const colors = getStatusColors(value);

    const pill = (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
                compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
                colors
                    ? `${colors.bg} ${colors.text}`
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                !readOnly && 'cursor-pointer',
            )}
        >
            {colors && (
                <span
                    className={cn(
                        'rounded-full shrink-0',
                        compact ? 'w-1.5 h-1.5' : 'w-2 h-2',
                        colors.dot,
                    )}
                />
            )}
            {value || <span className="text-muted-foreground/60">—</span>}
        </span>
    );

    if (readOnly) return pill;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{pill}</PopoverTrigger>
            <PopoverContent className="w-44 p-1" align="start">
                {options.length > 0 ? (
                    options.map((opt) => {
                        const c = getStatusColors(opt);
                        const isSelected = opt === value;
                        return (
                            <button
                                key={opt}
                                className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm hover:bg-muted/60 transition-colors"
                                onClick={() => {
                                    onChange(opt);
                                    setOpen(false);
                                }}
                            >
                                {c ? (
                                    <span
                                        className={cn(
                                            'w-2 h-2 rounded-full shrink-0',
                                            c.dot,
                                        )}
                                    />
                                ) : (
                                    <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                                )}
                                <span
                                    className={cn(
                                        'flex-1 text-left',
                                        c ? c.text : 'text-purple-700',
                                    )}
                                >
                                    {opt}
                                </span>
                                {isSelected && (
                                    <Check className="w-3 h-3 text-muted-foreground shrink-0" />
                                )}
                            </button>
                        );
                    })
                ) : (
                    <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                        No options
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

export { getStatusColors };

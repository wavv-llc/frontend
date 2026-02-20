import React from 'react';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Status =
    | 'review'
    | 'pending'
    | 'in-progress'
    | 'complete'
    | 'urgent';

interface StatusBadgeProps {
    status: Status;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    showDot?: boolean;
    className?: string;
}

const statusConfig: Record<
    Status,
    {
        label: string;
        color: string;
        bgColor: string;
    }
> = {
    review: {
        label: 'Needs Review',
        color: 'text-[var(--status-review)]',
        bgColor: 'bg-[var(--status-review-bg)]',
    },
    pending: {
        label: 'Pending',
        color: 'text-[var(--status-pending)]',
        bgColor: 'bg-[var(--status-pending-bg)]',
    },
    'in-progress': {
        label: 'In Progress',
        color: 'text-[var(--status-in-progress)]',
        bgColor: 'bg-[var(--status-in-progress-bg)]',
    },
    complete: {
        label: 'Complete',
        color: 'text-[var(--status-complete)]',
        bgColor: 'bg-[var(--status-complete-bg)]',
    },
    urgent: {
        label: 'Urgent',
        color: 'text-[var(--status-urgent)]',
        bgColor: 'bg-[var(--status-urgent-bg)]',
    },
};

const sizeConfig = {
    sm: {
        text: 'text-[10px]',
        dot: 'w-1 h-1',
        gap: 'gap-1',
    },
    md: {
        text: 'text-[11px]',
        dot: 'w-1 h-1',
        gap: 'gap-1',
    },
    lg: {
        text: 'text-[12px]',
        dot: 'w-1.5 h-1.5',
        gap: 'gap-1.5',
    },
};

export function StatusBadge({
    status,
    size = 'md',
    showLabel = true,
    showDot = true,
    className,
}: StatusBadgeProps) {
    const config = statusConfig[status];
    const sizeStyles = sizeConfig[size];

    return (
        <div
            className={cn(
                'inline-flex items-center font-sans',
                sizeStyles.gap,
                sizeStyles.text,
                config.color,
                className,
            )}
        >
            {showDot && (
                <Circle
                    className={cn(sizeStyles.dot, 'fill-current')}
                    strokeWidth={0}
                />
            )}
            {showLabel && <span>{config.label}</span>}
        </div>
    );
}

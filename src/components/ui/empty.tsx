import { cn } from '@/lib/utils';
import React from 'react';

interface EmptyProps {
    icon?: React.ReactNode;
    title?: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function Empty({
    icon,
    title,
    description,
    action,
    className,
}: EmptyProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-3 py-12 text-center',
                className,
            )}
        >
            {icon && (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    {icon}
                </div>
            )}
            {title && (
                <p className="text-sm font-medium text-foreground">{title}</p>
            )}
            {description && (
                <p className="max-w-[240px] text-xs text-muted-foreground">
                    {description}
                </p>
            )}
            {action && <div className="mt-1">{action}</div>}
        </div>
    );
}

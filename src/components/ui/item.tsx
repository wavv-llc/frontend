import { cn } from '@/lib/utils';
import React from 'react';

interface ItemProps {
    icon?: React.ReactNode;
    label: string;
    description?: string;
    badge?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export function Item({
    icon,
    label,
    description,
    badge,
    action,
    className,
    onClick,
}: ItemProps) {
    const Component = onClick ? 'button' : 'div';

    return (
        <Component
            onClick={onClick}
            className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                onClick && 'w-full cursor-pointer text-left hover:bg-accent/50',
                className,
            )}
        >
            {icon && (
                <span className="shrink-0 text-muted-foreground">{icon}</span>
            )}
            <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">
                    {label}
                </div>
                {description && (
                    <div className="text-xs text-muted-foreground truncate">
                        {description}
                    </div>
                )}
            </div>
            {badge && <span className="shrink-0">{badge}</span>}
            {action && <span className="shrink-0">{action}</span>}
        </Component>
    );
}

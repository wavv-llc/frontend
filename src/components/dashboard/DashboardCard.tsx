'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DashboardCardProps {
    icon?: LucideIcon;
    title: string;
    headerActions?: ReactNode;
    children: ReactNode;
    scrollable?: boolean;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
}

export function DashboardCard({
    icon: Icon,
    title,
    headerActions,
    children,
    scrollable = false,
    className,
    headerClassName,
    contentClassName,
}: DashboardCardProps) {
    const content = scrollable ? (
        <ScrollArea className={cn('flex-1', contentClassName)}>
            {children}
        </ScrollArea>
    ) : (
        <div className={cn('flex-1 min-h-0', contentClassName)}>{children}</div>
    );

    return (
        <div
            className={cn(
                'h-full bg-background/60 backdrop-blur-xl border border-border/50 shadow-sm rounded-xl overflow-hidden flex flex-col',
                className,
            )}
        >
            {/* Header */}
            <div
                className={cn(
                    'border-b border-border/40 bg-muted/20 py-3 px-4 shrink-0 cursor-move',
                    headerClassName,
                )}
            >
                <div className="flex items-center justify-between">
                    <span className="text-sm font-serif font-semibold flex items-center gap-2">
                        {Icon && <Icon className="w-4 h-4 text-primary" />}
                        {title}
                    </span>
                    {headerActions && (
                        <div
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {headerActions}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            {content}
        </div>
    );
}

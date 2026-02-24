import { cn } from '@/lib/utils';
import React from 'react';

interface ButtonGroupProps {
    children: React.ReactNode;
    className?: string;
    orientation?: 'horizontal' | 'vertical';
}

export function ButtonGroup({
    children,
    className,
    orientation = 'horizontal',
}: ButtonGroupProps) {
    return (
        <div
            className={cn(
                'inline-flex items-center',
                orientation === 'horizontal' ? 'flex-row' : 'flex-col',
                // Remove individual border radius from inner buttons
                '[&>*:not(:first-child):not(:last-child)]:rounded-none',
                orientation === 'horizontal'
                    ? '[&>*:first-child]:rounded-r-none [&>*:last-child]:rounded-l-none'
                    : '[&>*:first-child]:rounded-b-none [&>*:last-child]:rounded-t-none',
                // Collapse borders between adjacent buttons
                orientation === 'horizontal'
                    ? '[&>*:not(:first-child)]:-ml-px'
                    : '[&>*:not(:first-child)]:-mt-px',
                className,
            )}
        >
            {children}
        </div>
    );
}

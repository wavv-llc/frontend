import { cn } from '@/lib/utils';
import React from 'react';

interface InputGroupProps {
    children: React.ReactNode;
    className?: string;
}

interface InputAddonProps {
    children: React.ReactNode;
    className?: string;
    position?: 'left' | 'right';
}

export function InputGroup({ children, className }: InputGroupProps) {
    return (
        <div className={cn('flex items-stretch', className)}>{children}</div>
    );
}

export function InputAddon({
    children,
    className,
    position = 'left',
}: InputAddonProps) {
    return (
        <div
            className={cn(
                'flex items-center bg-muted px-3 text-sm text-muted-foreground border border-input',
                position === 'left'
                    ? 'rounded-l-md border-r-0'
                    : 'rounded-r-md border-l-0',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function InputGroupField({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex-1 [&>input]:rounded-none [&>input]:focus-within:z-10',
                className,
            )}
        >
            {children}
        </div>
    );
}

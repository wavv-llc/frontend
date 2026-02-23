import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                'file:text-dashboard-text-body placeholder:text-dashboard-text-muted text-dashboard-text-body selection:bg-accent-subtle border-dashboard-border h-9 w-full min-w-0 rounded-md border bg-dashboard-surface px-3 py-1 text-sm shadow-none transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                'focus-visible:border-accent-blue focus-visible:ring-accent-blue/15 focus-visible:ring-2',
                'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
                className,
            )}
            {...props}
        />
    );
}

export { Input };

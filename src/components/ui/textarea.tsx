import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                'placeholder:text-dashboard-text-muted text-dashboard-text-body border-dashboard-border bg-dashboard-surface flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-sm shadow-none transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50',
                'focus-visible:border-accent-blue focus-visible:ring-accent-blue/15 focus-visible:ring-2',
                'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
                className,
            )}
            {...props}
        />
    );
}

export { Textarea };

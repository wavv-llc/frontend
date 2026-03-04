import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import React from 'react';

export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    placeholder?: string;
}

export const NativeSelect = React.forwardRef<
    HTMLSelectElement,
    NativeSelectProps
>(({ className, children, placeholder, ...props }, ref) => {
    return (
        <div className="relative inline-flex w-full items-center">
            <select
                ref={ref}
                className={cn(
                    'w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'text-foreground',
                    className,
                )}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {children}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
    );
});

NativeSelect.displayName = 'NativeSelect';

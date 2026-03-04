import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import React from 'react';

interface FieldProps {
    label?: string;
    description?: string;
    error?: string;
    required?: boolean;
    htmlFor?: string;
    children: React.ReactNode;
    className?: string;
}

export function Field({
    label,
    description,
    error,
    required,
    htmlFor,
    children,
    className,
}: FieldProps) {
    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            {label && (
                <Label
                    htmlFor={htmlFor}
                    className={cn(
                        'text-sm font-medium',
                        error && 'text-destructive',
                    )}
                >
                    {label}
                    {required && (
                        <span className="ml-0.5 text-destructive">*</span>
                    )}
                </Label>
            )}
            {children}
            {description && !error && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

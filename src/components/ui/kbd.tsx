import { cn } from '@/lib/utils';

interface KbdProps {
    children: React.ReactNode;
    className?: string;
}

export function Kbd({ children, className }: KbdProps) {
    return (
        <kbd
            className={cn(
                'inline-flex items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5',
                'font-mono text-[11px] font-medium text-muted-foreground',
                'shadow-[0_1px_0_1px_hsl(var(--border))]',
                className,
            )}
        >
            {children}
        </kbd>
    );
}

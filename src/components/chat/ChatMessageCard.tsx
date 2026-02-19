'use client';

import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageCardProps {
    message: string;
    timestamp: string;
    userName?: string;
    className?: string;
}

export function ChatMessageCard({
    message,
    timestamp,
    userName = 'You',
    className,
}: ChatMessageCardProps) {
    return (
        <div
            className={cn(
                'rounded-xl border border-border/50 bg-card p-4 md:p-6 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4',
                className,
            )}
        >
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-primary" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-foreground">
                            {userName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {timestamp}
                        </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
}

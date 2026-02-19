'use client';

import { Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatThinkingCardProps {
    timestamp: string;
    className?: string;
}

export function ChatThinkingCard({
    timestamp,
    className,
}: ChatThinkingCardProps) {
    return (
        <div
            className={cn(
                'rounded-xl border border-border/50 bg-card p-4 md:p-6 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4',
                className,
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-border/30">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="shrink-0 h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                        <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>

                    {/* Label & Timestamp */}
                    <div>
                        <span className="text-xs font-semibold text-foreground block">
                            Assistant
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {timestamp}
                        </span>
                    </div>
                </div>
            </div>

            {/* Thinking Animation */}
            <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-primary/60 animate-pulse" />
                <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">
                        Thinking
                    </span>
                    <span className="flex gap-1">
                        <span
                            className="w-1 h-1 bg-muted-foreground/60 rounded-full animate-bounce"
                            style={{ animationDelay: '0ms' }}
                        />
                        <span
                            className="w-1 h-1 bg-muted-foreground/60 rounded-full animate-bounce"
                            style={{ animationDelay: '150ms' }}
                        />
                        <span
                            className="w-1 h-1 bg-muted-foreground/60 rounded-full animate-bounce"
                            style={{ animationDelay: '300ms' }}
                        />
                    </span>
                </div>
            </div>
        </div>
    );
}

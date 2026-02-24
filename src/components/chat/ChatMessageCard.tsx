'use client';

import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
        <Card
            className={cn(
                'border-border/50 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4',
                className,
            )}
        >
            <CardContent className="p-4 md:p-6">
                <div className="flex items-start gap-3">
                    <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                            <User className="h-3.5 w-3.5" />
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-foreground">
                                {userName}
                            </span>
                            <Separator orientation="vertical" className="h-3" />
                            <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground border-border/50"
                            >
                                {timestamp}
                            </Badge>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap wrap-break-word">
                            {message}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

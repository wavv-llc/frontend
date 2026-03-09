'use client';

import { useRef, useEffect, useState } from 'react';
import { Send, Loader2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Kbd } from '@/components/ui/kbd';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChatCommandBarProps {
    message: string;
    onChange: (value: string) => void;
    onSubmit: (e: React.FormEvent, externalSearchEnabled: boolean) => void;
    isSubmitting: boolean;
    placeholder?: string;
}

export function ChatCommandBar({
    message,
    onChange,
    onSubmit,
    isSubmitting,
    placeholder = 'Ask me anything...',
}: ChatCommandBarProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [externalSearchEnabled, setExternalSearchEnabled] = useState(false);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [message]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e, externalSearchEnabled);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(e, externalSearchEnabled);
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            <div className="relative bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl md:rounded-3xl shadow-2xl shadow-black/5 hover:shadow-black/10 transition-all focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-border">
                <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="min-h-14 max-h-64 resize-none border-0 bg-transparent pl-14 pr-14 md:pl-16 md:pr-16 py-4 focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground/60 scrollbar-thin overflow-y-auto"
                    disabled={isSubmitting}
                    rows={1}
                />
                <div className="absolute left-3 bottom-3">
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Toggle
                                    pressed={externalSearchEnabled}
                                    onPressedChange={setExternalSearchEnabled}
                                    size="sm"
                                    className="h-8 w-8 rounded-full p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                                    aria-label="Toggle external search"
                                >
                                    <Globe className="h-4 w-4" />
                                </Toggle>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p>
                                    {externalSearchEnabled
                                        ? 'External search enabled'
                                        : 'Enable external search'}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="absolute right-3 bottom-3">
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!message.trim() || isSubmitting}
                        className="h-10 w-10 rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-40"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground/60">
                <span>Press</span>
                <Kbd>Enter</Kbd>
                <span>to send</span>
                <Separator orientation="vertical" className="h-3" />
                <Kbd>Shift+Enter</Kbd>
                <span>for new line</span>
            </div>
        </form>
    );
}

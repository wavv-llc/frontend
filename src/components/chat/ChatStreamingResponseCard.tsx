'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatActionBar } from './ChatActionBar';
import { cn } from '@/lib/utils';

interface ChatStreamingResponseCardProps {
    response: string;
    timestamp: string;
    isStreaming: boolean;
    onStreamComplete?: () => void;
    className?: string;
}

export function ChatStreamingResponseCard({
    response,
    timestamp,
    isStreaming,
    onStreamComplete,
    className,
}: ChatStreamingResponseCardProps) {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const streamingRef = useRef<NodeJS.Timeout | null>(null);
    const indexRef = useRef(0);

    useEffect(() => {
        if (!isStreaming) {
            setDisplayedText(response);
            setIsComplete(true);
            return;
        }

        indexRef.current = 0;
        setDisplayedText('');
        setIsComplete(false);

        const charsPerInterval = 3;
        const intervalMs = 16;

        const stream = () => {
            if (indexRef.current < response.length) {
                const nextIndex = Math.min(
                    indexRef.current + charsPerInterval,
                    response.length,
                );
                setDisplayedText(response.slice(0, nextIndex));
                indexRef.current = nextIndex;

                streamingRef.current = setTimeout(stream, intervalMs);
            } else {
                setIsComplete(true);
                if (onStreamComplete) {
                    onStreamComplete();
                }
            }
        };

        stream();

        return () => {
            if (streamingRef.current) {
                clearTimeout(streamingRef.current);
            }
        };
    }, [response, isStreaming, onStreamComplete]);

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

                {/* Action Bar - only show when complete */}
                {isComplete && <ChatActionBar content={response} />}
            </div>

            {/* Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight prose-headings:mb-3 prose-headings:mt-6 first:prose-headings:mt-0 prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-strong:text-foreground prose-strong:font-semibold prose-code:text-primary prose-code:bg-muted prose-code:px-2 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:p-4 prose-pre:rounded-xl prose-pre:my-4 prose-ul:text-foreground prose-ul:my-4 prose-ol:text-foreground prose-ol:my-4 prose-li:text-foreground prose-li:my-1 prose-li:marker:text-muted-foreground prose-blockquote:border-l-2 prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:my-4 prose-hr:border-border prose-hr:my-6 prose-table:text-sm prose-th:text-foreground prose-th:font-semibold prose-th:p-2 prose-th:border prose-th:border-border prose-td:text-foreground prose-td:p-2 prose-td:border prose-td:border-border prose-img:rounded-lg prose-img:my-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {displayedText}
                </ReactMarkdown>
                {isStreaming && !isComplete && (
                    <span className="inline-block w-2 h-4 ml-1 bg-primary/60 animate-pulse" />
                )}
            </div>
        </div>
    );
}

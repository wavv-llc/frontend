'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { Globe, Send } from 'lucide-react';
import { chatApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Kbd } from '@/components/ui/kbd';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export default function NewChatPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { user } = useUser();
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [externalSearchEnabled, setExternalSearchEnabled] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [message]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isSubmitting) return;
        try {
            setIsSubmitting(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }
            const response = await chatApi.createChat(
                token,
                message.trim(),
                externalSearchEnabled,
            );
            if (response.data) router.push(`/chats/${response.data.id}`);
        } catch (error) {
            console.error('Failed to create chat:', error);
            toast.error('Failed to send message');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="h-full w-full bg-dashboard-bg flex flex-col items-center justify-center px-5">
            <div className="w-full max-w-2xl space-y-8 animate-fade-up">
                {/* Greeting */}
                <div className="text-center space-y-2">
                    <h1 className="font-serif text-[32px] md:text-[43px] font-normal tracking-tight text-dashboard-text-primary">
                        {getGreeting()},{' '}
                        <span className="italic">
                            {user?.firstName || 'there'}
                        </span>
                    </h1>
                    <p className="font-sans text-sm md:text-base text-dashboard-text-body">
                        How can I help with your taxes today?
                    </p>
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="relative">
                    <div className="relative bg-transparent border border-zinc-300 rounded-lg transition-all focus-within:border-(--accent)">
                        <div className="flex items-end gap-2 p-2">
                            <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Toggle
                                            pressed={externalSearchEnabled}
                                            onPressedChange={
                                                setExternalSearchEnabled
                                            }
                                            size="sm"
                                            className="shrink-0 h-9 w-9 rounded-lg p-0 data-[state=on]:bg-(--accent) data-[state=on]:text-white"
                                            aria-label="Toggle external search"
                                        >
                                            <Globe className="h-4.5 w-4.5" />
                                        </Toggle>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            {externalSearchEnabled
                                                ? 'External search enabled'
                                                : 'Enable external search'}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask me anything..."
                                disabled={isSubmitting}
                                rows={1}
                                className="flex-1 min-h-10 max-h-64 resize-none bg-transparent border-0 px-2 py-2 font-sans text-[13px] text-dashboard-text-primary placeholder:text-dashboard-text-muted focus:outline-none focus:ring-0 overflow-y-auto"
                                style={{ scrollbarWidth: 'thin' }}
                            />

                            <Button
                                type="submit"
                                size="icon"
                                disabled={!message.trim() || isSubmitting}
                                className="shrink-0 rounded-full bg-(--accent) text-white hover:bg-accent-light hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                {isSubmitting ? (
                                    <Spinner
                                        size="sm"
                                        className="text-current"
                                    />
                                ) : (
                                    <Send className="h-4.5 w-4.5" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-3 text-[11px] text-dashboard-text-muted font-sans">
                        <span>Press</span>
                        <Kbd>Enter</Kbd>
                        <span>to send</span>
                        <Separator orientation="vertical" className="h-3" />
                        <Kbd>Shift+Enter</Kbd>
                        <span>for new line</span>
                    </div>
                </form>
            </div>
        </div>
    );
}

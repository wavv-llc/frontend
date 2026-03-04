'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { Globe, Paperclip, Send } from 'lucide-react';
import { chatApi, type Chat } from '@/lib/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Kbd } from '@/components/ui/kbd';
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
    const [recentChats, setRecentChats] = useState<Chat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [externalSearchEnabled, setExternalSearchEnabled] = useState(false);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    useEffect(() => {
        const fetchRecentChats = async () => {
            try {
                const token = await getToken();
                if (!token) return;
                const response = await chatApi.getChats(token);
                if (response.data) setRecentChats(response.data.slice(0, 3));
            } catch (error) {
                console.error('Failed to fetch recent chats:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecentChats();
    }, [getToken]);

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

    const formatTimestamp = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60),
        );
        if (diffInHours < 24) {
            if (diffInHours < 1) return 'Just now';
            if (diffInHours === 1) return '1 hour ago';
            return `${diffInHours} hours ago`;
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            });
        }
    };

    const truncateText = (text: string, maxLength: number) =>
        text.length <= maxLength ? text : text.slice(0, maxLength) + '...';

    return (
        <div className="relative h-full w-full bg-dashboard-bg overflow-hidden flex flex-col">
            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
                <div className="w-full max-w-2xl space-y-10">
                    {/* Greeting */}
                    <div className="text-center space-y-2 animate-fade-up">
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

                    {/* Recent Conversations */}
                    {(isLoading || recentChats.length > 0) && (
                        <div className="space-y-3 animate-fade-up animate-delay-100">
                            <div className="flex items-center gap-3 px-1">
                                <span className="font-sans text-[11px] font-medium uppercase tracking-wider text-dashboard-text-muted">
                                    Recent Conversations
                                </span>
                                <Separator className="flex-1" />
                            </div>
                            <div className="space-y-2">
                                {isLoading
                                    ? [...Array(3)].map((_, i) => (
                                          <Card
                                              key={i}
                                              className="border-dashboard-border"
                                          >
                                              <CardContent className="flex items-start gap-3.5 p-3.5">
                                                  <Skeleton className="h-2 w-2 rounded-full mt-1.5 shrink-0" />
                                                  <div className="flex-1 space-y-2">
                                                      <Skeleton className="h-3.5 w-3/4" />
                                                      <Skeleton className="h-3 w-1/2" />
                                                  </div>
                                                  <Skeleton className="h-3 w-12 shrink-0" />
                                              </CardContent>
                                          </Card>
                                      ))
                                    : recentChats.map((chat) => (
                                          <Card
                                              key={chat.id}
                                              className="group cursor-pointer border-dashboard-border hover:border-(--accent) hover:shadow-sm transition-all duration-200"
                                              onClick={() =>
                                                  router.push(
                                                      `/chats/${chat.id}`,
                                                  )
                                              }
                                          >
                                              <CardContent className="flex items-start gap-3.5 p-3.5">
                                                  <div className="shrink-0 mt-1.5">
                                                      <div className="w-2 h-2 rounded-full bg-dashboard-text-muted group-hover:bg-(--accent) transition-colors" />
                                                  </div>
                                                  <div className="flex-1 min-w-0 space-y-1">
                                                      <h3 className="font-sans text-[13px] font-medium text-dashboard-text-primary group-hover:text-(--accent) transition-colors">
                                                          {truncateText(
                                                              chat.message,
                                                              60,
                                                          )}
                                                      </h3>
                                                      <p className="font-sans text-[11px] text-dashboard-text-muted line-clamp-1">
                                                          {chat.response
                                                              ? truncateText(
                                                                    chat.response,
                                                                    80,
                                                                )
                                                              : 'Processing...'}
                                                      </p>
                                                  </div>
                                                  <div className="shrink-0">
                                                      <Badge
                                                          variant="outline"
                                                          className="text-[10px] font-normal text-dashboard-text-faint border-dashboard-border"
                                                      >
                                                          {formatTimestamp(
                                                              chat.updatedAt,
                                                          )}
                                                      </Badge>
                                                  </div>
                                              </CardContent>
                                          </Card>
                                      ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Bar */}
            <div className="w-full pb-7 px-5 animate-fade-up animate-delay-160">
                <div className="max-w-2xl mx-auto">
                    <form onSubmit={handleSubmit} className="relative">
                        <div className="relative bg-transparent border border-zinc-300 rounded-lg transition-all focus-within:border-(--accent)">
                            <div className="flex items-center gap-2 p-2">
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

                                <TooltipProvider delayDuration={300}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0 h-9 w-9 rounded-lg text-dashboard-text-muted hover:bg-dashboard-bg"
                                            >
                                                <Paperclip className="h-4.5 w-4.5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Attach file</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask me anything..."
                                    disabled={isSubmitting}
                                    rows={1}
                                    className="flex-1 min-h-10 max-h-50 resize-none bg-transparent border-0 px-2 py-2 font-sans text-[13px] text-dashboard-text-primary placeholder:text-dashboard-text-muted focus:outline-none focus:ring-0"
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
        </div>
    );
}

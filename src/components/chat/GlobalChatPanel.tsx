'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
    MessageSquare,
    X,
    Send,
    Globe,
    Bot,
    Loader2,
    Maximize2,
    MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatApi, type ChatConversation, type ChatMessage } from '@/lib/api';
import { useChatPanel } from '@/contexts/ChatPanelContext';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

function contextLabel(type: string): string {
    switch (type) {
        case 'workspace':
            return 'Workspace';
        case 'project':
            return 'Project';
        case 'task':
            return 'Task';
        case 'tax-library':
            return 'Tax Library';
        default:
            return 'General';
    }
}

interface MessageEntry {
    id: string;
    message: string;
    response: string | null;
    createdAt: string;
}

export function GlobalChatFab() {
    const { isOpen, toggleChat } = useChatPanel();

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={toggleChat}
                        size="icon"
                        className={cn(
                            'fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg transition-all duration-200',
                            isOpen
                                ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                                : 'bg-[var(--accent)] text-white hover:bg-accent-light hover:scale-105',
                        )}
                    >
                        {isOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <MessageSquare className="h-5 w-5" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>{isOpen ? 'Close chat' : 'Open chat'}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export function GlobalChatPanel() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { isOpen, closeChat, pageContext } = useChatPanel();

    const [messages, setMessages] = useState<MessageEntry[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [externalSearch, setExternalSearch] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const cancelPollRef = useRef<(() => void) | null>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Reset conversation when panel is closed
    useEffect(() => {
        if (!isOpen) {
            // Cleanup polling when panel closes
            cancelPollRef.current?.();
        }
    }, [isOpen]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isSending || isPending) return;
        const text = input.trim();
        setInput('');

        try {
            setIsSending(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            if (!conversationId) {
                // Create new conversation with context
                const response = await chatApi.createChat(
                    token,
                    text,
                    externalSearch,
                    {
                        taskId: pageContext.taskId,
                        projectId: pageContext.projectId,
                        workspaceId: pageContext.workspaceId,
                    },
                );

                if (!response.data) {
                    toast.error('Failed to send message');
                    setInput(text);
                    return;
                }

                setConversationId(response.data.id);
                const entry: MessageEntry = {
                    id: response.data.id + '-msg',
                    message: text,
                    response: response.data.response,
                    createdAt: response.data.createdAt,
                };
                setMessages([entry]);

                if (!response.data.response) {
                    setIsPending(true);
                    // Poll for response
                    const fullConv = await chatApi.getChat(
                        token,
                        response.data.id,
                    );
                    const lastMsg =
                        fullConv.data?.messages?.[
                            fullConv.data.messages.length - 1
                        ];
                    if (lastMsg) {
                        cancelPollRef.current = await chatApi.pollChatStatus(
                            token,
                            response.data.id,
                            lastMsg.id,
                            (updatedConv: ChatConversation) => {
                                setMessages(
                                    updatedConv.messages.map(
                                        (m: ChatMessage) => ({
                                            id: m.id,
                                            message: m.message,
                                            response: m.response,
                                            createdAt: m.createdAt,
                                        }),
                                    ),
                                );
                                setIsPending(false);
                            },
                            {
                                interval: 1000,
                                maxAttempts: 120,
                                onError: () => {
                                    toast.error('Failed to receive response');
                                    setIsPending(false);
                                },
                            },
                        );
                    }
                }
            } else {
                // Add message to existing conversation
                // Optimistic update
                const optimisticEntry: MessageEntry = {
                    id: `opt-${Date.now()}`,
                    message: text,
                    response: null,
                    createdAt: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, optimisticEntry]);

                const sendResp = await chatApi.sendMessage(
                    token,
                    conversationId,
                    text,
                    externalSearch,
                );

                if (!sendResp.data) {
                    toast.error('Failed to send message');
                    setMessages((prev) =>
                        prev.filter((m) => m.id !== optimisticEntry.id),
                    );
                    setInput(text);
                    return;
                }

                // Replace optimistic with real
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === optimisticEntry.id
                            ? {
                                  id: sendResp.data!.id,
                                  message: sendResp.data!.message,
                                  response: sendResp.data!.response,
                                  createdAt: sendResp.data!.createdAt,
                              }
                            : m,
                    ),
                );

                setIsPending(true);
                cancelPollRef.current?.();
                cancelPollRef.current = await chatApi.pollChatStatus(
                    token,
                    conversationId,
                    sendResp.data.id,
                    (updatedConv: ChatConversation) => {
                        setMessages(
                            updatedConv.messages.map((m: ChatMessage) => ({
                                id: m.id,
                                message: m.message,
                                response: m.response,
                                createdAt: m.createdAt,
                            })),
                        );
                        setIsPending(false);
                    },
                    {
                        interval: 1000,
                        maxAttempts: 120,
                        onError: () => {
                            toast.error('Failed to receive response');
                            setIsPending(false);
                        },
                    },
                );
            }
        } catch {
            toast.error('Failed to send message');
            setInput(text);
        } finally {
            setIsSending(false);
        }
    }, [
        input,
        isSending,
        isPending,
        conversationId,
        externalSearch,
        pageContext,
        getToken,
    ]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleOpenFull = () => {
        if (conversationId) {
            router.push(`/chats/${conversationId}`);
            closeChat();
        } else {
            router.push('/chats/new');
            closeChat();
        }
    };

    const handleNewChat = () => {
        cancelPollRef.current?.();
        setMessages([]);
        setConversationId(null);
        setIsPending(false);
        setInput('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-20 right-5 z-50 w-96 h-[520px] bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-6 w-6 rounded-md bg-[var(--accent)] text-white">
                        <Bot className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-semibold">
                        Wavv Assistant
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {conversationId && (
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={handleNewChat}
                                    >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>New chat</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={handleOpenFull}
                                >
                                    <Maximize2 className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Open full chat</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={closeChat}
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Context badge */}
            {pageContext.type !== 'general' && (
                <div className="px-4 py-1.5 border-b bg-muted/20">
                    <Badge
                        variant="secondary"
                        className="text-[10px] gap-1 font-normal"
                    >
                        <MapPin className="h-2.5 w-2.5" />
                        {contextLabel(pageContext.type)}
                        {pageContext.label && `: ${pageContext.label}`}
                    </Badge>
                </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1" ref={scrollRef}>
                <div className="p-4 space-y-3">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Ask anything
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                                {pageContext.type !== 'general'
                                    ? `Context: ${contextLabel(pageContext.type)}${pageContext.label ? ` - ${pageContext.label}` : ''}`
                                    : 'Start a conversation'}
                            </p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div key={msg.id} className="space-y-2">
                            {/* User message */}
                            <div className="flex justify-end">
                                <div className="max-w-[80%] px-3 py-2 rounded-xl rounded-br-sm bg-[var(--accent)] text-white text-xs leading-relaxed">
                                    {msg.message}
                                </div>
                            </div>

                            {/* Assistant response */}
                            {msg.response !== null ? (
                                <div className="flex gap-2">
                                    <div className="h-5 w-5 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                        <Bot className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:my-1 [&_li]:my-0">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                        >
                                            {msg.response}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ) : isPending ? (
                                <div className="flex gap-2 items-center">
                                    <div className="h-5 w-5 rounded-md bg-muted flex items-center justify-center shrink-0">
                                        <Bot className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                            Thinking...
                                        </span>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <Separator />

            {/* Input area */}
            <div className="p-3">
                <div className="flex items-end gap-2 bg-muted/30 border border-border rounded-lg px-2 py-1.5 focus-within:border-[var(--accent)] transition-colors">
                    <Toggle
                        pressed={externalSearch}
                        onPressedChange={setExternalSearch}
                        size="sm"
                        className="shrink-0 h-7 w-7 rounded-md p-0 data-[state=on]:bg-[var(--accent)] data-[state=on]:text-white"
                    >
                        <Globe className="h-3.5 w-3.5" />
                    </Toggle>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything..."
                        disabled={isSending || isPending}
                        rows={1}
                        className="flex-1 min-h-7 max-h-24 resize-none bg-transparent border-0 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-0 overflow-y-auto py-1.5"
                    />
                    <Button
                        onClick={handleSend}
                        size="icon"
                        disabled={!input.trim() || isSending || isPending}
                        className="shrink-0 h-7 w-7 rounded-full bg-[var(--accent)] text-white hover:bg-accent-light disabled:opacity-40"
                    >
                        {isSending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Send className="h-3 w-3" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { Globe, Paperclip, Send, Loader2 } from 'lucide-react';
import { chatApi, type Chat } from '@/lib/api';
import { toast } from 'sonner';

export default function NewChatPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { user } = useUser();
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recentChats, setRecentChats] = useState<Chat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [externalSearchEnabled, setExternalSearchEnabled] = useState(false);

    // Get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Fetch recent chats
    useEffect(() => {
        const fetchRecentChats = async () => {
            try {
                const token = await getToken();
                if (!token) return;

                const response = await chatApi.getChats(token);
                if (response.data) {
                    setRecentChats(response.data.slice(0, 3));
                }
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
            if (response.data) {
                router.push(`/chats/${response.data.id}`);
            }
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

    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    };

    return (
        <div className="relative h-full w-full bg-[var(--dashboard-bg)] overflow-hidden flex flex-col">
            {/* Main Content - Centered */}
            <div className="flex-1 flex flex-col items-center justify-center px-5 py-[43px]">
                <div className="w-full max-w-2xl space-y-[43px]">
                    {/* Greeting Section */}
                    <div className="text-center space-y-2 animate-fade-up">
                        <h1 className="font-serif text-[32px] md:text-[43px] font-normal tracking-tight text-[var(--dashboard-text-primary)]">
                            {getGreeting()}, {user?.firstName || 'there'}
                        </h1>
                        <p className="font-sans text-sm md:text-base text-[var(--dashboard-text-body)]">
                            How can I help with your taxes today?
                        </p>
                    </div>

                    {/* Recent Conversations */}
                    {!isLoading && recentChats.length > 0 && (
                        <div className="space-y-3.5 animate-fade-up animate-delay-100">
                            <h2 className="font-sans text-[11px] font-medium uppercase tracking-wider text-[var(--dashboard-text-muted)] px-1">
                                Recent Conversations
                            </h2>
                            <div className="space-y-2">
                                {recentChats.map((chat) => (
                                    <button
                                        key={chat.id}
                                        onClick={() =>
                                            router.push(`/chats/${chat.id}`)
                                        }
                                        className="w-full text-left group cursor-pointer"
                                    >
                                        <div className="flex items-start gap-3.5 p-3.5 rounded-lg bg-[var(--dashboard-surface)] border border-[var(--dashboard-border)] hover:border-[var(--accent)] hover:shadow-sm transition-all duration-200">
                                            <div className="flex-shrink-0 mt-1.5">
                                                <div className="w-2 h-2 rounded-full bg-[var(--dashboard-text-muted)] group-hover:bg-[var(--accent)] transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <h3 className="font-sans text-[13px] font-medium text-[var(--dashboard-text-primary)] group-hover:text-[var(--accent)] transition-colors">
                                                    {truncateText(
                                                        chat.message,
                                                        60,
                                                    )}
                                                </h3>
                                                <p className="font-sans text-[11px] text-[var(--dashboard-text-muted)] line-clamp-1">
                                                    {chat.response
                                                        ? truncateText(
                                                              chat.response,
                                                              80,
                                                          )
                                                        : 'Processing...'}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <span className="font-sans text-[11px] text-[var(--dashboard-text-faint)]">
                                                    {formatTimestamp(
                                                        chat.updatedAt,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Bar - Bottom */}
            <div className="w-full pb-7 px-5 animate-fade-up animate-delay-160">
                <div className="max-w-2xl mx-auto">
                    <form onSubmit={handleSubmit} className="relative">
                        <div className="relative bg-transparent border border-zinc-300 rounded-lg transition-all focus-within:border-[var(--accent)]">
                            <div className="flex items-center gap-2 p-2">
                                {/* Globe Icon */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setExternalSearchEnabled(
                                            !externalSearchEnabled,
                                        )
                                    }
                                    className={`flex-shrink-0 p-2 rounded-lg transition-colors cursor-pointer ${
                                        externalSearchEnabled
                                            ? 'bg-[var(--accent)] text-white'
                                            : 'text-[var(--dashboard-text-muted)] hover:bg-[var(--accent-hover)]'
                                    }`}
                                    title={
                                        externalSearchEnabled
                                            ? 'External search enabled'
                                            : 'Enable external search'
                                    }
                                >
                                    <Globe className="h-[18px] w-[18px]" />
                                </button>

                                {/* Attachment Icon */}
                                <button
                                    type="button"
                                    className="flex-shrink-0 p-2 rounded-lg text-[var(--dashboard-text-muted)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
                                    title="Attach file"
                                >
                                    <Paperclip className="h-[18px] w-[18px]" />
                                </button>

                                {/* Textarea */}
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask me anything..."
                                    disabled={isSubmitting}
                                    rows={1}
                                    className="flex-1 min-h-[40px] max-h-[200px] resize-none bg-transparent border-0 px-2 py-2 font-sans text-[13px] text-[var(--dashboard-text-primary)] placeholder:text-[var(--dashboard-text-muted)] focus:outline-none focus:ring-0"
                                    style={{
                                        scrollbarWidth: 'thin',
                                        scrollbarColor:
                                            'var(--scrollbar-thumb) transparent',
                                    }}
                                />

                                {/* Send Button */}
                                <button
                                    type="submit"
                                    disabled={!message.trim() || isSubmitting}
                                    className="flex-shrink-0 p-2.5 rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-light)] hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-[18px] w-[18px] animate-spin" />
                                    ) : (
                                        <Send className="h-[18px] w-[18px]" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <p className="text-[11px] text-[var(--dashboard-text-muted)] text-center mt-3 font-sans">
                            Press <span className="font-medium">Enter</span> to
                            send •{' '}
                            <span className="font-medium">Shift+Enter</span> for
                            new line
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}

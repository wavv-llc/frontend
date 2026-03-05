'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
    ArrowLeft,
    Copy,
    Share2,
    Download,
    ThumbsUp,
    ThumbsDown,
    Check,
    Bot,
    RefreshCw,
    Send,
    Globe,
} from 'lucide-react';
import { chatApi, type ChatConversation, type ChatMessage } from '@/lib/api';
import { colors } from '@/lib/colors';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Design Tokens ───────────────────────────────────
const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';

// ─── Thinking Animation Component ───────────────────────────────
function ThinkingAnimation() {
    return (
        <div className="thinking-container">
            <div className="thinking-dot"></div>
            <div className="thinking-dot"></div>
            <div className="thinking-dot"></div>
        </div>
    );
}

// ─── Simple Markdown Renderer ───────────────────────────────
function RenderMarkdown({ text }: { text: string }) {
    const lines = text.split('\n');
    const elements: React.ReactElement[] = [];
    let i = 0;
    let listBuffer: string[] = [];

    const flushList = () => {
        if (listBuffer.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="md-ul">
                    {listBuffer.map((item, j) => (
                        <li key={j} className="md-li">
                            {parseInline(item)}
                        </li>
                    ))}
                </ul>,
            );
            listBuffer = [];
        }
    };

    const parseInline = (str: string) => {
        const parts: (string | React.ReactElement)[] = [];
        const regex = /\*\*(.+?)\*\*/g;
        let last = 0;
        let match;
        while ((match = regex.exec(str)) !== null) {
            if (match.index > last) parts.push(str.slice(last, match.index));
            parts.push(<strong key={match.index}>{match[1]}</strong>);
            last = regex.lastIndex;
        }
        if (last < str.length) parts.push(str.slice(last));
        return parts.length ? parts : str;
    };

    while (i < lines.length) {
        const line = lines[i];

        if (line.startsWith('## ')) {
            flushList();
            elements.push(
                <h2 key={i} className="md-h2">
                    {line.slice(3)}
                </h2>,
            );
        } else if (line.startsWith('### ')) {
            flushList();
            elements.push(
                <h3 key={i} className="md-h3">
                    {line.slice(4)}
                </h3>,
            );
        } else if (line.startsWith('- ')) {
            listBuffer.push(line.slice(2));
        } else if (line.trim() === '') {
            flushList();
        } else {
            flushList();
            elements.push(
                <p key={i} className="md-p">
                    {parseInline(line)}
                </p>,
            );
        }
        i++;
    }
    flushList();

    return <>{elements}</>;
}

export default function ChatDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { getToken } = useAuth();
    const chatId = params.chatId as string;
    const scrollRef = useRef<HTMLDivElement>(null);

    const [conversation, setConversation] = useState<ChatConversation | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [pendingMessageId, setPendingMessageId] = useState<string | null>(
        null,
    );
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
        null,
    );
    const [streamedText, setStreamedText] = useState('');
    const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const cancelPollingRef = useRef<(() => void) | null>(null);
    const [followUpMessage, setFollowUpMessage] = useState('');
    const [externalSearchEnabled, setExternalSearchEnabled] = useState(false);
    const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const fetchChat = async () => {
            try {
                const token = await getToken();
                if (!token) {
                    setError('Authentication required');
                    toast.error('Authentication required');
                    return;
                }

                const response = await chatApi.getChat(token, chatId);
                if (response.data) {
                    setConversation(response.data);

                    const msgs = response.data.messages ?? [];
                    const lastMsg = msgs[msgs.length - 1];

                    if (lastMsg && lastMsg.response === null) {
                        setPendingMessageId(lastMsg.id);
                        cancelPollingRef.current = await chatApi.pollChatStatus(
                            token,
                            chatId,
                            lastMsg.id,
                            (updatedConv) => {
                                setConversation(updatedConv);
                                setPendingMessageId(null);
                                const updatedMsg = updatedConv.messages?.find(
                                    (m) => m.id === lastMsg.id,
                                );
                                if (updatedMsg?.response) {
                                    animateResponse(
                                        lastMsg.id,
                                        updatedMsg.response,
                                    );
                                }
                            },
                            {
                                interval: 1000,
                                maxAttempts: 120,
                                onError: (err) => {
                                    console.error('Polling error:', err);
                                    toast.error('Failed to receive response');
                                    setPendingMessageId(null);
                                },
                            },
                        );
                    }
                } else {
                    setError('Chat not found');
                    toast.error('Chat not found');
                }
            } catch (err) {
                console.error('Failed to fetch chat:', err);
                setError('Failed to load chat');
                toast.error('Failed to load chat');
            } finally {
                setLoading(false);
            }
        };

        fetchChat();

        return () => {
            cancelPollingRef.current?.();
            if (streamIntervalRef.current)
                clearInterval(streamIntervalRef.current);
        };
    }, [getToken, chatId]);

    const animateResponse = (messageId: string, text: string) => {
        if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
        setStreamingMessageId(messageId);
        setStreamedText('');
        const words = text.split(' ');
        let currentIndex = 0;
        streamIntervalRef.current = setInterval(() => {
            if (currentIndex < words.length) {
                setStreamedText(words.slice(0, currentIndex + 1).join(' '));
                currentIndex++;
            } else {
                clearInterval(streamIntervalRef.current!);
                streamIntervalRef.current = null;
                setStreamingMessageId(null);
            }
        }, 30);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [conversation, streamedText]);

    const handleCopy = (messageId: string, content: string) => {
        navigator.clipboard?.writeText(
            content.replace(/\*\*/g, '').replace(/#{2,3}\s/g, ''),
        );
        setCopiedId(messageId);
        setTimeout(() => setCopiedId(null), 1500);
    };

    const handleFollowUp = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!followUpMessage.trim() || isSubmittingFollowUp || pendingMessageId)
            return;

        const text = followUpMessage.trim();
        setFollowUpMessage('');

        try {
            setIsSubmittingFollowUp(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            // Optimistically append a pending message to the UI
            const optimisticId = `optimistic-${Date.now()}`;
            setConversation((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    messages: [
                        ...prev.messages,
                        {
                            id: optimisticId,
                            message: text,
                            response: null,
                            externalSearchEnabled,
                            conversationId: chatId,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        } as ChatMessage,
                    ],
                };
            });

            const sendResp = await chatApi.sendMessage(
                token,
                chatId,
                text,
                externalSearchEnabled,
            );

            if (!sendResp.data) {
                toast.error('Failed to send message');
                setConversation((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        messages: prev.messages.filter(
                            (m) => m.id !== optimisticId,
                        ),
                    };
                });
                return;
            }

            const realId = sendResp.data.id;

            // Replace optimistic entry with the real message from server
            setConversation((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    messages: prev.messages.map((m) =>
                        m.id === optimisticId ? { ...sendResp.data! } : m,
                    ),
                };
            });

            setPendingMessageId(realId);

            cancelPollingRef.current?.();
            cancelPollingRef.current = await chatApi.pollChatStatus(
                token,
                chatId,
                realId,
                (updatedConv) => {
                    setConversation(updatedConv);
                    setPendingMessageId(null);
                    const updatedMsg = updatedConv.messages?.find(
                        (m) => m.id === realId,
                    );
                    if (updatedMsg?.response) {
                        animateResponse(realId, updatedMsg.response);
                    }
                },
                {
                    interval: 1000,
                    maxAttempts: 120,
                    onError: () => {
                        toast.error('Failed to receive response');
                        setPendingMessageId(null);
                    },
                },
            );
        } catch {
            toast.error('Failed to send message');
            setFollowUpMessage(text);
        } finally {
            setIsSubmittingFollowUp(false);
        }
    };

    const handleInputKeyDown = (
        e: React.KeyboardEvent<HTMLTextAreaElement>,
    ) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleFollowUp();
        }
    };

    const handleRetry = async (msgText: string) => {
        if (!conversation || isRetrying || pendingMessageId) return;
        setIsRetrying(true);
        try {
            setFollowUpMessage(msgText);
        } finally {
            setIsRetrying(false);
        }
    };

    const formatTimestamp = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor(
            (now.getTime() - date.getTime()) / 1000,
        );

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600)
            return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400)
            return `${Math.floor(diffInSeconds / 3600)}h ago`;

        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDateBadge = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <>
                <style>{styles}</style>
                <div className="cr-root">
                    <div className="cr-right">
                        <div className="main-bg" />
                        {/* Top bar skeleton */}
                        <header className="top-bar">
                            <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
                            <div className="flex flex-col gap-1 flex-1">
                                <Skeleton className="h-3 w-48" />
                                <Skeleton className="h-2 w-24" />
                            </div>
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </header>
                        {/* Messages skeleton */}
                        <div className="messages-scroll">
                            <div className="messages-inner">
                                {/* User message skeleton */}
                                <div className="flex justify-end py-1">
                                    <Skeleton className="h-12 w-64 rounded-[13px_13px_3px_13px]" />
                                </div>
                                {/* Assistant message skeleton */}
                                <div className="py-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Skeleton className="h-6 w-6 rounded-md shrink-0" />
                                        <Skeleton className="h-3 w-12" />
                                    </div>
                                    <Skeleton className="h-28 w-full rounded-[13px]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (error || !conversation) {
        return (
            <div className="cr-root">
                <style>{styles}</style>
                <div className="cr-right">
                    <div className="main-bg" />
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-4">
                            <p
                                className="text-lg font-semibold"
                                style={{ color: colors.steelAlt[800] }}
                            >
                                {error || 'Chat not found'}
                            </p>
                            <button
                                onClick={() => router.push('/chats/new')}
                                className="px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                                style={{
                                    background: colors.steelAlt[800],
                                    color: colors.steelAlt[100],
                                }}
                            >
                                Start New Chat
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const firstMsg = conversation.messages?.[0];
    const displayTitle =
        conversation.title ??
        (firstMsg?.message && firstMsg.message.length > 60
            ? firstMsg.message.slice(0, 60) + '...'
            : (firstMsg?.message ?? ''));
    const totalMessages = conversation.messages?.length ?? 0;

    return (
        <>
            <style>{styles}</style>
            <div className="cr-root">
                <div className="cr-right">
                    <div className="main-bg" />

                    {/* Top Bar */}
                    <header className="top-bar">
                        <button
                            className="back-btn"
                            onClick={() => router.push('/home')}
                        >
                            <ArrowLeft size={14} />
                        </button>
                        <div className="top-bar-info">
                            <div className="top-bar-title">{displayTitle}</div>
                            <div className="top-bar-meta">
                                {totalMessages} message
                                {totalMessages !== 1 ? 's' : ''} ·{' '}
                                {formatTimestamp(conversation.createdAt)}
                            </div>
                        </div>
                        <div className="top-bar-badge">
                            {formatDateBadge(conversation.createdAt)}
                        </div>
                    </header>

                    {/* Messages — one user bubble + one assistant bubble per ChatMessage */}
                    <div
                        className="messages-scroll"
                        ref={scrollRef}
                        style={{ paddingBottom: '80px' }}
                    >
                        <div className="messages-inner">
                            {conversation.messages?.map((msg) => {
                                const isPending = msg.id === pendingMessageId;
                                const isStreaming =
                                    msg.id === streamingMessageId;
                                const responseContent = isStreaming
                                    ? streamedText
                                    : (msg.response ?? '');
                                const showAssistant =
                                    msg.response !== null || isPending;

                                return (
                                    <React.Fragment key={msg.id}>
                                        {/* User bubble */}
                                        <div className="msg msg-user">
                                            <div>
                                                <div className="msg-user-bubble">
                                                    {msg.message}
                                                </div>
                                                <div className="msg-user-footer">
                                                    <div className="msg-user-time">
                                                        {formatTimestamp(
                                                            msg.createdAt,
                                                        )}
                                                    </div>
                                                    {!isPending && (
                                                        <button
                                                            className="retry-btn"
                                                            onClick={() =>
                                                                handleRetry(
                                                                    msg.message,
                                                                )
                                                            }
                                                            disabled={
                                                                isRetrying
                                                            }
                                                            title="Re-ask this question"
                                                        >
                                                            <RefreshCw
                                                                size={10}
                                                                className={
                                                                    isRetrying
                                                                        ? 'animate-spin'
                                                                        : ''
                                                                }
                                                            />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Assistant bubble */}
                                        {showAssistant && (
                                            <div className="msg msg-assistant">
                                                <div className="msg-asst-header">
                                                    <div className="msg-asst-icon">
                                                        <Bot size={13} />
                                                    </div>
                                                    <span className="msg-asst-label">
                                                        Wavv
                                                    </span>
                                                    {!isPending && (
                                                        <span className="msg-asst-time">
                                                            {formatTimestamp(
                                                                msg.createdAt,
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="msg-asst-body">
                                                    {isPending ? (
                                                        <ThinkingAnimation />
                                                    ) : (
                                                        <RenderMarkdown
                                                            text={
                                                                responseContent
                                                            }
                                                        />
                                                    )}
                                                </div>
                                                {!isPending &&
                                                    responseContent && (
                                                        <div className="msg-actions">
                                                            <button
                                                                className={`action-btn${copiedId === msg.id ? ' copied' : ''}`}
                                                                onClick={() =>
                                                                    handleCopy(
                                                                        msg.id,
                                                                        responseContent,
                                                                    )
                                                                }
                                                            >
                                                                {copiedId ===
                                                                msg.id ? (
                                                                    <Check
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <Copy
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                )}
                                                                <span className="action-tooltip">
                                                                    {copiedId ===
                                                                    msg.id
                                                                        ? 'Copied'
                                                                        : 'Copy'}
                                                                </span>
                                                            </button>
                                                            <button className="action-btn">
                                                                <Share2
                                                                    size={12}
                                                                />
                                                                <span className="action-tooltip">
                                                                    Share
                                                                </span>
                                                            </button>
                                                            <button className="action-btn">
                                                                <Download
                                                                    size={12}
                                                                />
                                                                <span className="action-tooltip">
                                                                    Download
                                                                </span>
                                                            </button>
                                                            <div className="action-divider" />
                                                            <button className="action-btn">
                                                                <ThumbsUp
                                                                    size={12}
                                                                />
                                                                <span className="action-tooltip">
                                                                    Good
                                                                </span>
                                                            </button>
                                                            <button className="action-btn">
                                                                <ThumbsDown
                                                                    size={12}
                                                                />
                                                                <span className="action-tooltip">
                                                                    Bad
                                                                </span>
                                                            </button>
                                                        </div>
                                                    )}
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* Follow-up Input Bar */}
                    <div className="follow-up-bar">
                        <form
                            onSubmit={handleFollowUp}
                            className="follow-up-form"
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setExternalSearchEnabled((v) => !v)
                                }
                                className={`follow-up-globe${externalSearchEnabled ? ' active' : ''}`}
                                title={
                                    externalSearchEnabled
                                        ? 'External search on'
                                        : 'External search off'
                                }
                            >
                                <Globe size={14} />
                            </button>
                            <textarea
                                ref={inputRef}
                                value={followUpMessage}
                                onChange={(e) =>
                                    setFollowUpMessage(e.target.value)
                                }
                                onKeyDown={handleInputKeyDown}
                                placeholder="Follow up or ask a new question..."
                                disabled={
                                    isSubmittingFollowUp ||
                                    pendingMessageId !== null
                                }
                                rows={1}
                                className="follow-up-input"
                            />
                            <button
                                type="submit"
                                disabled={
                                    !followUpMessage.trim() ||
                                    isSubmittingFollowUp ||
                                    pendingMessageId !== null
                                }
                                className="follow-up-send"
                            >
                                <Send size={14} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Serif+Display:ital@0;1&display=swap');

  .cr-root {
    font-family: 'DM Sans', -apple-system, sans-serif;
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: ${colors.steelAlt[50]};
    color: ${colors.steelAlt[800]};
  }

  /* ── RIGHT PANEL ── */
  .cr-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .main-bg {
    position: absolute;
    inset: 0;
    opacity: 0.2;
    pointer-events: none;
    background:
      radial-gradient(ellipse 55% 40% at 30% 20%, ${colors.steelAlt[200]}99, transparent),
      radial-gradient(ellipse 40% 30% at 75% 70%, ${colors.steelAlt[200]}55, transparent);
  }

  /* ── TOP BAR ── */
  .top-bar {
    display: flex;
    align-items: center;
    padding: 0 19px;
    height: 45px;
    background: rgba(255,255,255,0.82);
    backdrop-filter: blur(19px);
    border-bottom: 1px solid ${colors.steelAlt[200]}aa;
    flex-shrink: 0;
    position: relative;
    z-index: 5;
    gap: 10px;
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 27px;
    height: 27px;
    border-radius: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: ${colors.steelAlt[400]};
    transition: all 200ms ${ease};
    flex-shrink: 0;
  }

  .back-btn:hover {
    background: ${colors.steelAlt[100]};
    color: ${colors.steelAlt[700]};
  }

  .top-bar-info {
    flex: 1;
    min-width: 0;
  }

  .top-bar-title {
    font-size: 12px;
    font-weight: 600;
    color: ${colors.steelAlt[800]};
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .top-bar-meta {
    font-size: 9px;
    color: ${colors.steelAlt[400]};
    font-weight: 500;
  }

  .top-bar-badge {
    font-size: 9px;
    font-weight: 600;
    color: ${colors.steelAlt[500]};
    background: ${colors.steelAlt[100]};
    padding: 3px 8px;
    border-radius: 100px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* ── MESSAGES ── */
  .messages-scroll {
    flex: 1;
    overflow-y: auto;
    position: relative;
    z-index: 1;
  }

  .messages-scroll::-webkit-scrollbar {
    width: 5px;
  }

  .messages-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .messages-scroll::-webkit-scrollbar-thumb {
    background: ${colors.steelAlt[200]};
    border-radius: 5px;
  }

  .messages-inner {
    max-width: 608px;
    margin: 0 auto;
    padding: 22px 22px 32px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  /* ── MESSAGE BUBBLE ── */
  .msg {
    opacity: 0;
    transform: translateY(6px);
    animation: fadeUp 400ms ${ease} forwards;
  }

  .msg:nth-child(1) {
    animation-delay: 40ms;
  }

  .msg:nth-child(2) {
    animation-delay: 100ms;
  }

  .msg:nth-child(3) {
    animation-delay: 160ms;
  }

  .msg:nth-child(4) {
    animation-delay: 220ms;
  }

  @keyframes fadeUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ── USER MESSAGE ── */
  .msg-user {
    display: flex;
    justify-content: flex-end;
    padding: 3px 0;
  }

  .msg-user-bubble {
    max-width: 416px;
    padding: 10px 14px;
    border-radius: 13px 13px 3px 13px;
    background: ${colors.steelAlt[800]};
    color: ${colors.steelAlt[100]};
    font-size: 11px;
    line-height: 1.6;
    font-weight: 400;
    box-shadow: 0 2px 6px rgba(14,17,23,0.1);
  }

  .msg-user-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 3px;
    padding-right: 3px;
  }

  .msg-user-time {
    font-size: 9px;
    color: ${colors.steelAlt[400]};
  }

  .retry-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(8px);
    color: ${colors.steelAlt[500]};
    cursor: pointer;
    transition: all 200ms ${ease};
    opacity: 0;
    box-shadow: 0 1px 3px rgba(14, 17, 23, 0.08);
  }

  .msg-user:hover .retry-btn {
    opacity: 1;
  }

  .retry-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.95);
    color: ${colors.steelAlt[700]};
    transform: scale(1.1);
    box-shadow: 0 2px 6px rgba(14, 17, 23, 0.12);
  }

  .retry-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .retry-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* ── ASSISTANT MESSAGE ── */
  .msg-assistant {
    padding: 3px 0;
  }

  .msg-asst-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }

  .msg-asst-icon {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: ${colors.steelAlt[100]};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${colors.steelAlt[600]};
    flex-shrink: 0;
  }

  .msg-asst-label {
    font-size: 10px;
    font-weight: 600;
    color: ${colors.steelAlt[600]};
  }

  .msg-asst-time {
    font-size: 9px;
    color: ${colors.steelAlt[400]};
    font-weight: 400;
  }

  .msg-asst-body {
    background: white;
    border-radius: 13px;
    padding: 18px 21px;
    box-shadow: 0 1px 2px rgba(14,17,23,0.04), 0 3px 13px rgba(14,17,23,0.03);
    font-size: 11px;
    line-height: 1.7;
    color: ${colors.steelAlt[700]};
  }

  /* ── MARKDOWN STYLES ── */
  .md-h2 {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 15px;
    font-weight: 400;
    color: ${colors.steelAlt[800]};
    margin: 19px 0 6px;
    letter-spacing: -0.01em;
  }

  .md-h2:first-child {
    margin-top: 6px;
  }

  .md-h3 {
    font-size: 12px;
    font-weight: 700;
    color: ${colors.steelAlt[800]};
    margin: 14px 0 5px;
    letter-spacing: -0.005em;
  }

  .md-p {
    margin: 0 0 8px;
    color: ${colors.steelAlt[700]};
  }

  .md-p:last-child {
    margin-bottom: 0;
  }

  .md-p strong {
    color: ${colors.steelAlt[800]};
    font-weight: 600;
  }

  .md-ul {
    margin: 5px 0 10px 0;
    padding-left: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .md-li {
    position: relative;
    padding-left: 14px;
    color: ${colors.steelAlt[600]};
    font-size: 11px;
    line-height: 1.65;
  }

  .md-li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 7px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: ${colors.steelAlt[300]};
  }

  /* ── ACTIONS BAR ── */
  .msg-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-top: 8px;
    padding: 0 2px;
    opacity: 0;
    transition: opacity 200ms ${ease};
  }

  .msg:hover .msg-actions {
    opacity: 1;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: ${colors.steelAlt[400]};
    transition: all 180ms ${ease};
    position: relative;
  }

  .action-btn:hover {
    background: ${colors.steelAlt[100]};
    color: ${colors.steelAlt[600]};
  }

  .action-btn:active {
    transform: scale(0.92);
  }

  .action-btn.copied {
    color: ${colors.steelAlt[700]};
  }

  .action-divider {
    width: 1px;
    height: 13px;
    background: ${colors.steelAlt[200]};
    margin: 0 3px;
  }

  .action-tooltip {
    position: absolute;
    bottom: calc(100% + 5px);
    left: 50%;
    transform: translateX(-50%) translateY(3px);
    font-family: 'DM Sans', -apple-system, sans-serif;
    font-size: 9px;
    font-weight: 600;
    color: ${colors.steelAlt[100]};
    background: ${colors.steelAlt[800]};
    padding: 3px 6px;
    border-radius: 5px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: all 150ms ${ease};
  }

  .action-btn:hover .action-tooltip {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  /* ── THINKING ANIMATION ── */
  .thinking-container {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 0;
  }

  .thinking-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${colors.steelAlt[400]};
    animation: thinkingPulse 1.4s ease-in-out infinite;
  }

  .thinking-dot:nth-child(1) {
    animation-delay: 0s;
  }

  .thinking-dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .thinking-dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes thinkingPulse {
    0%, 100% {
      opacity: 0.3;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1.2);
    }
  }

  /* ── STREAMING TEXT ANIMATION ── */
  .msg-asst-body > * {
    animation: fadeInText 0.3s ${ease} forwards;
  }

  @keyframes fadeInText {
    from {
      opacity: 0;
      transform: translateY(2px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ── FOLLOW-UP INPUT BAR ── */
  .follow-up-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 16px 16px;
    background: linear-gradient(to top, ${colors.steelAlt[50]} 70%, transparent);
    z-index: 10;
  }

  .follow-up-form {
    max-width: 608px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 8px;
    background: white;
    border: 1px solid ${colors.steelAlt[200]};
    border-radius: 12px;
    padding: 8px 10px 8px 14px;
    box-shadow: 0 2px 12px rgba(14, 17, 23, 0.06);
    transition: border-color 200ms ${ease}, box-shadow 200ms ${ease};
  }

  .follow-up-form:focus-within {
    border-color: ${colors.steelAlt[400]};
    box-shadow: 0 2px 16px rgba(14, 17, 23, 0.1);
  }

  .follow-up-input {
    flex: 1;
    min-height: 32px;
    max-height: 120px;
    resize: none;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'DM Sans', -apple-system, sans-serif;
    font-size: 12px;
    line-height: 1.5;
    color: ${colors.steelAlt[800]};
    scrollbar-width: thin;
  }

  .follow-up-input::placeholder {
    color: ${colors.steelAlt[400]};
  }

  .follow-up-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .follow-up-send {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: ${colors.steelAlt[800]};
    color: ${colors.steelAlt[100]};
    cursor: pointer;
    transition: all 200ms ${ease};
    flex-shrink: 0;
  }

  .follow-up-send:hover:not(:disabled) {
    background: ${colors.steelAlt[700]};
    transform: scale(1.05);
  }

  .follow-up-send:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  .follow-up-globe {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 7px;
    border: none;
    background: transparent;
    color: ${colors.steelAlt[400]};
    cursor: pointer;
    transition: all 180ms ${ease};
    flex-shrink: 0;
  }

  .follow-up-globe:hover {
    background: ${colors.steelAlt[100]};
    color: ${colors.steelAlt[600]};
  }

  .follow-up-globe.active {
    background: ${colors.steelAlt[800]};
    color: ${colors.steelAlt[100]};
  }
`;

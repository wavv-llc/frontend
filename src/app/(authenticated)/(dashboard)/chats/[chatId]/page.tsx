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
} from 'lucide-react';
import { chatApi, type Chat } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { colors } from '@/lib/colors';

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

    const [chat, setChat] = useState<Chat | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [streamedResponse, setStreamedResponse] = useState('');
    const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let cancelPolling: (() => void) | null = null;

        const fetchChat = async () => {
            try {
                const token = await getToken();
                if (!token) {
                    setError('Authentication required');
                    return;
                }

                const response = await chatApi.getChat(token, chatId);
                if (response.data) {
                    setChat(response.data);

                    // If response is not complete, start polling and show thinking
                    if (response.data.response === null) {
                        setIsThinking(true);
                        cancelPolling = await chatApi.pollChatStatus(
                            token,
                            chatId,
                            (updatedChat) => {
                                setChat(updatedChat);
                                setIsThinking(false);
                                // Trigger streaming animation
                                if (updatedChat.response) {
                                    animateResponse(updatedChat.response);
                                }
                            },
                            {
                                interval: 1000,
                                maxAttempts: 120,
                                onError: (err) => {
                                    console.error('Polling error:', err);
                                    setError('Failed to receive response');
                                    setIsThinking(false);
                                },
                            },
                        );
                    } else if (response.data.response) {
                        // Response already complete, show it immediately
                        setStreamedResponse(response.data.response);
                    }
                } else {
                    setError('Chat not found');
                }
            } catch (err) {
                console.error('Failed to fetch chat:', err);
                setError('Failed to load chat');
            } finally {
                setLoading(false);
            }
        };

        fetchChat();

        // Cleanup: cancel polling and streaming animation when component unmounts
        return () => {
            if (cancelPolling) {
                cancelPolling();
            }
            if (streamIntervalRef.current) {
                clearInterval(streamIntervalRef.current);
            }
        };
    }, [getToken, chatId]);

    // Animate the response text streaming in
    const animateResponse = (text: string) => {
        // Clear any existing animation
        if (streamIntervalRef.current) {
            clearInterval(streamIntervalRef.current);
        }

        const words = text.split(' ');
        let currentIndex = 0;

        streamIntervalRef.current = setInterval(() => {
            if (currentIndex < words.length) {
                setStreamedResponse(words.slice(0, currentIndex + 1).join(' '));
                currentIndex++;
            } else {
                if (streamIntervalRef.current) {
                    clearInterval(streamIntervalRef.current);
                    streamIntervalRef.current = null;
                }
            }
        }, 30); // Adjust speed here (lower = faster)
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chat, streamedResponse]);

    const handleCopy = (idx: number, content: string) => {
        navigator.clipboard?.writeText(
            content.replace(/\*\*/g, '').replace(/#{2,3}\s/g, ''),
        );
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 1500);
    };

    const handleRetry = async () => {
        if (!chat || isRetrying) return;

        setIsRetrying(true);
        try {
            const token = await getToken();
            if (!token) {
                console.error('No auth token available');
                setIsRetrying(false);
                return;
            }

            // Create a new chat with the same message
            const response = await chatApi.createChat(token, chat.message);

            if (response.data?.id) {
                // Navigate to the new chat
                router.push(`/chats/${response.data.id}`);
            }
        } catch (err) {
            console.error('Failed to retry chat:', err);
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
            <div className="cr-root">
                <style>{styles}</style>
                <div className="cr-right">
                    <div className="main-bg" />
                    <header className="top-bar">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-64" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-8 w-28 rounded-full" />
                    </header>
                    <div className="messages-scroll">
                        <div className="messages-inner">
                            <Skeleton className="h-24 w-full rounded-2xl" />
                            <Skeleton className="h-48 w-full rounded-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !chat) {
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
                                className="px-4 py-2 rounded-lg font-medium transition-colors"
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

    // Build messages array from chat data
    type Message = {
        role: 'user' | 'assistant';
        content: string;
        time: string;
        isThinking?: boolean;
    };

    const messages: Message[] = [
        {
            role: 'user',
            content: chat.message,
            time: formatTimestamp(chat.createdAt),
        },
    ];

    // Show assistant message if we have a response or are thinking
    if (chat.response || isThinking) {
        messages.push({
            role: 'assistant',
            content: streamedResponse || chat.response || '',
            time: formatTimestamp(chat.updatedAt),
            isThinking: isThinking,
        });
    }

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
                            <div className="top-bar-title">
                                {chat.message.length > 60
                                    ? chat.message.slice(0, 60) + '...'
                                    : chat.message}
                            </div>
                            <div className="top-bar-meta">
                                {messages.length} message
                                {messages.length !== 1 ? 's' : ''} ·{' '}
                                {formatTimestamp(chat.createdAt)}
                            </div>
                        </div>
                        <div className="top-bar-badge">
                            {formatDateBadge(chat.createdAt)}
                        </div>
                    </header>

                    {/* Messages */}
                    <div className="messages-scroll" ref={scrollRef}>
                        <div className="messages-inner">
                            {messages.map((msg, i) =>
                                msg.role === 'user' ? (
                                    <div key={i} className="msg msg-user">
                                        <div>
                                            <div className="msg-user-bubble">
                                                {msg.content}
                                            </div>
                                            <div className="msg-user-footer">
                                                <div className="msg-user-time">
                                                    {msg.time}
                                                </div>
                                                <button
                                                    className="retry-btn"
                                                    onClick={handleRetry}
                                                    disabled={isRetrying}
                                                    title="Retry message"
                                                >
                                                    <RefreshCw
                                                        size={10}
                                                        className={
                                                            isRetrying
                                                                ? 'spinning'
                                                                : ''
                                                        }
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div key={i} className="msg msg-assistant">
                                        <div className="msg-asst-header">
                                            <div className="msg-asst-icon">
                                                <Bot size={13} />
                                            </div>
                                            <span className="msg-asst-label">
                                                Wavv
                                            </span>
                                            <span className="msg-asst-time">
                                                {msg.time}
                                            </span>
                                        </div>
                                        <div className="msg-asst-body">
                                            {msg.isThinking ? (
                                                <ThinkingAnimation />
                                            ) : (
                                                <RenderMarkdown
                                                    text={msg.content}
                                                />
                                            )}
                                        </div>
                                        {!msg.isThinking && (
                                            <div className="msg-actions">
                                                <button
                                                    className={`action-btn${copiedIdx === i ? ' copied' : ''}`}
                                                    onClick={() =>
                                                        handleCopy(
                                                            i,
                                                            msg.content,
                                                        )
                                                    }
                                                >
                                                    {copiedIdx === i ? (
                                                        <Check size={12} />
                                                    ) : (
                                                        <Copy size={12} />
                                                    )}
                                                    <span className="action-tooltip">
                                                        {copiedIdx === i
                                                            ? 'Copied'
                                                            : 'Copy'}
                                                    </span>
                                                </button>
                                                <button className="action-btn">
                                                    <Share2 size={12} />
                                                    <span className="action-tooltip">
                                                        Share
                                                    </span>
                                                </button>
                                                <button className="action-btn">
                                                    <Download size={12} />
                                                    <span className="action-tooltip">
                                                        Download
                                                    </span>
                                                </button>
                                                <div className="action-divider" />
                                                <button className="action-btn">
                                                    <ThumbsUp size={12} />
                                                    <span className="action-tooltip">
                                                        Good
                                                    </span>
                                                </button>
                                                <button className="action-btn">
                                                    <ThumbsDown size={12} />
                                                    <span className="action-tooltip">
                                                        Bad
                                                    </span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ),
                            )}
                        </div>
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

  .retry-btn .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
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
`;

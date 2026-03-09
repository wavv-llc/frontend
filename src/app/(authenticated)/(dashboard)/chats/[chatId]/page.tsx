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
    X,
    FileText,
    ExternalLink,
} from 'lucide-react';
import {
    chatApi,
    type ChatConversation,
    type ChatMessage,
    type ChunkDetail,
} from '@/lib/api';
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

// ─── Citation Helpers ────────────────────────────────────────
interface CitationEntry {
    number: number;
    chunk: ChunkDetail;
}

function buildCitationMap(
    text: string,
    sources: ChunkDetail[],
): Map<string, CitationEntry> {
    const map = new Map<string, CitationEntry>();
    const pattern = /\[ID:\s*([^\]]+)\]/g;
    let num = 1;
    let match;
    while ((match = pattern.exec(text)) !== null) {
        const id = match[1].trim();
        if (!map.has(id)) {
            const chunk = sources.find((s) => s.chunk_id === id);
            if (chunk) map.set(id, { number: num++, chunk });
        }
    }
    return map;
}

function getDocLabel(chunk: ChunkDetail): string {
    const parts: string[] = [];
    if (chunk.doc_type) parts.push(chunk.doc_type.replace(/_/g, ' '));
    if (chunk.tax_year) parts.push(String(chunk.tax_year));
    return parts.join(' · ') || 'Document';
}

// ─── Citation Hover Card ─────────────────────────────────────
function CitationHoverCard({
    chunk,
    anchorRect,
}: {
    chunk: ChunkDetail;
    anchorRect: DOMRect;
}) {
    const CARD_HEIGHT = 140;
    const CARD_WIDTH = 280;
    const MARGIN = 8;
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const placeAbove = spaceBelow < CARD_HEIGHT + MARGIN * 2;
    const top = placeAbove
        ? anchorRect.top - CARD_HEIGHT - MARGIN
        : anchorRect.bottom + MARGIN;
    const left = Math.min(
        anchorRect.left,
        window.innerWidth - CARD_WIDTH - MARGIN,
    );

    return (
        <div
            className="cite-hover-card"
            style={{ top, left, width: CARD_WIDTH }}
        >
            <div className="cite-hover-label">{getDocLabel(chunk)}</div>
            {chunk.section_header && (
                <div className="cite-hover-section">{chunk.section_header}</div>
            )}
            <div className="cite-hover-content">
                {chunk.content.length > 220
                    ? chunk.content.slice(0, 220) + '…'
                    : chunk.content}
            </div>
            {chunk.page_number !== null && (
                <div className="cite-hover-meta">Page {chunk.page_number}</div>
            )}
        </div>
    );
}

// ─── Citation Sidebar ────────────────────────────────────────
function CitationSidebar({
    chunk,
    onClose,
}: {
    chunk: ChunkDetail | null;
    onClose: () => void;
}) {
    return (
        <div className={`cite-sidebar${chunk ? ' cite-sidebar--open' : ''}`}>
            {chunk && (
                <>
                    <div className="cite-sidebar-header">
                        <div className="cite-sidebar-title">
                            <FileText size={13} />
                            <span>Source</span>
                        </div>
                        <button
                            className="cite-sidebar-close"
                            onClick={onClose}
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <div className="cite-sidebar-body">
                        <div className="cite-sidebar-doc-label">
                            {getDocLabel(chunk)}
                        </div>
                        {chunk.section_header && (
                            <div className="cite-sidebar-section">
                                {chunk.section_header}
                            </div>
                        )}
                        <div className="cite-sidebar-content">
                            {chunk.content}
                        </div>
                        <div className="cite-sidebar-meta-row">
                            {chunk.page_number !== null && (
                                <span className="cite-sidebar-meta-chip">
                                    Page {chunk.page_number}
                                </span>
                            )}
                            {chunk.doc_type && (
                                <span className="cite-sidebar-meta-chip">
                                    {chunk.doc_type.replace(/_/g, ' ')}
                                </span>
                            )}
                            {chunk.tax_year > 0 && (
                                <span className="cite-sidebar-meta-chip">
                                    {chunk.tax_year}
                                </span>
                            )}
                        </div>
                        {chunk.sharepoint_site_id && (
                            <a
                                className="cite-sidebar-sharepoint-link"
                                href={`https://sharepoint.com/sites/${chunk.sharepoint_site_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink size={11} />
                                View in SharePoint
                            </a>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Simple Markdown Renderer ───────────────────────────────
function RenderMarkdown({
    text,
    citationMap,
    onCitationHover,
    onCitationLeave,
    onCitationClick,
}: {
    text: string;
    citationMap?: Map<string, CitationEntry>;
    onCitationHover?: (chunk: ChunkDetail, rect: DOMRect) => void;
    onCitationLeave?: () => void;
    onCitationClick?: (chunk: ChunkDetail) => void;
}) {
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

    const parseInline = (str: string): React.ReactNode[] => {
        const parts: React.ReactNode[] = [];
        // Match **bold** or [ID: chunk_id]
        const regex = /\*\*(.+?)\*\*|\[ID:\s*([^\]]+)\]/g;
        let last = 0;
        let match;
        while ((match = regex.exec(str)) !== null) {
            if (match.index > last) parts.push(str.slice(last, match.index));
            if (match[1] !== undefined) {
                parts.push(<strong key={match.index}>{match[1]}</strong>);
            } else if (match[2] !== undefined && citationMap) {
                const id = match[2].trim();
                const entry = citationMap.get(id);
                if (entry) {
                    parts.push(
                        <button
                            key={match.index}
                            className="cite-badge"
                            onMouseEnter={(e) => {
                                const rect =
                                    e.currentTarget.getBoundingClientRect();
                                onCitationHover?.(entry.chunk, rect);
                            }}
                            onMouseLeave={onCitationLeave}
                            onClick={() => onCitationClick?.(entry.chunk)}
                        >
                            {entry.number}
                        </button>,
                    );
                }
                // If the citation ID isn't in our map, omit the raw marker
            }
            last = regex.lastIndex;
        }
        if (last < str.length) parts.push(str.slice(last));
        return parts;
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
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
        }
    }, [followUpMessage]);

    // Citation state
    const [hoverCitation, setHoverCitation] = useState<{
        chunk: ChunkDetail;
        rect: DOMRect;
    } | null>(null);
    const [sidebarChunk, setSidebarChunk] = useState<ChunkDetail | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleCitationHover = (chunk: ChunkDetail, rect: DOMRect) => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setHoverCitation({ chunk, rect });
    };

    const handleCitationLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setHoverCitation(null);
        }, 120);
    };

    const handleCitationClick = (chunk: ChunkDetail) => {
        setHoverCitation(null);
        setSidebarChunk(chunk);
    };

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
                <div
                    className="cr-right"
                    style={{
                        flex: sidebarChunk ? '1 1 0%' : '1 1 100%',
                        minWidth: 0,
                        transition: `flex 320ms cubic-bezier(0.23,1,0.32,1)`,
                    }}
                >
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
                                const sources = conversation.sources ?? [];
                                const citationMap =
                                    responseContent && sources.length > 0
                                        ? buildCitationMap(
                                              responseContent,
                                              sources,
                                          )
                                        : undefined;
                                const citedChunks = citationMap
                                    ? Array.from(citationMap.values()).sort(
                                          (a, b) => a.number - b.number,
                                      )
                                    : [];

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
                                                            citationMap={
                                                                citationMap
                                                            }
                                                            onCitationHover={
                                                                handleCitationHover
                                                            }
                                                            onCitationLeave={
                                                                handleCitationLeave
                                                            }
                                                            onCitationClick={
                                                                handleCitationClick
                                                            }
                                                        />
                                                    )}
                                                </div>
                                                {!isPending &&
                                                    citedChunks.length > 0 && (
                                                        <div className="msg-sources">
                                                            <span className="msg-sources-label">
                                                                Sources
                                                            </span>
                                                            {citedChunks.map(
                                                                (entry) => (
                                                                    <button
                                                                        key={
                                                                            entry
                                                                                .chunk
                                                                                .chunk_id
                                                                        }
                                                                        className="msg-source-chip"
                                                                        onClick={() =>
                                                                            handleCitationClick(
                                                                                entry.chunk,
                                                                            )
                                                                        }
                                                                    >
                                                                        <span className="msg-source-chip-num">
                                                                            {
                                                                                entry.number
                                                                            }
                                                                        </span>
                                                                        {entry
                                                                            .chunk
                                                                            .section_header ??
                                                                            getDocLabel(
                                                                                entry.chunk,
                                                                            )}
                                                                    </button>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
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

                    {/* Citation hover card — rendered via fixed positioning */}
                    {hoverCitation && (
                        <CitationHoverCard
                            chunk={hoverCitation.chunk}
                            anchorRect={hoverCitation.rect}
                        />
                    )}

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
                <CitationSidebar
                    chunk={sidebarChunk}
                    onClose={() => setSidebarChunk(null)}
                />
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
    align-items: flex-end;
    gap: 8px;
    background: white;
    border: 1px solid ${colors.steelAlt[200]};
    border-radius: 12px;
    padding: 8px 10px 8px 10px;
    box-shadow: 0 2px 12px rgba(14, 17, 23, 0.06);
    transition: border-color 200ms ${ease}, box-shadow 200ms ${ease};
  }

  .follow-up-form:focus-within {
    border-color: ${colors.accent.primary};
    box-shadow: 0 2px 16px rgba(14, 17, 23, 0.1);
  }

  .follow-up-input {
    flex: 1;
    min-height: 36px;
    max-height: 256px;
    resize: none;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'DM Sans', -apple-system, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    color: ${colors.steelAlt[800]};
    scrollbar-width: thin;
    overflow-y: auto;
    padding: 6px 4px;
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
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: ${colors.accent.primary};
    color: white;
    cursor: pointer;
    transition: all 200ms ${ease};
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(90, 127, 154, 0.35);
  }

  .follow-up-send:hover:not(:disabled) {
    background: ${colors.accent.light};
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(90, 127, 154, 0.4);
  }

  .follow-up-send:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .follow-up-globe {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
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
    background: ${colors.accent.primary};
    color: white;
  }

  /* ── CITATION BADGE ── */
  .cite-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 4px;
    background: ${colors.steelAlt[100]};
    border: 1px solid ${colors.steelAlt[200]};
    color: ${colors.steelAlt[600]};
    font-size: 9px;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    vertical-align: super;
    margin: 0 1px;
    transition: background 150ms ${ease}, color 150ms ${ease};
    font-family: 'DM Sans', -apple-system, sans-serif;
  }

  .cite-badge:hover {
    background: ${colors.steelAlt[800]};
    color: ${colors.steelAlt[100]};
    border-color: ${colors.steelAlt[800]};
  }

  /* ── CITATION HOVER CARD ── */
  .cite-hover-card {
    position: fixed;
    z-index: 9999;
    background: white;
    border: 1px solid ${colors.steelAlt[200]};
    border-radius: 10px;
    padding: 12px 14px;
    box-shadow: 0 8px 24px rgba(14,17,23,0.12), 0 2px 6px rgba(14,17,23,0.07);
    pointer-events: none;
    animation: citeCardIn 160ms ${ease} forwards;
  }

  @keyframes citeCardIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .cite-hover-label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${colors.steelAlt[400]};
    margin-bottom: 4px;
  }

  .cite-hover-section {
    font-size: 11px;
    font-weight: 600;
    color: ${colors.steelAlt[800]};
    margin-bottom: 6px;
    line-height: 1.3;
  }

  .cite-hover-content {
    font-size: 10px;
    line-height: 1.6;
    color: ${colors.steelAlt[600]};
    margin-bottom: 6px;
  }

  .cite-hover-meta {
    font-size: 9px;
    color: ${colors.steelAlt[400]};
    font-weight: 500;
  }

  /* ── SOURCES ROW ── */
  .msg-sources {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid ${colors.steelAlt[100]};
  }

  .msg-sources-label {
    font-size: 9px;
    font-weight: 600;
    color: ${colors.steelAlt[400]};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-right: 2px;
  }

  .msg-source-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px 3px 5px;
    border-radius: 100px;
    background: ${colors.steelAlt[50]};
    border: 1px solid ${colors.steelAlt[200]};
    font-size: 10px;
    font-weight: 500;
    color: ${colors.steelAlt[600]};
    cursor: pointer;
    transition: all 150ms ${ease};
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: 'DM Sans', -apple-system, sans-serif;
  }

  .msg-source-chip:hover {
    background: ${colors.steelAlt[100]};
    color: ${colors.steelAlt[800]};
    border-color: ${colors.steelAlt[300]};
  }

  .msg-source-chip-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 15px;
    height: 15px;
    padding: 0 3px;
    border-radius: 3px;
    background: ${colors.steelAlt[200]};
    color: ${colors.steelAlt[700]};
    font-size: 8px;
    font-weight: 700;
    flex-shrink: 0;
  }

  /* ── CITATION SIDEBAR ── */
  .cite-sidebar {
    width: 0;
    overflow: hidden;
    flex-shrink: 0;
    background: white;
    border-left: 1px solid ${colors.steelAlt[200]};
    display: flex;
    flex-direction: column;
    transition: width 320ms cubic-bezier(0.23,1,0.32,1);
  }

  .cite-sidebar--open {
    width: 300px;
  }

  .cite-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid ${colors.steelAlt[100]};
    flex-shrink: 0;
  }

  .cite-sidebar-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    color: ${colors.steelAlt[700]};
  }

  .cite-sidebar-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: ${colors.steelAlt[400]};
    cursor: pointer;
    transition: all 150ms ${ease};
  }

  .cite-sidebar-close:hover {
    background: ${colors.steelAlt[100]};
    color: ${colors.steelAlt[700]};
  }

  .cite-sidebar-body {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 300px;
  }

  .cite-sidebar-body::-webkit-scrollbar {
    width: 4px;
  }

  .cite-sidebar-body::-webkit-scrollbar-thumb {
    background: ${colors.steelAlt[200]};
    border-radius: 4px;
  }

  .cite-sidebar-doc-label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: ${colors.steelAlt[400]};
  }

  .cite-sidebar-section {
    font-size: 13px;
    font-weight: 600;
    color: ${colors.steelAlt[800]};
    line-height: 1.35;
  }

  .cite-sidebar-content {
    font-size: 11px;
    line-height: 1.75;
    color: ${colors.steelAlt[600]};
    white-space: pre-wrap;
    background: ${colors.steelAlt[50]};
    border-radius: 8px;
    padding: 12px 13px;
    border: 1px solid ${colors.steelAlt[100]};
  }

  .cite-sidebar-meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .cite-sidebar-meta-chip {
    padding: 2px 8px;
    border-radius: 100px;
    background: ${colors.steelAlt[100]};
    border: 1px solid ${colors.steelAlt[200]};
    font-size: 9px;
    font-weight: 600;
    color: ${colors.steelAlt[500]};
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .cite-sidebar-sharepoint-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 600;
    color: ${colors.steelAlt[500]};
    text-decoration: none;
    padding: 5px 0;
    transition: color 150ms ${ease};
  }

  .cite-sidebar-sharepoint-link:hover {
    color: ${colors.steelAlt[800]};
  }
`;

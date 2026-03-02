'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { chatApi, type Chat, type ChatConversation } from '@/lib/api';
import { toast } from 'sonner';

interface UseChatPollingOptions {
    chatId: string;
    messageId: string;
    initialChat: Chat;
    onResponseReady?: (chat: Chat) => void;
    pollingInterval?: number;
    maxAttempts?: number;
}

interface UseChatPollingReturn {
    chat: Chat;
    isPolling: boolean;
    error: string | null;
}

export function useChatPolling({
    chatId,
    messageId,
    initialChat,
    onResponseReady,
    pollingInterval = 1500,
    maxAttempts = 60,
}: UseChatPollingOptions): UseChatPollingReturn {
    const { getToken } = useAuth();
    const [chat, setChat] = useState<Chat>(initialChat);
    const [isPolling, setIsPolling] = useState(initialChat.response === null);
    const [error, setError] = useState<string | null>(null);
    const cancelPollingRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (initialChat.response !== null) {
            setIsPolling(false);
            return;
        }

        let mounted = true;

        const startPolling = async () => {
            try {
                const token = await getToken();
                if (!token) {
                    setError('Authentication required');
                    setIsPolling(false);
                    return;
                }

                if (!mounted) return;

                const cancel = await chatApi.pollChatStatus(
                    token,
                    chatId,
                    messageId,
                    (updatedConv: ChatConversation) => {
                        if (!mounted) return;

                        const lastMsg =
                            updatedConv.messages?.[
                                updatedConv.messages.length - 1
                            ];
                        const normalizedChat: Chat = {
                            id: updatedConv.id,
                            title: updatedConv.title ?? null,
                            message: updatedConv.messages?.[0]?.message ?? '',
                            response: lastMsg?.response ?? null,
                            createdAt: updatedConv.createdAt,
                            updatedAt: updatedConv.updatedAt,
                        };

                        setChat(normalizedChat);
                        setIsPolling(false);

                        if (onResponseReady) {
                            onResponseReady(normalizedChat);
                        }
                    },
                    {
                        interval: pollingInterval,
                        maxAttempts,
                        onError: (err: Error) => {
                            if (!mounted) return;

                            setError(err.message);
                            setIsPolling(false);
                            toast.error(
                                'Failed to load response. Please refresh the page.',
                            );
                        },
                    },
                );

                cancelPollingRef.current = cancel;
            } catch (err) {
                if (!mounted) return;

                const errorMessage =
                    err instanceof Error ? err.message : 'Unknown error';
                setError(errorMessage);
                setIsPolling(false);
            }
        };

        startPolling();

        return () => {
            mounted = false;
            if (cancelPollingRef.current) {
                cancelPollingRef.current();
            }
        };
    }, [
        chatId,
        initialChat,
        getToken,
        onResponseReady,
        pollingInterval,
        maxAttempts,
    ]);

    return {
        chat,
        isPolling,
        error,
    };
}

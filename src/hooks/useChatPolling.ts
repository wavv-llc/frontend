'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { chatApi, type Chat } from '@/lib/api';
import { toast } from 'sonner';

interface UseChatPollingOptions {
    chatId: string;
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
                    (updatedChat) => {
                        if (!mounted) return;

                        setChat(updatedChat);
                        setIsPolling(false);

                        if (onResponseReady) {
                            onResponseReady(updatedChat);
                        }
                    },
                    {
                        interval: pollingInterval,
                        maxAttempts,
                        onError: (err) => {
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

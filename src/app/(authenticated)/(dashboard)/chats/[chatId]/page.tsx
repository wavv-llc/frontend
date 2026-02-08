'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { MessageSquare, ArrowLeft } from 'lucide-react'
import { chatApi, type Chat } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChatMessageCard } from '@/components/chat/ChatMessageCard'
import { ChatResponseCard } from '@/components/chat/ChatResponseCard'

export default function ChatDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { getToken } = useAuth()
    const chatId = params.chatId as string

    const [chat, setChat] = useState<Chat | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchChat = async () => {
            try {
                const token = await getToken()
                if (!token) {
                    setError('Authentication required')
                    return
                }

                const response = await chatApi.getChat(token, chatId)
                if (response.data) {
                    setChat(response.data)
                } else {
                    setError('Chat not found')
                }
            } catch (err) {
                console.error('Failed to fetch chat:', err)
                setError('Failed to load chat')
            } finally {
                setLoading(false)
            }
        }

        fetchChat()
    }, [getToken, chatId])

    if (loading) {
        return (
            <div className="relative h-full w-full bg-background overflow-y-auto">
                <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
                    {/* Header Skeleton */}
                    <div className="flex items-center gap-3 pb-6 border-b border-border/30">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                    {/* Message Skeletons */}
                    <div className="space-y-6">
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-48 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        )
    }

    if (error || !chat) {
        return (
            <div className="relative h-full w-full bg-background overflow-y-auto">
                <div className="max-w-3xl mx-auto p-4 md:p-8">
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-destructive/5 border border-destructive/10">
                            <MessageSquare className="h-12 w-12 md:h-16 md:w-16 text-destructive/40" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-lg font-semibold text-foreground">
                                {error || 'Chat not found'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                This conversation doesn't exist or you don't have access to it
                            </p>
                        </div>
                        <Button
                            onClick={() => router.push('/chats/new')}
                            className="gap-2 shadow-sm"
                        >
                            <MessageSquare className="h-4 w-4" />
                            Start New Chat
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // Format timestamp
    const formatTimestamp = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) return 'Just now'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`

        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="relative h-full w-full bg-background overflow-y-auto">
            <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-6 border-b border-border/30">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push('/home')}
                            className="h-10 w-10 hover:bg-muted"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="p-2 rounded-xl bg-primary/5 border border-primary/10">
                            <MessageSquare className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-serif font-bold tracking-tight text-foreground">
                                Chat
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                {formatTimestamp(chat.createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* Created Date Card */}
                    <div className="hidden md:flex px-4 py-2 rounded-xl border border-border bg-card shadow-sm flex-col items-start min-w-[140px]">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-0.5">
                            Created
                        </span>
                        <span className="text-sm font-medium text-foreground">
                            {new Date(chat.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </span>
                    </div>
                </div>

                {/* Messages */}
                <div className="space-y-6">
                    {/* User Message */}
                    <ChatMessageCard
                        message={chat.message}
                        timestamp={formatTimestamp(chat.createdAt)}
                        userName="You"
                    />

                    {/* AI Response */}
                    <ChatResponseCard
                        response={chat.response}
                        timestamp={formatTimestamp(chat.createdAt)}
                    />
                </div>

                {/* New Chat Button */}
                <div className="flex justify-center pt-6">
                    <Button
                        onClick={() => router.push('/chats/new')}
                        className="gap-2 shadow-sm"
                    >
                        <MessageSquare className="h-4 w-4" />
                        Start New Chat
                    </Button>
                </div>
            </div>
        </div>
    )
}

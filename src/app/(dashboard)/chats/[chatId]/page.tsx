'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { MessageSquare, User, Bot, ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { chatApi, type Chat } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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
                <div className="max-w-3xl mx-auto p-6 md:p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-border/40">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                    <div className="space-y-4">
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
                <div className="max-w-3xl mx-auto p-6 md:p-8">
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg font-medium">{error || 'Chat not found'}</p>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/chats/new')}
                            className="mt-4 gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Start New Chat
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="relative h-full w-full bg-background overflow-y-auto">
            <div className="max-w-3xl mx-auto p-6 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-border/40">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/home')}
                        className="h-10 w-10"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="p-2 rounded-lg bg-primary/10">
                        <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            Chat
                        </h1>
                        <p className="text-muted-foreground text-xs">
                            {new Date(chat.createdAt).toLocaleDateString(undefined, {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>

                {/* Messages */}
                <div className="space-y-4">
                    {/* User Message */}
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-full bg-primary/10 shrink-0">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-primary mb-1">You</p>
                                    <p className="text-sm text-foreground whitespace-pre-wrap">
                                        {chat.message}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Response */}
                    <Card className="bg-background/60 backdrop-blur-xl border-border/50">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-full bg-muted shrink-0">
                                    <Bot className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Assistant</p>
                                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-ul:text-foreground prose-ol:text-foreground prose-li:marker:text-muted-foreground prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-hr:border-border prose-table:text-sm prose-th:text-foreground prose-td:text-foreground prose-img:rounded-lg">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {chat.response}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* New Chat Button */}
                <div className="flex justify-center pt-4">
                    <Button
                        onClick={() => router.push('/chats/new')}
                        className="gap-2"
                    >
                        <MessageSquare className="h-4 w-4" />
                        Start New Chat
                    </Button>
                </div>
            </div>
        </div>
    )
}

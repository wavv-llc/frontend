'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import { chatApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function NewChatPage() {
    const router = useRouter()
    const { getToken } = useAuth()
    const [message, setMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim() || isSubmitting) return

        try {
            setIsSubmitting(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            const response = await chatApi.createChat(token, message.trim())
            if (response.data) {
                router.push(`/chats/${response.data.id}`)
            }
        } catch (error) {
            console.error('Failed to create chat:', error)
            toast.error('Failed to send message')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="relative h-full w-full bg-background overflow-y-auto">
            <div className="max-w-3xl mx-auto p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border/40">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            New Chat
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Start a conversation
                        </p>
                    </div>
                </div>

                <Card className="bg-background/60 backdrop-blur-xl border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Your Message</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message here..."
                                className="min-h-[150px] resize-none"
                                disabled={isSubmitting}
                            />
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={!message.trim() || isSubmitting}
                                    className="gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            Send Message
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

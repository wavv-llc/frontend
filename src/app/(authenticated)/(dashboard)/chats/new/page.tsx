'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { MessageSquare } from 'lucide-react'
import { chatApi } from '@/lib/api'
import { ChatCommandBar } from '@/components/chat/ChatCommandBar'
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
        <div className="relative h-full w-full bg-background overflow-hidden flex flex-col">
            {/* Empty State - Centered */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                <div className="max-w-xl text-center space-y-6">
                    <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/5 border border-primary/10">
                        <MessageSquare className="h-12 w-12 md:h-16 md:w-16 text-primary/40" />
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                            Start a new conversation
                        </h1>
                        <p className="text-sm md:text-base text-muted-foreground">
                            Ask me anything and I'll help you find the answers you need
                        </p>
                    </div>
                </div>
            </div>

            {/* Command Bar - Bottom */}
            <div className="w-full pb-6 px-4">
                <div className="max-w-2xl mx-auto">
                    <ChatCommandBar
                        message={message}
                        onChange={setMessage}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                    />
                </div>
            </div>
        </div>
    )
}

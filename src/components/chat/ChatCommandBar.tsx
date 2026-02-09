'use client'

import { useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatCommandBarProps {
    message: string
    onChange: (value: string) => void
    onSubmit: (e: React.FormEvent) => void
    isSubmitting: boolean
    placeholder?: string
}

export function ChatCommandBar({
    message,
    onChange,
    onSubmit,
    isSubmitting,
    placeholder = 'Ask me anything...'
}: ChatCommandBarProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [message])

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSubmit(e)
        }
    }

    return (
        <form onSubmit={onSubmit} className="relative">
            <div className="relative bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl md:rounded-3xl shadow-2xl shadow-black/5 hover:shadow-black/10 transition-all focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-border">
                <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="min-h-[56px] max-h-[200px] resize-none border-0 bg-transparent px-4 md:px-6 py-4 pr-14 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base placeholder:text-muted-foreground/60 scrollbar-thin"
                    disabled={isSubmitting}
                    rows={1}
                />
                <div className="absolute right-3 bottom-3">
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!message.trim() || isSubmitting}
                        className="h-10 w-10 rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-40"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </div>
            <p className="text-xs text-muted-foreground/60 text-center mt-3">
                Press <span className="font-medium">Enter</span> to send • <span className="font-medium">Shift+Enter</span> for new line
            </p>
        </form>
    )
}

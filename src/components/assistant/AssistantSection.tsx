'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'
import { Send, Paperclip, Globe, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AssistantSection() {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    // Handle submission (placeholder)
    console.log('Submitted:', input)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-background relative">
      {/* Top Bar / Model Selector */}
      <header className="sticky top-0 z-10 flex items-center justify-between p-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
          <span className="text-lg font-semibold text-foreground/80">Wavv Assistant</span>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Pro</span>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] px-4">
          <div className="mb-8">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <div className="h-6 w-6 rounded-full bg-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-center mt-2">How can I help you today?</h2>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="w-full max-w-3xl mx-auto px-4 pb-6">
        <div className="relative flex flex-col bg-muted/50 border border-input rounded-3xl focus-within:ring-1 focus-within:ring-ring/20 transition-all overflow-hidden">

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message Wavv..."
            className="w-full bg-transparent border-0 focus:ring-0 resize-none py-4 px-12 min-h-[56px] max-h-[200px] text-base scrollbar-hide"
            rows={1}
          />

          {/* Left Actions */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:bg-background hover:text-foreground">
              <Paperclip className="h-5 w-5" />
            </Button>
          </div>

          {/* Right Actions */}
          <div className="absolute bottom-3 right-3">
            <Button
              onClick={handleSubmit}
              disabled={!input.trim()}
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full transition-all duration-200",
                input.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-center mt-2">
          <p className="text-xs text-muted-foreground">
            Wavv can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  )
}

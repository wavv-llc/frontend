'use client'

import { useState, FormEvent } from 'react'
import { Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function AssistantSection() {
  const [input, setInput] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        <div className="relative">
          <svg
            width="120"
            height="140"
            viewBox="0 0 120 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="animate-bounce-slow"
          >
            <ellipse cx="60" cy="90" rx="35" ry="40" fill="#3B82F6" />
            <ellipse cx="60" cy="50" rx="30" ry="35" fill="#3B82F6" />
            <ellipse cx="45" cy="20" rx="8" ry="25" fill="#3B82F6" />
            <ellipse cx="45" cy="25" rx="5" ry="20" fill="#60A5FA" />
            <ellipse cx="75" cy="20" rx="8" ry="25" fill="#3B82F6" />
            <ellipse cx="75" cy="25" rx="5" ry="20" fill="#60A5FA" />
            <circle cx="52" cy="50" r="4" fill="#1F2937" />
            <circle cx="68" cy="50" r="4" fill="#1F2937" />
            <ellipse cx="60" cy="58" rx="3" ry="2" fill="#EF4444" />
            <path
              d="M 60 62 Q 55 65 60 68 Q 65 65 60 62"
              stroke="#1F2937"
              strokeWidth="1.5"
              fill="none"
            />
            <rect x="58" y="62" width="4" height="6" fill="white" rx="1" />
            <ellipse
              cx="85"
              cy="75"
              rx="12"
              ry="15"
              fill="#3B82F6"
              transform="rotate(-20 85 75)"
            />
          </svg>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">How can I help you today?</h2>
          <p className="text-sm text-muted-foreground">
            Ask for any internal documents
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-full"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

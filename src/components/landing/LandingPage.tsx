'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      
      <section className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight">
            AI-Powered Workspace for Tax Professionals
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your single workspace to manage tax returns, respond to notices, and
            access knowledge with an integrated AI assistant.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/sign-up">
              <Button size="lg" className="text-lg px-8">
                Get Started Free
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
          </div>
        </div>
      </section>

    </div>
  )
}


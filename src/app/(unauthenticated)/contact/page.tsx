'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { signupRequestApi } from '@/lib/api'

const NAV_ITEMS = [
  { name: 'Product', href: '/#product' },
  { name: 'Solutions', href: '/#solutions' },
]

export default function ContactPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    firmName: '',
    firmSize: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await signupRequestApi.createRequest({
        name: formData.name,
        email: formData.email,
        organization: formData.firmName,
        message: formData.message || undefined,
      })

      setSubmitted(true)

      setTimeout(() => {
        setSubmitted(false)
        setFormData({ name: '', email: '', firmName: '', firmSize: '', message: '' })
      }, 3000)
    } catch (err) {
      console.error('Error submitting request:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 font-sans overflow-x-hidden">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/30 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-muted/20 rounded-full blur-[100px] animate-pulse-slow delay-700" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-serif italic text-lg pr-0.5">w</span>
            </div>
            wavv
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>

          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-6 py-4 space-y-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-border space-y-4">
              <Link href="/sign-in" className="block text-sm font-medium text-muted-foreground">Login</Link>

            </div>
          </div>
        )}
      </nav>

      {/* Contact Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 min-h-screen flex items-center z-10">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to home
                </Link>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-foreground"
              >
                Let's talk about <br />
                <span className="text-muted-foreground">your firm.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="text-lg text-muted-foreground max-w-md leading-relaxed"
              >
                Ready to transform how your team works? Fill out the form and we'll be in touch within 24 hours to schedule a personalized demo.
              </motion.p>
            </div>

            {/* Right Column - Form */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            >
              <div className="relative">
                {/* Glow effect behind card */}
                <div className="absolute inset-0 bg-primary/10 blur-[60px] rounded-full" />

                <div className="relative bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-8 md:p-10 shadow-xl">
                  {submitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-12 text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                        <Send className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">Thank you!</h3>
                      <p className="text-muted-foreground">
                        We'll be in touch soon.
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {error && (
                        <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
                          {error}
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium text-foreground">Name</Label>
                          <Input
                            id="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Your full name"
                            className="h-12 px-4 bg-background/50 border-border focus:border-primary focus:ring-primary rounded-xl"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="you@company.com"
                            className="h-12 px-4 bg-background/50 border-border focus:border-primary focus:ring-primary rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firmName" className="text-sm font-medium text-foreground">Firm name</Label>
                          <Input
                            id="firmName"
                            type="text"
                            required
                            value={formData.firmName}
                            onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                            placeholder="Your firm name"
                            className="h-12 px-4 bg-background/50 border-border focus:border-primary focus:ring-primary rounded-xl"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="firmSize" className="text-sm font-medium text-foreground">Firm size</Label>
                          <Input
                            id="firmSize"
                            type="text"
                            value={formData.firmSize}
                            onChange={(e) => setFormData({ ...formData, firmSize: e.target.value })}
                            placeholder="e.g., 10-50 professionals"
                            className="h-12 px-4 bg-background/50 border-border focus:border-primary focus:ring-primary rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-sm font-medium text-foreground">Message</Label>
                        <Textarea
                          id="message"
                          rows={4}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Tell us about your needs..."
                          className="px-4 py-3 bg-background/50 border-border focus:border-primary focus:ring-primary rounded-xl resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full h-12 text-base rounded-full shadow-lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Submitting...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Submit request
                            <Send className="w-4 h-4" />
                          </span>
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-background text-muted-foreground text-sm relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-serif italic text-xs">w</span>
            </div>
            <span className="font-bold text-foreground">wavv</span>
          </div>
          <div className="flex gap-8">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Security</Link>
          </div>
          <div>© 2026 Wavv AI LLC.</div>
        </div>
      </footer>
    </div>
  )
}

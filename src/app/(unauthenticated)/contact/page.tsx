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
import { RetroWaterAnimation } from '@/components/landing/RetroWaterAnimation'

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
    <div
      className="min-h-screen text-[var(--mahogany-800)] overflow-x-hidden"
      style={{ backgroundColor: 'var(--ivory-100)' }}
    >
      {/* Retro Water Animation Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <RetroWaterAnimation intensity="medium" />
      </div>

      {/* Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-[var(--mahogany-300)]/30 backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(250, 247, 240, 0.95)' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between relative">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group z-10">
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ backgroundColor: 'var(--mahogany-600)' }}
            >
              <span className="text-[var(--ivory-100)] font-serif italic text-lg font-semibold">w</span>
            </div>
            <span className="text-xl font-serif font-bold tracking-tight text-[var(--mahogany-700)]">
              wavv
            </span>
          </Link>

          {/* Desktop Nav - Absolutely centered */}
          <div className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-[var(--mahogany-500)] hover:text-[var(--mahogany-800)] transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4 z-10">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-[var(--mahogany-500)] hover:text-[var(--mahogany-800)] transition-colors"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-[var(--mahogany-600)]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-[var(--mahogany-300)]/30 px-6 py-4 space-y-4"
            style={{ backgroundColor: 'var(--ivory-100)' }}
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block text-sm font-medium text-[var(--mahogany-600)] hover:text-[var(--mahogany-800)]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-[var(--mahogany-300)]/30 space-y-3">
              <Link href="/sign-in" className="block text-sm font-medium text-[var(--mahogany-600)]">
                Login
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Contact Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 min-h-screen flex items-center z-10">
        <div className="max-w-6xl mx-auto px-6 w-full">
          {/* Semi-transparent backdrop for content */}
          <div className="bg-[var(--ivory-100)]/70 backdrop-blur-sm rounded-2xl p-8 md:p-12">
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
                    className="inline-flex items-center gap-2 text-sm font-medium text-[var(--mahogany-500)] hover:text-[var(--mahogany-800)] transition-colors mb-8"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to home
                  </Link>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight mb-6"
                  style={{ color: 'var(--mahogany-800)' }}
                >
                  Let's talk about <br />
                  <span style={{ color: 'var(--lake-blue-400)' }}>your firm.</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="text-lg max-w-md leading-relaxed"
                  style={{ color: 'var(--mahogany-500)' }}
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
                  <div
                    className="absolute inset-0 blur-[60px] rounded-full opacity-20"
                    style={{ backgroundColor: 'var(--lake-blue-300)' }}
                  />

                  <div
                    className="relative rounded-2xl p-8 md:p-10 shadow-2xl border-2"
                    style={{
                      backgroundColor: 'var(--ivory-50)',
                      borderColor: 'var(--mahogany-400)',
                    }}
                  >
                    {submitted ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-12 text-center"
                      >
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                          style={{ backgroundColor: 'var(--excel-green-400)/20' }}
                        >
                          <Send className="w-8 h-8 text-[var(--excel-green-400)]" />
                        </div>
                        <h3 className="text-2xl font-serif font-bold mb-2" style={{ color: 'var(--mahogany-800)' }}>
                          Thank you!
                        </h3>
                        <p style={{ color: 'var(--mahogany-500)' }}>
                          We'll be in touch soon.
                        </p>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                          <div
                            className="p-3 rounded-xl text-sm border"
                            style={{
                              backgroundColor: 'var(--mahogany-100)',
                              color: 'var(--mahogany-700)',
                              borderColor: 'var(--mahogany-300)',
                            }}
                          >
                            {error}
                          </div>
                        )}

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium" style={{ color: 'var(--mahogany-700)' }}>
                              Name
                            </Label>
                            <Input
                              id="name"
                              type="text"
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Your full name"
                              className="h-12 px-4 rounded-md border transition-colors"
                              style={{
                                backgroundColor: 'var(--ivory-100)',
                                borderColor: 'var(--mahogany-300)',
                                color: 'var(--mahogany-800)',
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--mahogany-700)' }}>
                              Email
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="you@company.com"
                              className="h-12 px-4 rounded-md border transition-colors"
                              style={{
                                backgroundColor: 'var(--ivory-100)',
                                borderColor: 'var(--mahogany-300)',
                                color: 'var(--mahogany-800)',
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firmName" className="text-sm font-medium" style={{ color: 'var(--mahogany-700)' }}>
                              Firm name
                            </Label>
                            <Input
                              id="firmName"
                              type="text"
                              required
                              value={formData.firmName}
                              onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                              placeholder="Your firm name"
                              className="h-12 px-4 rounded-md border transition-colors"
                              style={{
                                backgroundColor: 'var(--ivory-100)',
                                borderColor: 'var(--mahogany-300)',
                                color: 'var(--mahogany-800)',
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="firmSize" className="text-sm font-medium" style={{ color: 'var(--mahogany-700)' }}>
                              Firm size
                            </Label>
                            <Input
                              id="firmSize"
                              type="text"
                              value={formData.firmSize}
                              onChange={(e) => setFormData({ ...formData, firmSize: e.target.value })}
                              placeholder="e.g., 10-50 professionals"
                              className="h-12 px-4 rounded-md border transition-colors"
                              style={{
                                backgroundColor: 'var(--ivory-100)',
                                borderColor: 'var(--mahogany-300)',
                                color: 'var(--mahogany-800)',
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message" className="text-sm font-medium" style={{ color: 'var(--mahogany-700)' }}>
                            Message
                          </Label>
                          <Textarea
                            id="message"
                            rows={4}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Tell us about your needs..."
                            className="px-4 py-3 rounded-md border resize-none transition-colors"
                            style={{
                              backgroundColor: 'var(--ivory-100)',
                              borderColor: 'var(--mahogany-300)',
                              color: 'var(--mahogany-800)',
                            }}
                          />
                        </div>

                        <Button
                          type="submit"
                          size="lg"
                          className="w-full h-14 text-base font-serif font-medium rounded-md shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                          style={{
                            backgroundColor: 'var(--mahogany-600)',
                            color: 'var(--ivory-100)',
                          }}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-[var(--ivory-100)]/30 border-t-[var(--ivory-100)] rounded-full animate-spin" />
                              Submitting...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              Submit Request
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
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-12 border-t relative z-10"
        style={{
          backgroundColor: 'var(--ivory-200)',
          borderColor: 'var(--mahogany-300)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded flex items-center justify-center"
                style={{ backgroundColor: 'var(--mahogany-600)' }}
              >
                <span className="text-[var(--ivory-100)] font-serif italic text-sm">w</span>
              </div>
              <span className="font-serif font-bold text-[var(--mahogany-700)]">wavv</span>
            </div>

            {/* Links */}
            <div className="flex gap-8">
              <Link
                href="/privacy"
                className="text-sm hover:underline"
                style={{ color: 'var(--mahogany-500)' }}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm hover:underline"
                style={{ color: 'var(--mahogany-500)' }}
              >
                Terms of Service
              </Link>
            </div>

            {/* Copyright */}
            <div className="text-sm" style={{ color: 'var(--mahogany-400)' }}>
              © 2026 Wavv AI LLC.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

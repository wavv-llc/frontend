'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, Eye, Lock, Server, UserCheck, Bell, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const sections = [
  {
    icon: <Eye className="w-5 h-5" />,
    title: 'Information We Collect',
    content: `We collect information you provide directly to us, including your name, email address, company name, and any other information you choose to provide. When you use our services, we automatically collect certain information about your device, including your IP address, browser type, operating system, and usage patterns.`
  },
  {
    icon: <Server className="w-5 h-5" />,
    title: 'How We Use Your Information',
    content: `We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions. We may also use the information to send you marketing communications, in accordance with your preferences.`
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Data Security',
    content: `We implement appropriate technical and organizational security measures designed to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All data is encrypted in transit and at rest using industry-standard encryption protocols.`
  },
  {
    icon: <UserCheck className="w-5 h-5" />,
    title: 'Data Sharing',
    content: `We do not sell your personal information. We may share your information with third-party service providers who perform services on our behalf, such as hosting, analytics, and customer service. These providers are bound by contractual obligations to keep your information confidential.`
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: 'Your Rights',
    content: `You have the right to access, correct, or delete your personal information at any time. You may also opt out of receiving marketing communications from us. To exercise these rights, please contact us at privacy@wavv.ai.`
  },
  {
    icon: <Bell className="w-5 h-5" />,
    title: 'Updates to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically.`
  },
]

// Navigation Component (same as Landing Page)
function Navigation({ isMobileMenuOpen, setIsMobileMenuOpen }: {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}) {
  const [hasScrolled, setHasScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setHasScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${hasScrolled
        ? 'border-b border-[var(--mono-border-gray)] backdrop-blur-md shadow-sm'
        : 'backdrop-blur-sm'
        }`}
      style={{
        backgroundColor: hasScrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.8)'
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between relative">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group z-10">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ backgroundColor: 'var(--accent-brown)' }}
          >
            <span className="text-white font-serif italic text-lg font-semibold">w</span>
          </div>
          <span className="text-xl font-serif font-bold tracking-tight text-[var(--mono-black)]">
            wavv
          </span>
        </Link>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-4 z-10">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-[var(--mono-secondary-gray)] hover:text-[var(--mono-black)] transition-colors"
          >
            Login
          </Link>
          <Link href="/contact">
            <Button
              className="rounded-md px-5 h-10 font-medium transition-all hover:scale-[1.02] hover:brightness-95 shadow-sm"
              style={{
                backgroundColor: 'var(--accent-brown)',
                color: 'white',
              }}
            >
              Request Access
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-[var(--mono-black)]"
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
          className="md:hidden border-t border-[var(--mono-border-gray)] px-6 py-4 space-y-4"
          style={{ backgroundColor: 'var(--mono-white)' }}
        >
          <div className="space-y-3">
            <Link href="/sign-in" className="block text-sm font-medium text-[var(--mono-secondary-gray)]">
              Login
            </Link>
            <Link href="/contact" className="block">
              <Button
                className="w-full hover:brightness-95"
                style={{ backgroundColor: 'var(--accent-brown)', color: 'white' }}
              >
                Request Access
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </nav>
  )
}

// Footer Component (same as Landing Page)
function Footer() {
  return (
    <footer
      className="py-12 border-t"
      style={{
        backgroundColor: 'var(--mono-white)',
        borderColor: 'var(--mono-border-gray)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-brown)' }}
            >
              <span className="text-white font-serif italic text-sm">w</span>
            </div>
            <span className="font-serif font-bold text-[var(--mono-black)]">wavv</span>
          </div>

          {/* Links */}
          <div className="flex gap-8">
            <Link
              href="/privacy"
              className="text-sm hover:underline transition-colors"
              style={{ color: 'var(--mono-secondary-gray)' }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm hover:underline transition-colors"
              style={{ color: 'var(--mono-secondary-gray)' }}
            >
              Terms of Service
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-sm" style={{ color: 'var(--mono-muted-gray)' }}>
            © 2026 Wavv AI LLC.
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function PrivacyPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen text-[var(--mono-black)] overflow-x-hidden" style={{ backgroundColor: 'var(--mono-white)' }}>
      <Navigation isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
            style={{ color: 'var(--mono-secondary-gray)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="mb-12">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--mono-black)' }}>
              Privacy Policy
            </h1>
            <p style={{ color: 'var(--mono-secondary-gray)' }}>
              Last updated: January 29, 2026
            </p>
          </div>

          <div className="prose prose-neutral max-w-none">
            <p className="text-lg leading-relaxed mb-12" style={{ color: 'var(--mono-secondary-gray)' }}>
              At Wavv, we take your privacy seriously. This Privacy Policy describes how we collect,
              use, and share information about you when you use our services. By using Wavv, you agree
              to the collection and use of information in accordance with this policy.
            </p>

            <div className="space-y-8">
              {sections.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow"
                  style={{ backgroundColor: 'var(--mono-white)', borderColor: 'var(--mono-border-gray)' }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: 'var(--accent-brown)' }}
                    >
                      <div className="text-white">
                        {section.icon}
                      </div>
                    </div>
                    <div>
                      <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--mono-black)' }}>
                        {section.title}
                      </h2>
                      <p className="leading-relaxed" style={{ color: 'var(--mono-secondary-gray)' }}>
                        {section.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-12 p-6 rounded-2xl border"
              style={{ backgroundColor: 'var(--mono-off-white)', borderColor: 'var(--mono-border-gray)' }}
            >
              <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--mono-black)' }}>
                Contact Us
              </h2>
              <p className="leading-relaxed" style={{ color: 'var(--mono-secondary-gray)' }}>
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@wavv.ai" className="underline hover:no-underline" style={{ color: 'var(--mono-black)' }}>
                  privacy@wavv.ai
                </a>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}

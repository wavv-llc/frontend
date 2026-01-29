'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, Eye, Lock, Server, UserCheck, Bell } from 'lucide-react'
import { AppBar } from '@/components/AppBar'

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

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20" style={{ backgroundColor: 'hsl(42, 50%, 88%)' }}>
      <AppBar navItems={[]} showContactButton={true} showLoginLink={true} />

      <main className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="mb-12">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Last updated: January 29, 2026
            </p>
          </div>

          <div className="prose prose-neutral max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-12">
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
                  className="bg-background rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      {section.icon}
                    </div>
                    <div>
                      <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                        {section.title}
                      </h2>
                      <p className="text-muted-foreground leading-relaxed">
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
              className="mt-12 p-6 bg-muted/50 rounded-2xl border border-border"
            >
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                Contact Us
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@wavv.ai" className="text-foreground underline hover:no-underline">
                  privacy@wavv.ai
                </a>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </main>

      <footer className="py-8 border-t border-border text-muted-foreground text-sm" style={{ backgroundColor: 'hsl(42, 50%, 88%)' }}>
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-foreground">Wavv</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
          <div>© 2026 Wavv AI Inc.</div>
        </div>
      </footer>
    </div>
  )
}

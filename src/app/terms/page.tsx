'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Scale, AlertCircle, CreditCard, Ban, RefreshCw, Gavel } from 'lucide-react'
import { AppBar } from '@/components/AppBar'

const sections = [
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Acceptance of Terms',
    content: `By accessing or using Wavv's services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services. These terms apply to all visitors, users, and others who access or use the service.`
  },
  {
    icon: <Scale className="w-5 h-5" />,
    title: 'Use License',
    content: `We grant you a limited, non-exclusive, non-transferable, and revocable license to use our services for your personal or internal business purposes. This license does not include the right to modify, copy, distribute, or create derivative works based on our services without our prior written consent. You may not use our services for any illegal or unauthorized purpose.`
  },
  {
    icon: <AlertCircle className="w-5 h-5" />,
    title: 'User Responsibilities',
    content: `You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account. You must not use the service in any way that could damage, disable, or impair our servers or networks. You are solely responsible for the content you upload or share through our services.`
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: 'Payment Terms',
    content: `Certain features of our services may require payment. You agree to provide accurate billing information and authorize us to charge your payment method for all fees incurred. Subscription fees are billed in advance on a monthly or annual basis and are non-refundable except as required by law. We reserve the right to change our pricing at any time with reasonable notice.`
  },
  {
    icon: <Ban className="w-5 h-5" />,
    title: 'Limitation of Liability',
    content: `To the maximum extent permitted by law, Wavv shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of or in connection with your use of our services. Our total liability shall not exceed the amount you paid us in the twelve months preceding the claim.`
  },
  {
    icon: <RefreshCw className="w-5 h-5" />,
    title: 'Service Modifications',
    content: `We reserve the right to modify, suspend, or discontinue any part of our services at any time without prior notice. We may also impose limits on certain features or restrict your access to parts or all of the services without liability. We will make reasonable efforts to notify you of significant changes to our services.`
  },
  {
    icon: <Gavel className="w-5 h-5" />,
    title: 'Governing Law',
    content: `These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions. Any disputes arising under these terms shall be resolved exclusively in the state or federal courts located in Delaware. You consent to the personal jurisdiction of such courts.`
  },
]

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last updated: January 29, 2026
            </p>
          </div>

          <div className="prose prose-neutral max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-12">
              Welcome to Wavv. These Terms of Service govern your use of our platform and services.
              Please read these terms carefully before using our services. By using Wavv, you acknowledge
              that you have read, understood, and agree to be bound by these terms.
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
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-12 p-6 bg-muted/50 rounded-2xl border border-border"
            >
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                Questions?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:legal@wavv.ai" className="text-foreground underline hover:no-underline">
                  legal@wavv.ai
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

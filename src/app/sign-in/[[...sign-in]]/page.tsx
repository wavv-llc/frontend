'use client'

import Link from 'next/link'
import { SignIn } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 font-sans overflow-hidden">
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
        </div>
      </nav>

      {/* Sign In Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 z-10">
        <div className="max-w-xl mx-auto px-6 w-full py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative"
          >
            {/* Glow effect behind card */}
            <div className="absolute inset-0 bg-primary/10 blur-[60px] rounded-full" />

            <div className="relative bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-10 md:p-14 shadow-2xl">
              <div className="mb-8 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border text-xs font-medium text-foreground mb-6"
                >
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>Welcome back</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3"
                >
                  Sign in to Wavv
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-sm text-muted-foreground"
                >
                  Access your intelligent tax workspace
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="w-full"
              >
                <SignIn
                  forceRedirectUrl="/signup-callback"
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "!shadow-none !border-none !bg-transparent !w-full !max-w-none !p-0",
                      cardBox: "!bg-transparent w-full",
                      header: "hidden",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      main: "!bg-transparent w-full",
                      main__body: "!bg-transparent w-full flex flex-col !mt-0",
                      formButtonPrimary: "!bg-primary hover:!bg-primary/90 !text-primary-foreground !shadow-lg hover:!shadow-xl !transition-all !border-none !w-full !rounded-full !h-14 !font-medium !text-base",
                      socialButtonsBlockButton: "!border-border hover:!bg-muted/50 !transition-all !bg-background/50 !backdrop-blur-sm !w-full !mt-0 !rounded-xl !h-14 !px-6",
                      socialButtons: "!mt-0 !w-full",
                      socialButtonsBlockButtonText: "!text-foreground !font-medium !text-base",
                      formFieldInput: "!border-border focus:!border-primary focus:!ring-primary/20 !bg-background/50 !backdrop-blur-sm !w-full !rounded-xl !h-14 !text-base !px-5",
                      formFieldLabel: "!text-foreground !font-medium",
                      formField: "!w-full",
                      form: "!w-full flex flex-col",
                      identityPreview: "!bg-muted/30 !border-border !w-full !rounded-xl !backdrop-blur-sm",
                      identityPreviewText: "!text-foreground",
                      identityPreviewEditButton: "!text-primary hover:!text-primary/80",
                      footerAction: "hidden",
                      footerActionLink: "hidden",
                      footerActionText: "hidden",
                      dividerLine: "!bg-border",
                      dividerText: "!text-muted-foreground !text-xs",
                      formResendCodeLink: "!text-primary hover:!text-primary/80",
                      alertText: "!text-foreground",
                      formHeaderTitle: "!text-2xl !font-bold !text-foreground",
                      formHeaderSubtitle: "!text-sm !text-muted-foreground",
                      footer: "hidden",
                      footerPages: "hidden",
                      footerPagesLink: "hidden",
                      formFieldInputShowPasswordButton: "!text-muted-foreground hover:!text-foreground"
                    },
                    layout: {
                      socialButtonsPlacement: "top",
                      showOptionalFields: true
                    }
                  }}
                />

                <p className="text-sm text-muted-foreground text-center mt-6">
                  Don&apos;t have an account?{' '}
                  <Link href="/contact" className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Request access
                  </Link>
                </p>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </section>
    </div>
  )
}


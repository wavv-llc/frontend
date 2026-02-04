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
      <section className="relative h-screen flex items-center justify-center z-10">
        <div className="max-w-[420px] mx-auto px-4 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative"
          >
            {/* Glow effect behind card */}
            <div className="absolute inset-0 bg-primary/10 blur-[60px] rounded-full" />

            <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-sm flex flex-col items-center">
              <div className="mb-4 text-center w-full">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-2xl font-bold tracking-tight text-foreground mb-1"
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
                  forceRedirectUrl="/auth/callback"
                  appearance={{
                    elements: {
                      rootBox: "w-full flex flex-col items-center",
                      card: "!shadow-none !border-none !bg-transparent !w-full !max-w-none !p-0 !flex !flex-col !items-center",
                      cardBox: "!bg-transparent w-full",
                      header: "hidden",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      main: "!bg-transparent w-full !flex !flex-col !items-center",
                      main__body: "!bg-transparent w-full !p-0 !flex !flex-col !items-center",

                      // Social Buttons
                      socialButtonsBlockButton: "!relative !overflow-visible !border !border-border hover:!bg-muted/50 !bg-background/50 !w-full !flex !items-center !justify-center !gap-2 !h-10 !rounded-lg !mb-0 !shadow-sm transition-all",
                      socialButtonsBlockButtonText: "!text-foreground !font-medium !text-sm",
                      socialButtons: "!w-full !flex !flex-col !items-center",
                      socialButtonsProviderIcon: "!mr-2",

                      // Divider
                      // Using flex layout with growing lines as requested
                      dividerRow: "!flex !items-center !justify-between !my-4 !w-full",
                      dividerLine: "!h-px !flex-grow !bg-border/50",
                      dividerText: "!text-muted-foreground !text-[10px] !uppercase !tracking-wider !bg-transparent !px-3",

                      // Form Fields
                      form: "!w-full !gap-3 !mt-0 !flex !flex-col !items-center",
                      formFieldRow: "!w-full",
                      formField: "!w-full !mb-0",
                      // Ensure label is left-aligned and block
                      formFieldLabel: "!text-foreground !text-xs !font-medium !mb-1.5 !text-left !block !w-full",
                      formFieldInput: "!w-full !h-10 !rounded-lg !border !border-border !bg-background/50 !px-3 !text-sm focus:!border-primary focus:!ring-2 focus:!ring-primary/10 transition-all !box-border",

                      // Primary Button
                      formButtonPrimary: "!w-full !h-10 !rounded-lg !bg-primary !text-primary-foreground !text-sm !font-medium hover:!bg-primary/90 hover:!shadow-md transition-all !shadow-sm !mt-2",

                      // Footer/Links
                      footerAction: "hidden",
                      footer: "hidden",

                      // Other
                      identityPreview: "!bg-muted/30 !border !border-border !rounded-lg !p-3 !mb-4 !w-full",
                      identityPreviewText: "!text-foreground !text-sm",
                      identityPreviewEditButton: "!text-primary !text-xs hover:!underline",
                      formFieldInputShowPasswordButton: "!text-muted-foreground hover:!text-foreground",
                      alert: "!bg-destructive/10 !text-destructive !border !border-destructive/20 !rounded-lg !mb-4 !text-sm !p-3 !w-full",
                      alertText: "!text-destructive"
                    },
                    layout: {
                      socialButtonsPlacement: "top",
                      showOptionalFields: false
                    }
                  }}
                />

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Don&apos;t have an account?{' '}
                  <Link href="/contact" className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline">
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

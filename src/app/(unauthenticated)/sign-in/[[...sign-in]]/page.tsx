'use client'

import Link from 'next/link'
import { SignIn } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { RetroWaterAnimation } from '@/components/landing/RetroWaterAnimation'
import { AppBar } from '@/components/AppBar'
import { Footer } from '@/components/Footer'

export default function SignInPage() {
  return (
    <div
      className="min-h-screen text-[var(--mono-black)] overflow-x-hidden"
      style={{ backgroundColor: 'var(--mono-white)' }}
    >
      {/* Retro Water Animation Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <RetroWaterAnimation intensity="medium" />
      </div>

      {/* Navigation */}
      <AppBar variant="simple" backLinkText="Back to Home" />

      {/* Sign In Section - Better Vertical Centering */}
      <section className="relative flex items-center justify-center min-h-screen py-24 z-10">
        <div className="max-w-[480px] mx-auto px-6 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative"
          >
            {/* Subtle glow effect behind card */}
            <div
              className="absolute -inset-8 rounded-3xl blur-3xl"
              style={{
                background: 'radial-gradient(circle at center, rgba(139, 94, 60, 0.08), transparent 70%)',
                opacity: 0.4
              }}
            />

            {/* Card Container - Modern & Sleek */}
            <div
              className="relative bg-white/90 backdrop-blur-md border rounded-3xl shadow-2xl shadow-black/5 overflow-hidden"
              style={{
                borderColor: 'var(--mono-border-gray)'
              }}
            >
              {/* Header Section */}
              <div className="px-8 pt-8 pb-6 text-center border-b" style={{ borderColor: 'var(--mono-border-gray)' }}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                  className="mb-1"
                >
                  <h1
                    className="text-2xl font-serif font-bold tracking-tight mb-2"
                    style={{ color: 'var(--mono-black)' }}
                  >
                    Welcome Back
                  </h1>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--mono-secondary-gray)' }}
                  >
                    Sign in to access your intelligent tax workspace
                  </p>
                </motion.div>
              </div>

              {/* Form Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="px-8 py-6 flex flex-col items-center"
              >
                <div className="w-full">
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

                      // Social Buttons - styled to match landing page
                      socialButtonsBlockButton: "!relative !overflow-visible !border !bg-white/50 !w-full !flex !items-center !justify-center !gap-2 !h-10 !rounded-lg !mb-0 !shadow-sm transition-all hover:!shadow-md hover:!scale-[1.01] !px-4",
                      socialButtonsBlockButtonText: "!font-medium !text-sm",
                      socialButtons: "!w-full !flex !flex-col !items-center !gap-3",
                      socialButtonsProviderIcon: "!mr-2 !h-5",

                      // Divider
                      dividerRow: "!flex !items-center !justify-between !my-4 !w-full",
                      dividerLine: "!h-px !flex-grow",
                      dividerText: "!text-xs !uppercase !tracking-wider !bg-transparent !px-4",

                      // Form Fields - styled to match landing page aesthetic
                      form: "!w-full !gap-3 !mt-0 !flex !flex-col !items-center",
                      formFieldRow: "!w-full",
                      formField: "!w-full !mb-0",
                      formFieldLabel: "!text-sm !font-medium !mb-2 !text-left !block !w-full",
                      formFieldInput: "!w-full !h-10 !rounded-lg !border !bg-white/50 !px-4 !text-sm focus:!ring-2 transition-all !box-border",

                      // Primary Button - styled to match landing page CTA
                      formButtonPrimary: "!w-full !h-11 !rounded-lg !text-base !font-medium hover:!shadow-lg transition-all hover:!scale-[1.02] hover:!brightness-95 !shadow-sm !mt-2 !px-4",

                      // Footer/Links
                      footerAction: "hidden",
                      footer: "hidden",

                      // Other
                      identityPreview: "!border !rounded-lg !p-3 !mb-3 !w-full",
                      identityPreviewText: "!text-sm",
                      identityPreviewEditButton: "!text-sm hover:!underline",
                      formFieldInputShowPasswordButton: "hover:!scale-105 transition-transform",
                      alert: "!border !rounded-lg !mb-3 !text-sm !p-3 !w-full",
                      alertText: ""
                    },
                    layout: {
                      socialButtonsPlacement: "top",
                      showOptionalFields: false
                    },
                    variables: {
                      colorPrimary: '#8B5E3C', // accent-brown
                      colorText: '#1A1A1A', // mono-black
                      colorTextSecondary: '#6B6B6B', // mono-secondary-gray
                      colorBackground: 'rgba(255, 255, 255, 0.5)',
                      colorInputBackground: 'rgba(255, 255, 255, 0.5)',
                      colorInputText: '#1A1A1A',
                      borderRadius: '0.5rem',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem',
                    }
                  }}
                />

                {/* Footer Link */}
                <div className="mt-5 pt-4 border-t w-full" style={{ borderColor: 'var(--mono-border-gray)' }}>
                  <p
                    className="text-sm text-center"
                    style={{ color: 'var(--mono-secondary-gray)' }}
                  >
                    Don&apos;t have an account?{' '}
                    <Link
                      href="/contact"
                      className="font-medium transition-colors hover:underline"
                      style={{ color: 'var(--accent-brown)' }}
                    >
                      Request access
                    </Link>
                  </p>
                </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  )
}

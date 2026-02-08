'use client'

import Link from 'next/link'
import { SignIn } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { RetroWaterAnimation } from '@/components/landing/RetroWaterAnimation'

export default function SignInPage() {
  return (
    <div
      className="min-h-screen select-none overscroll-none overflow-hidden"
      style={{ backgroundColor: 'var(--ivory-100)', color: 'var(--mahogany-800)' }}
    >
      {/* Retro Water Animation Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <RetroWaterAnimation intensity="medium" />
      </div>

      {/* Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(250, 247, 240, 0.95)',
          borderColor: 'var(--mahogany-300)/30'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ backgroundColor: 'var(--mahogany-600)' }}
            >
              <span
                className="font-serif italic text-lg font-semibold"
                style={{ color: 'var(--ivory-100)' }}
              >
                w
              </span>
            </div>
            <span
              className="text-xl font-serif font-bold tracking-tight"
              style={{ color: 'var(--mahogany-700)' }}
            >
              wavv
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium transition-colors"
            style={{ color: 'var(--mahogany-500)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mahogany-800)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--mahogany-500)'}
          >
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Sign In Section */}
      <section className="relative h-screen flex items-center justify-center pt-16 z-10">
        <div className="max-w-[850px] mx-auto px-6 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            {/* Glow effect behind card */}
            <div
              className="absolute -inset-4 rounded-3xl opacity-20 blur-3xl"
              style={{ backgroundColor: 'var(--lake-blue-300)' }}
            />

            {/* Card Container */}
            <div
              className="relative backdrop-blur-sm border-2 rounded-2xl shadow-2xl overflow-hidden"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: 'var(--mahogany-400)'
              }}
            >
              {/* Header Section */}
              <div className="px-16 pt-10 pb-6 text-center border-b" style={{ borderColor: 'var(--mahogany-300)/30' }}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mb-3"
                >
                  <h1
                    className="text-3xl font-serif font-bold tracking-tight mb-2"
                    style={{ color: 'var(--mahogany-800)' }}
                  >
                    Welcome Back
                  </h1>
                  <p
                    className="text-base leading-relaxed"
                    style={{ color: 'var(--mahogany-500)' }}
                  >
                    Sign in to access your intelligent tax workspace
                  </p>
                </motion.div>
              </div>

              {/* Form Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="px-16 py-8 flex flex-col items-center"
              >
                <div className="w-full max-w-[620px]">
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
                      socialButtonsBlockButton: "!relative !overflow-visible !border !bg-background/50 !w-full !flex !items-center !justify-center !gap-2 !h-14 !rounded-md !mb-0 !shadow-sm transition-all hover:!shadow-md hover:!scale-[1.01] !px-6",
                      socialButtonsBlockButtonText: "!font-medium !text-base",
                      socialButtons: "!w-full !flex !flex-col !items-center !gap-4",
                      socialButtonsProviderIcon: "!mr-2 !h-5",

                      // Divider
                      dividerRow: "!flex !items-center !justify-between !my-6 !w-full",
                      dividerLine: "!h-px !flex-grow",
                      dividerText: "!text-xs !uppercase !tracking-wider !bg-transparent !px-4",

                      // Form Fields - styled to match landing page aesthetic
                      form: "!w-full !gap-4 !mt-0 !flex !flex-col !items-center",
                      formFieldRow: "!w-full",
                      formField: "!w-full !mb-0",
                      formFieldLabel: "!text-xs !font-semibold !mb-2.5 !text-left !block !w-full !uppercase !tracking-wide",
                      formFieldInput: "!w-full !h-14 !rounded-md !border !bg-background/50 !px-6 !text-base focus:!ring-2 transition-all !box-border",

                      // Primary Button - styled to match landing page CTA
                      formButtonPrimary: "!w-full !h-12 !rounded-md !text-base !font-serif !font-medium hover:!shadow-lg transition-all hover:!scale-[1.02] !shadow-md !mt-2 !px-6",

                      // Footer/Links
                      footerAction: "hidden",
                      footer: "hidden",

                      // Other
                      identityPreview: "!border !rounded-md !p-4 !mb-4 !w-full",
                      identityPreviewText: "!text-sm",
                      identityPreviewEditButton: "!text-xs hover:!underline",
                      formFieldInputShowPasswordButton: "hover:!scale-105 transition-transform",
                      alert: "!border-2 !rounded-md !mb-4 !text-sm !p-4 !w-full",
                      alertText: ""
                    },
                    layout: {
                      socialButtonsPlacement: "top",
                      showOptionalFields: false
                    },
                    variables: {
                      colorPrimary: '#704830', // mahogany-600
                      colorText: '#422F26', // mahogany-800
                      colorTextSecondary: '#8B6758', // mahogany-500
                      colorBackground: 'rgba(250, 247, 240, 0.5)', // ivory-100 with transparency
                      colorInputBackground: 'rgba(255, 255, 255, 0.5)',
                      colorInputText: '#422F26',
                      borderRadius: '0.375rem',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem',
                    }
                  }}
                />

                {/* Footer Link */}
                <div className="mt-5 pt-5 border-t w-full" style={{ borderColor: 'var(--mahogany-300)/30' }}>
                  <p
                    className="text-sm text-center"
                    style={{ color: 'var(--mahogany-500)' }}
                  >
                    Don&apos;t have an account?{' '}
                    <Link
                      href="/contact"
                      className="font-semibold transition-colors hover:underline"
                      style={{ color: 'var(--mahogany-700)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--lake-blue-500)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--mahogany-700)'}
                    >
                      Request access
                    </Link>
                  </p>
                </div>
                </div>
              </motion.div>
            </div>

            {/* Decorative corner accents - matching landing page CTA */}
            <div
              className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 rounded-tl-lg pointer-events-none"
              style={{ borderColor: 'var(--gold-500)' }}
            />
            <div
              className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 rounded-tr-lg pointer-events-none"
              style={{ borderColor: 'var(--gold-500)' }}
            />
            <div
              className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 rounded-bl-lg pointer-events-none"
              style={{ borderColor: 'var(--gold-500)' }}
            />
            <div
              className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 rounded-br-lg pointer-events-none"
              style={{ borderColor: 'var(--gold-500)' }}
            />
          </motion.div>
        </div>
      </section>
    </div>
  )
}

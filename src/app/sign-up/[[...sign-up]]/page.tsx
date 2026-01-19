'use client'

import Link from 'next/link'
import { SignUp } from '@clerk/nextjs'
import { Card, CardContent } from '@/components/ui/card'
import { AppBar } from '@/components/AppBar'

export default function SignUpPage() {
  return (
    <div className="bg-background text-foreground selection:bg-primary/20 selection:text-primary-foreground" style={{ backgroundColor: 'hsl(42, 50%, 88%)', minHeight: '100vh' }}>
      {/* HEADER / NAV - Matching landing page */}
      <AppBar navItems={[]} showLoginLink={false} showContactButton={false} />

      {/* SIGN UP SECTION */}
      <section className="relative w-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 w-full py-12">
          <Card className="bg-background border-border shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="mb-4 text-center">
                <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
                  Create your account
                </h1>
                <p className="font-sans text-sm text-muted-foreground">
                  Sign up to get started with your workspace
                </p>
              </div>
              <div className="flex justify-center">
                <SignUp
                  forceRedirectUrl="/signup-callback"
                  appearance={{
                    elements: {
                      rootBox: "w-full flex justify-center",
                      card: "!shadow-none !border-none !bg-transparent !w-full !max-w-none !p-0",
                      cardBox: "!bg-transparent w-full flex justify-center",
                      header: "hidden",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      main: "!bg-transparent w-full flex justify-center",
                      main__body: "!bg-transparent w-full flex flex-col items-center !mt-0",
                      formButtonPrimary: "bg-[#3b4a5f] hover:bg-[#3b4a5f]/90 text-white shadow-sm hover:shadow-md transition-all !border-none w-full",
                      socialButtonsBlockButton: "border-border hover:bg-muted/30 transition-colors !bg-background w-full !mt-0",
                      socialButtons: "!mt-0 w-full",
                      socialButtonsBlockButtonText: "text-foreground",
                      formFieldInput: "border-border focus:border-[#1e293b] focus:ring-[#1e293b] !bg-background w-full",
                      formFieldLabel: "text-foreground font-medium",
                      formField: "w-full",
                      form: "w-full flex flex-col items-center",
                      identityPreview: "!bg-transparent border-border w-full",
                      identityPreviewText: "text-foreground",
                      identityPreviewEditButton: "text-[#1e293b] hover:text-[#1e293b]/80",
                      footerAction: "hidden",
                      footerActionLink: "hidden",
                      footerActionText: "hidden",
                      dividerLine: "bg-border",
                      dividerText: "text-muted-foreground text-xs",
                      formResendCodeLink: "text-[#1e293b] hover:text-[#1e293b]/80",
                      alertText: "text-foreground",
                      formHeaderTitle: "font-serif text-2xl font-bold text-foreground",
                      formHeaderSubtitle: "font-sans text-sm text-muted-foreground",
                      footer: "hidden",
                      footerPages: "hidden",
                      footerPagesLink: "hidden",
                      formFieldInputShowPasswordButton: "text-[#1e293b] hover:text-[#1e293b]/80"
                    },
                    layout: {
                      socialButtonsPlacement: "top",
                      showOptionalFields: true
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="font-sans text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-[#1e293b] hover:text-[#1e293b]/80 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

import { type Metadata } from 'next'
import {
  ClerkProvider,
} from '@clerk/nextjs'
import { Geist, Geist_Mono, Crimson_Pro } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const crimsonPro = Crimson_Pro({
  variable: '--font-crimson',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Wavv - AI-Powered Tax Workspace',
  description: 'Integrated AI-powered workspace for tax professionals',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="bg-background" style={{ backgroundColor: 'hsl(42, 50%, 88%)', minHeight: '100vh' }}>
        <body className={`${geistSans.variable} ${geistMono.variable} ${crimsonPro.variable} antialiased bg-background`} style={{ backgroundColor: 'hsl(42, 50%, 88%)', minHeight: '100vh' }}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
import { type Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Sora, Lora } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

// ─── GLOBAL FONT CONFIG ───────────────────────────────────────────────────────
// To change fonts app-wide, update these two imports and their `variable` names,
// then update --font-sans / --font-serif in globals.css to match.

const sora = Sora({
    variable: '--font-sora',
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
});

const lora = Lora({
    variable: '--font-lora',
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    style: ['normal', 'italic'],
});

export const metadata: Metadata = {
    title: 'Wavv - AI-Powered Tax Workspace',
    description: 'Integrated AI-powered workspace for tax professionals',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body
                    className={`${sora.variable} ${lora.variable} antialiased`}
                >
                    {children}
                    <Toaster />
                    <Analytics />
                </body>
            </html>
        </ClerkProvider>
    );
}

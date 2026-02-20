import { type Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { DM_Sans, DM_Serif_Display } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const dmSans = DM_Sans({
    variable: '--font-dm-sans',
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
});

const dmSerifDisplay = DM_Serif_Display({
    variable: '--font-dm-serif',
    subsets: ['latin'],
    weight: ['400'],
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
                    className={`${dmSans.variable} ${dmSerifDisplay.variable} antialiased`}
                >
                    {children}
                    <Toaster />
                    <Analytics />
                </body>
            </html>
        </ClerkProvider>
    );
}

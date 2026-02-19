'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    FileText,
    Scale,
    AlertCircle,
    CreditCard,
    Ban,
    RefreshCw,
    Gavel,
    Menu,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const sections = [
    {
        icon: <FileText className="w-5 h-5" />,
        title: 'Acceptance of Terms',
        content: `By accessing or using Wavv's services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services. These terms apply to all visitors, users, and others who access or use the service.`,
    },
    {
        icon: <Scale className="w-5 h-5" />,
        title: 'Use License',
        content: `We grant you a limited, non-exclusive, non-transferable, and revocable license to use our services for your personal or internal business purposes. This license does not include the right to modify, copy, distribute, or create derivative works based on our services without our prior written consent. You may not use our services for any illegal or unauthorized purpose.`,
    },
    {
        icon: <AlertCircle className="w-5 h-5" />,
        title: 'User Responsibilities',
        content: `You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account. You must not use the service in any way that could damage, disable, or impair our servers or networks. You are solely responsible for the content you upload or share through our services.`,
    },
    {
        icon: <CreditCard className="w-5 h-5" />,
        title: 'Payment Terms',
        content: `Certain features of our services may require payment. You agree to provide accurate billing information and authorize us to charge your payment method for all fees incurred. Subscription fees are billed in advance on a monthly or annual basis and are non-refundable except as required by law. We reserve the right to change our pricing at any time with reasonable notice.`,
    },
    {
        icon: <Ban className="w-5 h-5" />,
        title: 'Limitation of Liability',
        content: `To the maximum extent permitted by law, Wavv shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of or in connection with your use of our services. Our total liability shall not exceed the amount you paid us in the twelve months preceding the claim.`,
    },
    {
        icon: <RefreshCw className="w-5 h-5" />,
        title: 'Service Modifications',
        content: `We reserve the right to modify, suspend, or discontinue any part of our services at any time without prior notice. We may also impose limits on certain features or restrict your access to parts or all of the services without liability. We will make reasonable efforts to notify you of significant changes to our services.`,
    },
    {
        icon: <Gavel className="w-5 h-5" />,
        title: 'Governing Law',
        content: `These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions. Any disputes arising under these terms shall be resolved exclusively in the state or federal courts located in Delaware. You consent to the personal jurisdiction of such courts.`,
    },
];

// Navigation Component (same as Landing Page)
function Navigation({
    isMobileMenuOpen,
    setIsMobileMenuOpen,
}: {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
}) {
    const [hasScrolled, setHasScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setHasScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                hasScrolled
                    ? 'border-b border-[var(--mono-border-gray)] backdrop-blur-md shadow-sm'
                    : 'backdrop-blur-sm'
            }`}
            style={{
                backgroundColor: hasScrolled
                    ? 'rgba(255, 255, 255, 0.98)'
                    : 'rgba(255, 255, 255, 0.8)',
            }}
        >
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between relative">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group z-10">
                    <div
                        className="w-9 h-9 rounded-md flex items-center justify-center transition-transform group-hover:scale-105"
                        style={{ backgroundColor: 'var(--accent-brown)' }}
                    >
                        <span className="text-white font-serif italic text-lg font-semibold">
                            w
                        </span>
                    </div>
                    <span className="text-xl font-serif font-bold tracking-tight text-[var(--mono-black)]">
                        wavv
                    </span>
                </Link>

                {/* CTA Buttons */}
                <div className="hidden md:flex items-center gap-4 z-10">
                    <Link
                        href="/sign-in"
                        className="text-sm font-medium text-[var(--mono-secondary-gray)] hover:text-[var(--mono-black)] transition-colors"
                    >
                        Login
                    </Link>
                    <Link href="/contact">
                        <Button
                            className="rounded-md px-5 h-10 font-medium transition-all hover:scale-[1.02] hover:brightness-95 shadow-sm"
                            style={{
                                backgroundColor: 'var(--accent-brown)',
                                color: 'white',
                            }}
                        >
                            Request Access
                        </Button>
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-[var(--mono-black)]"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                    {isMobileMenuOpen ? (
                        <X className="w-6 h-6" />
                    ) : (
                        <Menu className="w-6 h-6" />
                    )}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:hidden border-t border-[var(--mono-border-gray)] px-6 py-4 space-y-4"
                    style={{ backgroundColor: 'var(--mono-white)' }}
                >
                    <div className="space-y-3">
                        <Link
                            href="/sign-in"
                            className="block text-sm font-medium text-[var(--mono-secondary-gray)]"
                        >
                            Login
                        </Link>
                        <Link href="/contact" className="block">
                            <Button
                                className="w-full hover:brightness-95"
                                style={{
                                    backgroundColor: 'var(--accent-brown)',
                                    color: 'white',
                                }}
                            >
                                Request Access
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            )}
        </nav>
    );
}

// Footer Component (same as Landing Page)
function Footer() {
    return (
        <footer
            className="py-12 border-t"
            style={{
                backgroundColor: 'var(--mono-white)',
                borderColor: 'var(--mono-border-gray)',
            }}
        >
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div
                            className="w-7 h-7 rounded flex items-center justify-center"
                            style={{ backgroundColor: 'var(--accent-brown)' }}
                        >
                            <span className="text-white font-serif italic text-sm">
                                w
                            </span>
                        </div>
                        <span className="font-serif font-bold text-[var(--mono-black)]">
                            wavv
                        </span>
                    </div>

                    {/* Links */}
                    <div className="flex gap-8">
                        <Link
                            href="/privacy"
                            className="text-sm hover:underline transition-colors"
                            style={{ color: 'var(--mono-secondary-gray)' }}
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="/terms"
                            className="text-sm hover:underline transition-colors"
                            style={{ color: 'var(--mono-secondary-gray)' }}
                        >
                            Terms of Service
                        </Link>
                    </div>

                    {/* Copyright */}
                    <div
                        className="text-sm"
                        style={{ color: 'var(--mono-muted-gray)' }}
                    >
                        © 2026 Wavv AI LLC.
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default function TermsPage() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div
            className="min-h-screen text-[var(--mono-black)] overflow-x-hidden"
            style={{ backgroundColor: 'var(--mono-white)' }}
        >
            <Navigation
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
            />

            <main className="max-w-4xl mx-auto px-6 pt-32 pb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
                        style={{ color: 'var(--mono-secondary-gray)' }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to home
                    </Link>

                    <div className="mb-12">
                        <h1
                            className="font-serif text-4xl md:text-5xl font-bold mb-4"
                            style={{ color: 'var(--mono-black)' }}
                        >
                            Terms of Service
                        </h1>
                        <p style={{ color: 'var(--mono-secondary-gray)' }}>
                            Last updated: January 29, 2026
                        </p>
                    </div>

                    <div className="prose prose-neutral max-w-none">
                        <p
                            className="text-lg leading-relaxed mb-12"
                            style={{ color: 'var(--mono-secondary-gray)' }}
                        >
                            Welcome to Wavv. These Terms of Service govern your
                            use of our platform and services. Please read these
                            terms carefully before using our services. By using
                            Wavv, you acknowledge that you have read,
                            understood, and agree to be bound by these terms.
                        </p>

                        <div className="space-y-8">
                            {sections.map((section, index) => (
                                <motion.div
                                    key={section.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: index * 0.1,
                                    }}
                                    className="rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow"
                                    style={{
                                        backgroundColor: 'var(--mono-white)',
                                        borderColor: 'var(--mono-border-gray)',
                                    }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                            style={{
                                                backgroundColor:
                                                    'var(--accent-brown)',
                                            }}
                                        >
                                            <div className="text-white">
                                                {section.icon}
                                            </div>
                                        </div>
                                        <div>
                                            <h2
                                                className="font-serif text-xl font-semibold mb-3"
                                                style={{
                                                    color: 'var(--mono-black)',
                                                }}
                                            >
                                                {section.title}
                                            </h2>
                                            <p
                                                className="leading-relaxed"
                                                style={{
                                                    color: 'var(--mono-secondary-gray)',
                                                }}
                                            >
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
                            className="mt-12 p-6 rounded-2xl border"
                            style={{
                                backgroundColor: 'var(--mono-off-white)',
                                borderColor: 'var(--mono-border-gray)',
                            }}
                        >
                            <h2
                                className="font-serif text-xl font-semibold mb-3"
                                style={{ color: 'var(--mono-black)' }}
                            >
                                Questions?
                            </h2>
                            <p
                                className="leading-relaxed"
                                style={{ color: 'var(--mono-secondary-gray)' }}
                            >
                                If you have any questions about these Terms of
                                Service, please contact us at{' '}
                                <a
                                    href="mailto:legal@wavv.ai"
                                    className="underline hover:no-underline"
                                    style={{ color: 'var(--mono-black)' }}
                                >
                                    legal@wavv.ai
                                </a>
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
}

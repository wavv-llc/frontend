'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink,
} from '@/components/ui/navigation-menu';
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

/**
 * AppBar component for unauthenticated pages (landing, sign-in, contact, etc.)
 * Displays the Wavv logo and optional navigation items
 */
interface NavItem {
    name: string;
    href: string;
}

interface AppBarProps {
    navItems?: NavItem[];
    showContactButton?: boolean;
    showLoginLink?: boolean;
    variant?: 'full' | 'simple'; // 'simple' for sign-in page (just logo and back link)
    backLinkText?: string;
}

export function AppBar({
    navItems = [],
    showContactButton = true,
    showLoginLink = true,
    variant = 'full',
    backLinkText,
}: AppBarProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [hasScrolled, setHasScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setHasScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Simple variant for sign-in page
    if (variant === 'simple') {
        return (
            <nav
                className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md shadow-sm"
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    borderColor: '#e2e8f0',
                }}
            >
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div
                            className="w-9 h-9 rounded-md flex items-center justify-center transition-transform group-hover:scale-105"
                            style={{ backgroundColor: '#1e293b' }}
                        >
                            <span className="text-white font-serif italic text-lg font-semibold">
                                w
                            </span>
                        </div>
                        <span className="text-xl font-serif font-normal tracking-tight text-steel-950">
                            wavv
                        </span>
                    </Link>
                    <Link
                        href="/"
                        className="text-sm font-medium text-steel-700 hover:text-steel-950 transition-colors"
                    >
                        {backLinkText || 'Back to Home'}
                    </Link>
                </div>
            </nav>
        );
    }

    // Full variant for landing and contact pages
    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                hasScrolled
                    ? 'border-b border-steel-200 backdrop-blur-md shadow-sm bg-white/98'
                    : 'backdrop-blur-sm bg-white/80'
            }`}
        >
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between relative">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group z-10">
                    <div className="w-9 h-9 rounded-md bg-steel-800 hover:bg-steel-700 flex items-center justify-center transition-all group-hover:scale-105">
                        <span className="text-white font-serif italic text-lg font-semibold">
                            w
                        </span>
                    </div>
                    <span className="text-xl font-serif font-normal tracking-tight text-steel-950">
                        wavv
                    </span>
                </Link>

                {/* Desktop Nav - NavigationMenu absolutely centered */}
                {navItems.length > 0 && (
                    <div className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2">
                        <NavigationMenu viewport={false}>
                            <NavigationMenuList className="gap-6">
                                {navItems.map((item) => (
                                    <NavigationMenuItem key={item.name}>
                                        <NavigationMenuLink
                                            asChild
                                            className="text-sm font-medium text-steel-500 hover:text-steel-950 transition-colors bg-transparent hover:bg-transparent focus:bg-transparent px-0 py-0 rounded-none"
                                        >
                                            <Link href={item.href}>
                                                {item.name}
                                            </Link>
                                        </NavigationMenuLink>
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>
                )}

                {/* CTA Buttons */}
                <div className="hidden md:flex items-center gap-4 z-10">
                    {showLoginLink && (
                        <Link
                            href="/sign-in"
                            className="text-sm font-medium text-steel-700 hover:text-steel-950 transition-colors"
                        >
                            Login
                        </Link>
                    )}
                    {showContactButton && (
                        <Link href="/contact">
                            <Button className="rounded-md px-5 h-10 font-medium">
                                Request Access
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Mobile Menu - Sheet */}
                <div className="md:hidden z-10">
                    <Sheet
                        open={isMobileMenuOpen}
                        onOpenChange={setIsMobileMenuOpen}
                    >
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="p-2 text-steel-950"
                                aria-label={
                                    isMobileMenuOpen
                                        ? 'Close menu'
                                        : 'Open menu'
                                }
                            >
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="right"
                            className="w-72 bg-white px-0 pt-0"
                        >
                            <SheetHeader className="px-6 pt-6 pb-4">
                                <SheetTitle asChild>
                                    <Link
                                        href="/"
                                        className="flex items-center gap-2.5 group"
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                    >
                                        <div
                                            className="w-8 h-8 rounded-md flex items-center justify-center transition-transform group-hover:scale-105"
                                            style={{
                                                backgroundColor: '#1e293b',
                                            }}
                                        >
                                            <span className="text-white font-serif italic text-base font-semibold">
                                                w
                                            </span>
                                        </div>
                                        <span className="text-lg font-serif font-normal tracking-tight text-steel-950">
                                            wavv
                                        </span>
                                    </Link>
                                </SheetTitle>
                            </SheetHeader>

                            <Separator className="border-steel-200" />

                            {/* Nav links */}
                            <div className="px-6 py-4 space-y-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="block text-sm font-medium text-steel-500 hover:text-steel-950 py-2 transition-colors"
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>

                            <Separator className="border-steel-200" />

                            {/* CTA area */}
                            <div className="px-6 py-4 space-y-3">
                                {showLoginLink && (
                                    <Link
                                        href="/sign-in"
                                        className="block text-sm font-medium text-steel-700 hover:text-steel-950 py-1 transition-colors"
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                    >
                                        Login
                                    </Link>
                                )}
                                {showContactButton && (
                                    <Link
                                        href="/contact"
                                        className="block"
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                    >
                                        <Button className="w-full">
                                            Request Access
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
}

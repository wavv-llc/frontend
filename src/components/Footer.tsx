import Link from 'next/link';

export function Footer() {
    return (
        <footer className="py-12 border-t bg-background border-border">
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded flex items-center justify-center bg-steel-800">
                            <span className="text-white font-serif italic text-sm">
                                w
                            </span>
                        </div>
                        <span className="font-serif font-bold text-foreground">
                            wavv
                        </span>
                    </div>

                    {/* Links */}
                    <nav className="flex gap-8" aria-label="Footer navigation">
                        <Link
                            href="/privacy"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline cursor-pointer"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="/terms"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline cursor-pointer"
                        >
                            Terms of Service
                        </Link>
                    </nav>

                    {/* Copyright */}
                    <p className="text-sm text-muted-foreground">
                        © 2026 Wavv AI LLC.
                    </p>
                </div>
            </div>
        </footer>
    );
}

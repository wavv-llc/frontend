import Link from 'next/link'

export function Footer() {
  return (
    <footer
      className="py-12 border-t"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#e2e8f0',
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded flex items-center justify-center"
              style={{ backgroundColor: '#1e293b' }}
            >
              <span className="text-white font-serif italic text-sm">w</span>
            </div>
            <span className="font-serif font-bold text-[#0b1120]">wavv</span>
          </div>

          {/* Links */}
          <div className="flex gap-8">
            <Link
              href="/privacy"
              className="text-sm hover:underline transition-colors"
              style={{ color: '#475569' }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm hover:underline transition-colors"
              style={{ color: '#475569' }}
            >
              Terms of Service
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-sm" style={{ color: '#94a3b8' }}>
            © 2026 Wavv AI LLC.
          </div>
        </div>
      </div>
    </footer>
  )
}

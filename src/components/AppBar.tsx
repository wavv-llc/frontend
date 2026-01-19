'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * AppBar component for unauthenticated pages (landing, sign-in, contact, etc.)
 * Displays the Wavv logo and optional navigation items
 */
interface NavItem {
  name: string
  href: string
}

interface AppBarProps {
  navItems?: NavItem[]
  showContactButton?: boolean
  showLoginLink?: boolean
}

export function AppBar({ 
  navItems = [], 
  showContactButton = true,
  showLoginLink = true 
}: AppBarProps) {
  const [hoveredNav, setHoveredNav] = useState<string | null>(null)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border h-14 shadow-sm bg-background" style={{ backgroundColor: 'hsl(42, 50%, 88%)', backdropFilter: 'none' }}>
      <div className="w-full max-w-6xl mx-auto px-4 h-full grid grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex justify-start">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity">
            Wavv
          </Link>
        </div>

        {navItems.length > 0 && (
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative px-3 py-1.5 font-serif text-lg font-medium text-muted-foreground hover:text-[#1e293b] transition-colors"
                onMouseEnter={() => setHoveredNav(item.name)}
                onMouseLeave={() => setHoveredNav(null)}
              >
                <span className="relative z-10">{item.name}</span>
                <AnimatePresence>
                  {hoveredNav === item.name && (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-[#1e293b]/10"
                      layoutId="nav-hover"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    />
                  )}
                </AnimatePresence>
              </Link>
            ))}
          </nav>
        )}

        <div className="flex justify-end items-center gap-3">
          {showLoginLink && (
            <Link href="/sign-in" className="font-serif text-lg font-medium text-muted-foreground hover:text-[#1e293b] transition-colors">
              Login
            </Link>
          )}
          {showLoginLink && showContactButton && (
            <span className="text-muted-foreground/50">|</span>
          )}
          {showContactButton && (
            <Link href="/sign-up" className="font-serif text-lg font-medium text-muted-foreground hover:text-[#1e293b] transition-colors">
              Signup
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}


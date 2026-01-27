'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { ArrowRight, Check, Search, FileText, Database, Lock, Menu, X, Brain, Layers, Users, Sparkles, Zap, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  { name: 'Product', href: '#product' },
  { name: 'Solutions', href: '#solutions' },
  { name: 'Security', href: '#security' },
  { name: 'Company', href: '#company' },
]

export function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 font-sans overflow-x-hidden">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/30 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-muted/20 rounded-full blur-[100px] animate-pulse-slow delay-700" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-serif italic text-lg pr-0.5">w</span>
            </div>
            wavv
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>
            <Link href="/sign-up">
              <Button variant="default" className="rounded-full h-9 px-5 shadow-lg">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-6 py-4 space-y-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-border space-y-4">
              <Link href="/sign-in" className="block text-sm font-medium text-muted-foreground">Login</Link>
              <Link href="/sign-up" className="block">
                <Button className="w-full">Request Demo</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="flex flex-col items-center text-center">

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border text-xs font-medium text-foreground mb-8 backdrop-blur-sm"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              <span>The Intelligent Knowledge Hub for Tax</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 text-foreground"
            >
              Tax Intelligence, <br />
              <span className="text-muted-foreground">Unleashed.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10"
            >
              Wavv orchestrates your firm's knowledge. Unify internal documents with external tax code,
              automate defensible reviews, and empower your team with a trusted AI partner.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <Link href="/sign-up">
                <Button size="lg" className="h-12 px-8 text-lg rounded-full">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="h-12 px-8 text-lg rounded-full">
                  Book a Demo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Floating Holographic Dashboard */}
      <DashboardScrollReveal />

      {/* Solutions Grid */}
      <section id="solutions" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            <GlassCard
              icon={<Search className="w-6 h-6 text-foreground" />}
              title="Unified Search"
              description="One search bar for everything. Query your internal SharePoint and the IRC simultaneously with citation-backed results."
            />
            <GlassCard
              icon={<Zap className="w-6 h-6 text-foreground" />}
              title="Automated Reviews"
              description="Let AI handle the grunt work. Automated cross-checks for returns, K-1s, and notices with audit-ready trails."
            />
            <GlassCard
              icon={<Brain className="w-6 h-6 text-foreground" />}
              title="Institutional Brain"
              description="Stop knowledge bleeding. Semantic embedding preserves your firm's expertise regardless of staff turnover."
            />
          </div>
        </div>
      </section>

      {/* Feature Deep Dive: The Core */}
      <section className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-muted/30 border border-border rounded-3xl p-8 md:p-16 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2" />

            <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-xs font-medium text-foreground mb-6">
                  <Command className="w-3 h-3" />
                  <span>The Wavv Engine</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                  Intelligent Context.<br />
                  <span className="text-muted-foreground">Instant Clarity.</span>
                </h2>
                <div className="space-y-6">
                  <p className="text-lg text-muted-foreground">
                    Wavv doesn't just search keywords; it understands tax concepts. It connects a client's
                    past memos with current year workpapers and authoritative guidance to provide a complete picture.
                  </p>

                  <ul className="space-y-4">
                    {[
                      'Semantically indexes PDF, Excel, and Email',
                      'Maps entities across different file structures',
                      'Generates summaries with clickable source links'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-muted-foreground">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                          <Check className="w-3 h-3" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="relative">
                {/* Abstract Visualization of Knowledge Graph */}
                <div className="aspect-square relative">
                  <div className="absolute inset-0 bg-background/50 rounded-2xl border border-border backdrop-blur-md p-6 flex items-center justify-center">
                    {/* Center Node */}
                    <div className="relative z-10 w-24 h-24 bg-primary rounded-2xl shadow-xl flex items-center justify-center">
                      <Brain className="w-10 h-10 text-primary-foreground" />
                    </div>

                    {/* Orbiting Nodes */}
                    <OrbitNode angle={0} distance={120} delay={0} icon={<FileText className="w-4 h-4 text-foreground" />} label="10-K" />
                    <OrbitNode angle={72} distance={120} delay={1} icon={<Database className="w-4 h-4 text-foreground" />} label="SharePoint" />
                    <OrbitNode angle={144} distance={120} delay={2} icon={<Search className="w-4 h-4 text-foreground" />} label="IRC Code" />
                    <OrbitNode angle={216} distance={120} delay={3} icon={<Lock className="w-4 h-4 text-foreground" />} label="Security" />
                    <OrbitNode angle={288} distance={120} delay={4} icon={<Layers className="w-4 h-4 text-foreground" />} label="Workflows" />

                    {/* Connection Lines (SVG) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                      <circle cx="50%" cy="50%" r="120" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground" strokeDasharray="4 4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive: Workflow Automation */}
      <section className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center lg:flex-row-reverse">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-xs font-medium text-foreground mb-6">
                <Zap className="w-3 h-3" />
                <span>Active Intelligence</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                Defensible Work,<br />
                <span className="text-muted-foreground">On Autopilot.</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Turn static checklists into dynamic, AI-executed workflows. Wavv validates data integrity across documents,
                flagging inconsistencies before they become finding issues.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="text-2xl font-bold text-foreground mb-1">90%</div>
                  <div className="text-sm text-muted-foreground">Faster Document Review</div>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="text-2xl font-bold text-foreground mb-1">0</div>
                  <div className="text-sm text-muted-foreground">Hallucinations (Referenced)</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-muted/50 border-b border-border p-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-foreground/20" />
                    <div className="w-3 h-3 rounded-full bg-foreground/20" />
                    <div className="w-3 h-3 rounded-full bg-foreground/20" />
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">automated_review_log.txt</div>
                </div>
                <div className="p-6 font-mono text-sm space-y-4 h-[400px] overflow-hidden relative">
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent z-10" />

                  <div className="flex gap-3 text-emerald-600 dark:text-emerald-400 items-start">
                    <span className="text-muted-foreground select-none">01</span>
                    <span>[SUCCESS] Entity Structure mapped to K-1s</span>
                  </div>
                  <div className="flex gap-3 text-emerald-600 dark:text-emerald-400 items-start">
                    <span className="text-muted-foreground select-none">02</span>
                    <span>[SUCCESS] FEIN verified against master record</span>
                  </div>
                  <div className="flex gap-3 text-amber-600 dark:text-amber-400 items-start">
                    <span className="text-muted-foreground select-none">03</span>
                    <span>[WARNING] Depreciation method variance detected in Asset #4022</span>
                  </div>
                  <div className="pl-12 text-muted-foreground text-xs border-l border-border ml-5">
                    &gt; Reference: "2024 Depreciation Schedule.xlsx" Row 45<br />
                    &gt; Expected: MACRS 200DB<br />
                    &gt; Found: Straight Line
                  </div>
                  <div className="flex gap-3 text-sky-600 dark:text-sky-400 items-start">
                    <span className="text-muted-foreground select-none">04</span>
                    <span>[INFO] Generating review comment for Manager...</span>
                  </div>
                  <div className="flex gap-3 text-emerald-600 dark:text-emerald-400 items-start">
                    <span className="text-muted-foreground select-none">05</span>
                    <span>[SUCCESS] Cash reconciliation tied to bank statements</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative z-10 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full" />
            <div className="relative bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-12 md:p-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">Ready for the future of tax?</h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Join the top firms using Wavv to modernize their practice and empower their professionals.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/sign-up">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl">
                    Get Started Now
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-background text-muted-foreground text-sm relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-serif italic text-xs">w</span>
            </div>
            <span className="font-bold text-foreground">wavv</span>
          </div>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Security</Link>
          </div>
          <div>© 2026 Wavv AI Inc.</div>
        </div>
      </footer>
    </div>
  )
}

// ---------------- Support Components ----------------

function GlassCard({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
  return (
    <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
      <div className="mb-6 w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center group-hover:scale-110 transition-all">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">
        {description}
      </p>
    </div>
  )
}

function OrbitNode({ angle, distance, delay, icon, label }: { angle: number, distance: number, delay: number, icon: React.ReactNode, label: string }) {
  return (
    <motion.div
      className="absolute flex flex-col items-center gap-2"
      animate={{ rotate: 360 }}
      style={{
        width: 40,
        height: 40,
        transformOrigin: `50% 50%`
      }}
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-lg"
        style={{
          transform: `rotate(${angle}deg) translate(${distance}px) rotate(-${angle}deg)`
        }}
      >
        {icon}
        <div className="absolute top-full mt-2 text-[10px] font-mono whitespace-nowrap text-muted-foreground bg-popover border border-border px-1 rounded shadow-sm">
          {label}
        </div>
      </div>
    </motion.div>
  )
}


function DashboardScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 0.5], [100, 0])
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1])
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [20, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.9, 1])

  return (
    <div ref={containerRef} className="min-h-[80vh] w-full flex items-center justify-center perspective-[2000px] px-6 py-20 relative z-10">
      <motion.div
        style={{ y, opacity, rotateX, scale, transformPerspective: 2000 }}
        className="w-full max-w-6xl relative"
      >
        {/* Glow behind dashboard */}
        <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full z-0" />

        <div className="relative z-10 bg-background/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Bar */}
          <div className="h-14 border-b border-border bg-muted/30 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-border" />
                <div className="w-3 h-3 rounded-full bg-border" />
                <div className="w-3 h-3 rounded-full bg-border" />
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background px-2 py-1 rounded-md border border-border">
                <Users className="w-3 h-3" />
                <span>Project: Q4 Returns</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary-foreground" />
              </div>
              <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground">Export</Button>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="grid grid-cols-12 min-h-[500px] bg-background">
            {/* Text Sidebar */}
            <div className="hidden md:flex col-span-3 border-r border-border flex-col p-4 bg-muted/10">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Knowledge Sources</div>
              <div className="space-y-2">
                {['Prior Year Returns', 'K-1 Support', 'Brokerage Stmts', 'Emails: Client', 'IRC Section 163', 'Rev. Proc. 2023-1'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted cursor-pointer transition-colors group">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">AI Assistant</div>
              <div className="flex-1 bg-muted/20 rounded-xl p-3 border border-border relative overflow-hidden">
                <div className="space-y-3">
                  <div className="bg-primary/10 p-2 rounded-lg rounded-tl-none border border-primary/20">
                    <p className="text-xs text-foreground">I've analyzed the K-1s. There is a discrepancy in the Partner Capital Account on line L.</p>
                  </div>
                </div>
                <div className="absolute inset-x-3 bottom-3 h-8 bg-background rounded border border-border flex items-center px-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                </div>
              </div>
            </div>

            {/* Main View */}
            <div className="col-span-12 md:col-span-9 p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">Review Summary</h2>
                  <p className="text-muted-foreground text-sm">Automated analysis of 45 documents</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium">98% Confidence</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-5 rounded-xl bg-card border border-border">
                  <div className="text-sm text-muted-foreground mb-2">Total Adjustments Found</div>
                  <div className="text-3xl font-mono text-foreground">12</div>
                </div>
                <div className="p-5 rounded-xl bg-card border border-border">
                  <div className="text-sm text-muted-foreground mb-2">Time Saved</div>
                  <div className="text-3xl font-mono text-foreground">4.5 hrs</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">High Priority Flag</div>
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex gap-4">
                  <div className="mt-1">
                    <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center text-destructive font-bold text-xs">!</div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">Passive Activity Loss Limitation</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current calculation of $45,000 conflicts with prior year carryover data extracted from 2023 return ($32,000).
                      <span className="text-primary hover:underline cursor-pointer ml-1">View Calculation &gt;</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

'use client'

import { useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight, Check, Search, FileText, Database, Lock, Menu, X, Brain, Layers, Users, Sparkles, Zap, Command,
  CheckCircle2, Circle, FolderOpen, Clock, Calendar as CalendarIcon, ArrowUpRight, ListFilter, Plus,
  Briefcase, MessageSquarePlus, Home, PanelLeft, LayoutGrid, ChevronRight, ChevronDown, Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { ProjectCalendarView } from '@/components/projects/ProjectCalendarView'
import type { RecentItem, DashboardTask } from '@/lib/api'

const NAV_ITEMS = [
  { name: 'Product', href: '#product' },
  { name: 'Solutions', href: '#solutions' },
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
      <section id="product" className="py-24 relative z-10">
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
      <section id="solutions" className="py-32 relative z-10">
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
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
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
        className="w-full max-w-7xl relative"
      >
        {/* Glow behind dashboard */}
        <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full z-0" />

        <div className="relative z-10 bg-background/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden flex h-[800px]">
          {/* Static Sidebar */}
          <StaticSidebar />

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col bg-background">
            <div className="flex-1 overflow-y-auto w-full">
              <StaticHomePage />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ---------------- Dashboard Helpers ----------------

const MOCK_RECENTS: RecentItem[] = [
  { id: '1', type: 'project', name: 'Q4 Tax Returns', workspaceId: '1', workspaceName: 'My Workspace', updatedAt: new Date().toISOString(), icon: 'project', parentName: 'My Workspace', parentId: '1', status: null },
  { id: '2', type: 'task', name: 'Review 10-K Disclosures', workspaceId: '1', workspaceName: 'My Workspace', updatedAt: new Date(Date.now() - 3600000).toISOString(), icon: 'task', parentName: 'Annual Audit 2024', parentId: '2', status: null },
  { id: '3', type: 'workspace', name: 'Acme Corp Engagement', workspaceId: '2', workspaceName: 'Acme Corp', updatedAt: new Date(Date.now() - 86400000).toISOString(), icon: 'workspace', parentName: null, parentId: null, status: null },
  { id: '4', type: 'project', name: 'Estate Planning', workspaceId: '1', workspaceName: 'My Workspace', updatedAt: new Date(Date.now() - 172800000).toISOString(), icon: 'project', parentName: 'My Workspace', parentId: '1', status: null },
]

const MOCK_TASKS: DashboardTask[] = [
  {
    id: '1', name: 'Finalize Q3 Estimates', status: 'IN_PROGRESS', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), updatedAt: new Date().toISOString(), projectId: '1', dueAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    project: { id: '1', name: 'Q3 Prep', workspace: { id: '1', name: 'My Workspace' } }, preparers: [], reviewers: [], linkedFiles: [],
  },
  {
    id: '2', name: 'Client Onboarding - TechFlow Inc', status: 'PENDING', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString(), projectId: '2', dueAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    project: { id: '2', name: 'Onboarding', workspace: { id: '1', name: 'My Workspace' } }, preparers: [], reviewers: [], linkedFiles: [],
  },
  {
    id: '3', name: 'Review R&D Credit Calculation', status: 'IN_REVIEW', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), updatedAt: new Date().toISOString(), projectId: '1', dueAt: new Date(Date.now() - 86400000).toISOString(), // Overdue
    project: { id: '1', name: 'Tax Credits 2024', workspace: { id: '1', name: 'My Workspace' } }, preparers: [], reviewers: [], linkedFiles: [],
  },
  {
    id: '4', name: 'Send Engagement Letter', status: 'COMPLETED', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), updatedAt: new Date().toISOString(), projectId: '3', dueAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    project: { id: '3', name: 'Client Relations', workspace: { id: '1', name: 'My Workspace' } }, preparers: [], reviewers: [], linkedFiles: [],
  },
]

// Mocking calendar tasks by spreading mock tasks and adjusting dates for current week visualization
const today = new Date();
const currentDay = today.getDay(); // 0-6
const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
const monday = new Date(today);
monday.setDate(today.getDate() + mondayOffset);

const MOCK_CALENDAR_TASKS: DashboardTask[] = [
  { ...MOCK_TASKS[0], dueAt: new Date(monday.getTime() + 86400000).toISOString() }, // Tuesday
  { ...MOCK_TASKS[1], dueAt: new Date(monday.getTime() + 86400000 * 3).toISOString() }, // Thursday
  { ...MOCK_TASKS[2], dueAt: new Date(monday.getTime() + 86400000 * 4).toISOString() }, // Friday
  // Add one spread across days
  {
    id: '5', name: 'Audit Fieldwork', status: 'IN_PROGRESS', createdAt: new Date(monday.getTime()).toISOString(), updatedAt: new Date().toISOString(), projectId: '4', dueAt: new Date(monday.getTime() + 86400000 * 2).toISOString(),
    project: { id: '4', name: 'Audit 2024', workspace: { id: '1', name: 'My Workspace' } }, preparers: [], reviewers: [], linkedFiles: [],
  }
]


function StaticSidebar() {
  return (
    <div className="hidden md:flex flex-col w-[240px] border-r border-border bg-muted/10 h-full p-4 gap-2">
      <div className="flex items-center gap-2 px-2 pb-4">
        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-serif italic text-xs">w</span>
        </div>
        <span className="font-bold">wavv</span>
      </div>

      <div className="space-y-1">
        <Button variant="ghost" className="w-full justify-start gap-2 bg-sidebar-accent/50">
          <Home className="w-4 h-4" /> Home
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
          <MessageSquarePlus className="w-4 h-4" /> Chats
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
          <Search className="w-4 h-4" /> Search
        </Button>
      </div>

      <div className="mt-6">
        <div className="text-xs font-semibold text-muted-foreground px-2 mb-2">Workspaces</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-foreground rounded-md bg-muted/50">
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
            <Briefcase className="w-3.5 h-3.5 text-primary" />
            My Workspace
          </div>
          <div className="pl-6 space-y-1 mt-1">
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
              <FolderOpen className="w-3 h-3" /> Q4 Prep
            </div>
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
              <FolderOpen className="w-3 h-3" /> Annual Audit
            </div>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground rounded-md hover:bg-muted/30 cursor-pointer mt-2">
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
            <Briefcase className="w-3.5 h-3.5" />
            Acme Corp
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">MK</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Michael K.</div>
            <div className="text-xs text-muted-foreground truncate">Senior Manager</div>
          </div>
          <Settings className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}

function StaticHomePage() {
  return (
    <div className="h-full w-full bg-transparent p-6 flex flex-col gap-6 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Good afternoon, Michael
          </h1>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-8 h-full min-h-0">
          <MyWorkSection
            tasks={MOCK_TASKS}
            isLoading={false}
            onTaskClick={() => { }}
          />
        </div>
        <div className="lg:col-span-4 h-full flex flex-col gap-6 min-h-0">
          <div className="h-1/3 min-h-[200px] shrink-0">
            <RecentsSection
              items={MOCK_RECENTS}
              isLoading={false}
              onItemClick={() => { }}
            />
          </div>
          <div className="flex-1 min-h-0 bg-background/60 backdrop-blur-xl border border-border/50 shadow-sm rounded-xl overflow-hidden flex flex-col">
            <div className="border-b border-border/40 bg-muted/20 py-3 px-4 shrink-0">
              <span className="text-sm font-semibold flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                Smart Schedule
              </span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ScheduleList tasks={MOCK_CALENDAR_TASKS} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScheduleList({ tasks }: { tasks: DashboardTask[] }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const groups = useMemo(() => {
    const g: Record<string, DashboardTask[]> = {
      'Today': [],
      'Tomorrow': [],
      'Later': []
    }

    tasks.forEach(t => {
      if (!t.dueAt) return
      const d = new Date(t.dueAt)
      d.setHours(0, 0, 0, 0)

      if (d.getTime() === today.getTime()) g['Today'].push(t)
      else if (d.getTime() === tomorrow.getTime()) g['Tomorrow'].push(t)
      else g['Later'].push(t)
    })

    return g
  }, [tasks])

  return (
    <div className="p-0">
      {Object.entries(groups).map(([label, groupTasks]) => {
        if (groupTasks.length === 0) return null
        return (
          <div key={label} className="mb-2">
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/10 sticky top-0 backdrop-blur-sm z-10">
              {label}
            </div>
            <div className="px-2">
              {groupTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-muted/40 rounded-md group transition-colors cursor-pointer">
                  <div className="w-1 h-8 rounded-full bg-primary/20 shrink-0 group-hover:bg-primary transition-colors" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{task.name}</div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(task.dueAt!).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
      {Object.values(groups).every(g => g.length === 0) && (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground p-4 text-center">
          <CalendarIcon className="w-8 h-8 mb-2 opacity-20" />
          <p className="text-sm">No upcoming tasks scheduled</p>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon, trend, colorClass = "bg-primary/10 text-primary" }: any) {
  return (
    <Card className="group relative overflow-hidden bg-background/60 backdrop-blur-xl border-border/50 shadow-sm hover:border-primary/20 hover:shadow-md transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110", colorClass)}>
            {icon}
          </div>
          {trend && (
            <div className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
              {trend}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="text-3xl font-bold text-foreground tracking-tight">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    case 'IN_PROGRESS':
      return <Circle className="h-4 w-4 text-primary fill-primary/20" />
    case 'IN_REVIEW':
      return <Circle className="h-4 w-4 text-amber-500 fill-amber-500/20" />
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />
  }
}

function ItemIcon({ type }: { type: string }) {
  switch (type) {
    case 'workspace':
      return <Layers className="h-4 w-4 text-primary" />
    case 'project':
      return <FolderOpen className="h-4 w-4 text-blue-500" />
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />
  }
}

function RecentsSection({ items, isLoading, onItemClick }: any) {
  return (
    <Card className="h-full bg-background/60 backdrop-blur-xl border-border/50 shadow-sm flex flex-col overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20 py-3 px-4 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Recent Activity
          </CardTitle>
        </div>
      </CardHeader>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {items.map((item: any) => (
            <button
              key={`${item.type}-${item.id}`}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 hover:border-primary/10 border border-transparent transition-all group text-left"
            >
              <div className="p-1.5 rounded-md bg-muted/40 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <ItemIcon type={item.type} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-foreground truncate block group-hover:text-primary transition-colors">
                  {item.name}
                </span>
                {item.parentName && (
                  <span className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                    in {item.parentName}
                  </span>
                )}
              </div>
            </button>
          ))
          }
        </div>
      </ScrollArea>
    </Card>
  )
}

function MyWorkSection({ tasks, isLoading, onTaskClick }: any) {
  const [activeTab, setActiveTab] = useState<'todo' | 'done'>('todo')

  // Simple filter for mock
  const displayTasks = activeTab === 'done' ? tasks.filter((t: any) => t.status === 'COMPLETED') : tasks.filter((t: any) => t.status !== 'COMPLETED')

  return (
    <Card className="h-full bg-background/60 backdrop-blur-xl border-border/50 shadow-sm flex flex-col overflow-hidden">
      <CardHeader className="pb-0 border-b border-border/40 bg-muted/20 py-3 px-4 mb-0 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            My Tasks
          </CardTitle>
          <div className="flex p-0.5 bg-muted/50 rounded-lg border border-border/20">
            <button
              onClick={() => setActiveTab('todo')}
              className={cn(
                "text-[10px] font-medium px-2 py-1 rounded-sm transition-all",
                activeTab === 'todo' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              To Do
            </button>
            <button
              onClick={() => setActiveTab('done')}
              className={cn(
                "text-[10px] font-medium px-2 py-1 rounded-sm transition-all",
                activeTab === 'done' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Done
            </button>
          </div>
        </div>
      </CardHeader>
      <ScrollArea className="flex-1">
        <div className="p-0 space-y-0 divide-y divide-border/20">
          {displayTasks.map((task: any) => {
            const dueDate = task.dueAt ? new Date(task.dueAt) : null
            const isOverdue = dueDate && dueDate < new Date() && task.status !== 'COMPLETED'

            return (
              <button
                key={task.id}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-all group text-left relative"
                onClick={() => onTaskClick(task)}
              >
                <div className="shrink-0">
                  <StatusIcon status={task.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-sm font-medium truncate block transition-colors",
                    task.status === 'COMPLETED' ? "text-muted-foreground line-through" : "text-foreground group-hover:text-primary"
                  )}>
                    {task.name}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  <span className="flex items-center gap-1.5 opacity-70">
                    <FolderOpen className="w-3 h-3" />
                    <span className="truncate max-w-[100px]">{task.project.name}</span>
                  </span>

                  {dueDate && (
                    <span className={cn(
                      "flex items-center gap-1.5 transition-colors",
                      isOverdue
                        ? "text-red-500 font-medium"
                        : "opacity-70"
                    )}>
                      <CalendarIcon className="w-3 h-3" />
                      {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>

                <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </button>
            )
          })
          }
        </div>
      </ScrollArea>
    </Card>
  )
}

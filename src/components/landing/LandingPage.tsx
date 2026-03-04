'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
    ArrowRight,
    Search,
    FileText,
    Database,
    Brain,
    Layers,
    Users,
    BookOpen,
    Briefcase,
    Check,
    ShieldCheck,
    Clock,
    FileSearch,
    Home,
    MessageSquare,
    Folder,
    CheckCircle2,
    Circle,
    Settings,
    Plus,
    Filter,
    ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip';
import {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent,
} from '@/components/ui/hover-card';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RetroWaterAnimation } from './RetroWaterAnimation';
import { ExcelGridBackground } from './ExcelGridBackground';
import { ReviewerFlowAnimation } from './ReviewerFlowAnimation';
import { AppBar } from '@/components/AppBar';
import { Footer } from '@/components/Footer';

const NAV_ITEMS = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Why Wavv', href: '#why-wavv' },
];

export function LandingPage() {
    return (
        <div className="min-h-screen text-steel-950 overflow-x-hidden bg-white font-sf-pro">
            {/* Navigation - no login button */}
            <AppBar navItems={NAV_ITEMS} showLoginLink={false} />

            {/* Hero Section */}
            <HeroSection />

            {/* Problem Section */}
            <ProblemSection />

            {/* Solution Section */}
            <SolutionSection />

            {/* Features Section */}
            <FeaturesSection />

            {/* Testimonial Section */}
            <TestimonialSection />

            {/* FAQ Section */}
            <FAQSection />

            {/* CTA Section */}
            <CTASection />

            {/* Footer */}
            <Footer />
        </div>
    );
}

// ============ HERO SECTION ============
function HeroSection() {
    return (
        <section className="relative pt-32 pb-16 md:pt-40 md:pb-20">
            {/* Animated water background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <RetroWaterAnimation intensity="medium" />
            </div>

            <div className="max-w-4xl mx-auto px-6 relative z-10">
                {/* Semi-transparent backdrop for text readability */}
                <div className="flex flex-col items-center text-center bg-white/92 backdrop-blur-md rounded-2xl py-10 px-6 md:py-14 md:px-10 border border-steel-200/60 shadow-xl">
                    {/* Eyebrow label */}

                    {/* Main Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.65,
                            delay: 0.05,
                            ease: 'easeOut',
                        }}
                        className="text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight mb-5 leading-[1.05] text-steel-950"
                    >
                        Tax Intelligence,
                        <br />
                        <span className="italic font-normal text-steel-600">
                            Unleashed.
                        </span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.65,
                            delay: 0.1,
                            ease: 'easeOut',
                        }}
                        className="text-base md:text-lg max-w-xl leading-relaxed mb-8 text-steel-600"
                    >
                        The unified AI workspace where tax professionals find
                        answers, automate reviews, and reclaim time.
                    </motion.p>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.65,
                            delay: 0.15,
                            ease: 'easeOut',
                        }}
                        className="flex flex-col sm:flex-row items-center gap-3"
                    >
                        <Link href="/contact">
                            <Button
                                size="lg"
                                className="h-11 px-8 text-sm font-medium rounded-lg"
                            >
                                Request Access
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>

                {/* Dashboard Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.9,
                        delay: 0.2,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    className="mt-48 md:mt-64 relative"
                >
                    <DashboardPreview />
                </motion.div>
            </div>
        </section>
    );
}

// ============ DASHBOARD PREVIEW ============
function DashboardPreview() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    const tasks = [
        {
            status: 'complete',
            name: 'Form 1120 — Annual Corporate Return',
            assignee: 'SC',
            date: 'Dec 15',
            badge: 'Complete',
        },
        {
            status: 'review',
            name: 'R&D Credit Analysis — Client ABC',
            assignee: 'MT',
            date: 'Dec 18',
            badge: 'In Review',
        },
        {
            status: 'pending',
            name: 'State Apportionment Schedule',
            assignee: 'LK',
            date: 'Dec 22',
            badge: 'Pending',
        },
        {
            status: 'pending',
            name: 'FY2024 Tax Provision Workpaper',
            assignee: '—',
            date: 'Jan 5',
            badge: 'Pending',
        },
    ];

    const statusColors: Record<
        string,
        { bg: string; text: string; dot: string }
    > = {
        complete: {
            bg: '#f0fdf4',
            text: '#15803d',
            dot: '#16a34a',
        },
        review: {
            bg: '#eff6ff',
            text: '#1d4ed8',
            dot: '#3b82f6',
        },
        pending: {
            bg: '#f8fafc',
            text: '#475569',
            dot: '#94a3b8',
        },
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto max-w-5xl"
        >
            {/* Subtle glow */}
            <div
                className="absolute -inset-6 rounded-3xl blur-3xl opacity-20"
                style={{
                    background:
                        'radial-gradient(circle at center, rgba(30,41,59,0.15), transparent 70%)',
                }}
            />

            {/* Main container */}
            <div
                className="relative rounded-2xl border shadow-2xl overflow-hidden"
                style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#d1d5db',
                    boxShadow:
                        '0 25px 60px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)',
                }}
            >
                {/* Browser chrome */}
                <div
                    className="h-9 px-4 flex items-center gap-2 border-b"
                    style={{
                        backgroundColor: '#f1f5f9',
                        borderColor: '#e2e8f0',
                    }}
                >
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    </div>
                    <div
                        className="flex-1 mx-8 h-5 rounded flex items-center px-3 text-[11px]"
                        style={{
                            backgroundColor: '#ffffff',
                            color: '#94a3b8',
                        }}
                    >
                        wavvtax.com/workspaces/q4-review
                    </div>
                </div>

                {/* App layout */}
                <div className="flex h-120">
                    {/* Sidebar */}
                    <div
                        className="hidden md:flex flex-col w-52 border-r shrink-0"
                        style={{
                            backgroundColor: '#f8fafc',
                            borderColor: '#e2e8f0',
                        }}
                    >
                        {/* User header */}
                        <div
                            className="px-3 py-3 border-b flex items-center gap-2"
                            style={{ borderColor: '#e2e8f0' }}
                        >
                            <div
                                className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                                style={{ backgroundColor: '#1e293b' }}
                            >
                                <span className="text-white font-sf-pro italic text-[11px] font-semibold">
                                    w
                                </span>
                            </div>
                            <div className="min-w-0">
                                <div className="text-[12px] font-semibold text-[#0b1120] leading-tight truncate">
                                    Sarah Chen
                                </div>
                                <div className="text-[10px] text-[#64748b] leading-tight truncate">
                                    Meridian Tax Group
                                </div>
                            </div>
                        </div>

                        {/* Primary nav */}
                        <div className="px-2 pt-2 space-y-0.5">
                            {[
                                { icon: Home, label: 'Home', active: false },
                                {
                                    icon: MessageSquare,
                                    label: 'Conversations',
                                    active: false,
                                },
                                {
                                    icon: Settings,
                                    label: 'Settings',
                                    active: false,
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded text-[12px] transition-colors"
                                    style={{
                                        color: item.active
                                            ? '#0b1120'
                                            : '#475569',
                                        backgroundColor: item.active
                                            ? '#e2e8f0'
                                            : 'transparent',
                                    }}
                                >
                                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                                    {item.label}
                                </div>
                            ))}
                        </div>

                        {/* Workspaces section */}
                        <div className="px-2 pt-4">
                            <div className="text-[9px] font-semibold uppercase tracking-widest text-[#94a3b8] px-2 mb-1.5">
                                Workspaces
                            </div>
                            <div className="space-y-0.5">
                                {[
                                    {
                                        label: 'Q4 2024 Review',
                                        active: true,
                                    },
                                    {
                                        label: 'Client Onboarding',
                                        active: false,
                                    },
                                    {
                                        label: 'R&D Credits',
                                        active: false,
                                    },
                                ].map((ws) => (
                                    <div
                                        key={ws.label}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded text-[12px]"
                                        style={{
                                            color: ws.active
                                                ? '#0b1120'
                                                : '#475569',
                                            backgroundColor: ws.active
                                                ? '#e2e8f0'
                                                : 'transparent',
                                            fontWeight: ws.active ? 500 : 400,
                                        }}
                                    >
                                        <Folder
                                            className="w-3 h-3 shrink-0"
                                            style={{
                                                color: ws.active
                                                    ? '#475569'
                                                    : '#94a3b8',
                                            }}
                                        />
                                        <span className="truncate">
                                            {ws.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div
                        className="flex-1 flex flex-col overflow-hidden"
                        style={{ backgroundColor: '#FFFFFF' }}
                    >
                        {/* Project header */}
                        <div
                            className="px-5 py-3 border-b flex items-center justify-between gap-3"
                            style={{ borderColor: '#e2e8f0' }}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <ChevronLeft className="w-4 h-4 text-[#94a3b8] shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[13px] font-semibold text-[#0b1120] truncate">
                                        Q4 Tax Review — Meridian Tax
                                    </div>
                                    <div className="text-[10px] text-[#94a3b8]">
                                        4 tasks · 1 complete
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <div
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] text-[#475569]"
                                    style={{ borderColor: '#e2e8f0' }}
                                >
                                    <Filter className="w-3 h-3" />
                                    Filter
                                </div>
                                <div
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] text-white font-medium"
                                    style={{ backgroundColor: '#1e293b' }}
                                >
                                    <Plus className="w-3 h-3" />
                                    New Task
                                </div>
                            </div>
                        </div>

                        {/* Task list */}
                        <div className="flex-1 overflow-y-auto">
                            {/* Column headers */}
                            <div
                                className="grid px-5 py-2 border-b text-[10px] font-medium uppercase tracking-wider text-[#94a3b8]"
                                style={{
                                    borderColor: '#f1f5f9',
                                    gridTemplateColumns: '1fr 90px 48px 56px',
                                }}
                            >
                                <span>Task</span>
                                <span>Status</span>
                                <span>Owner</span>
                                <span>Due</span>
                            </div>

                            {tasks.map((task, i) => {
                                const colors = statusColors[task.status];
                                return (
                                    <motion.div
                                        key={task.name}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={
                                            isInView ? { opacity: 1, x: 0 } : {}
                                        }
                                        transition={{
                                            duration: 0.5,
                                            delay: 0.15 + i * 0.07,
                                            ease: 'easeOut',
                                        }}
                                        className="grid px-5 py-3 border-b items-center hover:bg-[#f8fafc] transition-colors cursor-pointer"
                                        style={{
                                            borderColor: '#f1f5f9',
                                            gridTemplateColumns:
                                                '1fr 90px 48px 56px',
                                        }}
                                    >
                                        {/* Task name */}
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {task.status === 'complete' ? (
                                                <CheckCircle2
                                                    className="w-3.5 h-3.5 shrink-0"
                                                    style={{
                                                        color: colors.dot,
                                                    }}
                                                />
                                            ) : (
                                                <Circle
                                                    className="w-3.5 h-3.5 shrink-0"
                                                    style={{
                                                        color: colors.dot,
                                                    }}
                                                />
                                            )}
                                            <span
                                                className="text-[12px] truncate"
                                                style={{
                                                    color:
                                                        task.status ===
                                                        'complete'
                                                            ? '#94a3b8'
                                                            : '#0b1120',
                                                    textDecoration:
                                                        task.status ===
                                                        'complete'
                                                            ? 'line-through'
                                                            : 'none',
                                                }}
                                            >
                                                {task.name}
                                            </span>
                                        </div>

                                        {/* Status badge */}
                                        <div>
                                            <span
                                                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium"
                                                style={{
                                                    backgroundColor: colors.bg,
                                                    color: colors.text,
                                                }}
                                            >
                                                {task.badge}
                                            </span>
                                        </div>

                                        {/* Assignee */}
                                        <div>
                                            {task.assignee !== '—' ? (
                                                <div
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold text-white"
                                                    style={{
                                                        backgroundColor:
                                                            '#475569',
                                                    }}
                                                >
                                                    {task.assignee}
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-[#cbd5e1]">
                                                    —
                                                </span>
                                            )}
                                        </div>

                                        {/* Due date */}
                                        <div className="text-[11px] text-[#94a3b8]">
                                            {task.date}
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {/* Add task row */}
                            <div className="px-5 py-2.5 flex items-center gap-2.5 text-[12px] text-[#cbd5e1] hover:text-[#94a3b8] cursor-pointer transition-colors">
                                <Plus className="w-3.5 h-3.5" />
                                Add task...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ============ PROBLEM SECTION ============
function ProblemSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    const problems = [
        {
            icon: Clock,
            title: 'Manual Processes',
            description:
                'Endless switching between tools. Repetitive tasks consuming valuable time. Your team deserves better.',
        },
        {
            icon: FileSearch,
            title: 'Lost Knowledge',
            description:
                'Critical information buried in SharePoint. Tribal knowledge walking out the door with every resignation.',
        },
        {
            icon: Users,
            title: 'Turnover Chaos',
            description:
                'New hires take months to ramp. Training costs compound. Margins shrink.',
        },
    ];

    return (
        <section
            ref={ref}
            className="py-24 md:py-32 relative overflow-hidden"
            style={{ backgroundColor: '#f8fafc' }}
        >
            <div className="max-w-6xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-serif mb-5 leading-tight text-steel-950">
                        The Reality of Tax Work
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto leading-relaxed text-steel-500">
                        Your profession demands precision. Your tools should
                        rise to meet it.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                    {problems.map((problem, i) => (
                        <motion.div
                            key={problem.title}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{
                                duration: 0.6,
                                delay: i * 0.08,
                                ease: 'easeOut',
                            }}
                        >
                            <Card
                                className="h-full rounded-xl border shadow-none gap-0 py-0 bg-white"
                                style={{ borderColor: '#e2e8f0' }}
                            >
                                <CardHeader className="px-6 pt-6 pb-0">
                                    <div
                                        className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                                        style={{ backgroundColor: '#0f172a' }}
                                    >
                                        <problem.icon className="w-4 h-4 text-white" />
                                    </div>
                                    <CardTitle className="text-lg font-serif text-steel-950">
                                        {problem.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 pb-6 pt-2">
                                    <p className="leading-relaxed text-[13px] text-steel-500">
                                        {problem.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============ SOLUTION SECTION ============
function SolutionSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    const features = [
        {
            icon: Search,
            title: 'Unified Search',
            description:
                'Query SharePoint, internal documents, and client files from a single search bar. Relevance-ranked with citations.',
            tooltip: 'Search across all your firm data in one place',
        },
        {
            icon: Brain,
            title: 'AI Assistant',
            description:
                'Natural-language Q&A over your documents. Get summaries, comparisons, and explanations instantly.',
            tooltip: 'Powered by advanced language models trained on tax law',
        },
        {
            icon: Layers,
            title: 'Semantic Understanding',
            description:
                'Not just keywords — Wavv understands tax concepts and connects related documents intelligently.',
            tooltip: 'Deep semantic indexing beyond keyword matching',
        },
        {
            icon: ShieldCheck,
            title: 'Secure & Private',
            description:
                "Enterprise-grade security with role-based access. Your firm's data stays exclusively yours.",
            tooltip: 'SOC 2 compliant with end-to-end encryption',
        },
    ];

    return (
        <section
            id="features"
            ref={ref}
            className="min-h-screen py-24 md:py-32 scroll-mt-20 relative overflow-hidden flex items-center"
            style={{ backgroundColor: '#FFFFFF' }}
        >
            {/* Subtle grid overlay */}
            <ExcelGridBackground className="z-0 opacity-50" />

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-serif mb-5 leading-tight text-steel-950">
                        One Hub. All Answers.
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto leading-relaxed text-steel-500">
                        Stop switching between twelve tabs. Wavv unifies your
                        internal knowledge with external tax authority in a
                        single, intelligent search.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Features list */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{
                            duration: 0.6,
                            delay: 0.08,
                            ease: 'easeOut',
                        }}
                        className="space-y-4"
                    >
                        {features.map((feature) => (
                            <HoverCard
                                key={feature.title}
                                openDelay={150}
                                closeDelay={100}
                            >
                                <HoverCardTrigger asChild>
                                    <div
                                        className="flex gap-3 p-5 rounded-xl border transition-all hover:shadow-md hover:border-steel-300 cursor-pointer bg-white"
                                        style={{ borderColor: '#e2e8f0' }}
                                    >
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 cursor-default"
                                                    style={{
                                                        backgroundColor:
                                                            '#0f172a',
                                                    }}
                                                >
                                                    <feature.icon className="w-4 h-4 text-white" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="left"
                                                className="text-xs max-w-45"
                                            >
                                                {feature.tooltip}
                                            </TooltipContent>
                                        </Tooltip>
                                        <div>
                                            <h4 className="font-serif text-base mb-1 text-steel-950">
                                                {feature.title}
                                            </h4>
                                            <p className="text-sm leading-relaxed text-steel-500">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </HoverCardTrigger>
                                <HoverCardContent
                                    side="right"
                                    className="w-72 border-steel-200 shadow-lg bg-white"
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                                            style={{
                                                backgroundColor: '#0f172a',
                                            }}
                                        >
                                            <feature.icon className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-serif text-sm mb-1 text-steel-950">
                                                {feature.title}
                                            </p>
                                            <p className="text-xs leading-relaxed text-steel-500">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </HoverCardContent>
                            </HoverCard>
                        ))}
                    </motion.div>

                    {/* Knowledge graph visualization */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{
                            duration: 0.6,
                            delay: 0.08,
                            ease: 'easeOut',
                        }}
                        className="relative"
                    >
                        <KnowledgeGraphVisualization />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// ============ KNOWLEDGE GRAPH VISUALIZATION ============
function KnowledgeGraphVisualization() {
    const graphNodes = [
        {
            angle: 0,
            icon: FileText,
            label: '10-K Filing',
            fallback: '10K',
            color: '#475569',
            description:
                'Annual SEC filings and financial disclosures indexed for instant retrieval.',
        },
        {
            angle: 72,
            icon: Database,
            label: 'SharePoint',
            fallback: 'SP',
            color: '#475569',
            description:
                'Your firm SharePoint fully integrated — no manual sync required.',
        },
        {
            angle: 144,
            icon: BookOpen,
            label: 'Tax Research',
            fallback: 'TR',
            color: '#475569',
            description:
                'Internal research memos and external tax authority in one index.',
        },
        {
            angle: 216,
            icon: Briefcase,
            label: 'Workpapers',
            fallback: 'WP',
            color: '#475569',
            description:
                'Historic workpapers surfaced automatically when you need them.',
        },
        {
            angle: 288,
            icon: Briefcase,
            label: 'Client Files',
            fallback: 'CF',
            color: '#475569',
            description:
                'Client engagement files organized and searchable across all engagements.',
        },
    ];

    return (
        <div
            className="aspect-square relative rounded-xl border p-8 z-20 bg-white"
            style={{ borderColor: '#e2e8f0' }}
        >
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <circle
                    cx="50%"
                    cy="50%"
                    r="105"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.6"
                />
            </svg>

            {/* Center node */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <motion.div
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    className="rounded-xl flex items-center justify-center shadow-lg"
                    style={{
                        backgroundColor: '#0f172a',
                        width: 60,
                        height: 60,
                    }}
                >
                    <Brain className="w-7 h-7 text-white" />
                </motion.div>
            </div>

            {/* Orbiting nodes */}
            {graphNodes.map((node) => {
                const x = Math.cos((node.angle * Math.PI) / 180) * 105;
                const y = Math.sin((node.angle * Math.PI) / 180) * 105;

                return (
                    <motion.div
                        key={node.label}
                        className="absolute top-1/2 left-1/2 flex flex-col items-center gap-2 z-10"
                        style={{
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: node.angle / 360 + 0.5 }}
                    >
                        <HoverCard openDelay={200} closeDelay={100}>
                            <HoverCardTrigger asChild>
                                <div className="flex flex-col items-center gap-2 cursor-pointer">
                                    <Avatar
                                        className="w-9 h-9 rounded-lg border border-steel-200 shadow-sm"
                                        style={{
                                            backgroundColor: node.color,
                                        }}
                                    >
                                        <AvatarFallback
                                            className="rounded-lg text-white text-xs font-medium"
                                            style={{
                                                backgroundColor: node.color,
                                            }}
                                        >
                                            <node.icon className="w-4.5 h-4.5 text-white" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <span
                                        className="text-[10px] font-medium whitespace-nowrap px-1.5 py-0.5 rounded"
                                        style={{
                                            backgroundColor: '#f1f5f9',
                                            color: '#475569',
                                        }}
                                    >
                                        {node.label}
                                    </span>
                                </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-52 border-steel-200 shadow-lg text-xs bg-white">
                                <div className="flex items-start gap-2">
                                    <div
                                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                                        style={{
                                            backgroundColor: node.color,
                                        }}
                                    >
                                        <node.icon className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-serif text-sm mb-1 text-steel-950">
                                            {node.label}
                                        </p>
                                        <p className="text-steel-500">
                                            {node.description}
                                        </p>
                                    </div>
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    </motion.div>
                );
            })}
        </div>
    );
}

// ============ FEATURES SECTION (Reviewer Flow) ============
function FeaturesSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    const checklistItems = [
        'Drag-and-drop reviewer assignment',
        'Multi-level approval chains',
        'Real-time status tracking',
        'Automated notifications',
        'Audit-ready documentation',
    ];

    return (
        <section
            id="how-it-works"
            ref={ref}
            className="min-h-screen py-24 md:py-32 scroll-mt-20 relative overflow-hidden flex items-center"
            style={{ backgroundColor: '#f8fafc' }}
        >
            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-serif mb-5 leading-tight text-steel-950">
                        Built for How You Work
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto leading-relaxed text-steel-500">
                        From task creation to multi-level review approval, Wavv
                        streamlines your entire workflow.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Text content */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{
                            duration: 0.6,
                            delay: 0.08,
                            ease: 'easeOut',
                        }}
                    >
                        <h3 className="text-2xl md:text-3xl font-serif mb-6 leading-tight text-steel-950">
                            Automated Review Workflows
                        </h3>

                        <div className="space-y-4">
                            {checklistItems.map((item, i) => (
                                <motion.div
                                    key={item}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={
                                        isInView ? { opacity: 1, x: 0 } : {}
                                    }
                                    transition={{
                                        duration: 0.5,
                                        delay: i * 0.07,
                                        ease: 'easeOut',
                                    }}
                                    className="flex items-center gap-3"
                                >
                                    <div
                                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: '#0f172a' }}
                                    >
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="text-steel-600">
                                        {item}
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        <Separator
                            className="my-8"
                            style={{ backgroundColor: '#e2e8f0' }}
                        />

                        <p className="text-sm leading-relaxed italic text-steel-400">
                            Designed with tax professionals in mind — every step
                            of the review process is tracked, auditable, and
                            built for compliance.
                        </p>
                    </motion.div>

                    {/* Reviewer Flow Animation */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{
                            duration: 0.6,
                            delay: 0.08,
                            ease: 'easeOut',
                        }}
                        className="hidden lg:block"
                    >
                        <ReviewerFlowAnimation />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// ============ TESTIMONIAL SECTION ============
function TestimonialSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section
            id="why-wavv"
            ref={ref}
            className="py-24 md:py-32 scroll-mt-20 relative overflow-hidden"
            style={{ backgroundColor: '#FFFFFF' }}
        >
            <div className="max-w-5xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="text-center mb-14"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-steel-200 bg-steel-50 text-xs font-medium text-steel-600 tracking-wide uppercase mb-5">
                        Backed by Industry Veterans
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif leading-tight text-steel-950">
                        Built with practitioners,
                        <br />
                        <span className="italic font-normal text-steel-500">
                            for practitioners.
                        </span>
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.65, delay: 0.1, ease: 'easeOut' }}
                    className="relative"
                >
                    {/* Quote card */}
                    <div
                        className="rounded-2xl border p-8 md:p-10 relative overflow-hidden bg-white"
                        style={{ borderColor: '#e2e8f0' }}
                    >
                        {/* Large decorative quote mark */}
                        <div
                            className="absolute top-6 left-8 font-sf-pro text-[90px] leading-none select-none pointer-events-none"
                            style={{ color: '#f1f5f9' }}
                            aria-hidden
                        >
                            &ldquo;
                        </div>

                        <div className="relative z-10">
                            <blockquote className="text-lg md:text-xl font-serif leading-relaxed text-steel-800 mb-8">
                                I've spent over two decades navigating some of
                                the most complex tax environments in the world —
                                Big 4 firms, Fortune 500 treasury departments.
                                The inefficiencies in tax workflows have been a
                                persistent pain point throughout my entire
                                career. Wavv is the first platform I've seen
                                that genuinely addresses how modern tax teams
                                actually operate. This will change the industry.
                            </blockquote>

                            <div className="flex items-center gap-5">
                                {/* Avatar */}
                                <div
                                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-sf-pro font-bold text-base shrink-0"
                                    style={{ backgroundColor: '#0f172a' }}
                                >
                                    R
                                </div>

                                <div>
                                    <div className="font-semibold text-steel-950 text-base">
                                        Frank C., CPA
                                    </div>
                                    <div className="text-sm text-steel-500 mt-0.5">
                                        20+ Year Tax Veteran · Former Big 4
                                        Partner · Fortune 500 Tax Executive
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <Badge
                                            className="text-[10px] px-2 py-0.5 font-medium rounded border-0"
                                            style={{
                                                backgroundColor: '#f0fdf4',
                                                color: '#15803d',
                                            }}
                                        >
                                            Advisor &amp; Investor
                                        </Badge>
                                        <Badge
                                            className="text-[10px] px-2 py-0.5 font-medium rounded border-0"
                                            style={{
                                                backgroundColor: '#f8fafc',
                                                color: '#475569',
                                            }}
                                        >
                                            Tax Strategy
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Supporting stats */}
                    <div
                        className="grid grid-cols-3 gap-px mt-px overflow-hidden rounded-xl border"
                        style={{ borderColor: '#e2e8f0' }}
                    >
                        {[
                            { value: '20+', label: 'Years in Tax Practice' },
                            { value: 'Big 4', label: 'Firm Experience' },
                            { value: 'F500', label: 'Corporate Background' },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className="py-4 text-center bg-white"
                                style={{ borderColor: '#e2e8f0' }}
                            >
                                <div className="text-xl font-serif text-steel-950 mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-xs text-steel-400 font-medium">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ============ FAQ SECTION ============
function FAQSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    const faqs = [
        {
            value: 'faq-1',
            question: 'How does Wavv integrate with our existing firm tools?',
            answer: 'Wavv connects directly to your existing SharePoint environment, internal document stores, and client file systems through secure OAuth integrations. Setup typically takes less than a day and requires no changes to your current workflows. Your data stays in your existing infrastructure — Wavv indexes it without copying it to external servers.',
        },
        {
            value: 'faq-2',
            question:
                'Is our client data safe and compliant with data protection regulations?',
            answer: 'Absolutely. Wavv is built with enterprise-grade security from the ground up. All data is encrypted at rest and in transit. Role-based access controls ensure each team member only sees what they are authorized to see. We are actively pursuing SOC 2 Type II certification, and our architecture is designed for compliance with IRS data security standards and client confidentiality obligations.',
        },
        {
            value: 'faq-3',
            question:
                'How accurate is the AI when answering tax research questions?',
            answer: 'Wavv answers questions grounded in your own firm documents and verified tax authority — not hallucinated general knowledge. Every answer is accompanied by citations to the underlying source documents so your team can verify the reasoning. Wavv surfaces what exists in your knowledge base; it does not fabricate statutes or create unsupported conclusions.',
        },
        {
            value: 'faq-4',
            question:
                'What does onboarding look like and how quickly can our team get up to speed?',
            answer: 'Most firms are fully operational within one to two weeks. We provide a dedicated onboarding specialist who configures your integrations, helps curate your initial document index, and trains your team on search and review workflows. Because Wavv is designed to feel familiar — it works like a smart search bar — the learning curve is minimal even for non-technical staff.',
        },
    ];

    return (
        <section
            ref={ref}
            className="py-24 md:py-32 relative overflow-hidden"
            style={{ backgroundColor: '#f8fafc' }}
        >
            <div className="max-w-3xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-serif mb-5 leading-tight text-steel-950">
                        Common Questions
                    </h2>
                    <p className="text-lg max-w-xl mx-auto leading-relaxed text-steel-500">
                        Everything you need to know before bringing Wavv to your
                        firm.
                    </p>
                </motion.div>

                <Separator
                    className="mb-8"
                    style={{ backgroundColor: '#e2e8f0' }}
                />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.65, delay: 0.1, ease: 'easeOut' }}
                >
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq) => (
                            <AccordionItem
                                key={faq.value}
                                value={faq.value}
                                className="border-b"
                                style={{ borderColor: '#e2e8f0' }}
                            >
                                <AccordionTrigger className="font-serif text-base text-left hover:no-underline py-5 text-steel-950 cursor-pointer">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-sm leading-relaxed pb-5 text-steel-500">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </motion.div>

                <Separator
                    className="mt-8"
                    style={{ backgroundColor: '#e2e8f0' }}
                />
            </div>
        </section>
    );
}

// ============ CTA SECTION ============
function CTASection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section
            ref={ref}
            className="py-32 md:py-40 relative overflow-hidden"
            style={{ backgroundColor: '#FFFFFF' }}
        >
            <div className="max-w-4xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="text-center"
                >
                    {/* Accent line */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={isInView ? { width: '48px' } : {}}
                        transition={{
                            duration: 0.6,
                            delay: 0.1,
                            ease: 'easeOut',
                        }}
                        className="h-px mx-auto mb-10"
                        style={{ backgroundColor: '#0f172a' }}
                    />

                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif mb-6 leading-tight text-steel-950">
                        Join the firms that work like the 1%.
                    </h2>

                    <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed text-steel-500">
                        See how Wavv transforms tax practice. Schedule a
                        personalized demo with our team.
                    </p>

                    <Link href="/contact">
                        <Button
                            size="lg"
                            className="h-13 px-12 text-base font-medium rounded-lg transition-all hover:scale-[1.02] shadow-sm group"
                            style={{
                                backgroundColor: '#0f172a',
                                color: 'white',
                            }}
                        >
                            Request Access
                            <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}

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
    FolderOpen,
    Rocket,
    Shield,
    Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
        <div className="min-h-screen text-steel-950 overflow-x-hidden bg-white">
            {/* Navigation */}
            <AppBar navItems={NAV_ITEMS} />

            {/* Hero Section */}
            <HeroSection />

            {/* Problem Section */}
            <ProblemSection />

            {/* Solution Section */}
            <SolutionSection />

            {/* Features Section */}
            <FeaturesSection />

            {/* Roadmap Section - Future Endeavors */}
            <RoadmapSection />

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
                <div className="flex flex-col items-center text-center bg-white/90 backdrop-blur-md rounded-3xl py-10 px-6 md:py-14 md:px-10 border border-white/40 shadow-2xl shadow-black/5">
                    {/* Main Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 }}
                        className="text-3xl md:text-5xl lg:text-6xl font-serif font-normal tracking-tight mb-5 leading-[1.05] text-steel-950"
                    >
                        Tax Intelligence,
                        <br />
                        <span className="italic text-steel-600">
                            Unleashed.
                        </span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 }}
                        className="font-sans text-sm md:text-lg max-w-xl leading-relaxed mb-8 text-steel-700"
                    >
                        Wavv is the unified AI workspace where tax professionals
                        find answers, automate reviews, and reclaim time. Work
                        smarter now. Live better later.
                    </motion.p>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 }}
                        className="flex flex-col sm:flex-row items-center gap-4"
                    >
                        <Link href="/contact">
                            <Button
                                size="lg"
                                className="h-11 px-7 text-base font-medium rounded-lg"
                            >
                                Contact Us
                            </Button>
                        </Link>
                    </motion.div>
                </div>

                {/* Dashboard Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 }}
                    className="mt-48 md:mt-64 relative"
                >
                    <DashboardPreview />
                </motion.div>
            </div>
        </section>
    );
}

// ============ DASHBOARD PREVIEW (Simplified) ============
function DashboardPreview() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto max-w-5xl"
        >
            {/* Glow effect */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 0.4 } : {}}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="absolute -inset-8 rounded-3xl blur-3xl"
                style={{
                    background:
                        'radial-gradient(circle at center, rgba(139, 94, 60, 0.08), transparent 70%)',
                }}
            />

            {/* Main container */}
            <div
                className="relative rounded-3xl border shadow-2xl overflow-hidden"
                style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#e2e8f0',
                }}
            >
                {/* Browser chrome */}
                <div
                    className="h-10 px-4 flex items-center gap-2 border-b"
                    style={{
                        backgroundColor: '#f1f5f9',
                        borderColor: '#e2e8f0',
                    }}
                >
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#e2e8f0]" />
                        <div className="w-3 h-3 rounded-full bg-[#e2e8f0]" />
                        <div className="w-3 h-3 rounded-full bg-[#e2e8f0]" />
                    </div>
                    <div
                        className="flex-1 mx-4 h-6 rounded-md flex items-center px-3 text-xs"
                        style={{
                            backgroundColor: '#FFFFFF',
                            color: '#94a3b8',
                        }}
                    >
                        wavv.ai/workspace
                    </div>
                </div>

                {/* Dashboard content */}
                <div className="flex h-[500px]">
                    {/* Sidebar */}
                    <div
                        className="hidden md:flex flex-col w-56 p-4 border-r"
                        style={{
                            backgroundColor: '#f8fafc',
                            borderColor: '#e2e8f0',
                        }}
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <div
                                className="w-7 h-7 rounded flex items-center justify-center"
                                style={{ backgroundColor: '#1e293b' }}
                            >
                                <span className="text-white font-serif italic text-sm">
                                    w
                                </span>
                            </div>
                            <span className="font-serif font-bold text-[#0b1120]">
                                wavv
                            </span>
                        </div>

                        {/* Nav items */}
                        <div className="space-y-1">
                            {[
                                { icon: Search, label: 'Search', active: true },
                                {
                                    icon: FileText,
                                    label: 'Documents',
                                    active: false,
                                },
                                {
                                    icon: Briefcase,
                                    label: 'Projects',
                                    active: false,
                                },
                                { icon: Users, label: 'Team', active: false },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors"
                                    style={{
                                        backgroundColor: item.active
                                            ? '#f1f5f9'
                                            : 'transparent',
                                        color: item.active
                                            ? '#0b1120'
                                            : '#475569',
                                    }}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main content */}
                    <div
                        className="flex-1 p-6 overflow-hidden"
                        style={{ backgroundColor: '#FFFFFF' }}
                    >
                        {/* Search bar */}
                        <div
                            className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg border"
                            style={{
                                backgroundColor: '#f8fafc',
                                borderColor: '#e2e8f0',
                            }}
                        >
                            <Search className="w-5 h-5 text-[#94a3b8]" />
                            <span className="text-[#94a3b8]">
                                Search IRC, internal memos, client files...
                            </span>
                            <div
                                className="ml-auto px-2 py-0.5 rounded text-xs font-mono"
                                style={{
                                    backgroundColor: '#f1f5f9',
                                    color: '#475569',
                                }}
                            >
                                ⌘K
                            </div>
                        </div>

                        {/* Results grid */}
                        <div className="grid gap-4">
                            {[
                                {
                                    type: 'Internal',
                                    title: 'R&D Credit Memo - Client ABC',
                                    excerpt:
                                        'Section 41 qualified research expenses...',
                                    icon: FileText,
                                },
                                {
                                    type: 'Research',
                                    title: 'Corporate Income Tax Analysis',
                                    excerpt:
                                        'ASC 740 deferred tax calculations and state apportionment rules...',
                                    icon: BookOpen,
                                },
                                {
                                    type: 'Workpaper',
                                    title: 'FY2024 Tax Provision Calculation',
                                    excerpt:
                                        'ASC 740 current and deferred tax analysis...',
                                    icon: Database,
                                },
                            ].map((result, i) => (
                                <motion.div
                                    key={result.title}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 + i * 0.03 }}
                                    className="flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm"
                                    style={{
                                        backgroundColor: '#FFFFFF',
                                        borderColor: '#e2e8f0',
                                    }}
                                >
                                    <div
                                        className="p-2 rounded-lg shrink-0 shadow-sm"
                                        style={{ backgroundColor: '#1e293b' }}
                                    >
                                        <result.icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span
                                                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                                                style={{
                                                    backgroundColor: '#f1f5f9',
                                                    color: '#475569',
                                                }}
                                            >
                                                {result.type}
                                            </span>
                                        </div>
                                        <h4 className="font-medium text-sm text-[#0b1120] truncate">
                                            {result.title}
                                        </h4>
                                        <p className="text-xs text-[#94a3b8] truncate mt-0.5">
                                            {result.excerpt}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
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
            {/* Animated floating orbs */}
            <motion.div
                className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-60 blur-2xl z-0"
                animate={{
                    x: [0, 30, 0],
                    y: [0, -20, 0],
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                style={{
                    background:
                        'radial-gradient(circle, rgba(139, 94, 60, 0.15), transparent 70%)',
                }}
            />
            <motion.div
                className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-60 blur-2xl z-0"
                animate={{
                    x: [0, -40, 0],
                    y: [0, 30, 0],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                style={{
                    background:
                        'radial-gradient(circle, rgba(127, 179, 230, 0.12), transparent 70%)',
                }}
            />

            {/* Decorative corner elements */}
            <div className="absolute top-8 right-8 w-24 h-24 border-t border-r border-[#e2e8f0] rounded-tr-3xl opacity-60 z-0" />
            <div className="absolute bottom-8 left-8 w-24 h-24 border-b border-l border-[#e2e8f0] rounded-bl-3xl opacity-60 z-0" />

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.35 }}
                    className="text-center mb-16"
                >
                    <h2
                        className="text-4xl md:text-5xl font-serif font-bold mb-5 leading-tight"
                        style={{ color: '#0b1120' }}
                    >
                        The Reality of Tax Work
                    </h2>
                    <p
                        className="text-lg max-w-2xl mx-auto leading-relaxed"
                        style={{ color: '#475569' }}
                    >
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
                            transition={{ duration: 0.25, delay: i * 0.05 }}
                            className="p-8 rounded-2xl border"
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderColor: '#e2e8f0',
                            }}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 shadow-sm"
                                style={{ backgroundColor: '#1e293b' }}
                            >
                                <problem.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3
                                className="text-xl font-serif font-bold mb-3"
                                style={{ color: '#0b1120' }}
                            >
                                {problem.title}
                            </h3>
                            <p
                                className="leading-relaxed text-[15px]"
                                style={{ color: '#475569' }}
                            >
                                {problem.description}
                            </p>
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

    return (
        <section
            id="features"
            ref={ref}
            className="min-h-screen py-24 md:py-32 scroll-mt-20 relative overflow-hidden flex items-center"
            style={{ backgroundColor: '#FFFFFF' }}
        >
            {/* Excel grid overlay */}
            <ExcelGridBackground className="z-0" />

            {/* Animated floating geometric shapes */}
            <motion.div
                className="absolute top-32 right-20 w-64 h-64 rounded-full opacity-70 blur-xl z-[1]"
                animate={{
                    x: [0, -25, 0],
                    y: [0, 25, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                style={{
                    background:
                        'radial-gradient(circle, rgba(127, 179, 230, 0.3), rgba(127, 179, 230, 0.1) 50%, transparent 70%)',
                }}
            />
            <motion.div
                className="absolute bottom-32 left-16 w-80 h-80 rounded-full opacity-70 blur-xl z-[1]"
                animate={{
                    x: [0, 35, 0],
                    y: [0, -25, 0],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                style={{
                    background:
                        'radial-gradient(circle, rgba(139, 94, 60, 0.25), rgba(139, 94, 60, 0.08) 50%, transparent 70%)',
                }}
            />

            {/* Decorative grid accent */}
            <div className="absolute bottom-16 right-16 w-40 h-40 border-2 border-steel-200 rounded-full opacity-60 z-0" />

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.35 }}
                    className="text-center mb-16"
                >
                    <h2
                        className="text-4xl md:text-5xl font-serif font-bold mb-5 leading-tight"
                        style={{ color: '#0b1120' }}
                    >
                        One Hub. All Answers.
                    </h2>
                    <p
                        className="text-lg max-w-2xl mx-auto leading-relaxed"
                        style={{ color: '#475569' }}
                    >
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
                        transition={{ duration: 0.25, delay: 0.05 }}
                        className="space-y-6"
                    >
                        {[
                            {
                                icon: Search,
                                title: 'Unified Search',
                                description:
                                    'Query SharePoint, internal documents, and client files from a single search bar. Relevance-ranked with citations.',
                            },
                            {
                                icon: Brain,
                                title: 'AI Assistant',
                                description:
                                    'Natural-language Q&A over your documents. Get summaries, comparisons, and explanations instantly.',
                            },
                            {
                                icon: Layers,
                                title: 'Semantic Understanding',
                                description:
                                    'Not just keywords—Wavv understands tax concepts and connects related documents intelligently.',
                            },
                            {
                                icon: ShieldCheck,
                                title: 'Secure & Private',
                                description:
                                    "Enterprise-grade security with role-based access. Your firm's data stays exclusively yours.",
                            },
                        ].map((feature) => (
                            <div
                                key={feature.title}
                                className="flex gap-4 p-6 rounded-2xl border transition-all hover:shadow-sm"
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    borderColor: '#e2e8f0',
                                }}
                            >
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: '#1e293b' }}
                                >
                                    <feature.icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h4
                                        className="font-serif font-bold text-lg mb-1"
                                        style={{ color: '#0b1120' }}
                                    >
                                        {feature.title}
                                    </h4>
                                    <p
                                        className="text-sm leading-relaxed"
                                        style={{ color: '#475569' }}
                                    >
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Knowledge graph visualization */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.25, delay: 0.05 }}
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
    return (
        <div
            className="aspect-square relative rounded-2xl border p-8 z-20"
            style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#e2e8f0',
            }}
        >
            {/* Connection lines (SVG) - Behind everything */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <circle
                    cx="50%"
                    cy="50%"
                    r="120"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.4"
                />
            </svg>

            {/* Center node */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: '#1e293b' }}
                >
                    <Brain className="w-10 h-10 text-white" />
                </motion.div>
            </div>

            {/* Orbiting nodes */}
            {[
                {
                    angle: 0,
                    icon: FileText,
                    label: '10-K Filing',
                    color: '#64748b',
                },
                {
                    angle: 72,
                    icon: Database,
                    label: 'SharePoint',
                    color: '#64748b',
                },
                {
                    angle: 144,
                    icon: BookOpen,
                    label: 'Tax Research',
                    color: '#64748b',
                },
                {
                    angle: 216,
                    icon: FolderOpen,
                    label: 'Workpapers',
                    color: '#64748b',
                },
                {
                    angle: 288,
                    icon: Briefcase,
                    label: 'Client Files',
                    color: '#64748b',
                },
            ].map((node) => {
                const x = Math.cos((node.angle * Math.PI) / 180) * 120;
                const y = Math.sin((node.angle * Math.PI) / 180) * 120;

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
                        <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm border border-white/30"
                            style={{
                                backgroundColor: node.color,
                            }}
                        >
                            <node.icon className="w-5 h-5 text-white" />
                        </div>
                        <span
                            className="text-[10px] font-medium whitespace-nowrap px-2 py-0.5 rounded"
                            style={{
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                            }}
                        >
                            {node.label}
                        </span>
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

    return (
        <section
            id="how-it-works"
            ref={ref}
            className="min-h-screen py-24 md:py-32 scroll-mt-20 relative overflow-hidden flex items-center"
            style={{ backgroundColor: '#f8fafc' }}
        >
            {/* Animated floating orbs with different patterns */}
            <motion.div
                className="absolute top-16 left-16 w-56 h-56 rounded-full opacity-60 blur-2xl z-0"
                animate={{
                    x: [0, 20, 0],
                    y: [0, -30, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                style={{
                    background:
                        'radial-gradient(circle, rgba(127, 179, 230, 0.15), transparent 70%)',
                }}
            />
            <motion.div
                className="absolute bottom-24 right-20 w-72 h-72 rounded-full opacity-60 blur-2xl z-0"
                animate={{
                    x: [0, -30, 0],
                    y: [0, 20, 0],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                style={{
                    background:
                        'radial-gradient(circle, rgba(139, 94, 60, 0.13), transparent 70%)',
                }}
            />

            {/* Decorative corner accents */}
            <div className="absolute top-10 right-10 w-28 h-28 border-t-2 border-r-2 border-[#e2e8f0] rounded-tr-3xl opacity-60 z-0" />
            <div className="absolute bottom-10 left-10 w-28 h-28 border-b-2 border-l-2 border-[#e2e8f0] rounded-bl-3xl opacity-60 z-0" />

            {/* Animated connecting lines */}
            <motion.div
                className="absolute top-1/2 left-0 w-32 h-[2px] bg-gradient-to-r from-transparent via-[#e2e8f0] to-transparent z-0 opacity-80"
                animate={{
                    scaleX: [0, 1, 0],
                    x: [0, 100, 200],
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.35 }}
                    className="text-center mb-16"
                >
                    <h2
                        className="text-4xl md:text-5xl font-serif font-bold mb-5 leading-tight"
                        style={{ color: '#0b1120' }}
                    >
                        Built for How You Work
                    </h2>
                    <p
                        className="text-lg max-w-2xl mx-auto leading-relaxed"
                        style={{ color: '#475569' }}
                    >
                        From task creation to multi-level review approval, Wavv
                        streamlines your entire workflow.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Text content */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.25, delay: 0.05 }}
                    >
                        <h3
                            className="text-2xl md:text-3xl font-serif font-bold mb-6 leading-tight"
                            style={{ color: '#0b1120' }}
                        >
                            Automated Review Workflows
                        </h3>

                        <div className="space-y-4">
                            {[
                                'Drag-and-drop reviewer assignment',
                                'Multi-level approval chains',
                                'Real-time status tracking',
                                'Automated notifications',
                                'Audit-ready documentation',
                            ].map((item, i) => (
                                <motion.div
                                    key={item}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={
                                        isInView ? { opacity: 1, x: 0 } : {}
                                    }
                                    transition={{ delay: i * 0.03 }}
                                    className="flex items-center gap-3"
                                >
                                    <div
                                        className="w-5 h-5 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: '#1e293b' }}
                                    >
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="text-[#475569]">
                                        {item}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Reviewer Flow Animation - Hidden on mobile to prevent clipping */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.25, delay: 0.05 }}
                        className="hidden lg:block"
                    >
                        <ReviewerFlowAnimation />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// ============ ROADMAP SECTION ============
function RoadmapSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    const roadmapItems = [
        {
            icon: Shield,
            title: 'Quality Assurance & Data Security',
            description:
                'SOC 2 Type II certification and enhanced client data protection protocols.',
            status: 'In Progress',
            progress: 65,
            progressColor: '#1e293b',
            iconColor: '#64748b',
            badgeColor: '#1e293b',
        },
        {
            icon: Rocket,
            title: 'AI-Powered Tax Review Automation',
            description:
                'Intelligent review automation for complex tax calculations and multi-level approvals. Coworker.ai-inspired AI workflows.',
            status: 'Coming Soon',
            progress: 30,
            progressColor: '#1e293b',
            iconColor: '#64748b',
            badgeColor: '#1e293b',
        },
        {
            icon: Target,
            title: 'Advanced Tax Research',
            description:
                'External research capabilities to match or exceed competitors like Blue J. Deep regulatory analysis.',
            status: 'Planned',
            progress: 15,
            progressColor: '#1e293b',
            iconColor: '#64748b',
            badgeColor: '#1e293b',
        },
    ];

    return (
        <section
            id="why-wavv"
            ref={ref}
            className="py-24 md:py-32 scroll-mt-20 relative overflow-hidden"
            style={{ backgroundColor: '#FFFFFF' }}
        >
            {/* Large animated gradient orbs for future/innovation feel */}
            <motion.div
                className="absolute top-20 right-10 w-96 h-96 rounded-full opacity-60 blur-2xl z-0"
                animate={{
                    x: [0, -20, 0],
                    y: [0, 40, 0],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                style={{
                    background:
                        'radial-gradient(circle, rgba(127, 179, 230, 0.18), transparent 70%)',
                }}
            />
            <motion.div
                className="absolute bottom-16 left-12 w-80 h-80 rounded-full opacity-60 blur-2xl z-0"
                animate={{
                    x: [0, 30, 0],
                    y: [0, -30, 0],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                style={{
                    background:
                        'radial-gradient(circle, rgba(139, 94, 60, 0.12), transparent 70%)',
                }}
            />

            {/* Animated progress lines - suggesting forward motion */}
            <motion.div
                className="absolute top-1/3 right-0 w-48 h-[2px] bg-gradient-to-l from-transparent via-[#e2e8f0] to-transparent opacity-80 z-0"
                animate={{
                    scaleX: [0, 1, 0],
                    x: [-100, -50, 0],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    repeatDelay: 1,
                }}
            />
            <motion.div
                className="absolute top-2/3 left-0 w-48 h-[2px] bg-gradient-to-r from-transparent via-[#e2e8f0] to-transparent opacity-80 z-0"
                animate={{
                    scaleX: [0, 1, 0],
                    x: [0, 50, 100],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    repeatDelay: 1,
                    delay: 0.5,
                }}
            />

            {/* Decorative tech-inspired elements */}
            <div className="absolute top-12 left-12 w-20 h-20 border-2 border-[#64748b] rounded-lg opacity-40 rotate-45 z-0" />
            <div className="absolute bottom-12 right-12 w-24 h-24 border-2 border-[#1e293b] rounded-full opacity-35 z-0" />

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.35 }}
                    className="text-center mb-16"
                >
                    <h2
                        className="text-4xl md:text-5xl font-serif font-bold mb-5 leading-tight"
                        style={{ color: '#0b1120' }}
                    >
                        What's Next
                    </h2>
                    <p
                        className="text-lg max-w-2xl mx-auto leading-relaxed"
                        style={{ color: '#475569' }}
                    >
                        Our roadmap for continuous improvement and innovation.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {roadmapItems.map((item, i) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.25, delay: i * 0.05 }}
                            className="p-6 rounded-2xl border relative overflow-hidden"
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderColor: '#e2e8f0',
                            }}
                        >
                            {/* Progress bar at top */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-[#f1f5f9]">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={
                                        isInView
                                            ? { width: `${item.progress}%` }
                                            : {}
                                    }
                                    transition={{
                                        duration: 0.25,
                                        delay: 0.05 + i * 0.05,
                                    }}
                                    className="h-full"
                                    style={{
                                        backgroundColor: item.progressColor,
                                    }}
                                />
                            </div>

                            <div className="flex items-start gap-4 mt-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                    style={{ backgroundColor: item.iconColor }}
                                >
                                    <item.icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span
                                            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                                            style={{
                                                backgroundColor:
                                                    item.badgeColor,
                                                color: 'white',
                                            }}
                                        >
                                            {item.status}
                                        </span>
                                    </div>
                                    <h3
                                        className="font-serif font-bold text-lg mb-2 leading-snug"
                                        style={{ color: '#0b1120' }}
                                    >
                                        {item.title}
                                    </h3>
                                    <p
                                        className="text-sm leading-relaxed"
                                        style={{ color: '#475569' }}
                                    >
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
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
            {/* Subtle gradient background */}
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    background:
                        'radial-gradient(ellipse at top, rgba(139, 94, 60, 0.04), transparent 60%)',
                }}
            />

            <div className="max-w-4xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.35 }}
                    className="text-center"
                >
                    {/* Minimal accent line */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={isInView ? { width: '64px' } : {}}
                        transition={{ duration: 0.3, delay: 0.05 }}
                        className="h-0.5 mx-auto mb-10"
                        style={{ backgroundColor: '#1e293b' }}
                    />

                    <h2
                        className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 leading-tight"
                        style={{ color: '#0b1120' }}
                    >
                        Join the firms that work like the 1%.
                    </h2>

                    <p
                        className="text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed"
                        style={{ color: '#475569' }}
                    >
                        See how Wavv transforms tax practice. Schedule a
                        personalized demo with our team.
                    </p>

                    <Link href="/contact">
                        <Button
                            size="lg"
                            className="h-14 px-12 text-lg font-medium rounded-lg transition-all hover:scale-[1.02] hover:brightness-95 shadow-sm group"
                            style={{
                                backgroundColor: '#1e293b',
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

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { memo, useState, useEffect, useRef } from 'react'
import { Check, Clock, User, FileCheck, Send, ChevronRight } from 'lucide-react'

interface ReviewerFlowAnimationProps {
    className?: string
}

const STAGES = [
    { id: 1, label: 'Task Created', icon: FileCheck, color: '#64748b' },
    { id: 2, label: 'Preparer', icon: User, color: '#64748b' },
    { id: 3, label: '1st Reviewer', icon: User, color: '#64748b' },
    { id: 4, label: '2nd Reviewer', icon: User, color: '#64748b' },
    { id: 5, label: 'Complete', icon: Check, color: '#64748b' },
]

function ReviewerFlowAnimationComponent({ className = '' }: ReviewerFlowAnimationProps) {
    const [activeStage, setActiveStage] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReducedMotion) {
            setActiveStage(4) // Show completed state
            return
        }

        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }

        // If paused, don't start a new interval
        if (isPaused) {
            return
        }

        // Start interval for stage progression
        intervalRef.current = setInterval(() => {
            setActiveStage((prev) => (prev + 1) % (STAGES.length + 1))
        }, 900)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [isPaused])

    return (
        <div
            className={`relative ${className}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Clean Window Frame */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-lg overflow-hidden">
                {/* Title Bar - Modern clean style */}
                <div
                    className="h-10 px-4 flex items-center justify-between border-b"
                    style={{
                        backgroundColor: '#f8fafc',
                        borderColor: '#e2e8f0'
                    }}
                >
                    <span className="text-[#0b1120] text-sm font-semibold tracking-wide font-serif">
                        Task Review Workflow
                    </span>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#e2e8f0]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#e2e8f0]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#e2e8f0]" />
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 bg-white">
                    {/* Flow Diagram */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                        {STAGES.map((stage, index) => {
                            const Icon = stage.icon
                            const isActive = index === activeStage
                            const isComplete = index < activeStage

                            return (
                                <div key={stage.id} className="flex items-center">
                                    {/* Stage Node */}
                                    <motion.div
                                        className="relative"
                                        animate={{
                                            scale: isActive ? 1.15 : 1,
                                        }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    >
                                        <motion.div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-colors duration-300"
                                            style={{
                                                backgroundColor: isComplete || isActive ? stage.color : '#f8fafc',
                                                borderColor: isComplete || isActive ? stage.color : '#e2e8f0',
                                                boxShadow: isActive
                                                    ? '0 0 0 3px rgba(127, 179, 230, 0.15)'
                                                    : 'none',
                                            }}
                                        >
                                            <Icon
                                                className="w-5 h-5 transition-colors duration-300"
                                                style={{
                                                    color: isComplete || isActive ? 'white' : '#475569'
                                                }}
                                            />
                                        </motion.div>
                                    </motion.div>

                                    {/* Connector Line */}
                                    {index < STAGES.length - 1 && (
                                        <div className="w-8 h-0.5 mx-1 relative overflow-hidden bg-[#e2e8f0]">
                                            <motion.div
                                                className="absolute inset-y-0 left-0 bg-[#64748b]"
                                                initial={{ width: '0%' }}
                                                animate={{
                                                    width: isComplete ? '100%' : isActive ? '50%' : '0%'
                                                }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Stage Labels */}
                    <div className="flex items-start justify-between">
                        {STAGES.map((stage, index) => (
                            <div key={stage.id} className="flex items-center">
                                <div className="flex-shrink-0 flex justify-center" style={{ width: '48px' }}>
                                    <motion.span
                                        className="text-xs font-medium transition-colors duration-300 whitespace-nowrap"
                                        style={{
                                            color: index <= activeStage ? '#0b1120' : '#94a3b8',
                                        }}
                                        animate={{
                                            fontWeight: index === activeStage ? 600 : 400,
                                        }}
                                    >
                                        {stage.label}
                                    </motion.span>
                                </div>
                                {/* Spacer to match connector width */}
                                {index < STAGES.length - 1 && (
                                    <div className="w-8 mx-1 flex-shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Status Message */}
                    <motion.div
                        className="mt-6 p-3 rounded-xl border"
                        style={{
                            backgroundColor: '#f8fafc',
                            borderColor: '#e2e8f0',
                        }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeStage}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-2"
                            >
                                {activeStage < STAGES.length ? (
                                    <>
                                        <Clock className="w-4 h-4 text-[#475569]" />
                                        <span className="text-sm text-[#0b1120] font-serif">
                                            {activeStage === 0 && 'Initializing task...'}
                                            {activeStage === 1 && 'Awaiting preparer review...'}
                                            {activeStage === 2 && 'Submitted to 1st level reviewer...'}
                                            {activeStage === 3 && 'Escalated to 2nd level reviewer...'}
                                            {activeStage === 4 && 'All reviews complete ✓'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 text-[#64748b]" />
                                        <span className="text-sm text-[#64748b] font-serif font-medium">
                                            Task approved and finalized
                                        </span>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>

            {/* Decorative shadow */}
            <div
                className="absolute -bottom-2 left-4 right-4 h-4 rounded-2xl -z-10"
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(100, 116, 139, 0.15), transparent 70%)',
                    filter: 'blur(6px)',
                }}
            />
        </div>
    )
}

export const ReviewerFlowAnimation = memo(ReviewerFlowAnimationComponent)

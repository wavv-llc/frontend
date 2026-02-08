'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { memo, useState, useEffect, useRef } from 'react'
import { Check, Clock, User, FileCheck, Send, ChevronRight } from 'lucide-react'

interface ReviewerFlowAnimationProps {
    className?: string
}

const STAGES = [
    { id: 1, label: 'Task Created', icon: FileCheck, color: 'var(--mahogany-400)' },
    { id: 2, label: 'Preparer', icon: User, color: 'var(--excel-green-400)' },
    { id: 3, label: '1st Reviewer', icon: User, color: 'var(--lake-blue-400)' },
    { id: 4, label: '2nd Reviewer', icon: User, color: 'var(--lake-blue-300)' },
    { id: 5, label: 'Complete', icon: Check, color: 'var(--excel-green-500)' },
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
        }, 1800)

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
            {/* Retro Window Frame */}
            <div className="bg-[var(--ivory-100)] border-2 border-[var(--mahogany-500)] rounded-lg shadow-xl overflow-hidden">
                {/* Title Bar - Windows 2000 style */}
                <div
                    className="h-8 px-3 flex items-center justify-between"
                    style={{
                        background: 'linear-gradient(180deg, var(--mahogany-400) 0%, var(--mahogany-600) 100%)'
                    }}
                >
                    <span className="text-[var(--ivory-100)] text-sm font-semibold tracking-wide font-serif">
                        Task Review Workflow
                    </span>
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-[var(--ivory-200)] opacity-80" />
                        <div className="w-3 h-3 rounded-sm bg-[var(--ivory-200)] opacity-80" />
                        <div className="w-3 h-3 rounded-sm bg-[var(--ivory-200)] opacity-80" />
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 bg-[var(--ivory-50)]">
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
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    >
                                        <motion.div
                                            className="w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-300"
                                            style={{
                                                backgroundColor: isComplete || isActive ? stage.color : 'var(--ivory-200)',
                                                borderColor: stage.color,
                                                boxShadow: isActive
                                                    ? `0 0 20px ${stage.color}40`
                                                    : '0 2px 4px rgba(0,0,0,0.1)',
                                            }}
                                        >
                                            <Icon
                                                className="w-5 h-5 transition-colors duration-300"
                                                style={{
                                                    color: isComplete || isActive ? 'var(--ivory-50)' : stage.color
                                                }}
                                            />
                                        </motion.div>
                                    </motion.div>

                                    {/* Connector Line */}
                                    {index < STAGES.length - 1 && (
                                        <div className="w-8 h-0.5 mx-1 relative overflow-hidden bg-[var(--ivory-300)]">
                                            <motion.div
                                                className="absolute inset-y-0 left-0 bg-[var(--excel-green-400)]"
                                                initial={{ width: '0%' }}
                                                animate={{
                                                    width: isComplete ? '100%' : isActive ? '50%' : '0%'
                                                }}
                                                transition={{ duration: 0.5 }}
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
                                            color: index <= activeStage ? 'var(--mahogany-700)' : 'var(--mahogany-400)',
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
                        className="mt-6 p-3 rounded-lg border"
                        style={{
                            backgroundColor: 'var(--ivory-100)',
                            borderColor: 'var(--mahogany-300)',
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
                                        <Clock className="w-4 h-4 text-[var(--mahogany-500)]" />
                                        <span className="text-sm text-[var(--mahogany-700)] font-serif">
                                            {activeStage === 0 && 'Initializing task...'}
                                            {activeStage === 1 && 'Awaiting preparer review...'}
                                            {activeStage === 2 && 'Submitted to 1st level reviewer...'}
                                            {activeStage === 3 && 'Escalated to 2nd level reviewer...'}
                                            {activeStage === 4 && 'All reviews complete ✓'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 text-[var(--excel-green-500)]" />
                                        <span className="text-sm text-[var(--excel-green-600)] font-serif font-medium">
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
                className="absolute -bottom-3 left-4 right-4 h-6 rounded-lg -z-10"
                style={{
                    background: 'linear-gradient(180deg, var(--mahogany-800) 0%, transparent 100%)',
                    opacity: 0.15,
                    filter: 'blur(8px)',
                }}
            />
        </div>
    )
}

export const ReviewerFlowAnimation = memo(ReviewerFlowAnimationComponent)

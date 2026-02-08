'use client'

import { motion } from 'framer-motion'
import { memo } from 'react'

interface ExcelGridBackgroundProps {
    className?: string
    showCells?: boolean
    animated?: boolean
}

function ExcelGridBackgroundComponent({
    className = '',
    showCells = true,
    animated = true
}: ExcelGridBackgroundProps) {
    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
            {/* Base grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                    backgroundImage: `
            linear-gradient(to right, var(--excel-green-500) 1px, transparent 1px),
            linear-gradient(to bottom, var(--excel-green-500) 1px, transparent 1px)
          `,
                    backgroundSize: '40px 24px',
                }}
            />

            {/* Column headers simulation */}
            {showCells && (
                <div className="absolute top-0 left-0 right-0 h-6 flex">
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'].map((letter, i) => (
                        <motion.div
                            key={letter}
                            className="w-10 h-6 flex items-center justify-center text-[10px] font-mono text-[var(--excel-green-500)]/30 border-r border-b border-[var(--excel-green-500)]/10"
                            initial={animated ? { opacity: 0 } : { opacity: 0.3 }}
                            animate={{ opacity: 0.3 }}
                            transition={{ delay: i * 0.05, duration: 0.5 }}
                        >
                            {letter}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Row numbers simulation */}
            {showCells && (
                <div className="absolute top-6 left-0 w-8 bottom-0 flex flex-col">
                    {Array.from({ length: 30 }, (_, i) => (
                        <motion.div
                            key={i}
                            className="w-8 h-6 flex items-center justify-center text-[10px] font-mono text-[var(--excel-green-500)]/30 border-r border-b border-[var(--excel-green-500)]/10"
                            initial={animated ? { opacity: 0 } : { opacity: 0.3 }}
                            animate={{ opacity: 0.3 }}
                            transition={{ delay: i * 0.03, duration: 0.5 }}
                        >
                            {i + 1}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Animated highlight cells */}
            {animated && (
                <>
                    <motion.div
                        className="absolute w-40 h-6 bg-[var(--excel-green-400)]/10 border border-[var(--excel-green-400)]/30"
                        style={{ top: '48px', left: '80px' }}
                        animate={{
                            opacity: [0.3, 0.6, 0.3],
                            scale: [1, 1.02, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: 'reverse',
                        }}
                    />
                    <motion.div
                        className="absolute w-20 h-6 bg-[var(--excel-green-400)]/10 border border-[var(--excel-green-400)]/30"
                        style={{ top: '120px', left: '160px' }}
                        animate={{
                            opacity: [0.2, 0.5, 0.2],
                            scale: [1, 1.02, 1],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            delay: 1,
                        }}
                    />
                    <motion.div
                        className="absolute w-32 h-12 bg-[var(--excel-green-400)]/10 border-2 border-[var(--excel-green-400)]/40"
                        style={{ top: '168px', left: '40px' }}
                        animate={{
                            opacity: [0.2, 0.4, 0.2],
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            delay: 2,
                        }}
                    />
                </>
            )}

            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[var(--ivory-100)]/50 to-[var(--ivory-100)]/80" />
        </div>
    )
}

export const ExcelGridBackground = memo(ExcelGridBackgroundComponent)

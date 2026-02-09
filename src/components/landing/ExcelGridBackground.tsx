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
                className="absolute inset-0"
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

            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[var(--ivory-100)]/50 to-[var(--ivory-100)]/80" />
        </div>
    )
}

export const ExcelGridBackground = memo(ExcelGridBackgroundComponent)

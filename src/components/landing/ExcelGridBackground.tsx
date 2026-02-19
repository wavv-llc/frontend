'use client';

import { motion } from 'framer-motion';
import { memo } from 'react';

interface ExcelGridBackgroundProps {
    className?: string;
    showCells?: boolean;
    animated?: boolean;
}

function ExcelGridBackgroundComponent({
    className = '',
    showCells = true,
    animated = true,
}: ExcelGridBackgroundProps) {
    const columns = [
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'P',
    ];
    const totalColumns = columns.length;
    const totalRows = 30;

    // Calculate opacity that fades from high to low
    const getColumnOpacity = (index: number) => {
        const startOpacity = 0.5;
        const endOpacity = 0.2;
        return (
            startOpacity -
            (index / (totalColumns - 1)) * (startOpacity - endOpacity)
        );
    };

    const getRowOpacity = (index: number) => {
        const startOpacity = 0.5;
        const endOpacity = 0.1;
        return (
            startOpacity -
            (index / (totalRows - 1)) * (startOpacity - endOpacity)
        );
    };

    return (
        <div
            className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
        >
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
                    {columns.map((letter, i) => {
                        const targetOpacity = getColumnOpacity(i);
                        return (
                            <motion.div
                                key={letter}
                                className="w-10 h-6 flex items-center justify-center text-[10px] font-mono border-r border-b"
                                style={{
                                    color: 'var(--excel-green-500)',
                                    borderColor: 'var(--excel-green-500)',
                                }}
                                initial={
                                    animated
                                        ? { opacity: 0 }
                                        : { opacity: targetOpacity }
                                }
                                animate={{ opacity: targetOpacity }}
                                transition={{ delay: i * 0.01, duration: 0.3 }}
                            >
                                {letter}
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Row numbers simulation */}
            {showCells && (
                <div className="absolute top-6 left-0 w-8 bottom-0 flex flex-col">
                    {Array.from({ length: totalRows }, (_, i) => {
                        const targetOpacity = getRowOpacity(i);
                        return (
                            <motion.div
                                key={i}
                                className="w-8 h-6 flex items-center justify-center text-[10px] font-mono border-r border-b"
                                style={{
                                    color: 'var(--excel-green-500)',
                                    borderColor: 'var(--excel-green-500)',
                                }}
                                initial={
                                    animated
                                        ? { opacity: 0 }
                                        : { opacity: targetOpacity }
                                }
                                animate={{ opacity: targetOpacity }}
                                transition={{ delay: i * 0.008, duration: 0.3 }}
                            >
                                {i + 1}
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[var(--ivory-100)]/25 to-[var(--ivory-100)]/50" />
        </div>
    );
}

export const ExcelGridBackground = memo(ExcelGridBackgroundComponent);

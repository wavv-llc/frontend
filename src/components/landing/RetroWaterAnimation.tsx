'use client'

import { useEffect, useRef, memo } from 'react'
import { motion } from 'framer-motion'

interface RetroWaterAnimationProps {
    className?: string
    intensity?: 'subtle' | 'medium' | 'prominent'
}

function RetroWaterAnimationComponent({ className = '', intensity = 'medium' }: RetroWaterAnimationProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animationId: number
        let time = 0
        let frameCount = 0

        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect()
            // Use device pixel ratio for sharper rendering but cap at 1 for performance
            const dpr = Math.min(window.devicePixelRatio || 1, 1)
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            ctx.scale(dpr, dpr)
        }

        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)

        // Larger pixel sizes for better performance (was 8/6/4, now 12/10/8)
        const pixelSize = intensity === 'subtle' ? 12 : intensity === 'medium' ? 10 : 8

        // Lake Como inspired colors - more visible
        const colors = [
            { r: 91, g: 148, b: 178, a: 0.85 }, // lake-blue-500
            { r: 111, g: 168, b: 198, a: 0.75 }, // lake-blue-400
            { r: 143, g: 191, b: 214, a: 0.65 }, // lake-blue-300
            { r: 184, g: 212, b: 227, a: 0.55 }, // lake-blue-200
        ]

        const draw = () => {
            frameCount++
            // Throttle to ~30fps by skipping every other frame
            if (frameCount % 2 !== 0) {
                animationId = requestAnimationFrame(draw)
                return
            }

            const rect = canvas.getBoundingClientRect()
            ctx.clearRect(0, 0, rect.width, rect.height)

            const cols = Math.ceil(rect.width / pixelSize)
            const rows = Math.ceil(rect.height / pixelSize)

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    // Create wave pattern
                    const wave1 = Math.sin((x * 0.1) + (time * 0.02) + (y * 0.05)) * 0.5 + 0.5
                    const wave2 = Math.sin((x * 0.05) - (time * 0.015) + (y * 0.08)) * 0.5 + 0.5
                    const wave3 = Math.cos((y * 0.1) + (time * 0.01)) * 0.5 + 0.5

                    const combinedWave = (wave1 + wave2 + wave3) / 3

                    // Select color based on wave position
                    const colorIndex = Math.floor(combinedWave * colors.length) % colors.length
                    const color = colors[colorIndex]

                    // Add shimmer effect
                    const shimmer = Math.sin((x + y) * 0.3 + time * 0.05) * 0.1 + 0.9

                    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a * shimmer})`
                    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize - 1, pixelSize - 1)
                }
            }

            time += 1
            animationId = requestAnimationFrame(draw)
        }

        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (!prefersReducedMotion) {
            draw()
        } else {
            // Draw static version
            const rect = canvas.getBoundingClientRect()
            time = 0
            ctx.clearRect(0, 0, rect.width, rect.height)
            const cols = Math.ceil(rect.width / pixelSize)
            const rows = Math.ceil(rect.height / pixelSize)
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const colorIndex = (x + y) % colors.length
                    const color = colors[colorIndex]
                    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a * 0.7})`
                    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize - 1, pixelSize - 1)
                }
            }
        }

        return () => {
            window.removeEventListener('resize', resizeCanvas)
            cancelAnimationFrame(animationId)
        }
    }, [intensity])

    return (
        <motion.div
            className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            style={{ willChange: 'transform' }}
        >
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{
                    imageRendering: 'pixelated',
                    willChange: 'contents',
                    pointerEvents: 'none'
                }}
            />
            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--ivory-100)]/80 pointer-events-none" />
        </motion.div>
    )
}

export const RetroWaterAnimation = memo(RetroWaterAnimationComponent)

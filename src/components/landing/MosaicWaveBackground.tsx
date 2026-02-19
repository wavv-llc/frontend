'use client'

import { useEffect, useRef, memo } from 'react'

interface MosaicWaveBackgroundProps {
  className?: string
}

function MosaicWaveBackgroundComponent({ className = '' }: MosaicWaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Mosaic configuration
    const tileSize = 26
    const gap = 2
    const step = tileSize + gap

    // Steel color palette (rgba values from Pure Steel spec)
    const steelColors = [
      'rgba(176, 200, 220, VAR_OPACITY)', // Light desaturated blue
      'rgba(155, 190, 218, VAR_OPACITY)', // Highlight tile color
      'rgba(130, 180, 210, VAR_OPACITY)', // Subtle variation
    ]

    // Resize canvas to fill container
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Generate tiles with wave-based opacity
    interface Tile {
      x: number
      y: number
      baseOpacity: number
      colorIndex: number
    }

    const tiles: Tile[] = []
    const cols = Math.ceil(canvas.width / step)
    const rows = Math.ceil(canvas.height / step)

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Skip ~12% randomly for mosaic effect
        if (Math.random() < 0.12) continue

        // Calculate wave-based opacity using Pure Steel wave function
        const cx = cols * 0.5
        const cy = rows * 0.35
        const dx = (col - cx) / cols
        const dy = (row - cy) / rows
        const dist = Math.sqrt(dx * dx * 1.2 + dy * dy * 2.5)

        // Wave pattern
        const wave1 = Math.cos(dist * 12) * 0.3 + 0.3
        const wave2 = Math.sin((col / cols) * 6 + (row / rows) * 4) * 0.15
        const fade = Math.max(0, 1 - dist * 1.6)

        // Clamp opacity between 0.25 and 0.80 per spec
        const baseOpacity = Math.max(0.25, Math.min(0.80, (wave1 + wave2) * fade))

        // Randomly assign color (40% highlight, 60% primary)
        const colorIndex = Math.random() < 0.4 ? 1 : 0

        tiles.push({
          x: col * step + Math.random() * 2, // Add 0-2px random variation
          y: row * step + Math.random() * 2,
          baseOpacity,
          colorIndex,
        })
      }
    }

    // Animation loop
    let frame = 0
    let animationFrameId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Background color per Pure Steel spec
      ctx.fillStyle = '#d6e2eb'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw tiles
      tiles.forEach((tile, i) => {
        // Subtle pulse animation (only if motion not reduced)
        const pulseOffset = prefersReducedMotion
          ? 0
          : Math.sin(frame * 0.02 + i * 0.1) * 0.1

        const opacity = Math.max(0.25, Math.min(0.80, tile.baseOpacity + pulseOffset))

        // Apply opacity to color
        ctx.fillStyle = steelColors[tile.colorIndex].replace('VAR_OPACITY', opacity.toString())

        // Draw tile
        ctx.fillRect(tile.x, tile.y, tileSize, tileSize)
      })

      frame++

      // Throttle to ~30fps for performance
      if (frame % 2 === 0) {
        animationFrameId = requestAnimationFrame(animate)
      } else {
        animationFrameId = requestAnimationFrame(animate)
      }
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      aria-hidden="true"
    />
  )
}

export const MosaicWaveBackground = memo(MosaicWaveBackgroundComponent)

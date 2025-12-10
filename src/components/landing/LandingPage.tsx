'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, FileText, Shield, Zap, Search, Database, MessageSquare, Lock, Key, Eye, EyeOff } from 'lucide-react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { AppBar } from '@/components/AppBar'

const NAV_ITEMS = [
  { name: 'Home', href: '#home' },
  { name: 'Problem', href: '#problem' },
  { name: 'Solution', href: '#solution' },
  { name: 'Vision', href: '#vision' },
  { name: 'Security', href: '#security' },
]

export function LandingPage() {
  const lottieContainerRef = useRef<HTMLDivElement>(null)
  const [isLottieLoaded, setIsLottieLoaded] = useState(false)
  const hasDetectedLoadRef = useRef(false)

  // Preload Lottie file immediately when component mounts
  useEffect(() => {
    const lottieUrl = "https://lottie.host/ee632d9e-027f-407c-be17-e58327b074b8/CZ1LlQhAQd.lottie"
    
    // Add preload link to head for instant loading
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = lottieUrl
    link.as = 'fetch'
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
    
    // Also start fetching immediately to warm up the cache
    fetch(lottieUrl, {
      method: 'GET',
      cache: 'force-cache',
    }).catch(() => {
      // Silently fail - the DotLottieReact component will handle loading
    })
    
    return () => {
      // Cleanup: remove preload link when component unmounts
      const existingLink = document.querySelector(`link[href="${lottieUrl}"]`)
      if (existingLink) {
        document.head.removeChild(existingLink)
      }
    }
  }, [])

  // Detect when Lottie animation has loaded
  useEffect(() => {
    if (!lottieContainerRef.current || hasDetectedLoadRef.current) return

    const checkLottieLoaded = () => {
      if (!lottieContainerRef.current || hasDetectedLoadRef.current) return
      
      const container = lottieContainerRef.current
      
      // Check for SVG elements (Lottie can render as SVG)
      const svgElements = container.querySelectorAll('svg')
      const hasValidSvg = svgElements.length > 0 && Array.from(svgElements).some(svg => {
        // Check if SVG has any meaningful content (paths, groups, etc.)
        return svg.children.length > 0 || svg.querySelector('path, g, circle, rect, polygon') !== null
      })
      
      // Check for canvas elements (Lottie can also render as canvas)
      const canvasElements = container.querySelectorAll('canvas')
      const hasValidCanvas = canvasElements.length > 0 && Array.from(canvasElements).some(canvas => {
        return canvas.width > 0 && canvas.height > 0
      })
      
      // Check for any visible content with dimensions
      const hasAnyContent = container.children.length > 0 && Array.from(container.children).some(child => {
        const el = child as HTMLElement
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      })
      
      if ((hasValidSvg || hasValidCanvas || hasAnyContent) && !hasDetectedLoadRef.current) {
        hasDetectedLoadRef.current = true
        // Small delay to ensure animation is fully rendered
        setTimeout(() => {
          setIsLottieLoaded(true)
        }, 150)
        return true
      }
      return false
    }

    // Check immediately
    if (checkLottieLoaded()) return

    // Then check periodically
    const interval = setInterval(() => {
      if (checkLottieLoaded()) {
        clearInterval(interval)
      }
    }, 100)

    // Also use MutationObserver to detect when content is added
    const observer = new MutationObserver(() => {
      if (checkLottieLoaded()) {
        observer.disconnect()
        clearInterval(interval)
      }
    })

    if (lottieContainerRef.current) {
      observer.observe(lottieContainerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
      })
    }

    // Fallback timeout - show animation after 2 seconds even if detection fails
    const timeout = setTimeout(() => {
      if (!hasDetectedLoadRef.current) {
        hasDetectedLoadRef.current = true
        setIsLottieLoaded(true)
      }
      clearInterval(interval)
      observer.disconnect()
    }, 2000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
      observer.disconnect()
    }
  }, [])

  // Modify purple colors in Lottie animation to slate blue
  useEffect(() => {
    const modifyLottieColors = () => {
      if (!lottieContainerRef.current) return

      const slateBlue = '#1e293b'
      
      // Function to check if a color is purple-like
      const isPurpleColor = (color: string): boolean => {
        if (!color || color === 'none' || color === 'transparent') return false
        
        // Convert to lowercase for comparison
        const lowerColor = color.toLowerCase().trim()
        
        // Check for common purple hex codes
        const purpleHexes = [
          '#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9',
          '#9333ea', '#a855f7', '#ba68c8', '#9c27b0', '#8e24aa',
          '#ab47bc', '#ce93d8', '#f3e5f5', '#e1bee7', '#d1c4e9'
        ]
        
        if (purpleHexes.some(hex => lowerColor.includes(hex))) return true
        
        // Check for rgb/rgba purple colors
        const rgbMatch = lowerColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1])
          const g = parseInt(rgbMatch[2])
          const b = parseInt(rgbMatch[3])
          
          // Purple colors typically have high red and blue, medium green
          // Check if it's in the purple range
          if (r > 100 && b > 100 && r > g && b > g && (r + b) > (g * 2)) {
            return true
          }
        }
        
        return false
      }

      // Find all SVG elements and paths - be very aggressive
      const allElements = lottieContainerRef.current.querySelectorAll('*')
      let modifiedCount = 0
      
      // Process all elements
      allElements.forEach((element) => {
        const el = element as HTMLElement | SVGElement
        
        // Check fill attribute
        const fill = el.getAttribute('fill')
        if (fill && isPurpleColor(fill)) {
          el.setAttribute('fill', slateBlue)
          modifiedCount++
        }
        
        // Check stroke attribute
        const stroke = el.getAttribute('stroke')
        if (stroke && isPurpleColor(stroke)) {
          el.setAttribute('stroke', slateBlue)
          modifiedCount++
        }
        
        // Check computed style (for dynamically set colors)
        if (el instanceof SVGElement || el instanceof HTMLElement) {
          try {
            const computedStyle = window.getComputedStyle(el)
            const computedFill = computedStyle.fill
            if (computedFill && isPurpleColor(computedFill) && computedFill !== 'none' && computedFill !== 'rgb(0, 0, 0)') {
              el.setAttribute('fill', slateBlue)
              modifiedCount++
            }
            
            const computedStroke = computedStyle.stroke
            if (computedStroke && isPurpleColor(computedStroke) && computedStroke !== 'none') {
              el.setAttribute('stroke', slateBlue)
              modifiedCount++
            }
            
            // Also check backgroundColor for any elements
            const bgColor = computedStyle.backgroundColor
            if (bgColor && isPurpleColor(bgColor) && bgColor !== 'rgba(0, 0, 0, 0)') {
              el.style.backgroundColor = slateBlue
              modifiedCount++
            }
          } catch (e) {
            // Ignore errors
          }
        }
        
        // Check style attribute and replace any purple references
        const style = el.getAttribute('style')
        if (style) {
          let newStyle = style
          let changed = false
          
          // Replace fill in style
          const fillMatch = style.match(/fill:\s*([^;]+)/i)
          if (fillMatch && isPurpleColor(fillMatch[1].trim())) {
            newStyle = newStyle.replace(/fill:\s*[^;]+/gi, `fill: ${slateBlue}`)
            changed = true
          }
          
          // Replace stroke in style
          const strokeMatch = style.match(/stroke:\s*([^;]+)/i)
          if (strokeMatch && isPurpleColor(strokeMatch[1].trim())) {
            newStyle = newStyle.replace(/stroke:\s*[^;]+/gi, `stroke: ${slateBlue}`)
            changed = true
          }
          
          // Replace background-color in style
          const bgMatch = style.match(/background-color:\s*([^;]+)/i)
          if (bgMatch && isPurpleColor(bgMatch[1].trim())) {
            newStyle = newStyle.replace(/background-color:\s*[^;]+/gi, `background-color: ${slateBlue}`)
            changed = true
          }
          
          if (changed) {
            el.setAttribute('style', newStyle)
            modifiedCount++
          }
        }
      })
      
      // Also try to find and replace in SVG defs and styles
      const svgElements = lottieContainerRef.current.querySelectorAll('svg')
      svgElements.forEach((svg) => {
        // Check for style elements
        const styleElements = svg.querySelectorAll('style')
        styleElements.forEach((styleEl) => {
          if (styleEl.textContent) {
            let newContent = styleEl.textContent
            // Replace purple colors in CSS
            const purpleRegex = /#[8-9a-f][0-9a-f]{5}|rgb\(1(3[9-9]|4[0-7]|5[0-5]),\s*(9[2-9]|1[0-5][0-9]),\s*(2[4-9][0-6]|2[5-9][0-9]|3[0-5][0-9])\)/gi
            if (purpleRegex.test(newContent)) {
              newContent = newContent.replace(purpleRegex, slateBlue)
              styleEl.textContent = newContent
              modifiedCount++
            }
          }
        })
      })
      
      if (modifiedCount > 0) {
        console.log(`Modified ${modifiedCount} purple color(s) to slate blue`)
      }
    }

    // Run multiple times to catch animation as it loads
    const runModifications = () => {
      modifyLottieColors()
      setTimeout(modifyLottieColors, 100)
      setTimeout(modifyLottieColors, 300)
      setTimeout(modifyLottieColors, 500)
      setTimeout(modifyLottieColors, 1000)
      setTimeout(modifyLottieColors, 2000)
    }

    // Set up observer for when animation loads
    const observer = new MutationObserver(() => {
      modifyLottieColors()
    })

    if (lottieContainerRef.current) {
      observer.observe(lottieContainerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['fill', 'stroke', 'style']
      })
      
      // Initial modifications
      runModifications()
      
      // Also run on animation frame for dynamic updates
      const interval = setInterval(() => {
        modifyLottieColors()
      }, 500)
      
      // Clear interval after 10 seconds
      setTimeout(() => clearInterval(interval), 10000)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div className="bg-background text-foreground selection:bg-primary/20 selection:text-primary-foreground" style={{ backgroundColor: 'hsl(42, 50%, 88%)', minHeight: '100vh' }}>
      {/* HEADER / NAV - Sticky, solid opaque background */}
      <AppBar navItems={NAV_ITEMS} />

      {/* HERO SECTION - Warm Paper, Min-Height Screen (minus header) */}
      <section className="relative w-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center border-b border-border bg-background" style={{ backgroundColor: 'hsl(42, 50%, 88%)' }}>
        <div className="max-w-6xl mx-auto px-4 w-full py-12">
          <div className="flex flex-col md:flex-row md:items-center gap-12 lg:gap-20">
            {/* Left column */}
            <div className="flex-1 space-y-6">

              <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] text-foreground tracking-tight">
                Your trusted AI colleague, <span className="text-muted-foreground italic block">always by your side.</span>
              </h1>

              <p className="max-w-xl font-sans text-lg text-muted-foreground leading-relaxed">
                An AI-powered integrated workspace designed for tax professionals.
                Unify essential workflows, automate repetitive tasks, and access internal knowledge in one centralized hub.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center pt-2">
                <Link href="/contact">
                  <Button size="lg" className="font-serif h-12 px-8 text-lg bg-[#3b4a5f] text-white hover:bg-[#3b4a5f]/90 shadow-md hover:shadow-lg transition-all">Get Started</Button>
                </Link>
              </div>
            </div>

            {/* Right column - Lottie / Visual */}
            <div className="flex-1">
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                <div className="relative h-full w-full bg-background rounded-2xl flex items-center justify-center p-8 shadow-lg border border-border/50 overflow-hidden">
                  {/* Loading placeholder with Lottie outline skeleton */}
                  <AnimatePresence mode="wait">
                    {!isLottieLoaded && (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="relative w-full h-full flex items-center justify-center">
                          {/* Animated gradient background */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-muted/20 via-background to-muted/10"
                            animate={{
                              backgroundPosition: ['0% 0%', '100% 100%'],
                            }}
                            transition={{
                              duration: 4,
                              repeat: Infinity,
                              repeatType: 'reverse',
                              ease: 'easeInOut',
                            }}
                          />
                          {/* Lottie outline skeleton - generic character/figure shape */}
                          <svg
                            className="w-full h-full max-w-md max-h-md"
                            viewBox="0 0 400 400"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            {/* Head outline */}
                            <motion.circle
                              cx="200"
                              cy="120"
                              r="45"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeDasharray="283"
                              className="text-[#1e293b]/30"
                              initial={{ strokeDashoffset: 283, opacity: 0.3 }}
                              animate={{ 
                                strokeDashoffset: [283, 0, 283],
                                opacity: [0.3, 0.6, 0.3],
                              }}
                              transition={{
                                strokeDashoffset: { duration: 1.5, ease: "easeInOut" },
                                opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                              }}
                            />
                            {/* Body outline */}
                            <motion.path
                              d="M 200 165 L 200 280"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              className="text-[#1e293b]/30"
                              initial={{ pathLength: 0, opacity: 0.3 }}
                              animate={{ 
                                pathLength: 1,
                                opacity: [0.3, 0.6, 0.3],
                              }}
                              transition={{
                                pathLength: { duration: 1.5, delay: 0.2, ease: "easeInOut" },
                                opacity: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }
                              }}
                            />
                            {/* Left arm */}
                            <motion.path
                              d="M 200 200 L 140 240 L 130 280"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              className="text-[#1e293b]/30"
                              initial={{ pathLength: 0, opacity: 0.3 }}
                              animate={{ 
                                pathLength: 1,
                                opacity: [0.3, 0.6, 0.3],
                              }}
                              transition={{
                                pathLength: { duration: 1.5, delay: 0.4, ease: "easeInOut" },
                                opacity: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }
                              }}
                            />
                            {/* Right arm */}
                            <motion.path
                              d="M 200 200 L 260 240 L 270 280"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              className="text-[#1e293b]/30"
                              initial={{ pathLength: 0, opacity: 0.3 }}
                              animate={{ 
                                pathLength: 1,
                                opacity: [0.3, 0.6, 0.3],
                              }}
                              transition={{
                                pathLength: { duration: 1.5, delay: 0.6, ease: "easeInOut" },
                                opacity: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }
                              }}
                            />
                            {/* Left leg */}
                            <motion.path
                              d="M 200 280 L 180 340 L 170 380"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              className="text-[#1e293b]/30"
                              initial={{ pathLength: 0, opacity: 0.3 }}
                              animate={{ 
                                pathLength: 1,
                                opacity: [0.3, 0.6, 0.3],
                              }}
                              transition={{
                                pathLength: { duration: 1.5, delay: 0.8, ease: "easeInOut" },
                                opacity: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }
                              }}
                            />
                            {/* Right leg */}
                            <motion.path
                              d="M 200 280 L 220 340 L 230 380"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              className="text-[#1e293b]/30"
                              initial={{ pathLength: 0, opacity: 0.3 }}
                              animate={{ 
                                pathLength: 1,
                                opacity: [0.3, 0.6, 0.3],
                              }}
                              transition={{
                                pathLength: { duration: 1.5, delay: 1, ease: "easeInOut" },
                                opacity: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }
                              }}
                            />
                            {/* Shimmer effect overlay */}
                            <motion.rect
                              x="0"
                              y="0"
                              width="200"
                              height="400"
                              fill="url(#shimmer)"
                              opacity={0}
                              animate={{
                                opacity: [0, 0.2, 0],
                                x: [-200, 400],
                              }}
                              transition={{
                                opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                x: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                              }}
                            />
                            <defs>
                              <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="#1e293b" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="transparent" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Lottie Animation - Colors modified programmatically */}
                  <motion.div
                    ref={lottieContainerRef}
                    className="w-full h-full lottie-match-theme opacity-95"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ 
                      opacity: isLottieLoaded ? 1 : 0,
                      scale: isLottieLoaded ? 1 : 0.98
                    }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    <DotLottieReact
                      src="https://lottie.host/ee632d9e-027f-407c-be17-e58327b074b8/CZ1LlQhAQd.lottie"
                      loop
                      autoplay
                    />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION - Stone at 40% */}
      <section id="problem" className="relative w-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center border-b border-border bg-muted/40 scroll-mt-14" style={{ backgroundColor: 'hsl(42, 40%, 86%)' }}>
        <div className="max-w-6xl mx-auto px-4 w-full py-24">
          <div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto">
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
              The complexity gap.
            </h2>
            <p className="font-sans text-lg text-muted-foreground">
              Tax professionals work in a challenging environment defined by manual work, complexity, and institutional fragility.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { title: 'Fragmented Workflows', desc: 'Professionals spend too much time switching between tools and performing repetitive manual tasks just to get the job done.' },
              { title: 'Information Silos', desc: 'Significant time is wasted searching for internal documents and external tax codes, especially in remote environments.' },
              { title: 'Knowledge Loss', desc: 'High turnover leads to the loss of critical institutional knowledge and increased training costs for new staff.' }
            ].map((item, i) => {
              const accentColors = [
                'border-[#1e293b]/40 hover:border-[#1e293b]/60',
                'border-secondary/40 hover:border-secondary/60',
                'border-[hsl(32,25%,40%)]/40 hover:border-[hsl(32,25%,40%)]/60'
              ];
              return (
                <Card key={i} className={`bg-background border-border ${accentColors[i]} hover:shadow-md transition-all duration-300 shadow-sm`}>
                  <CardHeader>
                    <CardTitle className="font-serif text-2xl text-foreground">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-sans text-base text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SOLUTION / MVP FEATURES - Warm Paper Background */}
      <section id="solution" className="relative w-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center scroll-mt-14 bg-background" style={{ backgroundColor: 'hsl(42, 50%, 88%)' }}>
        <div className="max-w-6xl mx-auto px-4 w-full py-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <div className="font-sans text-xs font-bold uppercase tracking-widest text-[#1e293b] mb-3">
                The Solution
              </div>
              <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
                One unified workspace.
              </h2>
              <p className="font-sans text-lg text-muted-foreground">
                We are building the single hub where tax teams access knowledge, automate work, and collaborate—regardless of location.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: 'Unified Search',
                desc: 'Single search bar across internal documents (SharePoint) and authoritative external tax sources. Get relevance-ranked results with citations instantly.'
              },
              {
                icon: Database,
                title: 'Knowledge Integration',
                desc: 'Secure ingestion of firm documents with semantic embedding. Preserve the "Why" behind past decisions and make it accessible to the whole team.'
              },
              {
                icon: MessageSquare,
                title: 'AI Assistant',
                desc: 'Natural-language Q&A over your internal documents. Ask for summaries, comparisons, and quick explanations as if asking a colleague.'
              }
            ].map((feature, i) => {
              const iconColors = [
                { bg: 'bg-[#1e293b]/15', text: 'text-[#1e293b]', hover: 'group-hover:bg-[#1e293b]/20' },
                { bg: 'bg-secondary/15', text: 'text-secondary', hover: 'group-hover:bg-secondary/20' },
                { bg: 'bg-[hsl(32,25%,40%)]/15', text: 'text-[hsl(32,25%,40%)]', hover: 'group-hover:bg-[hsl(32,25%,40%)]/20' }
              ];
              const borderColors = [
                'hover:border-[#1e293b]/40',
                'hover:border-secondary/40',
                'hover:border-[hsl(32,25%,40%)]/40'
              ];
              const color = iconColors[i];
              return (
                <div key={i} className={`group p-10 rounded-2xl border border-border bg-background hover:bg-muted/30 ${borderColors[i]} transition-all duration-300 shadow-sm hover:shadow-md`}>
                  <div className={`mb-6 w-12 h-12 rounded-xl ${color.bg} flex items-center justify-center ${color.text} group-hover:scale-110 ${color.hover} transition-all duration-300`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-2xl text-foreground mb-4">{feature.title}</h3>
                  <p className="font-sans text-base text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* VISION SECTION - Subtle Muted Background with Earthy Tones */}
      <section id="vision" className="relative w-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center border-y border-border bg-muted/50 scroll-mt-14" style={{ backgroundColor: 'hsl(42, 40%, 86%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center w-full py-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/30 text-xs font-bold tracking-wide mb-8">
            <Zap className="w-3 h-3 text-secondary" />
            <span>Future Roadmap</span>
          </div>
          <h2 className="font-serif text-4xl md:text-6xl text-foreground mb-8">
            Beyond Search
          </h2>
          <p className="font-sans text-xl text-muted-foreground mb-16 max-w-2xl mx-auto">
            Our mission is evolving. Soon, Wavv will handle complex tax reviews, automate notice responses,
            and provide embedded training modules to foster professional growth.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm font-semibold text-foreground">
            {['Auto-Reviews', 'Task Management', 'Training Modules', 'Collaboration'].map((item, i) => (
              <div key={i} className="p-6 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center hover:border-[#1e293b]/40 hover:shadow-md transition-all duration-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURITY SECTION - Cream Background with Earthy Accents */}
      <section id="security" className="relative w-full min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-muted/40 text-foreground scroll-mt-14 py-8 md:py-12" style={{ backgroundColor: 'hsl(42, 40%, 86%)' }}>
        <div className="max-w-6xl mx-auto px-4 w-full">
          <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
            <div>
              <div className="font-sans text-xs font-bold uppercase tracking-widest text-[#1e293b] mb-4">
                Security First
              </div>
              <h2 className="font-serif text-4xl md:text-6xl mb-8 text-foreground">
                Enterprise-grade protection.
              </h2>
              <p className="font-sans text-xl text-muted-foreground mb-8 leading-relaxed">
                Your firm's data is sensitive. We treat it that way. Wavv is built on a foundation of rigorous security standards and modern infrastructure.
              </p>

              <div className="space-y-6">
                {[
                  { title: 'Identity Management', desc: 'Secure authentication powered by Clerk (Enterprise).', icon: Shield },
                  { title: 'Encryption Standard', desc: 'AES-256 encryption for data at rest (S3) and TLS 1.3 in transit.', icon: Lock },
                  { title: 'Network Security', desc: 'DDoS protection, Rate Limiting, and Security Headers via Helmet.', icon: Shield },
                  { title: 'Infrastructure', desc: 'Hosted on scalable, secure AWS cloud infrastructure.', icon: Database }
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    className="flex gap-5 group"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-medium text-foreground mb-1">{item.title}</h3>
                      <p className="font-sans text-sm text-muted-foreground leading-normal">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative h-full flex items-center justify-center py-6 md:py-10">
              <motion.div 
                className="relative w-full max-w-md aspect-square bg-gradient-to-br from-background via-muted/30 to-background border-2 border-[#1e293b]/20 p-8 rounded-3xl flex flex-col justify-between shadow-2xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                {/* Top section - Encryption indicators */}
                  <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      className="w-3 h-3 rounded-full bg-[hsl(140,40%,35%)]"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-xs font-semibold text-[hsl(140,25%,25%)] uppercase tracking-wider">Encryption Active</span>
                  </div>
                  <div className="space-y-3">
                    <motion.div 
                      className="h-2 rounded-full bg-[#1e293b]/20"
                      initial={{ width: 0 }}
                      whileInView={{ width: "30%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                    <motion.div 
                      className="h-2 rounded-full bg-[#1e293b]/30"
                      initial={{ width: 0 }}
                      whileInView={{ width: "65%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                    />
                  </div>
                </div>

                {/* Center section - Enhanced encryption visualization */}
                <div className="w-full flex-1 flex items-center justify-center relative">
                  <motion.div 
                    className="w-full h-48 bg-gradient-to-br from-[#1e293b]/10 via-background to-[hsl(140,25%,25%)]/10 rounded-2xl border-2 border-dashed border-[#1e293b]/30 flex flex-col items-center justify-center gap-4 p-6 relative overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Animated lock icon */}
                    <motion.div
                      animate={{ 
                        y: [0, -5, 0],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Lock className="w-12 h-12 text-[#1e293b]" />
                    </motion.div>
                    
                    {/* Encryption text with animation */}
                    <div className="flex flex-col items-center gap-2">
                      <motion.span 
                        className="text-foreground font-serif text-lg font-semibold"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                      >
                        End-to-End Encrypted
                      </motion.span>
                      <motion.span 
                        className="text-xs text-muted-foreground font-sans"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.7 }}
                      >
                        AES-256 • TLS 1.3
                      </motion.span>
                    </div>

                    {/* Floating security icons */}
                    <div className="absolute top-4 left-4">
                      <motion.div
                        animate={{ 
                          opacity: [0.3, 0.7, 0.3],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          delay: 0
                        }}
                      >
                        <Key className="w-4 h-4 text-[#1e293b]/60" />
                      </motion.div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <motion.div
                        animate={{ 
                          opacity: [0.3, 0.7, 0.3],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          delay: 0.5
                        }}
                      >
                        <Shield className="w-4 h-4 text-[hsl(140,25%,25%)]/60" />
                      </motion.div>
                    </div>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <motion.div
                        animate={{ 
                          opacity: [0.3, 0.7, 0.3],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          delay: 1
                        }}
                      >
                        <EyeOff className="w-4 h-4 text-[hsl(32,25%,40%)]/60" />
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                {/* Bottom section - Security status indicators */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Security Status</span>
                    <motion.span 
                      className="text-[hsl(140,40%,35%)] font-semibold"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Secure
                    </motion.span>
                  </div>
                  <div className="flex gap-2">
                    <motion.div 
                      className="h-2 flex-1 rounded-full bg-[hsl(140,40%,35%)]"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      style={{ transformOrigin: "left" }}
                    />
                    <motion.div 
                      className="h-2 w-12 rounded-full bg-[#1e293b]/40"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.8 }}
                      style={{ transformOrigin: "left" }}
                    />
                    <motion.div 
                      className="h-2 w-12 rounded-full bg-[hsl(32,25%,40%)]/40"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 1.0 }}
                      style={{ transformOrigin: "left" }}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA BAND - Cream with Blue Accent */}
      <section className="relative w-full py-24 bg-gradient-to-b from-muted/50 to-background border-t border-border" style={{ backgroundColor: 'hsl(42, 45%, 87%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
            Ready to unify your tax workspace?
          </h2>
          <p className="max-w-2xl mx-auto font-sans text-lg text-muted-foreground mb-10">
            Join the firms using Wavv to reduce manual work, find answers instantly, and empower their teams.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact">
              <Button size="lg" className="font-serif h-14 px-8 text-lg shadow-xl bg-[#3b4a5f] text-white hover:bg-[#3b4a5f]/90 hover:shadow-2xl transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER - Background */}
      <footer className="bg-background border-t border-border" style={{ backgroundColor: 'hsl(42, 50%, 88%)' }}>
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="flex flex-col md:flex-row justify-between gap-12">
            <div className="space-y-4">
              <div className="font-sans text-2xl font-bold text-foreground tracking-tighter">Wavv</div>
              <div className="font-sans text-sm text-muted-foreground max-w-xs leading-relaxed">
                © 2025 Wavv, Inc.<br />
                Austin, Texas
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24">
              <div>
                <h3 className="font-serif font-bold text-[#1e293b] mb-6">Product</h3>
                <ul className="space-y-4 font-sans text-sm text-muted-foreground">
                  <li><Link href="#solution" className="hover:text-[#1e293b] transition-colors">Features</Link></li>
                  <li><Link href="#security" className="hover:text-[#1e293b] transition-colors">Security</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-serif font-bold text-[#1e293b] mb-6">Company</h3>
                <ul className="space-y-4 font-sans text-sm text-muted-foreground">
                  <li><Link href="#" className="hover:text-[#1e293b] transition-colors">About</Link></li>
                  <li><Link href="/contact" className="hover:text-[#1e293b] transition-colors">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-serif font-bold text-[#1e293b] mb-6">Legal</h3>
                <ul className="space-y-4 font-sans text-sm text-muted-foreground">
                  <li><Link href="#" className="hover:text-[#1e293b] transition-colors">Privacy</Link></li>
                  <li><Link href="#" className="hover:text-[#1e293b] transition-colors">Terms</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}


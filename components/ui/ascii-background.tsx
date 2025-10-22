'use client'

import React, { useEffect, useRef } from 'react'

interface AsciiBackgroundProps {
  children: React.ReactNode
  className?: string
}

// Liquid glass character set - creates flowing patterns
const CHAR = "          `~._ASCII_.~`      `~._ASCII_.~`"
const MAX = CHAR.length * 2
const FRAMES = 2000
const BLUR_STEPS = 100

// FrameLoop class for smooth animation
class FrameLoop {
  frames: number
  min: number
  max: number
  pingpong: boolean
  ease: (t: number) => number
  value: number
  t: number
  dir: number

  constructor(frames: number, min: number, max: number, pingpong: boolean, ease?: (t: number) => number) {
    this.frames = frames
    this.min = min
    this.max = max
    this.pingpong = pingpong
    this.ease = ease || ((t: number) => t)
    this.value = min
    this.t = 0
    this.dir = 1
  }

  set(frame: number) {
    this.t = frame / this.frames
    this.value = this.min + (this.max - this.min) * this.ease(this.t)
  }

  inc() {
    this.t += this.dir / this.frames
    if (this.pingpong) {
      if (this.t > 1) { this.t = 1; this.dir = -1 }
      if (this.t < 0) { this.t = 0; this.dir = 1 }
    } else {
      if (this.t > 1) this.t = 0
    }
    this.value = this.min + (this.max - this.min) * this.ease(this.t)
  }
}

export function AsciiBackground({ children, className = '' }: AsciiBackgroundProps) {
  const preRef = useRef<HTMLPreElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const waveMapRef = useRef<FrameLoop[][]>([])
  const canvasWidthRef = useRef<number>(0)
  const canvasHeightRef = useRef<number>(0)

  const easeQuadInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

  const createLayer = (width: number, height: number): string[][] => {
    const arr: string[][] = []
    for (let y = 0; y < height; y++) {
      arr[y] = []
      for (let x = 0; x < width; x++) {
        arr[y][x] = ' '
      }
    }
    return arr
  }

  const setup = (width: number, height: number) => {
    // Create initial random wave map
    const waveMap = createLayer(width, height)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        waveMap[y][x] = (Math.random() * MAX).toString()
      }
    }

    // Blur the wave map for smooth transitions
    for (let step = 0; step < BLUR_STEPS; step++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const value = parseFloat(waveMap[y][x])
          const left = x > 0 ? parseFloat(waveMap[y][x - 1]) : value
          const right = x < width - 1 ? parseFloat(waveMap[y][x + 1]) : value
          const top = y > 0 ? parseFloat(waveMap[y - 1][x]) : value
          const bottom = y < height - 1 ? parseFloat(waveMap[y + 1][x]) : value
          waveMap[y][x] = ((value + left + right + top + bottom) / 5).toString()
        }
      }
    }

    // Find min/max values
    let valMin = Infinity
    let valMax = -Infinity
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const val = parseFloat(waveMap[y][x])
        valMin = Math.min(valMin, val)
        valMax = Math.max(valMax, val)
      }
    }

    // Convert to FrameLoop objects
    const frameMap: FrameLoop[][] = []
    for (let y = 0; y < height; y++) {
      frameMap[y] = []
      for (let x = 0; x < width; x++) {
        const value = Math.floor(((parseFloat(waveMap[y][x]) - valMin) / (valMax - valMin)) * FRAMES)
        frameMap[y][x] = new FrameLoop(FRAMES, 0, CHAR.length - 1, true, easeQuadInOut)
        frameMap[y][x].set(value)
      }
    }

    waveMapRef.current = frameMap
  }

  const draw = () => {
    if (!preRef.current || !waveMapRef.current) return

    const width = canvasWidthRef.current!
    const height = canvasHeightRef.current!
    const waveMap = waveMapRef.current

    // Create ASCII grid
    const ascii = createLayer(width, height)

    // Fill with characters based on wave map
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = Math.round(waveMap[y][x].value) % CHAR.length
        ascii[y][x] = CHAR[idx]
        waveMap[y][x].inc()
      }
    }

    // Render to pre element
    preRef.current.textContent = ascii.map(row => row.join('')).join('\n')
  }

  const resizeCanvas = () => {
    if (!preRef.current) return

    const container = preRef.current.parentElement
    if (!container) return

    // Calculate grid size based on container and font size
    const computed = window.getComputedStyle(preRef.current)
    const fontSize = parseFloat(computed.fontSize)
    const lineHeight = parseFloat(computed.lineHeight)
    
    const width = Math.max(20, Math.floor(container.clientWidth / (fontSize * 0.6)))
    const height = Math.max(10, Math.floor(container.clientHeight / lineHeight))

    canvasWidthRef.current = width
    canvasHeightRef.current = height

    setup(width, height)
  }

  useEffect(() => {
    const pre = preRef.current
    if (!pre) return

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const loop = () => {
      draw()
      animationRef.current = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* ASCII Liquid Glass Effect */}
      <pre
        ref={preRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ 
          zIndex: 1,
          margin: 0,
          padding: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          overflow: 'hidden',
          whiteSpace: 'pre',
          fontFamily: 'monospace',
          fontSize: 'clamp(8px, 1.5vw, 16px)',
          lineHeight: '1.05',
          fontWeight: '100',
          letterSpacing: '0.01em',
          color: 'rgba(255, 255, 255, 0.25)',
          userSelect: 'none'
        }}
      />
    </div>
  )
}

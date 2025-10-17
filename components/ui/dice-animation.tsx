'use client'

import { useState, useEffect } from 'react'

interface DiceAnimationProps {
  isRolling: boolean
  onComplete?: () => void
  className?: string
}

export function DiceAnimation({ isRolling, onComplete, className = '' }: DiceAnimationProps) {
  const [currentFace, setCurrentFace] = useState(1)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isRolling) {
      setIsVisible(true)
      const interval = setInterval(() => {
        setCurrentFace(prev => (prev % 6) + 1)
      }, 100)

      const timeout = setTimeout(() => {
        clearInterval(interval)
        setIsVisible(false)
        onComplete?.()
      }, 2000)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  }, [isRolling, onComplete])

  if (!isVisible) return null

  const diceFaces = {
    1: '⚀',
    2: '⚁', 
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅'
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none ${className}`}>
      <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-8 border border-white/30">
        <div className="text-8xl animate-bounce">
          {diceFaces[currentFace as keyof typeof diceFaces]}
        </div>
        <div className="text-center mt-4 text-white/70 text-sm">
          Rolling the die...
        </div>
      </div>
    </div>
  )
}

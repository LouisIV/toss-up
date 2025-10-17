'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'
import { usePlausible } from 'next-plausible'

interface TossButtonProps {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline'
  fallbackText?: string
}

export function TossButton({ 
  onClick, 
  disabled = false, 
  children, 
  className = '',
  variant = 'default',
  fallbackText
}: TossButtonProps) {
  const [isDesktop, setIsDesktop] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const plausible = usePlausible()

  // Detect if we're on desktop
  useEffect(() => {
    const checkDesktop = () => {
      // Only consider it desktop if it has no touch capability AND is wide enough
      const hasTouch = 'ontouchstart' in window
      const isWide = window.innerWidth > 1024
      const isDesktopDevice = !hasTouch && isWide
      console.log('Desktop detection - hasTouch:', hasTouch, 'isWide:', isWide, 'isDesktop:', isDesktopDevice)
      setIsDesktop(isDesktopDevice)
    }
    
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  const handleClick = () => {
    if (isProcessing || disabled) return
    
    console.log('🎲 TOSS BUTTON CLICKED!')
    setIsProcessing(true)
    
    // Safety timeout to reset processing state
    const timeoutId = setTimeout(() => {
      setIsProcessing(false)
    }, 10000) // 10 second timeout
    
    // Always show modal - even on desktop, we want the toss confirmation
    console.log('🎲 Showing toss confirmation modal')
    const event = new CustomEvent('showTossModal', {
      detail: {
        onConfirmed: () => {
          clearTimeout(timeoutId)
          
          // Track toss button usage
          plausible('Toss Button Used', {
            props: {
              buttonText: fallbackText || 'Unknown',
              isDesktop: isDesktop,
            }
          })
          
          onClick()
          setIsProcessing(false)
        },
        onCancelled: () => {
          clearTimeout(timeoutId)
          console.log('Toss cancelled')
          setIsProcessing(false)
        },
        title: 'Confirm Your Action',
        message: isDesktop ? 'Click Confirm to proceed' : 'Toss your device to confirm this action!'
      }
    })
    window.dispatchEvent(event)
  }


  return (
    <>
      <Button
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        variant={variant}
        className={`transition-all duration-300 hover:scale-105 ${className}`}
      >
        {children}
      </Button>

    </>
  )
}

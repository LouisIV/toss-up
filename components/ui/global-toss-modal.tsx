'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from './button'
import { useGestureSubmission } from '@/hooks/useGestureSubmission'

interface TossModalData {
  onConfirmed: () => void
  onCancelled: () => void
  title?: string
  message?: string
}

export function GlobalTossModal() {
  const [isVisible, setIsVisible] = useState(false)
  const [modalData, setModalData] = useState<TossModalData | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [currentFace, setCurrentFace] = useState(1)
  const hasSettledRef = useRef(false)

  // Simple gesture detection - just like the test page
  const { 
    isSupported, 
    requestPermission, 
    isListening 
  } = useGestureSubmission({
    onToss: () => {
      console.log('🎲 Toss detected in global modal!')
      handleTossDetected()
    },
    threshold: 5,
    cooldown: 1000,
    minAngleChange: 5,
    minimumFinishingAngle: 11
  })

  // Request permission when modal becomes visible
  useEffect(() => {
    if (isVisible && isSupported) {
      const requestMotionPermission = async () => {
        try {
          await requestPermission()
        } catch (error) {
          console.error('Failed to request motion permission:', error)
        }
      }
      requestMotionPermission()
    }
  }, [isVisible, isSupported, requestPermission])

  const handleTossDetected = () => {
    if (hasSettledRef.current) return
    setIsRolling(true)
    
    // Animate dice rolling
    const interval = setInterval(() => {
      setCurrentFace(prev => (prev % 6) + 1)
    }, 100)

    // Stop rolling after 2 seconds and confirm
    setTimeout(() => {
      clearInterval(interval)
      setIsRolling(false)
      handleConfirmed()
    }, 2000)
  }

  const diceFaces = {
    1: '⚀',
    2: '⚁', 
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅'
  }

  useEffect(() => {
    const handleShowTossModal = (event: CustomEvent<TossModalData>) => {
      console.log('🎲 Global modal triggered!', event.detail)
      hasSettledRef.current = false
      setModalData(event.detail)
      setIsVisible(true)
    }

    const handleHideTossModal = () => {
      console.log('🎲 Global modal hidden!')
      setIsVisible(false)
      setModalData(null)
    }

    // Listen for custom events
    window.addEventListener('showTossModal', handleShowTossModal as EventListener)
    window.addEventListener('hideTossModal', handleHideTossModal)

    return () => {
      window.removeEventListener('showTossModal', handleShowTossModal as EventListener)
      window.removeEventListener('hideTossModal', handleHideTossModal)
    }
  }, [])

  const handleConfirmed = () => {
    if (hasSettledRef.current) return
    hasSettledRef.current = true
    modalData?.onConfirmed()
    setIsVisible(false)
    setModalData(null)
  }

  const handleCancelled = () => {
    if (hasSettledRef.current) return
    hasSettledRef.current = true
    // Just close the modal - no need to call onCancelled since it's just a console.log
    setIsVisible(false)
    setModalData(null)
  }

  if (!isVisible || !modalData) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {modalData.title || 'Confirm Your Action'}
        </h2>
        <p className="text-white/80 text-lg">
          {modalData.message || 'Toss your device to confirm'}
        </p>
      </div>

      {/* Dice area */}
      <div className="relative mb-8">
        <div className={`text-8xl md:text-9xl transition-all duration-300 ${
          isRolling ? 'animate-bounce scale-110' : 'scale-100'
        }`}>
          {diceFaces[currentFace as keyof typeof diceFaces]}
        </div>
        
        {/* Rolling indicator */}
        {isRolling && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 text-sm animate-pulse">
            Rolling...
          </div>
        )}
      </div>

      {/* Gesture status */}
      <div className="text-center mb-8">
        {!isSupported ? (
          <p className="text-white/70">Motion detection not supported</p>
        ) : !isListening ? (
          <p className="text-white/70">Requesting motion permission...</p>
        ) : isRolling ? (
          <p className="text-white/70">Rolling...</p>
        ) : (
          <p className="text-white/70">Ready to detect toss gesture</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleConfirmed}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
          disabled={isRolling}
        >
          {isRolling ? 'Rolling...' : 'Confirm'}
        </Button>
        <Button
          onClick={handleCancelled}
          variant="outline"
          className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg"
          disabled={isRolling}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

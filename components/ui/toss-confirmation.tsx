'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'

interface TossConfirmationProps {
  onConfirmed: () => void
  onCancelled: () => void
}

export function TossConfirmation({ onConfirmed, onCancelled }: TossConfirmationProps) {
  const [isRolling, setIsRolling] = useState(false)
  const [currentFace, setCurrentFace] = useState(1)
  const [hasPermission, setHasPermission] = useState(false)
  const [permissionRequested, setPermissionRequested] = useState(false)
  const [debugInfo] = useState('')

  console.log('🎲 TOSS CONFIRMATION COMPONENT RENDERED!')
  
  // Add cleanup logging
  useEffect(() => {
    console.log('🎲 TossConfirmation MOUNTED')
    return () => {
      console.log('🎲 TossConfirmation UNMOUNTED')
    }
  }, [])

  // Temporarily remove gesture detection entirely to test modal stability
  // const { 
  //   isSupported, 
  //   requestPermission, 
  //   isListening 
  // } = useGestureSubmission({
  //   onToss: () => {
  //     console.log('🎲 Toss detected in confirmation!')
  //     setDebugInfo('Toss detected!')
  //     handleToss()
  //   },
  //   threshold: 999999, // Disable by setting extremely high threshold
  //   cooldown: 2000,
  //   minAngleChange: 15,
  //   minimumFinishingAngle: 20
  // })

  // Mock values for testing
  const isSupported = true
  const requestPermission = async () => true
  const isListening = false

  // Request permission on mount
  useEffect(() => {
    console.log('🎲 TossConfirmation useEffect - requesting permission')
    const requestMotionPermission = async () => {
      if (isSupported && !permissionRequested) {
        console.log('🎲 Requesting motion permission...')
        setPermissionRequested(true)
        const granted = await requestPermission()
        console.log('🎲 Permission granted:', granted)
        setHasPermission(granted)
        
        // Add a small delay before allowing toss detection
        setTimeout(() => {
          console.log('🎲 Ready for toss detection')
        }, 1000)
      }
    }
    
    requestMotionPermission()
  }, []) // Remove dependencies to prevent re-runs

  const handleToss = () => {
    console.log('🎲 handleToss called!')
    setIsRolling(true)
    
    // Animate dice rolling
    const interval = setInterval(() => {
      setCurrentFace(prev => (prev % 6) + 1)
    }, 100)

    // Stop rolling after 2 seconds but don't auto-close
    setTimeout(() => {
      clearInterval(interval)
      setIsRolling(false)
      // Don't call onConfirmed() - let user manually close
    }, 2000)
  }

  const handleManualConfirm = () => {
    handleToss()
  }

  const diceFaces = {
    1: '⚀',
    2: '⚁', 
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅'
  }

  return (
    <div className="fixed inset-0 z-50 bg-red-500 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Confirm Your Action
        </h2>
        <p className="text-white/70 text-sm md:text-base">
          Flick your wrist to toss the die and confirm
        </p>
        {debugInfo && (
          <div className="mt-2 p-2 bg-red-500/20 rounded text-xs text-red-300">
            Debug: {debugInfo}
          </div>
        )}
      </div>

      {/* Dice Area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative">
          {/* Dice */}
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
        {isSupported && hasPermission && isListening && !isRolling && (
          <div className="mt-8 text-center">
            <div className="text-white/60 text-sm mb-2">🎯 Gesture active</div>
            <div className="text-white/40 text-xs">Flick your wrist to toss</div>
          </div>
        )}

        {/* Permission prompt */}
        {isSupported && !hasPermission && !isRolling && (
          <div className="mt-8 text-center">
            <div className="text-white/60 text-sm mb-4">
              Motion access needed for gesture control
            </div>
            <Button
              onClick={async () => {
                const granted = await requestPermission()
                setHasPermission(granted)
              }}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              Enable Motion Access
            </Button>
          </div>
        )}

        {/* Fallback button */}
        {(!isSupported || !hasPermission) && !isRolling && (
          <div className="mt-8">
            <Button
              onClick={handleManualConfirm}
              className="bg-white text-black hover:bg-white/90 font-bold px-8 py-3"
            >
              🎲 Toss the Die
            </Button>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex gap-4">
        <Button
          onClick={onConfirmed}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={isRolling}
        >
          Confirm
        </Button>
        <Button
          onClick={onCancelled}
          variant="outline"
          className="border-white/30 text-white hover:bg-white/10"
          disabled={isRolling}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

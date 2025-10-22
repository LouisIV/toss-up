'use client'

import { useState, useEffect, useMemo } from 'react'
import { AsciiBackground } from './ascii-background'
import { Button } from './button'
import { useGestureSubmission } from '@/hooks/useGestureSubmission'

interface OnboardingScreenProps {
  onComplete: () => void
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false)
  const [showFallbackButton, setShowFallbackButton] = useState(false)
  const [isTossing, setIsTossing] = useState(false)
  const [showHelpText, setShowHelpText] = useState(false)
  const [currentFace, setCurrentFace] = useState(6) // Start with ⚅
  const [motionControlsAttempted, setMotionControlsAttempted] = useState(false)
  const handleToss = () => {
    setIsTossing(true)
  }

  const { isSupported, hasPermission, requestPermission, isListening } = useGestureSubmission({
    onToss: handleToss,
    threshold: 8, // Lower threshold = more sensitive
    cooldown: 1000
  })

  // Just use a simple static text to prevent flickering
  const displayText = 'Welcome to Die Toss'

  useEffect(() => {
    // Show help text after a short delay
    const timer = setTimeout(() => {
      setShowHelpText(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])


  useEffect(() => {
    // Animate dice faces when tossing
    if (isTossing) {
      const interval = setInterval(() => {
        setCurrentFace(prev => (prev % 6) + 1)
      }, 100)

      const timeout = setTimeout(() => {
        clearInterval(interval)
        onComplete()
      }, 2000)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  }, [isTossing, onComplete])

  useEffect(() => {
    // Check if we should show permission prompt or fallback button
    if (isSupported && !hasPermission && !showPermissionPrompt) {
      // Wait a bit before showing permission prompt
      const timer = setTimeout(() => {
        setShowPermissionPrompt(true)
      }, 2000)
      return () => clearTimeout(timer)
    } else if (hasPermission && !isListening && motionControlsAttempted) {
      // Has permission but not listening and we've attempted motion controls - show fallback as backup
      const timer = setTimeout(() => {
        setShowFallbackButton(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isSupported, hasPermission, showPermissionPrompt, isListening, motionControlsAttempted])

  // Handle case where motion controls are not supported at all
  useEffect(() => {
    if (!isSupported) {
      console.log('Motion controls not supported, setting up fallback button...')
      // Wait a bit before showing that motion controls aren't supported
      const timer = setTimeout(() => {
        console.log('Showing fallback button for desktop')
        setMotionControlsAttempted(true)
        setShowFallbackButton(true) // Directly show fallback button for desktop
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isSupported])

  const handlePermissionRequest = async () => {
    setMotionControlsAttempted(true)
    const granted = await requestPermission()
    if (granted) {
      setShowPermissionPrompt(false)
    } else {
      // Permission denied - show fallback button
      setShowFallbackButton(true)
    }
  }

  const handleFallbackToss = () => {
    handleToss()
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black z-50 overflow-hidden" 
        style={{ 
          height: '100dvh',
          minHeight: '-webkit-fill-available',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-radial from-slate-900/20 via-transparent to-black/90 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 pointer-events-none" />
        
        {/* Edge blur vignette for iOS Safari */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-black/60 to-transparent" />
          <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-black/60 to-transparent" />
        </div>
        
        {/* ASCII Background with ethereal scene */}
        <AsciiBackground className="absolute inset-0">
          <div className="h-full w-full flex flex-col items-center justify-center relative" style={{ minHeight: '100dvh' }}>
            {/* Ethereal grass/field description - using text as "scenery" */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-green-900/10 to-transparent pointer-events-none" />
            
            {/* Main content container */}
            <div className="flex flex-col items-center justify-center space-y-8 px-4 z-10">
              {/* Floating dice */}
              <div className="relative">
                <div className={isTossing ? "text-9xl animate-bounce" : "text-9xl animate-bounce"} style={{ animationDuration: '3s' }}>
                  {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][currentFace - 1]}
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 blur-3xl bg-white/20 animate-pulse" style={{ animationDuration: '3s' }} />
              </div>

              {/* Main text */}
              <div className="text-center space-y-4">
                <h1 className="text-6xl md:text-8xl font-black text-white drop-shadow-2xl animate-fade-in">
                  toss?
                </h1>
                
                {showHelpText && (
                  <div className="animate-fade-in space-y-3">
                    <p className="text-xl md:text-2xl text-white/80 max-w-md mx-auto">
                      {displayText}
                    </p>
                    
                    {isSupported && (
                      <p className="text-sm md:text-base text-white/60 max-w-xs mx-auto">
                        Make an upward tossing motion with your device
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Permission prompt */}
              {showPermissionPrompt && (
                <div className="animate-fade-in">
                  <Button
                    onClick={handlePermissionRequest}
                    size="lg"
                    className="bg-white text-black hover:bg-white/90 font-bold text-lg px-8 py-6 rounded-full shadow-2xl border-4 border-white/30"
                  >
                    Enable Motion Controls
                  </Button>
                </div>
              )}

              {/* Fallback button for desktop or if gestures fail */}
              {showFallbackButton && !showPermissionPrompt && (
                <div className="animate-fade-in">
                  <Button
                    onClick={handleFallbackToss}
                    size="lg"
                    className="bg-white text-black hover:bg-white/90 font-bold text-lg px-8 py-6 rounded-full shadow-2xl border-4 border-white/30"
                  >
                    Toss the Die
                  </Button>
                </div>
              )}

            </div>
          </div>
        </AsciiBackground>
      </div>
    </>
  )
}

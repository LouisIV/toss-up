'use client'

import { useState, useEffect } from 'react'
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

  const handleToss = () => {
    setIsTossing(true)
  }

  const { isSupported, hasPermission, requestPermission, isListening } = useGestureSubmission({
    onToss: handleToss,
    threshold: 15,
    cooldown: 1000
  })

  useEffect(() => {
    // Show help text after a short delay
    const timer = setTimeout(() => {
      setShowHelpText(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // When tossing, complete onboarding after spin animation finishes
    if (isTossing) {
      const timer = setTimeout(() => {
        onComplete()
      }, 2000) // Match the spin animation duration

      return () => clearTimeout(timer)
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
    } else if (!isSupported) {
      // Not supported - show fallback button immediately
      setShowFallbackButton(true)
    } else if (hasPermission && !isListening) {
      // Has permission but not listening - show fallback as backup
      const timer = setTimeout(() => {
        setShowFallbackButton(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isSupported, hasPermission, showPermissionPrompt, isListening])

  const handlePermissionRequest = async () => {
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
      <div className="fixed inset-0 bg-black z-50">
        {/* Background gradients */}
        <div className="fixed inset-0 bg-gradient-radial from-slate-900/20 via-transparent to-black/90 pointer-events-none" />
        <div className="fixed inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 pointer-events-none" />
        
        {/* ASCII Background with ethereal scene */}
        <AsciiBackground className="fixed inset-0">
          <div className="min-h-screen flex flex-col items-center justify-center relative">
            {/* Ethereal grass/field description - using text as "scenery" */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-green-900/10 to-transparent pointer-events-none" />
            
            {/* Main content container */}
            <div className="flex flex-col items-center justify-center space-y-8 px-4 z-10">
              {/* Floating dice */}
              <div className="relative">
                <div 
                  className={`text-9xl ${isTossing ? 'animate-spin-fast' : 'animate-bounce'}`} 
                  style={{ animationDuration: isTossing ? '2s' : '3s', animationIterationCount: isTossing ? '1' : 'infinite' }}
                >
                  ⚅
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
                      {isSupported && hasPermission && isListening
                        ? 'Flick your wrist upward to enter'
                        : isSupported && !hasPermission
                        ? 'Enable motion to continue'
                        : 'Welcome to Die Toss'}
                    </p>
                    
                    {isSupported && hasPermission && isListening && (
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

              {/* Status indicator (for debugging/feedback) */}
              {isListening && (
                <div className="text-xs text-white/40 animate-pulse">
                  Listening for gesture...
                </div>
              )}
            </div>
          </div>
        </AsciiBackground>
      </div>
    </>
  )
}

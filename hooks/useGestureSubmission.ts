'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface GestureState {
  isSupported: boolean
  hasPermission: boolean
  isListening: boolean
  lastToss: number | null
}

interface UseGestureSubmissionOptions {
  onToss?: () => void
  threshold?: number
  cooldown?: number
  enableHaptic?: boolean
  minAngleChange?: number
  minimumFinishingAngle?: number
}

export function useGestureSubmission({
  onToss,
  threshold = 15,
  cooldown = 1000,
  enableHaptic = true,
  minAngleChange = 10,
  minimumFinishingAngle = 15
}: UseGestureSubmissionOptions = {}) {
  const [gestureState, setGestureState] = useState<GestureState>({
    isSupported: false,
    hasPermission: false,
    isListening: false,
    lastToss: null
  })
  const [isReady, setIsReady] = useState(false)

  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 })
  const lastTime = useRef(0)
  const smoothedAcceleration = useRef({ x: 0, y: 0, z: 0 })
  const [orientationData, setOrientationData] = useState({ alpha: 0, beta: 0, gamma: 0 })
  const smoothedBeta = useRef(0)

  // Check if DeviceMotion is supported
  useEffect(() => {
    const isSupported = 'DeviceMotionEvent' in window
    setGestureState(prev => ({ ...prev, isSupported }))
  }, [])

  // Request permission and start listening
  const requestPermission = useCallback(async () => {
    if (!gestureState.isSupported) return false

    try {
      // iOS 13+ requires explicit permission
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission()
        if (permission === 'granted') {
          setGestureState(prev => ({ ...prev, hasPermission: true }))
          return true
        }
        return false
      } else {
        // For older iOS versions or other browsers
        setGestureState(prev => ({ ...prev, hasPermission: true }))
        return true
      }
    } catch (error) {
      console.error('Error requesting motion permission:', error)
      return false
    }
  }, [gestureState.isSupported])

  // Handle device orientation changes
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    const newOrientationData = {
      alpha: event.alpha ?? 0,
      beta: event.beta ?? 0,
      gamma: event.gamma ?? 0
    }
    setOrientationData(newOrientationData)
    
    // Apply heavy smoothing to beta (only 2% new data)
    const smoothingFactor = 0.02
    smoothedBeta.current = smoothedBeta.current * (1 - smoothingFactor) + newOrientationData.beta * smoothingFactor
  }, [])

  // Detect toss gesture
  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    if (!event.acceleration) return

    const now = Date.now()
    const x = event.acceleration?.x ?? 0
    const y = event.acceleration?.y ?? 0
    const z = event.acceleration?.z ?? 0

    // Smooth the raw acceleration values first
    const smoothingFactor = 0.1
    smoothedAcceleration.current = {
      x: smoothedAcceleration.current.x * (1 - smoothingFactor) + x * smoothingFactor,
      y: smoothedAcceleration.current.y * (1 - smoothingFactor) + y * smoothingFactor,
      z: smoothedAcceleration.current.z * (1 - smoothingFactor) + z * smoothingFactor
    }
    
    const { x: smoothX, y: smoothY, z: smoothZ } = smoothedAcceleration.current

    // Calculate acceleration delta using smoothed values
    const deltaY = Math.abs(smoothY - lastAcceleration.current.y)
    const deltaX = Math.abs(smoothX - lastAcceleration.current.x)
    const deltaZ = Math.abs(smoothZ - lastAcceleration.current.z)

    // Check for upward flick motion (primary toss gesture)
    const isUpwardFlick = deltaY > threshold && smoothY > 0
    // Check for side-to-side toss motion
    const isSideToss = (deltaX > threshold || deltaZ > threshold) && 
                      (Math.abs(smoothX) > Math.abs(smoothY) || Math.abs(smoothZ) > Math.abs(smoothY))
    
    // Use the smoothed beta from orientation handler (same as test page)
    // Calibrate beta: subtract the flat baseline (90°) to get angle from horizontal
    const finishingAngle = Math.abs(smoothedBeta.current - 90)
    
    // Calculate angle change (optional additional check)
    const currentMagnitude = Math.sqrt(x * x + y * y + z * z)
    const lastMagnitude = Math.sqrt(
      lastAcceleration.current.x * lastAcceleration.current.x +
      lastAcceleration.current.y * lastAcceleration.current.y +
      lastAcceleration.current.z * lastAcceleration.current.z
    )
    
    // Angle change in degrees (simplified calculation)
    const angleChange = currentMagnitude > 0 && lastMagnitude > 0 
      ? Math.acos(Math.min(1, Math.max(-1, 
          (x * lastAcceleration.current.x + y * lastAcceleration.current.y + z * lastAcceleration.current.z) / 
          (currentMagnitude * lastMagnitude)
        ))) * 180 / Math.PI
      : 0

    // Prevent rapid-fire tosses
    const timeSinceLastToss = now - (gestureState.lastToss ?? 0)
    const canToss = timeSinceLastToss > cooldown

    // Debug: Log the toss conditions (commented out to reduce noise)
    // console.log('Hook Toss Debug:', {
    //   isUpwardFlick,
    //   isSideToss,
    //   deltaY: deltaY.toFixed(2),
    //   threshold,
    //   smoothY: smoothY.toFixed(2),
    //   canToss,
    //   timeSinceLastToss: timeSinceLastToss
    // })

    // Simplified toss detection - just check for upward flick (like test page)
    if (isUpwardFlick && canToss) {
      console.log('Hook: Toss triggered!')
      
      // Trigger haptic feedback
      if (enableHaptic && 'vibrate' in navigator) {
        navigator.vibrate([50, 30, 50])
      }

      // Update state
      setGestureState(prev => ({ ...prev, lastToss: now }))

      // Call the toss handler
      onToss?.()
    }

    // Update last values
    lastAcceleration.current = { x, y, z }
    lastTime.current = now
  }, [threshold, cooldown, enableHaptic, minAngleChange, minimumFinishingAngle, onToss, gestureState.lastToss])

  // Start listening for gestures
  const startListening = useCallback(() => {
    if (!gestureState.hasPermission || gestureState.isListening) return

    window.addEventListener('devicemotion', handleMotion, { passive: true })
    window.addEventListener('deviceorientation', handleOrientation, { passive: true })
    setGestureState(prev => ({ ...prev, isListening: true }))
    
    // Add delay before allowing toss detection
    setTimeout(() => {
      setIsReady(true)
    }, 500) // Shorter delay - 0.5 seconds
  }, [gestureState.hasPermission, gestureState.isListening, handleMotion, handleOrientation])

  // Stop listening for gestures
  const stopListening = useCallback(() => {
    if (!gestureState.isListening) return

    window.removeEventListener('devicemotion', handleMotion)
    window.removeEventListener('deviceorientation', handleOrientation)
    setGestureState(prev => ({ ...prev, isListening: false }))
  }, [gestureState.isListening, handleMotion, handleOrientation])

  // Auto-start listening when permission is granted
  useEffect(() => {
    if (gestureState.hasPermission && !gestureState.isListening) {
      startListening()
    }
  }, [gestureState.hasPermission, gestureState.isListening, startListening])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [stopListening])

  return {
    ...gestureState,
    requestPermission,
    startListening,
    stopListening
  }
}

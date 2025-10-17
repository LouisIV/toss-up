'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SensorData {
  x: number
  y: number
  z: number
  timestamp: number
}

interface GestureSettings {
  threshold: number
  cooldown: number
  minAngleChange: number
  minimumFinishingAngle: number
}

export default function TestGesturesPage() {
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const [isListening, setIsListening] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [lastToss, setLastToss] = useState<number | null>(null)
  const [tossCount, setTossCount] = useState(0)
  const [orientationData, setOrientationData] = useState({ alpha: 0, beta: 0, gamma: 0 })
  const [settings, setSettings] = useState<GestureSettings>({
    threshold: 5,
    cooldown: 1000,
    minAngleChange: 5,
    minimumFinishingAngle: 11
  })

  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 })
  const lastTime = useRef(0)
  const maxDataPoints = 100
  const smoothedBeta = useRef(0)
  const [calibratedAngle, setCalibratedAngle] = useState(0)

  // Request permission and start listening
  const requestPermission = async () => {
    if (!('DeviceMotionEvent' in window)) {
      alert('DeviceMotionEvent not supported on this device')
      return false
    }

    try {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission()
        if (permission === 'granted') {
          setHasPermission(true)
          return true
        }
        return false
      } else {
        setHasPermission(true)
        return true
      }
    } catch (error) {
      console.error('Error requesting motion permission:', error)
      return false
    }
  }

  // Handle device orientation changes
  const handleOrientation = (event: DeviceOrientationEvent) => {
    const newOrientationData = {
      alpha: event.alpha ?? 0,
      beta: event.beta ?? 0,
      gamma: event.gamma ?? 0
    }
    setOrientationData(newOrientationData)
    
    // Apply heavy smoothing to beta (only 2% new data)
    const smoothingFactor = 0.02
    smoothedBeta.current = smoothedBeta.current * (1 - smoothingFactor) + newOrientationData.beta * smoothingFactor
    
    // Calibrate beta: subtract the flat baseline (90°) to get angle from horizontal
    const newCalibratedAngle = Math.abs(smoothedBeta.current - 90)
    setCalibratedAngle(newCalibratedAngle)
  }

  // Handle motion data
  const handleMotion = (event: DeviceMotionEvent) => {
    if (!event.acceleration || event.acceleration.x === null || event.acceleration.y === null || event.acceleration.z === null) return

    const now = Date.now()
    const { x, y, z } = event.acceleration

    // Add to sensor data
    const newData: SensorData = { x, y, z, timestamp: now }
    setSensorData(prev => {
      const updated = [...prev, newData]
      return updated.slice(-maxDataPoints) // Keep only last 100 points
    })

    // Calculate deltas
    const deltaX = Math.abs(x - lastAcceleration.current.x)
    const deltaY = Math.abs(y - lastAcceleration.current.y)
    const deltaZ = Math.abs(z - lastAcceleration.current.z)

    // Check for toss gesture (upward only)
    const isUpwardFlick = deltaY > settings.threshold && y > 0
    const isSideToss = (deltaX > settings.threshold || deltaZ > settings.threshold) && 
                      (Math.abs(x) > Math.abs(y) || Math.abs(z) > Math.abs(y))
    
    // Use the calibrated angle from orientation handler
    const currentAngle = calibratedAngle
    
    // Ensure phone ends up pointing upward
    const endsUpward = y > 0

    // Calculate angle change
    const lastMagnitude = Math.sqrt(
      lastAcceleration.current.x * lastAcceleration.current.x +
      lastAcceleration.current.y * lastAcceleration.current.y +
      lastAcceleration.current.z * lastAcceleration.current.z
    )
    
    const angleChange = currentMagnitude > 0 && lastMagnitude > 0 
      ? Math.acos(Math.min(1, Math.max(-1, 
          (x * lastAcceleration.current.x + y * lastAcceleration.current.y + z * lastAcceleration.current.z) / 
          (currentMagnitude * lastMagnitude)
        ))) * 180 / Math.PI
      : 0

    // Check cooldown
    const timeSinceLastToss = now - (lastToss || 0)
    const canToss = timeSinceLastToss > settings.cooldown

    // Debug: Log the toss conditions
    console.log('Toss Debug:', {
      isUpwardFlick,
      isSideToss,
      angleChange: angleChange.toFixed(1),
      minAngleChange: settings.minAngleChange,
      currentAngle: currentAngle.toFixed(1),
      minimumFinishingAngle: settings.minimumFinishingAngle,
      canToss,
      beta: orientationData.beta.toFixed(1),
      smoothedBeta: smoothedBeta.current.toFixed(1),
      calibratedAngle: calibratedAngle.toFixed(1)
    })

    // Simplified test: just check for upward flick with minimal conditions
    if (isUpwardFlick && canToss) {
      setLastToss(now)
      setTossCount(prev => prev + 1)
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50])
      }
    }

    // Update last values
    lastAcceleration.current = { x, y, z }
    lastTime.current = now
  }

  // Start/stop listening
  const toggleListening = async () => {
    if (!isListening) {
      const granted = await requestPermission()
      if (granted) {
        window.addEventListener('devicemotion', handleMotion, { passive: true })
        window.addEventListener('deviceorientation', handleOrientation, { passive: true })
        setIsListening(true)
      }
    } else {
      window.removeEventListener('devicemotion', handleMotion)
      window.removeEventListener('deviceorientation', handleOrientation)
      setIsListening(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleMotion)
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [])

  // Calculate current acceleration magnitude and angle
  const currentMagnitude = sensorData.length > 0 
    ? Math.sqrt(
        Math.pow(sensorData[sensorData.length - 1].x, 2) +
        Math.pow(sensorData[sensorData.length - 1].y, 2) +
        Math.pow(sensorData[sensorData.length - 1].z, 2)
      )
    : 0

  const currentAngle = sensorData.length > 0 && currentMagnitude > 0
    ? Math.acos(Math.abs(sensorData[sensorData.length - 1].y) / currentMagnitude) * 180 / Math.PI
    : 0

  // Calculate recent max acceleration
  const recentMaxAcceleration = sensorData.length > 0
    ? Math.max(...sensorData.slice(-10).map(d => 
        Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z)
      ))
    : 0

  return (
    <div className="min-h-screen bg-black p-4 text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Gesture Test Page</h1>
          <p className="text-white/70">Test and tune your gesture detection settings</p>
        </div>

        {/* Settings Panel */}
        <Card className="bg-black/80 backdrop-blur-xl border border-white/30">
          <CardHeader>
            <CardTitle>Gesture Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Threshold: {settings.threshold}
                </label>
                <Input
                  type="range"
                  min="5"
                  max="50"
                  value={settings.threshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, threshold: Number(e.target.value) }))}
                  className="w-full"
                />
                <p className="text-xs text-white/60 mt-1">Acceleration change required</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cooldown: {settings.cooldown}ms
                </label>
                <Input
                  type="range"
                  min="200"
                  max="3000"
                  step="100"
                  value={settings.cooldown}
                  onChange={(e) => setSettings(prev => ({ ...prev, cooldown: Number(e.target.value) }))}
                  className="w-full"
                />
                <p className="text-xs text-white/60 mt-1">Time between gestures</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Min Angle: {settings.minAngleChange}°
                </label>
                <Input
                  type="range"
                  min="5"
                  max="45"
                  value={settings.minAngleChange}
                  onChange={(e) => setSettings(prev => ({ ...prev, minAngleChange: Number(e.target.value) }))}
                  className="w-full"
                />
                <p className="text-xs text-white/60 mt-1">Minimum angle change required</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Min Finishing Angle: {settings.minimumFinishingAngle}°
                </label>
                <Input
                  type="range"
                  min="5"
                  max="60"
                  value={settings.minimumFinishingAngle}
                  onChange={(e) => setSettings(prev => ({ ...prev, minimumFinishingAngle: Number(e.target.value) }))}
                  className="w-full"
                />
                <p className="text-xs text-white/60 mt-1">Minimum upward angle required when finishing</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={toggleListening}
                className={isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
              >
                {isListening ? 'Stop Listening' : 'Start Listening'}
              </Button>
              
              <Button
                onClick={() => {
                  setSensorData([])
                  setTossCount(0)
                  setLastToss(null)
                }}
                variant="outline"
              >
                Clear Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-black/80 backdrop-blur-xl border border-white/30">
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Permission:</span>
                <span className={hasPermission ? 'text-green-400' : 'text-red-400'}>
                  {hasPermission ? 'Granted' : 'Not Granted'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Listening:</span>
                <span className={isListening ? 'text-green-400' : 'text-red-400'}>
                  {isListening ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Toss Count:</span>
                <span className="text-white font-bold">{tossCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Magnitude:</span>
                <span className="text-white font-bold">{currentMagnitude.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Recent Max:</span>
                <span className="text-white font-bold">{recentMaxAcceleration.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Angle:</span>
                <span className={`font-bold ${currentAngle <= settings.minimumFinishingAngle ? 'text-green-400' : 'text-red-400'}`}>
                  {currentAngle.toFixed(1)}°
                </span>
              </div>
              <div className="flex justify-between">
                <span>Orientation Beta:</span>
                <span className="font-mono text-blue-400">{orientationData.beta.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span>Raw Beta:</span>
                <span className="font-mono text-purple-400">{orientationData.beta.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span>Smoothed Beta:</span>
                <span className="font-mono text-yellow-400">{smoothedBeta.current.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span>Calibrated Angle:</span>
                <span className="font-mono text-green-400">{calibratedAngle.toFixed(1)}°</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/80 backdrop-blur-xl border border-white/30">
            <CardHeader>
              <CardTitle>Live Sensor Data</CardTitle>
            </CardHeader>
            <CardContent>
              {sensorData.length > 0 ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>X:</span>
                    <span className="font-mono">{sensorData[sensorData.length - 1].x.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Y:</span>
                    <span className="font-mono">{sensorData[sensorData.length - 1].y.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Z:</span>
                    <span className="font-mono">{sensorData[sensorData.length - 1].z.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Magnitude:</span>
                    <span className="font-mono">{currentMagnitude.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Angle:</span>
                    <span className={`font-mono ${currentAngle <= settings.minimumFinishingAngle ? 'text-green-400' : 'text-red-400'}`}>
                      {currentAngle.toFixed(1)}°
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-white/60">No sensor data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Acceleration Graph */}
        <Card className="bg-black/80 backdrop-blur-xl border border-white/30">
          <CardHeader>
            <CardTitle>Acceleration Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-black/40 rounded-lg p-4 relative overflow-hidden">
              {sensorData.length > 1 ? (
                <svg width="100%" height="100%" className="absolute inset-0">
                  {/* Threshold line */}
                  <line
                    x1="0"
                    y1={200 - (settings.threshold * 4)}
                    x2="100%"
                    y2={200 - (settings.threshold * 4)}
                    stroke="rgba(255, 0, 0, 0.5)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                  
                  {/* Acceleration magnitude line */}
                  <polyline
                    points={sensorData.map((d, i) => {
                      const x = (i / (sensorData.length - 1)) * 100 + '%'
                      const y = 200 - (Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z) * 4)
                      return `${x},${y}`
                    }).join(' ')}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.8)"
                    strokeWidth="2"
                  />
                  
                  {/* X axis */}
                  <polyline
                    points={sensorData.map((d, i) => {
                      const x = (i / (sensorData.length - 1)) * 100 + '%'
                      const y = 200 - (d.x * 4)
                      return `${x},${y}`
                    }).join(' ')}
                    fill="none"
                    stroke="rgba(255, 0, 0, 0.6)"
                    strokeWidth="1"
                  />
                  
                  {/* Y axis */}
                  <polyline
                    points={sensorData.map((d, i) => {
                      const x = (i / (sensorData.length - 1)) * 100 + '%'
                      const y = 200 - (d.y * 4)
                      return `${x},${y}`
                    }).join(' ')}
                    fill="none"
                    stroke="rgba(0, 255, 0, 0.6)"
                    strokeWidth="1"
                  />
                  
                  {/* Z axis */}
                  <polyline
                    points={sensorData.map((d, i) => {
                      const x = (i / (sensorData.length - 1)) * 100 + '%'
                      const y = 200 - (d.z * 4)
                      return `${x},${y}`
                    }).join(' ')}
                    fill="none"
                    stroke="rgba(0, 0, 255, 0.6)"
                    strokeWidth="1"
                  />
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full text-white/60">
                  Start listening to see acceleration data
                </div>
              )}
            </div>
            <div className="flex justify-between text-xs text-white/60 mt-2">
              <span>White: Magnitude | Red: X | Green: Y | Blue: Z</span>
              <span>Red dashed line: Threshold</span>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-black/80 backdrop-blur-xl border border-white/30">
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. Click "Start Listening" to begin motion detection</p>
            <p>2. Adjust the threshold slider to change sensitivity (higher = less sensitive)</p>
            <p>3. Try different wrist flick motions and watch the graph</p>
            <p>4. The red dashed line shows your current threshold</p>
            <p>5. When acceleration exceeds the threshold, it counts as a toss</p>
            <p>6. Use the cooldown setting to prevent rapid-fire detections</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

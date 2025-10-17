'use client'

import { Button } from './button'

interface TossConfirmationProps {
  onConfirmed: () => void
  onCancelled: () => void
}

export function TossConfirmation({ onConfirmed, onCancelled }: TossConfirmationProps) {
  console.log('🎲 SIMPLE TOSS CONFIRMATION RENDERED!')
  
  return (
    <div className="fixed inset-0 z-50 bg-red-500 flex flex-col items-center justify-center p-6">
      {/* Simple test modal */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          TEST MODAL
        </h2>
        <p className="text-white/80 text-lg">
          This is a test modal to see if it stays visible
        </p>
      </div>

      {/* Simple buttons */}
      <div className="flex gap-4">
        <Button
          onClick={onConfirmed}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Confirm
        </Button>
        <Button
          onClick={onCancelled}
          variant="outline"
          className="border-white/30 text-white hover:bg-white/10"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

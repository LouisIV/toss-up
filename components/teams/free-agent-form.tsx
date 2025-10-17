'use client'

import { useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { freeAgentSchema, type FreeAgentInput } from '@/lib/validations'
import { useRegisterFreeAgent } from '@/hooks/useFreeAgents'
import { Button } from '@/components/ui/button'
import { TossButton } from '@/components/ui/toss-button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FreeAgentFormProps {
  onSuccess?: (result: any) => void
  onCancel?: () => void
  isInDialog?: boolean
}

export function FreeAgentForm({ onSuccess, onCancel, isInDialog = false }: FreeAgentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const registerFreeAgent = useRegisterFreeAgent()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FreeAgentInput>({
    resolver: zodResolver(freeAgentSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  })

  const onSubmit = useCallback(async (data: FreeAgentInput) => {
    if (isSubmitting || submittingRef.current) {
      console.log('Free agent form submission already in progress, ignoring duplicate submission')
      return
    }
    
    submittingRef.current = true
    setIsSubmitting(true)
    try {
      const result = await registerFreeAgent.mutateAsync(data)
      reset()
      onSuccess?.(result)
    } catch (error) {
      console.error('Error registering as free agent:', error)
    } finally {
      setIsSubmitting(false)
      submittingRef.current = false
    }
  }, [isSubmitting, registerFreeAgent, reset, onSuccess])

  const handleFormSubmit = useCallback(() => {
    if (isSubmitting || submittingRef.current) {
      console.log('Free agent form submission already in progress, ignoring button click')
      return
    }
    handleSubmit(onSubmit)()
  }, [handleSubmit, onSubmit, isSubmitting])

  const formContent = (
    <>
      {!isInDialog && (
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white text-center">
            Register as Free Agent
          </CardTitle>
          <p className="text-sm text-white/70 text-center">
            We'll pair you with another free agent to form a team
          </p>
          <p className="text-xs text-white/50 text-center mt-2">
            Fill out the form and tap to confirm
          </p>
        </CardHeader>
      )}
      {isInDialog && (
        <div className="mb-4">
          <p className="text-sm text-white/70 text-center">
            We'll pair you with another free agent to form a team
          </p>
          <p className="text-xs text-white/50 text-center mt-2">
            Fill out the form and tap to confirm
          </p>
        </div>
      )}
      <div className={isInDialog ? "space-y-4" : ""}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1 text-white">
              Your Name
            </label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter your name"
              className={`bg-black/40 border-white/30 text-white placeholder:text-white/50 ${errors.name ? 'border-red-400' : ''}`}
            />
            {errors.name && (
              <p className="text-sm text-red-400 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1 text-white">
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="Enter your phone number"
              className={`bg-black/40 border-white/30 text-white placeholder:text-white/50 ${errors.phone ? 'border-red-400' : ''}`}
            />
            {errors.phone && (
              <p className="text-sm text-red-400 mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <TossButton
              onClick={handleFormSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-white text-black hover:bg-white/90 font-bold rounded-full px-6 py-3"
              fallbackText="Register as Free Agent"
            >
              {isSubmitting ? 'Registering...' : '🎲 Toss to Register'}
            </TossButton>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="border-white/30 text-white hover:bg-white/10 rounded-full px-6 py-3"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </>
  )

  if (isInDialog) {
    return formContent
  }

  return (
    <Card className="w-full max-w-md bg-black/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl">
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  )
}

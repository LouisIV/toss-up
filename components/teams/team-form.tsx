'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { teamSchema, type TeamInput } from '@/lib/validations'
import { useCreateTeam, useUpdateTeam } from '@/hooks/useTeams'
import { Button } from '@/components/ui/button'
import { TossButton } from '@/components/ui/toss-button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Team } from '@/lib/db/schema'

interface TeamFormProps {
  initialValues?: Team
  onSuccess?: () => void
  onCancel?: () => void
  isInDialog?: boolean
}

export function TeamForm({ initialValues, onSuccess, onCancel, isInDialog = false }: TeamFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const createTeam = useCreateTeam()
  const updateTeam = useUpdateTeam()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TeamInput>({
    resolver: zodResolver(teamSchema),
    defaultValues: initialValues ? {
      name: initialValues.name,
      player1: initialValues.player1,
      player2: initialValues.player2,
      mascotUrl: initialValues.mascotUrl || '',
    } : {
      name: '',
      player1: '',
      player2: '',
      mascotUrl: '',
    },
  })

  const onSubmit = useCallback(async (data: any) => {
    if (isSubmitting) {
      console.log('Form submission already in progress, ignoring duplicate submission')
      return
    }
    
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      if (initialValues) {
        await updateTeam.mutateAsync({ id: initialValues.id, ...data })
      } else {
        await createTeam.mutateAsync(data)
      }
      reset()
      onSuccess?.()
    } catch (error: any) {
      console.error('Error saving team:', error)
      if (error?.message?.includes('already exists')) {
        setSubmitError('A team with this name already exists. Please choose a different name.')
      } else {
        setSubmitError('Failed to save team. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, initialValues, updateTeam, createTeam, reset, onSuccess])

  const handleFormSubmit = useCallback(() => {
    if (isSubmitting) {
      console.log('Form submission already in progress, ignoring button click')
      return
    }
    handleSubmit(onSubmit)()
  }, [handleSubmit, onSubmit, isSubmitting])

  const formContent = (
    <>
      {!isInDialog && (
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white text-center">
            {initialValues ? 'Edit Team' : 'Register New Team'}
          </CardTitle>
          <p className="text-xs text-white/50 text-center mt-2">
            Fill out the form and tap to confirm
          </p>
        </CardHeader>
      )}
      {isInDialog && (
        <div className="mb-4">
          <p className="text-xs text-white/50 text-center">
            Fill out the form and tap to confirm
          </p>
        </div>
      )}
      <div className={isInDialog ? "space-y-4" : ""}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1 text-white">
              Team Name
            </label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter team name"
              className={`bg-black/40 border-white/30 text-white placeholder:text-white/50 ${errors.name ? 'border-red-400' : ''}`}
            />
            {errors.name && (
              <p className="text-sm text-red-400 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="player1" className="block text-sm font-medium mb-1 text-white">
              Player 1
            </label>
            <Input
              id="player1"
              {...register('player1')}
              placeholder="Enter player 1 name"
              className={`bg-black/40 border-white/30 text-white placeholder:text-white/50 ${errors.player1 ? 'border-red-400' : ''}`}
            />
            {errors.player1 && (
              <p className="text-sm text-red-400 mt-1">{errors.player1.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="player2" className="block text-sm font-medium mb-1 text-white">
              Player 2
            </label>
            <Input
              id="player2"
              {...register('player2')}
              placeholder="Enter player 2 name"
              className={`bg-black/40 border-white/30 text-white placeholder:text-white/50 ${errors.player2 ? 'border-red-400' : ''}`}
            />
            {errors.player2 && (
              <p className="text-sm text-red-400 mt-1">{errors.player2.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="mascotUrl" className="block text-sm font-medium mb-1 text-white">
              Mascot Image URL (Optional)
            </label>
            <Input
              id="mascotUrl"
              {...register('mascotUrl')}
              placeholder="https://example.com/mascot.png"
              className={`bg-black/40 border-white/30 text-white placeholder:text-white/50 ${errors.mascotUrl ? 'border-red-400' : ''}`}
            />
            {errors.mascotUrl && (
              <p className="text-sm text-red-400 mt-1">{errors.mascotUrl.message}</p>
            )}
          </div>

          {submitError && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-sm text-red-400">{submitError}</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <TossButton
              onClick={handleFormSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-white text-black hover:bg-white/90 font-bold rounded-full px-6 py-3"
              fallbackText={initialValues ? 'Update Team' : 'Register Team'}
            >
              {isSubmitting ? 'Saving...' : (initialValues ? '🎲 Toss to Update' : '🎲 Toss to Register')}
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

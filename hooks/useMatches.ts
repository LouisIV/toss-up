import { useMutation, useQueryClient } from '@tanstack/react-query'

const API_BASE = '/api'

// Update match winner
export function useUpdateMatchWinner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      matchId, 
      winnerId,
      tournamentId,
      round,
      position
    }: { 
      matchId: string
      winnerId: string
      tournamentId?: string
      round?: number
      position?: number
    }): Promise<void> => {
      const response = await fetch(`${API_BASE}/matches/${matchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          winnerId,
          tournamentId,
          round,
          position
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update match')
      }
    },
    onSuccess: () => {
      // Invalidate tournament queries to refresh bracket data
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      queryClient.invalidateQueries({ queryKey: ['tournament'] })
    },
  })
}

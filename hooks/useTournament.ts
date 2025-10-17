import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Tournament, NewTournament } from '@/lib/db/schema'
import { BracketData } from '@/lib/tournament'

const API_BASE = '/api'

// Fetch all tournaments
export function useTournaments() {
  return useQuery({
    queryKey: ['tournaments'],
    queryFn: async (): Promise<Tournament[]> => {
      const response = await fetch(`${API_BASE}/tournaments`)
      if (!response.ok) {
        throw new Error('Failed to fetch tournaments')
      }
      return response.json()
    },
  })
}

// Fetch a single tournament
export function useTournament(id: string) {
  return useQuery({
    queryKey: ['tournament', id],
    queryFn: async (): Promise<Tournament> => {
      const response = await fetch(`${API_BASE}/tournaments/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch tournament')
      }
      return response.json()
    },
    enabled: !!id,
  })
}

// Create a new tournament
export function useCreateTournament() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tournament: NewTournament): Promise<Tournament> => {
      const response = await fetch(`${API_BASE}/tournaments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tournament),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create tournament')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
    },
  })
}

// Update tournament bracket data
export function useUpdateTournamentBracket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      bracketData 
    }: { 
      id: string
      bracketData: BracketData 
    }): Promise<Tournament> => {
      const response = await fetch(`${API_BASE}/tournaments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bracketData }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update tournament')
      }

      return response.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] })
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
    },
  })
}

// Update tournament settings (name, status, tableCount)
export function useUpdateTournamentSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      name, 
      status, 
      tableCount 
    }: { 
      id: string
      name?: string
      status?: string
      tableCount?: number
    }): Promise<Tournament> => {
      const response = await fetch(`${API_BASE}/tournaments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, status, tableCount }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update tournament settings')
      }

      return response.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] })
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
    },
  })
}

// Update tournament lineup and regenerate bracket
export function useUpdateTournamentLineup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      lineup, 
      bracketData 
    }: { 
      id: string
      lineup: string[]
      bracketData: BracketData
    }): Promise<Tournament> => {
      const response = await fetch(`${API_BASE}/tournaments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lineup, bracketData }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update tournament lineup')
      }

      return response.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] })
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
    },
  })
}

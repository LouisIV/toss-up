import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Team, NewTeam } from '@/lib/db/schema'
import { usePlausible } from 'next-plausible'

const API_BASE = '/api'

// Fetch all teams
export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async (): Promise<Team[]> => {
      const response = await fetch(`${API_BASE}/teams`)
      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }
      return response.json()
    },
  })
}

// Create a new team
export function useCreateTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (team: NewTeam): Promise<Team> => {
      const response = await fetch(`${API_BASE}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(team),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create team')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

// Update a team
export function useUpdateTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...team }: { id: string } & NewTeam): Promise<Team> => {
      const response = await fetch(`${API_BASE}/teams/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(team),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update team')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

// Delete a team
export function useDeleteTeam() {
  const queryClient = useQueryClient()
  const plausible = usePlausible()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/teams/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete team')
      }
    },
    onSuccess: () => {
      // Track team deletion event
      plausible('Team Deleted')
      
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

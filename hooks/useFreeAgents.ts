import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FreeAgent, NewFreeAgent } from '@/lib/db/schema'
import { usePlausible } from 'next-plausible'

const API_BASE = '/api'

// Fetch all free agents
export function useFreeAgents() {
  return useQuery({
    queryKey: ['free-agents'],
    queryFn: async (): Promise<FreeAgent[]> => {
      const response = await fetch(`${API_BASE}/free-agents`)
      if (!response.ok) {
        throw new Error('Failed to fetch free agents')
      }
      return response.json()
    },
  })
}

// Fetch a single free agent
export function useFreeAgent(id: string) {
  return useQuery({
    queryKey: ['free-agents', id],
    queryFn: async (): Promise<FreeAgent> => {
      const response = await fetch(`${API_BASE}/free-agents/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch free agent')
      }
      return response.json()
    },
    enabled: !!id,
  })
}

// Register as a free agent
export function useRegisterFreeAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (freeAgent: NewFreeAgent): Promise<FreeAgent & { team?: any; partner?: any }> => {
      const response = await fetch(`${API_BASE}/free-agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(freeAgent),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to register as free agent')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['free-agents'] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

// Withdraw from free agent pool
export function useWithdrawFreeAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/free-agents/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to withdraw from free agent pool')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['free-agents'] })
    },
  })
}

// Manual pairing of specific free agents
export function usePairFreeAgents() {
  const queryClient = useQueryClient()
  const plausible = usePlausible()

  return useMutation({
    mutationFn: async (agentIds: [string, string]): Promise<{ success: boolean; team: any; pairedAgents: any[] }> => {
      const response = await fetch(`${API_BASE}/free-agents`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'pair',
          agentIds,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to pair free agents')
      }

      return response.json()
    },
    onSuccess: () => {
      // Track manual free agent pairing event
      plausible('Free Agents Paired', {
        props: {
          pairingType: 'manual',
        }
      })
      
      queryClient.invalidateQueries({ queryKey: ['free-agents'] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

// Auto-pair all waiting free agents
export function useAutoPairFreeAgents() {
  const queryClient = useQueryClient()
  const plausible = usePlausible()

  return useMutation({
    mutationFn: async (): Promise<{ success: boolean; pairs: any[]; totalPaired: number }> => {
      const response = await fetch(`${API_BASE}/free-agents`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'auto-pair',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to auto-pair free agents')
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Track auto free agent pairing event
      plausible('Free Agents Paired', {
        props: {
          pairingType: 'auto',
          pairCount: data.pairs?.length || 0,
          totalPaired: data.totalPaired || 0,
        }
      })
      
      queryClient.invalidateQueries({ queryKey: ['free-agents'] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

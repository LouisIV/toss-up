'use client'

import { useState, useCallback } from 'react'
import { useFreeAgents, usePairFreeAgents, useAutoPairFreeAgents, useWithdrawFreeAgent } from '@/hooks/useFreeAgents'
import { Button } from '@/components/ui/button'
import { TossButton } from '@/components/ui/toss-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FreeAgent } from '@/lib/db/schema'

export function FreeAgentManager() {
  const { data: freeAgents, isLoading, error } = useFreeAgents()
  const pairFreeAgents = usePairFreeAgents()
  const autoPairFreeAgents = useAutoPairFreeAgents()
  const withdrawFreeAgent = useWithdrawFreeAgent()
  
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [isPairing, setIsPairing] = useState(false)

  const waitingAgents = freeAgents?.filter(agent => agent.status === 'waiting') || []
  const pairedAgents = freeAgents?.filter(agent => agent.status === 'paired') || []

  const handleAgentSelect = useCallback((agentId: string) => {
    setSelectedAgents(prev => {
      if (prev.includes(agentId)) {
        return prev.filter(id => id !== agentId)
      } else if (prev.length < 2) {
        return [...prev, agentId]
      }
      return prev
    })
  }, [])

  const handleManualPair = useCallback(async () => {
    if (selectedAgents.length !== 2) return
    
    setIsPairing(true)
    try {
      await pairFreeAgents.mutateAsync([selectedAgents[0], selectedAgents[1]] as [string, string])
      setSelectedAgents([])
    } catch (error) {
      console.error('Error pairing agents:', error)
    } finally {
      setIsPairing(false)
    }
  }, [selectedAgents, pairFreeAgents])

  const handleAutoPair = useCallback(async () => {
    setIsPairing(true)
    try {
      const result = await autoPairFreeAgents.mutateAsync()
      console.log(`Successfully paired ${result.totalPaired} agents into ${result.pairs.length} teams`)
    } catch (error) {
      console.error('Error auto-pairing agents:', error)
    } finally {
      setIsPairing(false)
    }
  }, [autoPairFreeAgents])

  const handleWithdraw = useCallback(async (agentId: string) => {
    try {
      await withdrawFreeAgent.mutateAsync(agentId)
    } catch (error) {
      console.error('Error withdrawing agent:', error)
    }
  }, [withdrawFreeAgent])

  if (isLoading) {
    return (
      <Card className="bg-black/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl">
        <CardContent className="p-6">
          <div className="text-white/70">Loading free agents...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-black/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl">
        <CardContent className="p-6">
          <div className="text-red-400">Error loading free agents: {error.message}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card className="bg-black/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-white">Free Agents Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{waitingAgents.length}</div>
              <div className="text-sm text-white/70">Waiting to be paired</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{pairedAgents.length}</div>
              <div className="text-sm text-white/70">Successfully paired</div>
            </div>
          </div>
          
          {/* Auto-pair button */}
          {waitingAgents.length >= 2 && (
            <div className="pt-2">
              <TossButton
                onClick={handleAutoPair}
                disabled={isPairing || autoPairFreeAgents.isPending}
                className="w-full bg-green-600 text-white hover:bg-green-700 font-bold rounded-full px-6 py-3"
                fallbackText="Auto-Pair All"
              >
                {isPairing || autoPairFreeAgents.isPending ? 'Pairing...' : '🎲 Auto-Pair All Free Agents'}
              </TossButton>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Pairing Section */}
      {waitingAgents.length >= 2 && (
        <Card className="bg-black/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-white">Manual Pairing</CardTitle>
            <p className="text-sm text-white/70">Select 2 free agents to pair them manually</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              {waitingAgents.map((agent) => (
                <div
                  key={agent.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedAgents.includes(agent.id)
                      ? 'bg-blue-600/20 border-blue-400 text-blue-100'
                      : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                  }`}
                  onClick={() => handleAgentSelect(agent.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-xs text-white/60">{agent.phone}</div>
                    </div>
                    {selectedAgents.includes(agent.id) && (
                      <div className="text-blue-400">✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {selectedAgents.length === 2 && (
              <div className="pt-2">
                <TossButton
                  onClick={handleManualPair}
                  disabled={isPairing || pairFreeAgents.isPending}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-full px-6 py-3"
                  fallbackText="Pair Selected"
                >
                  {isPairing || pairFreeAgents.isPending ? 'Pairing...' : '🎲 Pair Selected Agents'}
                </TossButton>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Waiting Agents List */}
      {waitingAgents.length > 0 && (
        <Card className="bg-black/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-white">Waiting Free Agents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {waitingAgents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/20">
                <div>
                  <div className="font-medium text-white">{agent.name}</div>
                  <div className="text-xs text-white/60">{agent.phone}</div>
                </div>
                <Button
                  onClick={() => handleWithdraw(agent.id)}
                  disabled={withdrawFreeAgent.isPending}
                  variant="outline"
                  size="sm"
                  className="border-red-400 text-red-400 hover:bg-red-400/10"
                >
                  Withdraw
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Paired Agents List */}
      {pairedAgents.length > 0 && (
        <Card className="bg-black/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-white">Successfully Paired</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pairedAgents.map((agent) => (
              <div key={agent.id} className="p-3 bg-green-600/10 rounded-lg border border-green-400/30">
                <div className="font-medium text-green-100">{agent.name}</div>
                <div className="text-xs text-green-400/70">Paired and ready to play!</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {waitingAgents.length === 0 && pairedAgents.length === 0 && (
        <Card className="bg-black/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl">
          <CardContent className="p-6 text-center">
            <div className="text-white/70">No free agents registered yet</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

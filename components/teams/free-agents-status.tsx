'use client'

import { useState } from 'react'
import { useFreeAgents } from '@/hooks/useFreeAgents'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FreeAgentManager } from './free-agent-manager'

export function FreeAgentsStatus() {
  const { data: freeAgents, isLoading, error } = useFreeAgents()
  const [showManager, setShowManager] = useState(false)

  if (isLoading) {
    return (
      <Card className="bg-black/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl">
        <CardContent className="p-4">
          <div className="text-white/70">Loading free agents...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-black/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl">
        <CardContent className="p-4">
          <div className="text-red-400">Error loading free agents: {error.message}</div>
        </CardContent>
      </Card>
    )
  }

  const waitingAgents = freeAgents?.filter(agent => agent.status === 'waiting') || []
  const pairedAgents = freeAgents?.filter(agent => agent.status === 'paired') || []

  if (showManager) {
    return (
      <div className="space-y-4">
        <Button
          onClick={() => setShowManager(false)}
          variant="outline"
          className="border-white/30 text-white hover:bg-white/10"
        >
          ← Back to Status
        </Button>
        <FreeAgentManager />
      </div>
    )
  }

  return (
    <Card className="bg-black/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm md:text-lg font-bold text-white">Free Agents Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4 p-3 md:p-6">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-white">{waitingAgents.length}</div>
            <div className="text-xs md:text-sm text-white/70">Waiting to be paired</div>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-white">{pairedAgents.length}</div>
            <div className="text-xs md:text-sm text-white/70">Successfully paired</div>
          </div>
        </div>
        
        {waitingAgents.length > 0 && (
          <div>
            <div className="text-xs md:text-sm text-white/70 mb-2">Currently waiting:</div>
            <div className="space-y-1">
              {waitingAgents.map((agent) => (
                <div key={agent.id} className="text-xs md:text-sm text-white">
                  {agent.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {(waitingAgents.length > 0 || pairedAgents.length > 0) && (
          <div className="pt-2">
            <Button
              onClick={() => setShowManager(true)}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-full px-6 py-3"
            >
              Manage Free Agents
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

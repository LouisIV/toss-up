'use client'

import { useState } from 'react'
import { useTeams } from '@/hooks/useTeams'
import { TeamCard } from './team-card'
import { TeamForm } from './team-form'
import { FreeAgentForm } from './free-agent-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function TeamList() {
  const [isAddingTeam, setIsAddingTeam] = useState(false)
  const [isAddingFreeAgent, setIsAddingFreeAgent] = useState(false)
  const [registrationMode, setRegistrationMode] = useState<'team' | 'free-agent' | null>(null)
  const { data: teams, isLoading, error } = useTeams()
  
  // Debug log to ensure state is defined
  console.log('registrationMode:', registrationMode)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-white">Loading teams...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-red-400">
          Error loading teams: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-2">
        <h2 className="text-lg md:text-2xl font-bold text-white">Registered Teams</h2>
        {teams && teams.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => {
                setRegistrationMode('free-agent')
                setIsAddingFreeAgent(true)
              }}
              size="sm"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 text-xs md:text-sm"
            >
              Register as Free Agent
            </Button>
            <Button
              onClick={() => {
                setRegistrationMode('team')
                setIsAddingTeam(true)
              }}
              size="sm"
              className="pill-button text-xs md:text-sm"
            >
              Register Team
            </Button>
          </div>
        )}
      </div>

      {teams && teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 md:py-12">
          <p className="text-sm md:text-lg text-white/70 mb-4">
            No teams registered yet
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              onClick={() => {
                setRegistrationMode('free-agent')
                setIsAddingFreeAgent(true)
              }}
              size="sm"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 text-xs md:text-sm"
            >
              Register as Free Agent
            </Button>
            <Button
              onClick={() => {
                setRegistrationMode('team')
                setIsAddingTeam(true)
              }}
              size="sm"
              className="pill-button text-xs md:text-sm"
            >
              Register First Team
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isAddingTeam} onOpenChange={setIsAddingTeam}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register New Team</DialogTitle>
          </DialogHeader>
          <TeamForm
            isInDialog={true}
            onSuccess={() => {
              setIsAddingTeam(false)
              setRegistrationMode(null)
            }}
            onCancel={() => {
              setIsAddingTeam(false)
              setRegistrationMode(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingFreeAgent} onOpenChange={setIsAddingFreeAgent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register as Free Agent</DialogTitle>
          </DialogHeader>
          <FreeAgentForm
            isInDialog={true}
            onSuccess={(result: unknown) => {
              setIsAddingFreeAgent(false)
              setRegistrationMode(null)
              // Show success message if paired
              if (result && typeof result === 'object' && 'status' in result && result.status === 'paired' && 'team' in result && result.team) {
                const typedResult = result as { status: string; team: { name: string }; partner?: { name: string } };
                alert(`Great! You've been paired with ${typedResult.partner?.name} to form team "${typedResult.team.name}"`)
              } else {
                alert('You\'ve been registered as a free agent. We\'ll pair you with someone soon!')
              }
            }}
            onCancel={() => {
              setIsAddingFreeAgent(false)
              setRegistrationMode(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

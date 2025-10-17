'use client'

import { useState } from 'react'
import { Team } from '@/lib/db/schema'
import { BracketData } from '@/lib/tournament'
import { MatchCard } from './match-card'

interface BracketViewProps {
  bracketData: BracketData
  teams: Team[]
  tournamentId: string
}

export function BracketView({ bracketData, teams, tournamentId }: BracketViewProps) {
  // Use the bracket data directly from props instead of local state
  // This ensures we always show the latest data from the server
  const currentBracket = bracketData

  const handleBracketUpdate = (newBracket: BracketData) => {
    // This is now handled by query invalidation in the backend
    // No need to update local state
  }

  if (!currentBracket.rounds || currentBracket.rounds.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-muted-foreground">No bracket data available</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-8 min-w-max p-4">
        {currentBracket.rounds.map((round, roundIndex) => (
          <div key={round.round} className="flex flex-col gap-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold">
                {roundIndex === currentBracket.rounds.length - 1 
                  ? 'Final' 
                  : `Round ${round.round}`
                }
              </h3>
            </div>
            
            <div className="flex flex-col gap-6">
              {round.matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  teams={teams}
                  tournamentId={tournamentId}
                  round={round.round}
                  currentBracket={currentBracket}
                  onBracketUpdate={handleBracketUpdate}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

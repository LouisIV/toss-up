'use client'

import { useState } from 'react'
import { Team } from '@/lib/db/schema'
import { BracketMatch } from '@/lib/tournament'
import { useUpdateMatchWinner } from '@/hooks/useMatches'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface MatchCardProps {
  match: BracketMatch
  teams: Team[]
  tournamentId: string
  round: number
  currentBracket: unknown
  onBracketUpdate: (newBracket: unknown) => void
}

export function MatchCard({ match, teams, tournamentId, round, currentBracket, onBracketUpdate }: MatchCardProps) {
  const [selectedWinner, setSelectedWinner] = useState<string | null>(match.winnerId || null)
  const updateMatch = useUpdateMatchWinner()

  const team1 = teams.find(t => t.id === match.team1Id)
  const team2 = teams.find(t => t.id === match.team2Id)

  const handleWinnerSelect = async (winnerId: string) => {
    if (selectedWinner === winnerId) return

    setSelectedWinner(winnerId)
    
    try {
      await updateMatch.mutateAsync({
        matchId: match.id,
        winnerId,
        tournamentId,
        round,
        position: match.position,
      })
      
      // The tournament data will be refreshed automatically via query invalidation
      // No need to manually update local state
    } catch (error) {
      console.error('Error updating match:', error)
      setSelectedWinner(match.winnerId || null)
    }
  }

  const isMatchComplete = team1 && team2
  const hasWinner = selectedWinner
  const isByeMatch = team1 && !team2
  const isEliminated = (teamId: string) => {
    if (!hasWinner) return false
    return selectedWinner !== teamId
  }

  return (
    <Card className={`min-w-[200px] ${hasWinner ? 'border-accent' : ''}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Team 1 */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {team1 ? (
                <div className={`p-2 rounded border-thick transition-all ${
                  selectedWinner === team1.id 
                    ? 'border-accent bg-accent/10' 
                    : isEliminated(team1.id)
                    ? 'border-gray-500 bg-gray-500/10 opacity-50'
                    : 'border-border'
                }`}>
                  <p className={`font-medium text-sm ${
                    isEliminated(team1.id) ? 'text-gray-400' : ''
                  }`}>
                    {team1.name}
                    {isByeMatch && ' (Bye)'}
                  </p>
                  <p className={`text-xs ${
                    isEliminated(team1.id) ? 'text-gray-500' : 'text-muted-foreground'
                  }`}>
                    {team1.player1} & {team1.player2}
                  </p>
                </div>
              ) : (
                <div className="p-2 rounded border-thick border-dashed border-muted-foreground/30">
                  <p className="text-muted-foreground text-sm">TBD</p>
                </div>
              )}
            </div>
            {team1 && !isByeMatch && (
              <Button
                size="sm"
                variant={selectedWinner === team1.id ? "default" : "outline"}
                onClick={() => handleWinnerSelect(team1.id)}
                disabled={updateMatch.isPending}
                className="ml-2"
              >
                Win
              </Button>
            )}
            {isByeMatch && (
              <div className="ml-2 px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded border border-green-500/30">
                {hasWinner ? 'Advanced' : 'Auto-Advance'}
              </div>
            )}
          </div>

          {/* VS or BYE */}
          <div className="text-center">
            <span className="text-xs font-bold text-muted-foreground">
              {isByeMatch ? (hasWinner ? 'ADVANCED' : 'BYE') : 'VS'}
            </span>
          </div>

          {/* Team 2 */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {team2 ? (
                <div className={`p-2 rounded border-thick transition-all ${
                  selectedWinner === team2.id 
                    ? 'border-accent bg-accent/10' 
                    : isEliminated(team2.id)
                    ? 'border-gray-500 bg-gray-500/10 opacity-50'
                    : 'border-border'
                }`}>
                  <p className={`font-medium text-sm ${
                    isEliminated(team2.id) ? 'text-gray-400' : ''
                  }`}>
                    {team2.name}
                  </p>
                  <p className={`text-xs ${
                    isEliminated(team2.id) ? 'text-gray-500' : 'text-muted-foreground'
                  }`}>
                    {team2.player1} & {team2.player2}
                  </p>
                </div>
              ) : isByeMatch ? (
                <div className="p-2 rounded border-thick border-dashed border-muted-foreground/30">
                  <p className="text-muted-foreground text-sm">No Opponent</p>
                </div>
              ) : (
                <div className="p-2 rounded border-thick border-dashed border-muted-foreground/30">
                  <p className="text-muted-foreground text-sm">TBD</p>
                </div>
              )}
            </div>
            {team2 && (
              <Button
                size="sm"
                variant={selectedWinner === team2.id ? "default" : "outline"}
                onClick={() => handleWinnerSelect(team2.id)}
                disabled={updateMatch.isPending}
                className="ml-2"
              >
                Win
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

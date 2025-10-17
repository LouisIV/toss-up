'use client'

import { useState } from 'react'
import { Team } from '@/lib/db/schema'
import { BracketData, BracketMatch } from '@/lib/tournament'
import { useUpdateMatchWinner } from '@/hooks/useMatches'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TableViewProps {
  bracketData: BracketData
  teams: Team[]
  tournamentId: string
  tableCount: number
}

export function TableView({ bracketData, teams, tournamentId, tableCount }: TableViewProps) {
  const updateMatch = useUpdateMatchWinner()

  // Debug: Log the bracket data structure
  console.log('TableView received bracketData:', bracketData)
  console.log('TableView received tableCount:', tableCount)
  
  // Debug: Log all matches and their table assignments
  if (bracketData.rounds) {
    bracketData.rounds.forEach(round => {
      console.log(`Round ${round.round} matches:`)
      round.matches.forEach(match => {
        console.log(`  Match ${match.id}: table ${match.tableId}, position ${match.position}`)
      })
    })
  }

  // Helper function to get active matches for a specific table
  const getActiveMatchesForTable = (tableId: number): BracketMatch[] => {
    const activeMatches: BracketMatch[] = []
    
    console.log(`Looking for matches on table ${tableId}`)
    
    // Find the current round (the earliest round with unfinished matches)
    let currentRound = null
    for (const round of bracketData.rounds) {
      const hasUnfinishedMatches = round.matches.some(match => 
        match.tableId === tableId && isMatchActive(match)
      )
      if (hasUnfinishedMatches) {
        currentRound = round
        break
      }
    }
    
    if (!currentRound) {
      console.log(`No current round found for table ${tableId}`)
      return activeMatches
    }
    
    console.log(`Current round for table ${tableId}: ${currentRound.round}`)
    
    // Only show the FIRST active match from the current round for this table
    // This ensures only one match is active per table at a time
    for (const match of currentRound.matches) {
      if (match.tableId === tableId && isMatchActive(match)) {
        const matchWithRound: BracketMatch = {
          ...match,
          round: currentRound.round
        }
        console.log(`Found active match for table ${tableId}:`, matchWithRound)
        activeMatches.push(matchWithRound)
        // Only take the first active match for this table
        break
      }
    }
    
    console.log(`Active matches for table ${tableId}:`, activeMatches)
    return activeMatches
  }

  // Helper function to get the next match for a table
  const getNextMatchForTable = (tableId: number): BracketMatch | null => {
    // Find the current round for this table
    let currentRoundIndex = -1
    for (let i = 0; i < bracketData.rounds.length; i++) {
      const round = bracketData.rounds[i]
      const hasUnfinishedMatches = round.matches.some(match => 
        match.tableId === tableId && isMatchActive(match)
      )
      if (hasUnfinishedMatches) {
        currentRoundIndex = i
        break
      }
    }
    
    // If no current round, look for the next round with matches for this table
    if (currentRoundIndex === -1) {
      for (let i = 0; i < bracketData.rounds.length; i++) {
        const round = bracketData.rounds[i]
        const hasMatchesForTable = round.matches.some(match => match.tableId === tableId)
        if (hasMatchesForTable) {
          currentRoundIndex = i
          break
        }
      }
    }
    
    // Look for the next match in the current round or subsequent rounds
    for (let i = currentRoundIndex + 1; i < bracketData.rounds.length; i++) {
      const round = bracketData.rounds[i]
      for (const match of round.matches) {
        if (match.tableId === tableId && !match.winnerId) {
          const matchWithRound: BracketMatch = {
            ...match,
            round: round.round
          }
          return matchWithRound
        }
      }
    }
    
    return null
  }

  // Helper function to check if a match is currently active
  const isMatchActive = (match: BracketMatch): boolean => {
    const isActive = !!(match.team1Id && match.team2Id && !match.winnerId)
    console.log(`Checking if match ${match.id} is active:`, {
      team1Id: match.team1Id,
      team2Id: match.team2Id,
      winnerId: match.winnerId,
      isActive
    })
    return isActive
  }

  // Helper function to get team by ID
  const getTeamById = (teamId: string): Team | undefined => {
    return teams.find(team => team.id === teamId)
  }

  // Helper function to handle winner selection
  const handleWinnerSelect = async (match: BracketMatch, winnerId: string) => {
    console.log('handleWinnerSelect called with match:', match)
    console.log('handleWinnerSelect called with winnerId:', winnerId)
    console.log('match.round value:', match.round)
    console.log('typeof match.round:', typeof match.round)
    console.log('match.round === 0:', match.round === 0)
    console.log('match.round === undefined:', match.round === undefined)
    console.log('match.round === null:', match.round === null)
    
    if (match.round === undefined || match.round === null) {
      console.error('No round found for match:', match)
      console.error('Available match properties:', Object.keys(match))
      return
    }

    console.log('Handling winner selection:', {
      matchId: match.id,
      winnerId,
      tournamentId,
      round: match.round,
      position: match.position
    })

    console.log('About to call updateMatch.mutateAsync...')
    
    try {
      const result = await updateMatch.mutateAsync({
        matchId: match.id,
        winnerId,
        tournamentId,
        round: match.round,
        position: match.position,
      })
      console.log('Match updated successfully:', result)
    } catch (error) {
      console.error('Error updating match:', error)
      console.error('Error details:', error)
    }
  }

  // Generate table colors for visual distinction
  const getTableColor = (tableId: number) => {
    const colors = [
      'border-blue-500/30 bg-blue-500/5',
      'border-green-500/30 bg-green-500/5',
      'border-purple-500/30 bg-purple-500/5',
      'border-orange-500/30 bg-orange-500/5',
      'border-pink-500/30 bg-pink-500/5',
      'border-cyan-500/30 bg-cyan-500/5',
    ]
    return colors[(tableId - 1) % colors.length]
  }

  const getTableHeaderColor = (tableId: number) => {
    const colors = [
      'text-blue-400',
      'text-green-400',
      'text-purple-400',
      'text-orange-400',
      'text-pink-400',
      'text-cyan-400',
    ]
    return colors[(tableId - 1) % colors.length]
  }

  if (!bracketData.rounds || bracketData.rounds.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-muted-foreground">No bracket data available</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {Array.from({ length: tableCount }, (_, index) => {
          const tableId = index + 1
          const activeMatches = getActiveMatchesForTable(tableId)
          const nextMatch = getNextMatchForTable(tableId)
          const tableColor = getTableColor(tableId)
          const headerColor = getTableHeaderColor(tableId)
          
          console.log(`Table ${tableId}: ${activeMatches.length} active matches, next match:`, nextMatch)

          return (
            <Card key={tableId} className={`bg-black/80 backdrop-blur-xl border-2 ${tableColor} rounded-2xl`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-xl font-bold ${headerColor} text-center`}>
                  Table {tableId}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Match */}
                {activeMatches.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                      Current Match
                    </h4>
                    {activeMatches.map((match) => {
                      console.log('Rendering match:', match)
                      
                      if (!match || !match.team1Id || !match.team2Id) {
                        console.error('Invalid match object:', match)
                        return null
                      }
                      
                      const team1 = getTeamById(match.team1Id)
                      const team2 = getTeamById(match.team2Id)
                      
                      if (!team1 || !team2) {
                        console.error('Teams not found for match:', { team1, team2, match })
                        return null
                      }

                      return (
                        <div key={match.id} className="space-y-3">
                          <div className="text-center">
                            <div className="text-xs text-white/60 mb-2">
                              Round {match.round}
                            </div>
                          </div>
                          
                          {/* Team 1 */}
                          <div className="flex items-center justify-between p-3 rounded-lg border border-white/20 bg-white/5">
                            <div className="flex-1">
                              <p className="font-medium text-white text-sm">{team1.name}</p>
                              <p className="text-xs text-white/60">{team1.player1} & {team1.player2}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('Button clicked for team1:', team1.id)
                                console.log('Match object at button click:', match)
                                console.log('Match round:', match.round)
                                handleWinnerSelect(match, team1.id)
                              }}
                              disabled={updateMatch.isPending}
                              className="ml-3 min-h-[44px] min-w-[60px] text-white border-white/30 hover:bg-white/10"
                            >
                              Win
                            </Button>
                          </div>

                          {/* VS */}
                          <div className="text-center">
                            <span className="text-xs font-bold text-white/60">VS</span>
                          </div>

                          {/* Team 2 */}
                          <div className="flex items-center justify-between p-3 rounded-lg border border-white/20 bg-white/5">
                            <div className="flex-1">
                              <p className="font-medium text-white text-sm">{team2.name}</p>
                              <p className="text-xs text-white/60">{team2.player1} & {team2.player2}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('Button clicked for team2:', team2.id)
                                console.log('Match object at button click:', match)
                                console.log('Match round:', match.round)
                                handleWinnerSelect(match, team2.id)
                              }}
                              disabled={updateMatch.isPending}
                              className="ml-3 min-h-[44px] min-w-[60px] text-white border-white/30 hover:bg-white/10"
                            >
                              Win
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-white/60 text-sm">No active matches</p>
                  </div>
                )}

                {/* Next Up */}
                {nextMatch && (
                  <div className="space-y-2 pt-4 border-t border-white/20">
                    <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                      Next Up
                    </h4>
                    <div className="p-3 rounded-lg border border-dashed border-white/30 bg-white/5">
                      {nextMatch.team1Id && nextMatch.team2Id ? (
                        <div className="text-center">
                          <p className="text-white text-sm font-medium">
                            {getTeamById(nextMatch.team1Id)?.name} vs {getTeamById(nextMatch.team2Id)?.name}
                          </p>
                          <p className="text-xs text-white/60 mt-1">
                            Round {nextMatch.round}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-white/60 text-sm">Waiting for previous round</p>
                          <p className="text-xs text-white/50 mt-1">
                            Round {nextMatch.round}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* No more matches */}
                {!activeMatches.length && !nextMatch && (
                  <div className="text-center py-4">
                    <p className="text-white/60 text-sm">Table complete</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

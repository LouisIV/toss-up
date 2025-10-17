'use client'

import { useState, useEffect } from 'react'
import { Team } from '@/lib/db/schema'
import { useTournamentActions } from '@/lib/tournament-utils'
import { Button } from '@/components/ui/button'
import { TossButton } from '@/components/ui/toss-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

interface TournamentControlsProps {
  teams: Team[]
  onTournamentCreated: (tournament: any) => void
  hasActiveTournament?: boolean
}

export function TournamentControls({ teams, onTournamentCreated, hasActiveTournament = false }: TournamentControlsProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [tableCount, setTableCount] = useState(1)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [lineup, setLineup] = useState<Team[]>([])
  const { createNewTournament, isCreating: isCreatingTournament } = useTournamentActions()

  // Initialize lineup when teams change
  useEffect(() => {
    if (teams.length > 0 && lineup.length === 0) {
      setLineup([...teams])
    }
  }, [teams, lineup.length])

  const handleCreateTournament = async () => {
    if (lineup.length < 2) {
      alert('You need at least 2 teams to create a tournament!')
      return
    }

    setIsCreating(true)
    try {
      const tournament = await createNewTournament(lineup, tableCount)
      onTournamentCreated(tournament)
    } catch (error) {
      console.error('Error creating tournament:', error)
      alert('Failed to create tournament. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(lineup)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setLineup(items)
  }

  const resetLineup = () => {
    setLineup([...teams])
  }

  const canCreateTournament = lineup.length >= 2 && !isCreatingTournament

  return (
    <Card className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl text-white">Tournament Controls</CardTitle>
        <p className="text-xs text-white/50 text-center mt-2">
          Configure tables and lineup, then generate tournament brackets
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-white/70 mb-4">
            {lineup.length} team{lineup.length !== 1 ? 's' : ''} in lineup
          </p>

          {/* Table Count Configuration */}
          <div className="mb-4 p-3 border border-white/20 rounded-lg bg-white/5">
            <label className="block text-sm text-white/80 mb-2">
              Number of Tables (Concurrent Games)
            </label>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTableCount(Math.max(1, tableCount - 1))}
                disabled={tableCount <= 1}
                className="text-white border-white/30 hover:bg-white/10"
              >
                -
              </Button>
              <Input
                type="number"
                min="1"
                max={Math.ceil(lineup.length / 2)}
                value={tableCount}
                onChange={(e) => setTableCount(Math.max(1, Math.min(Math.ceil(lineup.length / 2), parseInt(e.target.value) || 1)))}
                className="w-16 text-center text-white bg-transparent border-white/30"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTableCount(Math.min(Math.ceil(lineup.length / 2), tableCount + 1))}
                disabled={tableCount >= Math.ceil(lineup.length / 2)}
                className="text-white border-white/30 hover:bg-white/10"
              >
                +
              </Button>
            </div>
            <p className="text-xs text-white/50 mt-1">
              Max: {Math.ceil(lineup.length / 2)} tables
            </p>
          </div>

          {/* Advanced Controls Toggle */}
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              {showAdvanced ? 'Hide' : 'Show'} Lineup Management
            </Button>
          </div>

          {/* Lineup Management */}
          {showAdvanced && (
            <div className="mb-4 p-3 border border-white/20 rounded-lg bg-white/5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-white">Team Lineup</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetLineup}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  Reset Order
                </Button>
              </div>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="lineup">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2 max-h-40 overflow-y-auto"
                    >
                      {lineup.map((team, index) => (
                        <Draggable key={team.id} draggableId={team.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-2 rounded-lg border text-sm transition-colors ${
                                snapshot.isDragging
                                  ? 'bg-accent/20 border-accent'
                                  : 'bg-white/10 border-white/20 hover:bg-white/15'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-white font-medium">
                                  {index + 1}. {team.name}
                                </span>
                                <span className="text-white/60 text-xs">
                                  {team.player1} & {team.player2}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}
          
          {hasActiveTournament ? (
            <div className="space-y-4">
              <div className="p-4 border border-accent rounded-lg bg-accent/5">
                <p className="text-sm text-accent font-medium">
                  Tournament in progress! Creating a new tournament will end the current one.
                </p>
              </div>
              <TossButton
                onClick={handleCreateTournament}
                disabled={!canCreateTournament}
                className="pill-button w-full"
                variant="outline"
                fallbackText="Start New Tournament (Ends Current)"
              >
                {isCreatingTournament ? 'Creating New Tournament...' : '🎲 Toss to Start New Tournament'}
              </TossButton>
            </div>
          ) : (
            <>
              <TossButton
                onClick={handleCreateTournament}
                disabled={!canCreateTournament}
                className="pill-button w-full"
                fallbackText="Generate Tournament Bracket"
              >
                {isCreatingTournament ? 'Creating Tournament...' : '🎲 Toss to Generate Bracket'}
              </TossButton>
              
              {teams.length < 2 && (
                <p className="text-sm text-white/70 mt-2">
                  Need at least 2 teams to start a tournament
                </p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

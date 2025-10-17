'use client'

import { useState, useEffect } from 'react'
import { Team, Tournament } from '@/lib/db/schema'
import { useUpdateTournamentLineup } from '@/hooks/useTournament'
import { hasMatchResults, regenerateTournamentBracket } from '@/lib/tournament-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

interface LineupManagerProps {
  tournament: Tournament
  allTeams: Team[]
}

export function LineupManager({ tournament, allTeams }: LineupManagerProps) {
  const [lineup, setLineup] = useState<Team[]>([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingLineup, setPendingLineup] = useState<Team[]>([])

  const updateLineup = useUpdateTournamentLineup()
  const hasResults = hasMatchResults(tournament)

  // Initialize lineup from tournament data
  useEffect(() => {
    if (tournament.lineup && allTeams.length > 0) {
      const currentLineup = tournament.lineup
        .map(teamId => allTeams.find(team => team.id === teamId))
        .filter((team): team is Team => team !== undefined)
      setLineup(currentLineup)
    } else if (allTeams.length > 0) {
      // If no lineup data, use all teams
      setLineup([...allTeams])
    }
  }, [tournament.lineup, allTeams])

  // Get teams not in current lineup
  const availableTeams = allTeams.filter(team => 
    !lineup.some(lineupTeam => lineupTeam.id === team.id)
  )

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(lineup)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setLineup(items)
  }

  const addTeamToLineup = (team: Team) => {
    setLineup([...lineup, team])
  }

  const removeTeamFromLineup = (teamId: string) => {
    setLineup(lineup.filter(team => team.id !== teamId))
  }

  const resetLineup = () => {
    setLineup([...allTeams])
  }

  const handleSaveLineup = () => {
    if (lineup.length < 2) {
      alert('You need at least 2 teams in the lineup!')
      return
    }

    if (hasResults) {
      // Show confirmation dialog for destructive changes
      setPendingLineup([...lineup])
      setShowConfirmDialog(true)
    } else {
      // Safe changes, save directly
      saveLineup(lineup)
    }
  }

  const saveLineup = (teamsToSave: Team[]) => {
    const newBracket = regenerateTournamentBracket(teamsToSave, tournament.tableCount)
    
    updateLineup.mutate({
      id: tournament.id,
      lineup: teamsToSave.map(team => team.id),
      bracketData: newBracket,
    })
  }

  const handleConfirmSave = () => {
    saveLineup(pendingLineup)
    setPendingLineup([])
  }

  const hasChanges = JSON.stringify(lineup.map(t => t.id)) !== JSON.stringify(tournament.lineup || [])

  return (
    <>
      <Card className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl text-white">Tournament Lineup</CardTitle>
          <p className="text-sm text-white/70">
            {lineup.length} team{lineup.length !== 1 ? 's' : ''} in lineup
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Lineup */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
              Current Lineup
            </h4>
            
            {lineup.length > 0 ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="lineup">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2 min-h-[100px] p-3 border border-white/20 rounded-lg bg-white/5"
                    >
                      {lineup.map((team, index) => (
                        <Draggable key={team.id} draggableId={team.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                snapshot.isDragging
                                  ? 'bg-white/20 border-white/40'
                                  : 'bg-white/10 border-white/20'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-white/60 text-sm font-mono">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-white text-sm">{team.name}</p>
                                  <p className="text-xs text-white/60">{team.player1} & {team.player2}</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeTeamFromLineup(team.id)}
                                className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <div className="p-6 text-center border border-dashed border-white/30 rounded-lg bg-white/5">
                <p className="text-white/60">No teams in lineup</p>
              </div>
            )}
          </div>

          {/* Available Teams */}
          {availableTeams.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
                Available Teams
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableTeams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-white/20 bg-white/5"
                  >
                    <div>
                      <p className="font-medium text-white text-sm">{team.name}</p>
                      <p className="text-xs text-white/60">{team.player1} & {team.player2}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addTeamToLineup(team)}
                      className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSaveLineup}
              disabled={!hasChanges || lineup.length < 2 || updateLineup.isPending}
              className="bg-white text-black hover:bg-white/90"
            >
              {updateLineup.isPending ? 'Saving...' : 'Save & Regenerate Bracket'}
            </Button>
            <Button
              variant="outline"
              onClick={resetLineup}
              disabled={updateLineup.isPending}
              className="text-white border-white/30 hover:bg-white/10"
            >
              Reset to All Teams
            </Button>
          </div>

          {/* Warning for ongoing matches */}
          {hasResults && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-400">
                ⚠️ This tournament has ongoing matches. Changing the lineup will regenerate the entire bracket and permanently delete all current match results.
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400">
              💡 Drag teams to reorder them, or add/remove teams from the lineup. Changes will regenerate the tournament bracket.
            </p>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Regenerate Tournament Bracket?"
        description="Changing the lineup will regenerate the entire tournament bracket and permanently delete all current match results. This action cannot be undone."
        confirmText="Yes, Regenerate Bracket"
        variant="destructive"
        onConfirm={handleConfirmSave}
        isLoading={updateLineup.isPending}
      />
    </>
  )
}

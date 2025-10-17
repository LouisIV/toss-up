import { Team, Tournament } from './db/schema'
import { TournamentSolver, BracketData } from './tournament-solver'
import { useCreateTournament, useUpdateTournamentBracket } from '@/hooks/useTournament'
import { usePlausible } from 'next-plausible'

export function useTournamentActions() {
  const createTournament = useCreateTournament()
  const updateBracket = useUpdateTournamentBracket()
  const plausible = usePlausible()

  const createNewTournament = async (teams: Team[], tableCount: number = 1) => {
    if (teams.length < 2) {
      throw new Error('Need at least 2 teams to create a tournament')
    }

    const solver = new TournamentSolver(teams, tableCount)
    const bracketData = solver.getBracketData()
    
    const tournament = await createTournament.mutateAsync({
      name: `Tournament ${new Date().toLocaleDateString()}`,
      status: 'active',
      bracketData,
      tableCount,
      lineup: teams.map(team => team.id),
    })

    // Track tournament creation event
    plausible('Tournament Created', {
      props: {
        teamCount: teams.length,
        tableCount: tableCount,
      }
    })

    return tournament
  }

  const updateMatchWinner = async (tournamentId: string, matchId: string, winnerId: string, currentBracket: BracketData, teams: Team[], tableCount: number) => {
    // Create a solver with the current bracket state
    const solver = new TournamentSolver(teams, tableCount)
    // Manually set the bracket data to the current state
    solver['bracketData'] = currentBracket
    
    // Process the match result
    const updatedBracket = solver.processMatchResult(matchId, winnerId)
    
    await updateBracket.mutateAsync({
      id: tournamentId,
      bracketData: updatedBracket,
    })

    // Track match result update event
    plausible('Match Result Updated', {
      props: {
        tournamentId: tournamentId,
      }
    })

    return updatedBracket
  }

  return {
    createNewTournament,
    updateMatchWinner,
    isCreating: createTournament.isPending,
    isUpdating: updateBracket.isPending,
  }
}

// Check if any matches in the tournament have results (winners)
export function hasMatchResults(tournament: Tournament): boolean {
  if (!tournament.bracketData?.rounds) {
    return false
  }

  for (const round of tournament.bracketData.rounds) {
    for (const match of round.matches) {
      if (match.winnerId) {
        return true
      }
    }
  }
  return false
}

// Regenerate tournament bracket with new teams and table count
export function regenerateTournamentBracket(
  teams: Team[], 
  tableCount: number
): BracketData {
  if (teams.length < 2) {
    throw new Error('Need at least 2 teams to generate bracket')
  }
  
  const solver = new TournamentSolver(teams, tableCount)
  return solver.getBracketData()
}

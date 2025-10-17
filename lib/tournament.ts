import { Team } from './db/schema';

export interface BracketMatch {
  id: string;
  team1Id?: string;
  team2Id?: string;
  winnerId?: string;
  position: number;
  tableId?: number;
  round?: number;
}

export interface BracketRound {
  round: number;
  matches: BracketMatch[];
}

export interface BracketData {
  rounds: BracketRound[];
}

export function generateBracket(teams: Team[], tableCount: number = 1): BracketData {
  if (teams.length < 2) {
    return { rounds: [] };
  }

  const numTeams = teams.length;
  const hasOddTeam = numTeams % 2 === 1;
  const rounds: BracketRound[] = [];

  if (hasOddTeam) {
    // Create a "bye determination round" (Round 0) for odd number of teams
    const byeDeterminationRound: BracketMatch[] = [];
    const numByeMatches = Math.floor(numTeams / 2);
    
    // Assign matches to tables, ensuring only one match per table
    for (let i = 0; i < numByeMatches; i++) {
      const team1 = teams[i * 2];
      const team2 = teams[i * 2 + 1];
      byeDeterminationRound.push({
        id: `bye-match-${i}`,
        team1Id: team1?.id,
        team2Id: team2?.id,
        position: i,
        tableId: (i % tableCount) + 1,
      });
    }

    // The last team gets a bye automatically
    const byeTeam = teams[numTeams - 1];
    byeDeterminationRound.push({
      id: `bye-match-${numByeMatches}`,
      team1Id: byeTeam.id,
      team2Id: undefined,
      position: numByeMatches,
      tableId: (numByeMatches % tableCount) + 1,
      winnerId: byeTeam.id, // Auto-advance the bye team
    });

    rounds.push({ round: 0, matches: byeDeterminationRound });
  }

  // Now create the main tournament rounds
  // For odd teams, we need to account for the bye team properly
  const teamsForMainTournament = hasOddTeam ? numTeams : numTeams;
  const numRounds = Math.ceil(Math.log2(teamsForMainTournament));
  const startRound = hasOddTeam ? 1 : 1;

  for (let round = startRound; round <= numRounds; round++) {
    const currentRound: BracketMatch[] = [];
    const isFirstMainRound = round === startRound;
    
    // Calculate match count for this round
    let matchCount;
    if (isFirstMainRound) {
      if (hasOddTeam) {
        // For odd teams, Round 1 should have matches for the bye determination winners
        // The bye team will be placed in the final round
        matchCount = Math.floor((numTeams - 1) / 2); // Number of bye determination matches
      } else {
        matchCount = Math.floor(teamsForMainTournament / 2);
      }
    } else {
      // For subsequent rounds, use the previous round's match count
      const prevRound = rounds[rounds.length - 1];
      matchCount = Math.ceil(prevRound.matches.length / 2);
    }

    for (let i = 0; i < matchCount; i++) {
      const match: BracketMatch = {
        id: `match-${round}-${i}`,
        position: i,
        tableId: (i % tableCount) + 1,
      };

      // Don't pre-place the bye team in Round 1 - let the winners advance naturally
      currentRound.push(match);
    }

    rounds.push({ round, matches: currentRound });
  }

  return { rounds };
}

export function advanceWinner(
  bracketData: BracketData,
  matchId: string,
  winnerId: string
): BracketData {
  // First, update the current match with the winner
  const updatedRounds = bracketData.rounds.map(round => ({
    ...round,
    matches: round.matches.map(match => {
      if (match.id === matchId) {
        return { ...match, winnerId };
      }
      return match;
    })
  }));

  // Find the current match to get its position and round
  const currentMatch = findMatchInBracket({ rounds: updatedRounds }, matchId);
  
  // Handle bye matches - they should advance to the next round normally
  if (currentMatch && !currentMatch.team2Id && currentMatch.team1Id && currentMatch.winnerId) {
    // This is a bye match that's already been auto-advanced
    // The bye team should advance to the next round like any other winner
    // Don't skip processing - continue to advance the winner normally
  }
  if (!currentMatch || currentMatch.round === undefined || currentMatch.round === null) {
    return { rounds: updatedRounds };
  }

  // Find the next round
  const nextRoundIndex = updatedRounds.findIndex(r => r.round === currentMatch.round! + 1);
  if (nextRoundIndex === -1) {
    // No next round (this is the final match)
    return { rounds: updatedRounds };
  }

  // Calculate which match in the next round this winner should advance to
  let nextMatchPosition = Math.floor(currentMatch.position / 2);
  const nextRound = updatedRounds[nextRoundIndex];

  // Special handling for bye determination round (Round 0) to main tournament (Round 1)
  if (currentMatch.round === 0 && nextRound.round === 1) {
    // Winners from bye determination round advance to Round 1
    // The bye team is already in the first match (position 0), so winners go to subsequent matches
    nextMatchPosition = currentMatch.position + 1; // Skip the bye team's match
    
    // But if this is the first winner (position 0), they should play the bye team
    if (currentMatch.position === 0) {
      nextMatchPosition = 0; // Play the bye team in the first match
    }
    
  }
  
  // Special handling for Round 1 to Round 2 advancement with bye teams
  if (currentMatch.round === 1 && nextRound.round === 2) {
    // Check if there's a bye team already in Round 2
    const byeMatch = nextRound.matches.find(match => match.team1Id && !match.team2Id);
    if (byeMatch) {
      // If this is the first Round 1 winner, they should play the bye team
      const isFirstWinner = currentMatch.position === 0;
      if (isFirstWinner) {
        nextMatchPosition = nextRound.matches.findIndex(match => match.id === byeMatch.id);
      } else {
        // Subsequent winners go to the next available match
        nextMatchPosition = Math.floor((currentMatch.position - 1) / 2) + 1;
      }
    }
  }

  if (nextMatchPosition < nextRound.matches.length) {
    const nextMatch = nextRound.matches[nextMatchPosition];

    // Determine if this winner goes to team1 or team2 slot
    const isFirstSlot = currentMatch.position % 2 === 0;

    // Special handling for Round 0 to Round 1 advancement
    if (currentMatch.round === 0 && nextRound.round === 1) {
      // For Round 0 to Round 1, winners should play each other, not the bye team
      // The bye team will be placed in the final round
      updatedRounds[nextRoundIndex] = {
        ...nextRound,
        matches: nextRound.matches.map((match, index) => {
          if (index === nextMatchPosition) {
            // Determine if this winner goes to team1Id or team2Id
            const isFirstSlot = currentMatch.position % 2 === 0;
            return {
              ...match,
              [isFirstSlot ? 'team1Id' : 'team2Id']: winnerId,
            };
          }
          return match;
        })
      };
    } else {
      // Normal advancement logic for other rounds
      updatedRounds[nextRoundIndex] = {
        ...nextRound,
        matches: nextRound.matches.map((match, index) => {
          if (index === nextMatchPosition) {
            return {
              ...match,
              team1Id: isFirstSlot ? winnerId : match.team1Id,
              team2Id: !isFirstSlot ? winnerId : match.team2Id,
            };
          }
          return match;
        })
      };
    }
  }

  // Handle bye team placement in the final round
  // Only place the bye team in the final round when Round 1 is completed
  if (currentMatch.round === 1 && nextRound.round === 2) {
    // Check if this is the last match of Round 1
    const round1Matches = updatedRounds.find(r => r.round === 1);
    if (round1Matches) {
      const completedRound1Matches = round1Matches.matches.filter(match => match.winnerId);
      const isLastMatchOfRound1 = completedRound1Matches.length === round1Matches.matches.length;
      
      if (isLastMatchOfRound1) {
        // Find the bye team from Round 0
        const byeMatch = bracketData.rounds[0]?.matches.find(match => match.winnerId && !match.team2Id);
        if (byeMatch && byeMatch.winnerId) {
          // Place the bye team in the final round
          const finalRoundIndex = updatedRounds.length - 1;
          if (finalRoundIndex >= 0) {
            const finalRound = updatedRounds[finalRoundIndex];
            updatedRounds[finalRoundIndex] = {
              ...finalRound,
              matches: finalRound.matches.map((match, index) => {
                if (index === 0) { // Final match
                  return {
                    ...match,
                    team1Id: byeMatch.winnerId,
                    winnerId: byeMatch.winnerId, // Auto-advance the bye team
                  };
                }
                return match;
              })
            };
          }
        }
      }
    }
  }

  return { rounds: updatedRounds };
}

export function findMatchInBracket(bracketData: BracketData, matchId: string): BracketMatch | null {
  for (const round of bracketData.rounds) {
    const match = round.matches.find(m => m.id === matchId);
    if (match) {
      return { ...match, round: round.round };
    }
  }
  return null;
}

export function getTournamentWinner(bracketData: BracketData): string | null {
  const finalRound = bracketData.rounds[bracketData.rounds.length - 1];
  if (!finalRound || finalRound.matches.length === 0) {
    return null;
  }
  
  const finalMatch = finalRound.matches[0];
  return finalMatch.winnerId || null;
}

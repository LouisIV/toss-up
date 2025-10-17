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

export class TournamentSolver {
  private teams: Team[];
  private tableCount: number;
  private bracketData: BracketData;

  constructor(teams: Team[], tableCount: number = 1) {
    this.teams = teams;
    this.tableCount = tableCount;
    this.bracketData = this.generateBracket();
  }

  /**
   * Generate the initial bracket structure
   */
  private generateBracket(): BracketData {
    if (this.teams.length < 2) {
      return { rounds: [] };
    }

    const numTeams = this.teams.length;
    const hasOddTeam = numTeams % 2 === 1;
    const rounds: BracketRound[] = [];

    // If we have an odd number of teams, create a bye determination round
    if (hasOddTeam) {
      const byeDeterminationRound = this.createByeDeterminationRound();
      rounds.push({ round: 0, matches: byeDeterminationRound });
    }

    // Create the main tournament rounds
    const teamsForMainTournament = hasOddTeam ? numTeams - 1 : numTeams;
    const numRounds = Math.ceil(Math.log2(teamsForMainTournament));
    const startRound = hasOddTeam ? 1 : 0;

    // Number of main rounds to create after the optional bye round
    const totalMainRounds = numRounds;

    for (let i = 0; i < totalMainRounds; i++) {
      const round = startRound + i;
      const currentRound = this.createRound(round, rounds);
      if (currentRound.length > 0) {
        rounds.push({ round, matches: currentRound });
      }
    }

    return { rounds };
  }

  /**
   * Create the bye determination round for odd number of teams
   */
  private createByeDeterminationRound(): BracketMatch[] {
    const numTeams = this.teams.length;
    const numByeMatches = Math.floor(numTeams / 2);
    const matches: BracketMatch[] = [];

    // Create matches for teams that need to play
    for (let i = 0; i < numByeMatches; i++) {
      const team1 = this.teams[i * 2];
      const team2 = this.teams[i * 2 + 1];
      
      matches.push({
        id: `bye-match-${i}`,
        team1Id: team1?.id,
        team2Id: team2?.id,
        position: i,
        tableId: (i % this.tableCount) + 1,
      });
    }

    // The last team gets a bye automatically
    const byeTeam = this.teams[numTeams - 1];
    matches.push({
      id: `bye-match-${numByeMatches}`,
      team1Id: byeTeam.id,
      team2Id: undefined,
      position: numByeMatches,
      tableId: (numByeMatches % this.tableCount) + 1,
      winnerId: byeTeam.id, // Auto-advance the bye team
    });

    return matches;
  }

  /**
   * Create a tournament round
   */
  private createRound(round: number, existingRounds: BracketRound[]): BracketMatch[] {
    const matches: BracketMatch[] = [];
    
    if (round === 0 && !this.hasOddTeam()) {
      // First round for even number of teams - create matches for all teams
      const numMatches = Math.floor(this.teams.length / 2);
      for (let i = 0; i < numMatches; i++) {
        const team1 = this.teams[i * 2];
        const team2 = this.teams[i * 2 + 1];
        matches.push({
          id: `match-${round}-${i}`,
          team1Id: team1?.id,
          team2Id: team2?.id,
          position: i,
          tableId: (i % this.tableCount) + 1,
        });
      }
    } else if (round > 0) {
      // Subsequent rounds - half the matches of the previous round
      const prevRound = existingRounds[existingRounds.length - 1];
      // If previous round was the bye-determination round (round 0), only count real matches
      const prevCount = prevRound.round === 0
        ? prevRound.matches.filter(m => m.team2Id).length
        : prevRound.matches.length;

      const numMatches = Math.ceil(prevCount / 2);
      
      for (let i = 0; i < numMatches; i++) {
        matches.push({
          id: `match-${round}-${i}`,
          position: i,
          tableId: (i % this.tableCount) + 1,
        });
      }
    }

    return matches;
  }

  /**
   * Check if we have an odd number of teams
   */
  private hasOddTeam(): boolean {
    return this.teams.length % 2 === 1;
  }

  /**
   * Process a match result and advance the winner
   */
  public processMatchResult(matchId: string, winnerId: string): BracketData {
    const match = this.findMatch(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    // Update the match with the winner in the bracket data
    for (const round of this.bracketData.rounds) {
      const bracketMatch = round.matches.find(m => m.id === matchId);
      if (bracketMatch) {
        bracketMatch.winnerId = winnerId;
        break;
      }
    }

    // Advance the winner to the next round
    this.advanceWinner(match, winnerId);

    return this.bracketData;
  }

  /**
   * Find a match by ID
   */
  private findMatch(matchId: string): BracketMatch | null {
    for (const round of this.bracketData.rounds) {
      const match = round.matches.find(m => m.id === matchId);
      if (match) {
        return { ...match, round: round.round };
      }
    }
    return null;
  }

  /**
   * Advance a winner to the next round
   */
  private advanceWinner(currentMatch: BracketMatch, winnerId: string): void {
    const nextRound = this.getNextRound(currentMatch.round!);
    if (!nextRound) {
      return; // This is the final match
    }

    // Special handling: Round 0 bye winner should NOT be placed into Round 1 now
    // We only bring the bye team back later (semis/final) after Round 1 is resolved
    if (currentMatch.round === 0 && !currentMatch.team2Id) {
      return;
    }

    // Round 0 non-bye winners: compact mapping
    if (currentMatch.round === 0 && currentMatch.team2Id) {
      const round0 = this.bracketData.rounds.find(r => r.round === 0);
      const nonByePositions = (round0?.matches || []).filter(m => m.team2Id).map(m => m.position);
      const compactIndex = nonByePositions.indexOf(currentMatch.position); // 0 or 1 for 5 teams

      // If first non-bye winner: pair with bye team in Round 1
      if (compactIndex === 0) {
        const byeId = (round0?.matches || []).find(m => !m.team2Id)?.winnerId;
        const r1 = nextRound; // round 1 has exactly one match
        if (r1 && r1.matches[0]) {
          if (byeId) r1.matches[0].team1Id = byeId;
          r1.matches[0].team2Id = winnerId;
        }
        return;
      }

      // If second non-bye winner: seed directly into Final, awaiting Round 1 winner
      const r2 = this.getNextRound(nextRound.round);
      if (r2 && r2.matches[0]) {
        const fm = r2.matches[0];
        if (!fm.team1Id) fm.team1Id = winnerId; else if (!fm.team2Id) fm.team2Id = winnerId;
      }
      return;
    }

    // Round 1 winner advances to Final, fill whichever slot is open
    if (currentMatch.round === 1) {
      const finalRound = this.getNextRound(currentMatch.round!);
      if (finalRound && finalRound.matches[0]) {
        const fm = finalRound.matches[0];
        if (!fm.team1Id) fm.team1Id = winnerId; else if (!fm.team2Id) fm.team2Id = winnerId;
      }
      return;
    }

    // Default mapping for other rounds
    const nextMatchPosition = this.calculateNextMatchPosition(currentMatch, nextRound);
    const nextMatch = nextRound.matches[nextMatchPosition];
    if (!nextMatch) { return; }
    const isFirstSlot = currentMatch.position % 2 === 0;
    const slot = isFirstSlot ? 'team1Id' : 'team2Id';
    nextMatch[slot] = winnerId;

    // Special handling for bye teams - only place bye team in final round
    this.handleByeTeamPlacement(currentMatch, nextRound, nextMatch);
  }

  /**
   * Get the next round after the current round
   */
  private getNextRound(currentRound: number): BracketRound | null {
    const nextRoundIndex = this.bracketData.rounds.findIndex(r => r.round === currentRound + 1);
    return nextRoundIndex >= 0 ? this.bracketData.rounds[nextRoundIndex] : null;
  }

  /**
   * Calculate which match in the next round this winner should advance to
   */
  private calculateNextMatchPosition(currentMatch: BracketMatch, nextRound: BracketRound): number {
    // For bye determination round (Round 0), pair only non-bye winners against each other in Round 1
    if (currentMatch.round === 0) {
      if (!currentMatch.team2Id) {
        // bye match: do not map into Round 1 now
        return -1;
      }
      // Map non-bye positions densely (skip the bye slot)
      // Example: positions 0 and 1 -> match 0, position 2 (if exists) pairs with position 3 -> match 1
      // But when a bye exists, there are only two non-bye matches; they should become match 0 in Round 1
      // Compute compacted index among non-bye matches
      const round0 = this.bracketData.rounds.find(r => r.round === 0);
      const nonByePositions = (round0?.matches || []).filter(m => m.team2Id).map(m => m.position);
      const compactIndex = nonByePositions.indexOf(currentMatch.position);
      return Math.floor(compactIndex / 2);
    }
    
    // For other rounds, use simple advancement: winners from position 0,1 go to match 0; 2,3 go to match 1; etc.
    return Math.floor(currentMatch.position / 2);
  }

  /**
   * Place the bye team in the final round
   */
  private placeByeTeamInFinal(byeTeamId: string): void {
    const finalRound = this.bracketData.rounds[this.bracketData.rounds.length - 1];
    if (!finalRound || finalRound.matches.length === 0) return;
    const finalMatch = finalRound.matches[0];
    // Fill whichever slot is free; DO NOT set winnerId here
    if (!finalMatch.team1Id) {
      finalMatch.team1Id = byeTeamId;
    } else if (!finalMatch.team2Id) {
      finalMatch.team2Id = byeTeamId;
    }
  }

  /**
   * Handle bye team placement in the final round
   */
  private handleByeTeamPlacement(currentMatch: BracketMatch, nextRound: BracketRound, nextMatch: BracketMatch): void {
    // If this is the last match of Round 1 and we have a bye team, place them in the final (as opponent)
    if (currentMatch.round === 1 && nextRound.round === 2) {
      const round1 = this.bracketData.rounds.find(r => r.round === 1);
      if (round1) {
        const completedMatches = round1.matches.filter(m => m.winnerId);
        const isLastMatchOfRound1 = completedMatches.length === round1.matches.length;
        
        if (isLastMatchOfRound1) {
          // Find the bye team from Round 0
          const byeMatch = this.bracketData.rounds[0]?.matches.find(match => 
            match.winnerId && !match.team2Id
          );
          
          if (byeMatch && byeMatch.winnerId) {
            // Place the bye team in the final round (no auto-advance)
            this.placeByeTeamInFinal(byeMatch.winnerId);
          }
        }
      }
    }
  }

  /**
   * Get the current bracket data
   */
  public getBracketData(): BracketData {
    return this.bracketData;
  }

  /**
   * Get the tournament winner
   */
  public getTournamentWinner(): string | null {
    const finalRound = this.bracketData.rounds[this.bracketData.rounds.length - 1];
    if (!finalRound || finalRound.matches.length === 0) {
      return null;
    }
    
    const finalMatch = finalRound.matches[0];
    return finalMatch.winnerId || null;
  }

  /**
   * Check if the tournament is complete
   */
  public isTournamentComplete(): boolean {
    return this.getTournamentWinner() !== null;
  }

  /**
   * Get all active matches (matches that can be played)
   */
  public getActiveMatches(): BracketMatch[] {
    const activeMatches: BracketMatch[] = [];
    
    for (const round of this.bracketData.rounds) {
      for (const match of round.matches) {
        if (this.isMatchActive(match, round.round)) {
          activeMatches.push({ ...match, round: round.round });
        }
      }
    }
    
    return activeMatches;
  }

  /**
   * Check if a match is currently active (can be played)
   */
  private isMatchActive(match: BracketMatch, round: number): boolean {
    // A match is active if it has both teams and no winner yet
    if (match.winnerId) {
      return false; // Already completed
    }

    // For bye determination round (Round 0), matches are active if they have both teams
    if (round === 0) {
      return !!(match.team1Id && match.team2Id);
    }

    // For other rounds, matches are active if they have both teams
    return !!(match.team1Id && match.team2Id);
  }
}

// Factory function for backward compatibility
export function generateBracket(teams: Team[], tableCount: number = 1): BracketData {
  const solver = new TournamentSolver(teams, tableCount);
  return solver.getBracketData();
}

export function advanceWinner(bracketData: BracketData, matchId: string, winnerId: string): BracketData {
  // This is a simplified version for backward compatibility
  // In practice, you'd want to use the TournamentSolver class
  const updatedRounds = bracketData.rounds.map(round => ({
    ...round,
    matches: round.matches.map(match => {
      if (match.id === matchId) {
        return { ...match, winnerId };
      }
      return match;
    })
  }));

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

